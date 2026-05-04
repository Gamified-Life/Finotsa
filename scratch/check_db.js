import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.count();
    const categories = await prisma.category.findMany();
    const transactions = await prisma.transaction.count();
    console.log('Users:', users);
    console.log('Categories:', categories);
    console.log('Transactions:', transactions);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
