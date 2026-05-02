import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({});

async function main() {
  console.log('Seeding Engine data...');
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("No user found!");
    return;
  }

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

  console.log('Engine Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
