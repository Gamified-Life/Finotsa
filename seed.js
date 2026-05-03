import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({});

async function main() {
  console.log('Seeding database...');

  // Clear existing data to avoid conflicts
  await prisma.healthScoreHistory.deleteMany({});
  await prisma.merchantMap.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.insight.deleteMany({});
  await prisma.benchmark.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.engineRule.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Create a default user
  const user = await prisma.user.create({
    data: {
      name: 'Rahul',
      healthScore: 68,
    },
  });

  // Create Categories
  const catFood = await prisma.category.create({ data: { name: 'Food', emoji: '🍔', warningFlag: true, type: 'EXPENSE' } });
  const catTransport = await prisma.category.create({ data: { name: 'Transport', emoji: '🚗', warningFlag: false, type: 'EXPENSE' } });
  const catSubs = await prisma.category.create({ data: { name: 'Subs', emoji: '🎬', warningFlag: true, type: 'EXPENSE' } });
  const catShopping = await prisma.category.create({ data: { name: 'Shopping', emoji: '🛍️', warningFlag: false, type: 'EXPENSE' } });
  const catCafe = await prisma.category.create({ data: { name: 'Café', emoji: '☕', warningFlag: false, type: 'EXPENSE' } });

  // Create Transactions
  await prisma.transaction.createMany({
    data: [
      { userId: user.id, categoryId: catFood.id, amount: 3200, shopName: 'Swiggy' },
      { userId: user.id, categoryId: catFood.id, amount: 2400, shopName: 'Zomato' },
      { userId: user.id, categoryId: catFood.id, amount: 1200, shopName: 'McDonalds' },
      { userId: user.id, categoryId: catTransport.id, amount: 1800, shopName: 'Uber' },
      { userId: user.id, categoryId: catTransport.id, amount: 600, shopName: 'Ola' },
      { userId: user.id, categoryId: catSubs.id, amount: 649, shopName: 'Netflix' },
      { userId: user.id, categoryId: catSubs.id, amount: 119, shopName: 'Spotify' },
      { userId: user.id, categoryId: catSubs.id, amount: 2081, shopName: 'Amazon Prime' },
      { userId: user.id, categoryId: catShopping.id, amount: 1200, shopName: 'Myntra' },
      { userId: user.id, categoryId: catCafe.id, amount: 550, shopName: 'Starbucks' },
      { userId: user.id, categoryId: catCafe.id, amount: 340, shopName: 'Blue Tokai' },
    ],
  });

  // Create MerchantMaps
  await prisma.merchantMap.createMany({
    data: [
      { pattern: 'SWIGGY', categoryId: catFood.id },
      { pattern: 'ZOMATO', categoryId: catFood.id },
      { pattern: 'MCDONALDS', categoryId: catFood.id },
      { pattern: 'UBER', categoryId: catTransport.id },
      { pattern: 'OLA', categoryId: catTransport.id },
      { pattern: 'NETFLIX', categoryId: catSubs.id },
      { pattern: 'SPOTIFY', categoryId: catSubs.id },
      { pattern: 'AMAZON', categoryId: catSubs.id },
      { pattern: 'MYNTRA', categoryId: catShopping.id },
      { pattern: 'STARBUCKS', categoryId: catCafe.id },
      { pattern: 'BLUE TOKAI', categoryId: catCafe.id },
    ]
  });

  // Create Insights
  await prisma.insight.createMany({
    data: [
      { userId: user.id, title: 'Cancel Netflix', description: 'Unused for 3 weeks', suggestedAction: '₹649/mo', type: 'SAVING', effort: 'Easy', icon: '🎬' },
      { userId: user.id, title: 'Cook 3x vs Swiggy', description: 'Cut food variance', suggestedAction: '₹1,200/mo', type: 'SAVING', effort: 'Medium', icon: '🍱' },
      { userId: user.id, title: 'ELSS Mutual Funds', description: 'Invest ₹50,000 to max out 80C limit', suggestedAction: 'Save ₹15,000 in tax', type: 'TAX', icon: '📈' },
      { userId: user.id, title: 'Health Insurance', description: 'Premium for parents under 80D', suggestedAction: 'Save ₹7,500 in tax', type: 'TAX', icon: '🏥' },
    ],
  });

  // Create Benchmarks
  await prisma.benchmark.createMany({
    data: [
      { label: 'Food spend', current: 12400, past: 14200, better: true },
      { label: 'Transport', current: 4500, past: 3200, better: false },
      { label: 'Shopping', current: 2100, past: 5800, better: true },
    ],
  });

  // Create Portfolio
  await prisma.portfolio.create({
    data: {
      userId: user.id,
      totalInvested: 4250,
      returns: 102,
      returnsPct: 2.4,
    },
  });

  // Create Engine Rules
  await prisma.engineRule.createMany({
    data: [
      { userId: user.id, name: 'Round-Up Invest', desc: 'Every UPI spend rounded to next ₹10, swept to Nifty 50', saved: '₹1,240', active: true, icon: 'Zap' },
      { userId: user.id, name: 'Goal Auto-Transfer', desc: '₹500/week silently moved to Goa Trip fund', saved: '₹2,000', active: true, icon: 'Target' },
      { userId: user.id, name: 'Subscription Shield', desc: 'Flags any new auto-debit before it hits', saved: '₹649 blocked', active: true, icon: 'Shield' },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
