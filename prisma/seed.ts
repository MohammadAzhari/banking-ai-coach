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
