import { Router, Request, Response } from "express";
import { whatsappService } from "./service";
import { whatsappConfig } from "./config";
import messageService from "../messages/service";
import { prisma } from "../../configs/db";
import { userService } from "../user/service";

const router = Router();

// Helper function to get user by WhatsApp ID
async function getUserByWhatsAppId(whatsAppId: string): Promise<string | null> {
  try {
    // Find existing user by their WhatsApp ID (phone number)
    const existingUser = await prisma.user.findFirst({
      where: { whatsAppId },
    });

    if (existingUser) {
      return existingUser.id; // Return the user's UUID
    }

    // TODO: Implement proper user registration flow
    // For now, return null if user doesn't exist
    // In production, you might want to:
    // 1. Ask for user details (name, etc.)
    // 2. Create a proper onboarding flow
    // 3. Link to existing account by email/phone
    console.log(`No user found for WhatsApp ID: ${whatsAppId}`);
    return null;
  } catch (error) {
    console.error("Error getting user by WhatsApp ID:", error);
    return null;
  }
}

// Webhook verification endpoint (GET)
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === whatsappConfig.verifyToken) {
      console.log("Webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook endpoint for receiving messages (POST)
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));

    const message = whatsappService.processWebhookMessage(req.body);

    if (message && message.body) {
      console.log("Processed message from WhatsApp:", message.from); // This is the phone number

      // Get user UUID by WhatsApp ID (phone number)
      const userId = await getUserByWhatsAppId(message.from);

      if (!userId) {
        // Create user and notify
        const newUser = await userService.createUserFromWhatsApp({
          name: message.profileName,
          whatsAppId: message.from,
        });
        console.log("Created new user for WhatsApp ID:", message.from);
        await whatsappService.sendMessage(
          newUser.whatsAppId,
          `
          هلا ${message.profileName}!
          حسابك مفتوح الحين!
          تقدر تستخدم رشد فنتك
          `
        );
      } else {
        // Process the message using MessageService with the user's UUID
        await messageService.onReceiveMessage(userId, message.body);
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent WhatsApp from retrying
    res.sendStatus(200);
  }
});

// Endpoint to send a message (for testing or internal use)
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, message, userId } = req.body;

    if (userId) {
      // If userId (UUID) is provided, use MessageService
      await messageService.sendMessage(userId, {
        content: message,
      });
      res.json({ success: true, method: "messageService" });
    } else if (to && message) {
      // Direct send using WhatsApp number (phone number)
      const result = await whatsappService.sendMessage(to, message);
      res.json({ success: true, data: result, method: "direct" });
    } else {
      return res.status(400).json({
        error: "Missing required fields: either userId (UUID) or (to, message)",
      });
    }
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Optional: Endpoint to link WhatsApp ID to existing user
router.post("/link-user", async (req: Request, res: Response) => {
  try {
    const { userId, whatsAppId } = req.body;

    if (!userId || !whatsAppId) {
      return res.status(400).json({
        error:
          "Missing required fields: userId (UUID), whatsAppId (phone number)",
      });
    }

    // Update user record to add their WhatsApp phone number
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // UUID
      data: { whatsAppId }, // Phone number
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id, // UUID
        name: updatedUser.name,
        whatsAppId: updatedUser.whatsAppId, // Phone number
      },
    });
  } catch (error) {
    console.error("Link user error:", error);
    res.status(500).json({ error: "Failed to link user" });
  }
});

export default router;
