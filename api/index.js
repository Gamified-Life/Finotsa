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

  res.json({
    rules: rules.map(r => ({
      name: r.name,
      desc: r.desc,
      saved: r.saved,
      on: r.active,
      icon: r.icon,
    })),
    portfolio,
  });
});

export default app;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(3001, () => console.log('Local dev server running on port 3001'));
}
