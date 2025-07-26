import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

async function main() {
  console.log('🌱 Starting seed...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      name: 'John Doe',
      balance: 5000.00,
      whatsAppId: 'test-user-whatsapp-123',
    },
  });

  console.log('✅ Created user:', user);

  // Create some sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 25.50,
        category: 'food',
        type: 'DEBIT',
        storeName: 'Starbucks',
        date: new Date('2024-01-15T10:30:00Z'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 1200.00,
        category: 'bills',
        type: 'DEBIT',
        storeName: 'Electric Company',
        date: new Date('2024-01-14T14:20:00Z'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 3000.00,
        category: 'other',
        type: 'CREDIT',
        storeName: 'Salary Deposit',
        date: new Date('2024-01-01T09:00:00Z'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 45.75,
        category: 'transportation',
        type: 'DEBIT',
        storeName: 'Uber',
        date: new Date('2024-01-13T18:45:00Z'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 89.99,
        category: 'shopping',
        type: 'DEBIT',
        storeName: 'Amazon',
        date: new Date('2024-01-12T16:30:00Z'),
      },
    }),
  ]);

  console.log('✅ Created transactions:', transactions.length);

  // Create a sample short report
  const shortReport = await prisma.shortReport.create({
    data: {
      userId: user.id,
      summary: {
        totalSpent: 1361.24,
        topCategory: 'bills',
        transactionCount: 4,
        insights: ['High spending on bills this month', 'Consider budgeting for transportation']
      },
    },
  });

  console.log('✅ Created short report:', shortReport);

  console.log('🎉 Seed completed successfully!');
  console.log(`📋 Test User ID: ${user.id}`);
  console.log(`📋 Test User WhatsApp ID: ${user.whatsAppId}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
