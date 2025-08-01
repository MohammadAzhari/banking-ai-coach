import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const OSMAN_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const AZHARI_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440002";

async function main() {
  const userId = OSMAN_TEST_USER_ID;
  const filePath = path.join(__dirname, "mock", "transactions1.ts");
  const transactions = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        userId,
        amount: tx.amount,
        category: tx.category,
        type: tx.type,
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
