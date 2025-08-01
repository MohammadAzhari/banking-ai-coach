import { PrismaClient } from "@prisma/client";
import { transactions2 } from "../mock/transactions2";

const prisma = new PrismaClient();

const OSMAN_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const AZHARI_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440002";

async function main() {
  const userId = AZHARI_TEST_USER_ID;
  const transactions = transactions2;

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId,
        amount: tx.amount,
        category: tx.category,
        type: "DEBIT",
        context: tx.context,
        storeName: tx.storeName,
        date: new Date(tx.date),
      },
    });
  }

  console.log(`✅ Seeded ${transactions.length} transactions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
