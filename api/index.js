import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

const app = express();
const prisma = new PrismaClient({});
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── SECURE AI TUNNEL ─────────────────────────────────────────────────────────
const cleanNumber = (val) => {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return null;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const getUser = async (req) => {
  const authId = req.headers['x-user-id'];
  if (!authId) return await prisma.user.findFirst({ include: { goals: true } });
  
  let user = await prisma.user.findUnique({ where: { authId }, include: { goals: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        authId,
        name: 'New User',
        monthlyIncome: 45000,
        fixedExpenses: 6200,
        emergencyBuffer: 2000,
      },
      include: { goals: true }
    });
  }
  return user;
};

const classifyMerchant = async (shopName) => {
  try {
    const maps = await prisma.merchantMap.findMany();
    for (const map of maps) {
      if (shopName.toUpperCase().includes(map.pattern.toUpperCase())) {
        return map.categoryId;
      }
    }
    // Search by name match
    const cats = await prisma.category.findMany();
    const foodTerms = ['SWIGGY', 'ZOMATO', 'RESTAURANT', 'FOOD', 'DINING', 'CAFE', 'EAT', 'BAKERY'];
    const shopUpper = shopName.toUpperCase();
    
    if (foodTerms.some(term => shopUpper.includes(term))) {
      const food = cats.find(c => c.name === 'Food');
      if (food) return food.id;
    }

    const defaultCat = cats.find(c => c.name === 'Shopping') || cats[0];
    if (!defaultCat) {
      // Emergency seed if still empty
      const newCat = await prisma.category.create({ data: { name: 'General', emoji: '📦', type: 'EXPENSE' } });
      return newCat.id;
    }
    return defaultCat.id;
  } catch (e) {
    console.error('[CLASSIFY] Error:', e);
    return 1; // Fallback to ID 1
  }
};

const seedCategories = async () => {
  const cats = [
    { name: 'Food', emoji: '🍔', type: 'EXPENSE' },
    { name: 'Transport', emoji: '🚗', type: 'EXPENSE' },
    { name: 'Shopping', emoji: '🛍️', type: 'EXPENSE' },
    { name: 'Entertainment', emoji: '🎬', type: 'EXPENSE' },
    { name: 'Health', emoji: '🏥', type: 'EXPENSE' },
    { name: 'Subs', emoji: '💳', type: 'EXPENSE' },
    { name: 'Income', emoji: '💰', type: 'INCOME' }
  ];
  
  for (const c of cats) {
    const existing = await prisma.category.findFirst({ where: { name: c.name } });
    if (!existing) {
      console.log(`[SEED] Creating missing category: ${c.name}`);
      await prisma.category.create({ data: c });
    }
  }
};

app.get('/api/pulse', async (req, res) => {
  await seedCategories();
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { date: 'desc' }
  });

  const categories = await prisma.category.findMany({
    include: {
      transactions: {
        where: { userId: user.id }
      }
    }
  });

  const detailedCategories = categories.map(cat => ({
    name: cat.name,
    amount: cat.transactions.reduce((sum, t) => sum + t.amount, 0),
    emoji: cat.emoji,
    warning: cat.warningFlag,
    pct: Math.min(100, Math.round((cat.transactions.reduce((sum, t) => sum + t.amount, 0) / (Math.max(1, user.monthlyIncome) * 0.1)) * 100)),
    shops: cat.transactions.slice(0, 5).map(t => ({
      name: t.shopName,
      amount: t.amount,
      date: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }))
  })).filter(s => s.amount > 0);

  // Budget Logic
  const monthlyIncome = user.monthlyIncome || 45000;
  const fixedExpenses = user.fixedExpenses || 6200;
  const emergencyBuffer = user.emergencyBuffer || 2000;
  const subsSpend = transactions.filter(t => t.category.name === 'Subs').reduce((s, t) => s + t.amount, 0);
  
  const goals = user.goals || [];
  const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  
  const availableForMonth = monthlyIncome - fixedExpenses - subsSpend - emergencyBuffer - totalGoalTarget;
  
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = lastDay - now.getDate() + 1;
  
  const baseDailyLimit = Math.max(0, Math.floor(availableForMonth / daysRemaining));
  const aiAdjustment = (now.getDay() === 0 || now.getDay() === 6) ? -200 : 0; // Lower limit on weekends
  const safeToday = Math.max(0, baseDailyLimit + aiAdjustment);

  const budget = {
    monthlyIncome,
    fixedExpenses,
    subsSpend,
    emergencyBuffer,
    availableForMonth,
    daysRemaining,
    baseDailyLimit,
    aiAdjustment,
    safeToday,
    goals: goals.map(g => ({ name: g.name, target: g.targetAmount }))
  };

  res.json({ detailedCategories, budget, transactions, currentBalance: user.currentBalance });
});

app.post('/api/user/settings', async (req, res) => {
  const { monthlyIncome, fixedExpenses } = req.body;
  const user = await getUser(req);
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        monthlyIncome: Number(monthlyIncome), 
        fixedExpenses: Number(fixedExpenses) 
      }
    });
  }
  res.json({ success: true });
});

app.post('/api/user/reset', async (req, res) => {
  try {
    const user = await getUser(req);
    if (user) {
      await prisma.transaction.deleteMany({ where: { userId: user.id } });
      await prisma.user.update({
        where: { id: user.id },
        data: { currentBalance: 0, bankLinked: false }
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[API] /api/user/reset Error:', error);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

app.get('/api/coach', async (req, res) => {
  const user = await getUser(req);
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true }
  });

  const insights = await prisma.insight.findMany();
  const benchmarks = await prisma.benchmark.findMany();

  const foodSpend = transactions.filter(t => t.category.name === 'Food').reduce((s, t) => s + t.amount, 0);
  const shoppingSpend = transactions.filter(t => t.category.name === 'Shopping').reduce((s, t) => s + t.amount, 0);

  const dynamicOpps = [
    {
      title: `Cook 3x vs Swiggy`,
      sub: `You spent ₹${foodSpend.toLocaleString('en-IN')} on food recently.`,
      save: `₹${Math.round(foodSpend * 0.2).toLocaleString('en-IN')}/mo`,
      effort: 'Medium',
      emoji: '🍱'
    },
    ...insights.filter(i => i.type === 'SAVING' && i.title !== 'Cook 3x vs Swiggy').map(i => ({
      title: i.title,
      sub: i.description,
      save: i.suggestedAction,
      effort: i.effort,
      emoji: i.icon
    }))
  ];

  const dynamicBenchmarks = benchmarks.map(b => {
    let current = b.current;
    if (b.label.toLowerCase().includes('food')) current = foodSpend;
    if (b.label.toLowerCase().includes('shopping')) current = shoppingSpend;
    return { ...b, current };
  });

  res.json({
    healthScore: user?.healthScore || 0,
    opps: dynamicOpps,
    taxOpps: insights.filter(i => i.type === 'TAX').map(i => ({
      title: i.title,
      desc: i.description,
      save: i.suggestedAction,
      icon: i.icon
    })),
    selfCompare: dynamicBenchmarks,
    summary: {
      foodSpend,
      shoppingSpend
    }
  });
});

app.get('/api/engine', async (req, res) => {
  const user = await getUser(req);
  const rules = await prisma.engineRule.findMany({ where: { userId: user?.id } });
  const portfolio = await prisma.portfolio.findFirst({ where: { userId: user?.id } });
  const sweeps = await prisma.sweepHistory.findMany({
    where: { userId: user?.id },
    orderBy: { date: 'desc' },
    take: 10
  });

  res.json({
    bankLinked: user?.bankLinked || false,
    aaConsentId: user?.aaConsentId || null,
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

app.post('/api/aa/consent', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (process.env.SETU_CLIENT_ID && process.env.SETU_CLIENT_SECRET) {
      const setuRes = await fetch('https://fiu-sandbox.setu.co/consents', {
        method: 'POST',
        headers: {
          'x-client-id': process.env.SETU_CLIENT_ID,
          'x-client-secret': process.env.SETU_CLIENT_SECRET,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Detail: {
            consentStart: new Date().toISOString(),
            consentExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            Customer: { id: `${user.id}@finotsa` },
            FIDataRange: {
              from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
              to: new Date().toISOString(),
            },
            consentMode: "STORE",
            consentTypes: ["TRANSACTIONS", "PROFILE", "SUMMARY"],
            fetchType: "PERIODIC",
            Frequency: { value: 1, unit: "DAY" },
            DataFilter: [{ type: "TRANSACTIONAMOUNT", operator: ">", value: "0" }],
            DataLife: { unit: "MONTH", value: 6 },
            DataConsumer: { id: "FIU" },
            Purpose: { 
              code: "101", 
              refUri: "https://api.rebit.org.in/aa/purpose/101.xml", 
              text: "Wealth management service", 
              Category: { type: "string" } 
            },
            fiTypes: ["DEPOSIT"]
          },
          context: [
            { key: "accounttype", value: "SAVINGS" }
          ],
          redirectUrl: "http://localhost:5173/?consent_status=success"
        })
      });

      const setuData = await setuRes.json();
      
      if (setuData && setuData.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { aaConsentId: setuData.id }
        });

        return res.json({ 
          success: true, 
          consentId: setuData.id,
          redirectUrl: setuData.url 
        });
      }
    }

    const fakeConsentId = `consent_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { aaConsentId: fakeConsentId }
    });
    
    res.json({ 
      success: true, 
      consentId: fakeConsentId,
      redirectUrl: `/?consent_status=success`
    });
  } catch (error) {
    console.error('Setu AA Error:', error);
    res.status(500).json({ error: 'Failed to create AA consent request' });
  }
});

app.post('/api/aa/demo', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // 1. Mark as linked
  await prisma.user.update({
    where: { id: user.id },
    data: { bankLinked: true, currentBalance: 84250 }
  });

  // 2. Seed Transactions if none exist
  const txCount = await prisma.transaction.count({ where: { userId: user.id } });
  if (txCount === 0) {
    const categories = await prisma.category.findMany();
    const getCat = (name) => categories.find(c => c.name === name)?.id || categories[0].id;

    const demoTxns = [
      { userId: user.id, amount: 649, shopName: 'Netflix Subscription', categoryId: getCat('Subs'), date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 1450, shopName: 'Amazon Shopping', categoryId: getCat('Shopping'), date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 340, shopName: 'Swiggy Delivery', categoryId: getCat('Food'), date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 243, shopName: 'Uber Ride', categoryId: getCat('Transport'), date: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 180, shopName: 'Starbucks Coffee', categoryId: getCat('Café'), date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { userId: user.id, amount: 1200, shopName: 'Grocery Store', categoryId: getCat('Food'), date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];

    await prisma.transaction.createMany({ data: demoTxns });
  }

  // 3. Seed Engine Rules if none exist
  const ruleCount = await prisma.engineRule.count({ where: { userId: user.id } });
  if (ruleCount === 0) {
    await prisma.engineRule.createMany({
      data: [
        { userId: user.id, name: 'Daily Round-up', desc: 'Round up every transaction to the next ₹10 and invest.', saved: '₹420', icon: 'Zap' },
        { userId: user.id, name: 'Subscription Shield', desc: 'Auto-detect and flag price hikes in your subs.', saved: '₹0', icon: 'Shield' },
        { userId: user.id, name: 'Weekend Sweep', desc: 'Sweep 1% of your balance every Sunday into savings.', saved: '₹1,250', icon: 'Target' },
      ]
    });
  }

  // 4. Seed Portfolio if none exists
  const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id } });
  if (!portfolio) {
    await prisma.portfolio.create({
      data: {
        userId: user.id,
        totalInvested: 12450,
        returns: 840,
        returnsPct: 6.8
      }
    });
  }

  // 5. Update Health Score
  await updateHealthScore(user.id);

  res.json({ success: true });
});

app.post('/api/aa/verify', async (req, res) => {
  const user = await getUser(req);
  if (user && user.aaConsentId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { bankLinked: true }
    });

    const existingCount = await prisma.transaction.count({ where: { userId: user.id } });
    if (existingCount === 0) {
      const foodCat = await prisma.category.findFirst({ where: { name: 'Food' } });
      const transportCat = await prisma.category.findFirst({ where: { name: 'Transport' } });
      
      await prisma.transaction.createMany({
        data: [
          { userId: user.id, amount: 240, shopName: 'UPI/UBER/TRIP', categoryId: transportCat?.id || 1 },
          { userId: user.id, amount: 560, shopName: 'UPI/ZOMATO/LUNCH', categoryId: foodCat?.id || 1 },
          { userId: user.id, amount: 120, shopName: 'UPI/SWIGGY/SNACK', categoryId: foodCat?.id || 1 },
          { userId: user.id, amount: 80, shopName: 'UPI/RAPIDO/RIDE', categoryId: transportCat?.id || 1 }
        ]
      });
    }
  }
  res.json({ success: true });
});

app.post('/api/aa/sync', async (req, res) => {
  const user = await getUser(req);
  if (!user || !user.bankLinked) return res.status(400).json({ error: 'Bank not linked' });

  const randomAmount = Math.floor(Math.random() * 500) + 50;
  const merchants = ['UPI/ZOMATO', 'UPI/SWIGGY', 'UPI/UBER', 'UPI/STARBUCKS', 'UPI/AMAZON', 'UPI/MYNTRA'];
  const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
  const categoryId = await classifyMerchant(randomMerchant);

  const transaction = await prisma.transaction.create({
    data: { amount: randomAmount, shopName: randomMerchant, userId: user.id, categoryId },
    include: { category: true }
  });

  res.json({ success: true, transaction });
});

app.post('/api/extract', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      "Extract bank transactions and current balance from this bank statement screenshot. Return JSON with 'balance' (number) and 'transactions' (array of {amount: number, shopName: string}). Return ONLY raw JSON object.",
      { inlineData: { data: imageBase64, mimeType: mimeType } }
    ]);

    let text = result.response.text().trim();
    // Clean JSON
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const parsed = JSON.parse(text);
      res.json({ extracted: parsed });
    } catch (parseError) {
      console.error('[AI] Parse Error:', parseError, 'Raw text:', text);
      res.status(500).json({ error: 'Failed to parse AI response', raw: text });
    }
  } catch (error) {
    console.error('[AI] Error:', error);
    res.status(500).json({ error: 'AI Extraction failed', details: error.message });
  }
});

app.post('/api/upload-statement', async (req, res) => {
  try {
    await seedCategories();
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { isPreProcessed, extracted, profile } = req.body;

    if (isPreProcessed && extracted) {
      console.log('[API] Processing pre-extracted data from client...');
      const txs = extracted.transactions || [];
      const extractedBalance = cleanNumber(extracted.balance);
      let addedCount = 0;

      for (const tx of txs) {
        try {
          const amount = cleanNumber(tx.amount);
          if (amount === null || amount === 0) continue;
          
          const categoryId = await classifyMerchant(tx.shopName);
          
          await prisma.transaction.create({
            data: { userId: user.id, amount, shopName: String(tx.shopName), categoryId }
          });
          addedCount++;
        } catch (err) { console.error(err); }
      }

      if (extractedBalance !== null) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentBalance: extractedBalance }
        });
      }

      if (profile) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            monthlyIncome: cleanNumber(profile.monthlyIncome) || user.monthlyIncome,
            fixedExpenses: cleanNumber(profile.fixedExpenses) || user.fixedExpenses,
            lifestyleSpend: cleanNumber(profile.lifestyleSpend) || user.lifestyleSpend,
            emergencyBuffer: cleanNumber(profile.emergencyGoal) || user.emergencyBuffer,
            debt: cleanNumber(profile.currentDebt) || user.debt
          }
        });
      }

      return res.json({ success: true, count: addedCount, balance: extractedBalance });
    }

    res.status(400).json({ error: 'Please use the client-side AI Tunnel for processing.' });
  } catch (error) {
    console.error(`[API] /api/upload-statement Error:`, error);
    res.status(500).json({ error: error.message || 'Failed to process' });
  }
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

  // 2. LLM Fallback (If no match in our DB)
  if (!categoryId) {
    console.log(`[LLM Fallback Triggered] Unknown merchant: ${shopName}`);
    let llmCategoryName = 'Shopping'; // default fallback
    
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(`Categorize the following bank transaction merchant name into exactly one of these exact categories: Food, Shopping, Transport, Utilities, Entertainment, Health, Transfer, Subs, Other. Merchant: "${shopName}". Return ONLY the exact category name as plain text.`);
      const rawText = response.response.text()?.trim() || '';
      if (rawText) {
        llmCategoryName = rawText.split('\n')[0].trim();
      }
      console.log(`[LLM Fallback] Gemini matched: ${llmCategoryName}`);
    } catch (e) {
      console.error(`[LLM Error]`, e);
    }
    
    const fallbackCategory = await prisma.category.findFirst({ where: { name: llmCategoryName } });
    categoryId = fallbackCategory ? fallbackCategory.id : (await prisma.category.findFirst({ where: { name: 'Other' } }))?.id || 1;

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

const updateHealthScore = async (userId) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true }
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { goals: true } });
  if (!user) return;

  let score = 100;
  
  // 1. Spend-to-Income (30 pts)
  const totalSpend = transactions.filter(t => t.category.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const income = user.monthlyIncome || 150000;
  if (totalSpend > income * 0.8) score -= 20;
  else if (totalSpend > income * 0.6) score -= 10;

  // 2. Savings Rate (25 pts)
  const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id }});
  const saved = portfolio ? portfolio.totalInvested : 0;
  if (saved < income * 0.1) score -= 15;

  // 3. Fixed vs Variable (20 pts)
  const variableSpend = transactions.filter(t => t.category.name === 'Food' || t.category.name === 'Shopping').reduce((sum, t) => sum + t.amount, 0);
  if (variableSpend > totalSpend * 0.4) score -= 10;

  // 4. Subscription Efficiency (10 pts)
  const subSpend = transactions.filter(t => t.category.name === 'Subs').reduce((sum, t) => sum + t.amount, 0);
  if (subSpend > 5000) score -= 5;

  score = Math.max(0, Math.min(100, score));

  await prisma.user.update({
    where: { id: user.id },
    data: { healthScore: score }
  });

  await prisma.healthScoreHistory.create({
    data: { userId: user.id, score }
  });
  
  return score;
};

// Phase 1: Nightly Health Score Algorithm
app.post('/api/cron/health-score', async (req, res) => {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await updateHealthScore(user.id);
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
