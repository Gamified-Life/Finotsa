import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const prisma = new PrismaClient({});

app.use(cors());
app.use(express.json());

app.get('/api/pulse', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
  });
  
  const categoryMap = {};
  transactions.forEach(t => {
    if (!categoryMap[t.categoryId]) {
      categoryMap[t.categoryId] = {
        name: t.category.name,
        emoji: t.category.emoji,
        warning: t.category.warningFlag,
        amount: 0,
        shops: [],
      };
    }
    categoryMap[t.categoryId].amount += t.amount;
    categoryMap[t.categoryId].shops.push({
      name: t.shopName,
      amount: t.amount,
      date: 'Recent',
    });
  });

  const totalSpend = Object.values(categoryMap).reduce((sum, cat) => sum + cat.amount, 0);

  const detailedCategories = Object.values(categoryMap).map(cat => ({
    ...cat,
    pct: totalSpend > 0 ? Math.round((cat.amount / totalSpend) * 100) : 0,
  }));

  res.json({
    detailedCategories,
  });
});

app.get('/api/coach', async (req, res) => {
  const user = await prisma.user.findFirst();
  const insights = await prisma.insight.findMany();
  const benchmarks = await prisma.benchmark.findMany();

  const opps = insights.filter(i => i.type === 'SAVING').map(i => ({
    title: i.title,
    sub: i.description,
    save: i.suggestedAction,
    effort: i.effort,
    emoji: i.icon
  }));

  const taxOpps = insights.filter(i => i.type === 'TAX').map(i => ({
    title: i.title,
    desc: i.description,
    save: i.suggestedAction,
    icon: i.icon
  }));

  res.json({
    healthScore: user?.healthScore || 0,
    opps,
    taxOpps,
    selfCompare: benchmarks,
  });
});

app.get('/api/engine', async (req, res) => {
  const rules = await prisma.engineRule.findMany();
  const portfolio = await prisma.portfolio.findFirst();
  const sweeps = await prisma.sweepHistory.findMany({
    orderBy: { date: 'desc' },
    take: 10
  });

  res.json({
    rules: rules.map(r => ({
      name: r.name,
      desc: r.desc,
      saved: r.saved,
      on: r.active,
      icon: r.icon,
    })),
    portfolio,
    sweeps: sweeps.map(s => s.source)
  });
});

// Phase 1: Simulated Account Aggregator Webhook (Transaction Classification)
app.post('/api/webhook/transaction', async (req, res) => {
  const { userId, amount, shopName } = req.body;
  if (!userId || !amount || !shopName) return res.status(400).json({ error: 'Missing fields' });

  // 1. Try to find merchant in our MerchantMap (Regex/String Match)
  const maps = await prisma.merchantMap.findMany();
  let categoryId = null;
  
  for (const map of maps) {
    if (shopName.toUpperCase().includes(map.pattern.toUpperCase())) {
      categoryId = map.categoryId;
      break;
    }
  }

  // 2. LLM Fallback Simulation (If no match in our DB)
  if (!categoryId) {
    // In production, we would call: await gemini.generateContent(`Categorize: ${shopName}`)
    console.log(`[LLM Fallback Triggered] Unknown merchant: ${shopName}`);
    
    // Simulate LLM returning a generic 'Shopping' or 'Miscellaneous' category for now
    const fallbackCategory = await prisma.category.findFirst({ where: { name: 'Shopping' } });
    categoryId = fallbackCategory ? fallbackCategory.id : 1; 

    // Automatically learn from LLM and update MerchantMap for the future!
    await prisma.merchantMap.create({
      data: {
        pattern: shopName.split(' ')[0].toUpperCase(), // Simple extraction
        categoryId: categoryId
      }
    });
  }

  // 3. Insert the Transaction
  const transaction = await prisma.transaction.create({
    data: {
      amount,
      shopName,
      userId,
      categoryId,
    },
    include: { category: true }
  });

  res.json({ success: true, transaction });
});

// Phase 1: Nightly Health Score Algorithm
app.post('/api/cron/health-score', async (req, res) => {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Fetch last 30 days of transactions (simulated with all transactions for MVP)
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true }
    });

    let score = 100;
    
    // 1. Spend-to-Income (30 pts)
    const totalSpend = transactions.filter(t => t.category.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const income = 150000; // Simulated monthly income
    if (totalSpend > income * 0.8) score -= 20;
    else if (totalSpend > income * 0.6) score -= 10;

    // 2. Savings Rate (25 pts)
    // Assume any portfolio value is savings
    const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id }});
    const saved = portfolio ? portfolio.totalInvested : 0;
    if (saved < income * 0.1) score -= 15;

    // 3. Fixed vs Variable (20 pts)
    const variableSpend = transactions.filter(t => t.category.name === 'Food' || t.category.name === 'Shopping').reduce((sum, t) => sum + t.amount, 0);
    if (variableSpend > totalSpend * 0.4) score -= 10;

    // 4. Buffer (15 pts) - Assumed based on balance vs fixed expenses
    // 5. Subscription Efficiency (10 pts)
    const subSpend = transactions.filter(t => t.category.name === 'Subs').reduce((sum, t) => sum + t.amount, 0);
    if (subSpend > 5000) score -= 5;

    // Cap score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Update user and history
    await prisma.user.update({
      where: { id: user.id },
      data: { healthScore: score }
    });

    await prisma.healthScoreHistory.create({
      data: { userId: user.id, score }
    });
  }

  res.json({ success: true, message: "Nightly health scores recalculated." });
});

// Phase 3: Virtual Engine Sweep
app.post('/api/cron/engine-sweep', async (req, res) => {
  const users = await prisma.user.findMany();
  let totalSwept = 0;

  for (const user of users) {
    // 1. Fetch recent transactions that haven't been swept
    // For MVP, we'll just take the last 3 transactions to simulate the daily sweep.
    const recentTxns = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
      take: 3
    });

    let userSwept = 0;
    for (const txn of recentTxns) {
      // Calculate Round Up to nearest 10
      // e.g. amount 143 -> next 10 is 150 -> swept 7
      const next10 = Math.ceil(txn.amount / 10) * 10;
      let sweepAmount = next10 - txn.amount;
      
      // If it's a flat amount like 140, sweep 10
      if (sweepAmount === 0) sweepAmount = 10;
      
      userSwept += sweepAmount;

      // Add to Sweep History
      await prisma.sweepHistory.create({
        data: {
          userId: user.id,
          amount: sweepAmount,
          source: `${txn.shopName.split(' ')[0]} ₹${txn.amount} → +₹${sweepAmount} swept`
        }
      });
    }

    // 2. Add to Portfolio
    if (userSwept > 0) {
      const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id } });
      if (portfolio) {
        // Add random slight return fluctuation to simulate real market
        const randomReturnPct = (Math.random() * 0.4 - 0.1); // between -0.1% and +0.3% daily
        const newReturns = portfolio.returns + (portfolio.totalInvested * (randomReturnPct / 100));

        await prisma.portfolio.update({
          where: { userId: user.id },
          data: { 
            totalInvested: portfolio.totalInvested + userSwept,
            returns: newReturns,
            returnsPct: portfolio.returnsPct + randomReturnPct
          }
        });
      }
    }
    totalSwept += userSwept;
  }

  res.json({ success: true, message: `Swept a total of ₹${totalSwept} into portfolios!` });
});

export default app;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(3001, () => console.log('Local dev server running on port 3001'));
}
