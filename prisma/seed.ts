import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Use a specific UUID for your test user
const OSMAN_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440001"; // Changed last digit to make it unique
const AZHARI_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440002"; // Changed last digit to make it unique

async function main() {
  console.log("🌱 Adding Osman test user...");

  try {
    // Create or update only YOUR test user
    const osman = await prisma.user.upsert({
      where: { id: OSMAN_TEST_USER_ID },
      update: {
        name: "Osman Elfaki",
        whatsAppId: "966537211368",
      },
      create: {
        id: OSMAN_TEST_USER_ID,
        name: "Osman Elfaki",
        balance: 5000.0,
        whatsAppId: "966537211368",
      },
    });

    const azhari = await prisma.user.upsert({
      where: { id: AZHARI_TEST_USER_ID },
      update: {
        name: "Azhari",
        whatsAppId: "249928737001",
      },
      create: {
        id: AZHARI_TEST_USER_ID,
        name: "Azhari",
        balance: 5000.0,
        whatsAppId: "249928737001",
      },
    });

    console.log("✅ Created/Updated Osman test user:", osman);
    console.log(`📋 Your Test User ID: ${osman.id}`);
    console.log(`📋 Your WhatsApp ID: ${osman.whatsAppId}`);

    // Save this ID somewhere for your testing
    console.log("\n💡 Save this for your testing:");
    console.log(`export const OSMAN_TEST_USER_ID = '${osman.id}';`);
    console.log(`export const AZHARI_TEST_USER_ID = '${azhari.id}';`);
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
