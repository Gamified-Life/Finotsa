import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const txs = await prisma.transaction.findMany({
    include: { category: true }
  });
  console.log(`Total transactions: ${txs.length}`);
  txs.forEach(t => {
    console.log(`${t.id}: ${t.shopName} - ₹${t.amount} (${t.date.toISOString()})`);
  });
  await prisma.$disconnect();
}

check();
