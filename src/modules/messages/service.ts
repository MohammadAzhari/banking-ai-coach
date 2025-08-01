import transactionService from "../transaction/service";
import aiService from "../ai/service";
import reportsService from "../reports/service";
import { prisma } from "../../configs/db";
import { whatsappService } from "../whatsapp/service";
import { Message } from "@prisma/client";
import { waitingMessages } from "./types";

class MessageService {
  async sendMessage(
    userId: string,
    data: { content: string; options?: string[] }
  ): Promise<void> {
    console.log(`Sending message to user ${userId}:`, data);
    // Fetch user from database to get WhatsApp ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (!user.whatsAppId) {
      throw new Error(`User ${userId} does not have a WhatsApp ID`);
    }

    await this.storeMessage({
      userId,
      message: data.content,
      isFromAi: true,
      options: data.options,
    });

    console.log(
      `Sending message to user ${userId} (WhatsApp: ${user.whatsAppId})`
    );

    // Check if we need to send buttons or just text
    if (data.options && data.options.length > 0) {
      // Send interactive button message
      const buttons = data.options.slice(0, 3).map((option, index) => ({
        id: `option_${index}`,
        title: option.substring(0, 20), // WhatsApp button limit is 20 chars
      }));

      await whatsappService.sendButtonMessage(
        user.whatsAppId,
        data.content,
        buttons
      );
    } else {
      // Send regular text message
      await whatsappService.sendMessage(user.whatsAppId, data.content);
    }

    console.log("Message sent successfully");
  }

  async onReceiveMessage(userId: string, messageText: string): Promise<void> {
    console.log(`Receiving message from user ${userId}: "${messageText}"`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const messsage = await this.storeMessage({
      userId,
      message: messageText,
      isFromAi: false,
    });

    // Use simplified transaction service method
    const response = await this.processUserMessage(messsage);

    if (!response) {
      throw new Error("No response generated");
    }

    await this.sendMessage(userId, response);
  }

  async processUserMessage(
    message: Message
  ): Promise<{ content: string; options?: string[] } | null> {
    const randomWaitingMessage =
      waitingMessages[Math.floor(Math.random() * waitingMessages.length)];

    await whatsappService.sendMessage(message.userId, randomWaitingMessage);

    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        userId: message.userId,
      },
      orderBy: { date: "desc" },
    });

    if (latestTransaction && !latestTransaction.isConversationClosed) {
      // Transaction is open - check user message and extract context
      const result = await aiService.extractContextFromMessage(
        latestTransaction.id,
        message.message
      );

      if (!result) {
        return null;
      }

      await transactionService.updateTransactionResponseId(
        latestTransaction.id,
        result.response.responseId
      );

      if (!result.isRelated) {
        return {
          content: result.response.content,
          options: result.response.options,
        };
      }

      await transactionService.updateTransactionContext(
        latestTransaction.id,
        result.context
      );

      if (result.needFurtherInfo) {
        // Update context and send response asking for more info
        return result.response;
      } else {
        // Close transaction and update context
        await transactionService.closeTransactionConversation(
          latestTransaction.id
        );
        return {
          content: result.response.content,
        };
      }
    }

    const [lifeReport, recentShortReports] = await Promise.all([
      reportsService.getLifeReportByUserId(message.userId),
      prisma.report.findMany({
        where: {
          userId: message.userId,
          type: "SHORT",
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]);

    const latestUserMessage = await prisma.message.findFirst({
      where: {
        userId: message.userId,
        isFromAi: false,
        id: {
          not: message.id,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response = await aiService.generateNaturalMessageResponse(
      message.userId,
      message.message,
      lifeReport,
      recentShortReports,
      latestUserMessage?.aiResponseId ?? undefined
    );

    if (!response) {
      throw new Error("No response generated");
    }

    await prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        aiResponseId: response.responseId,
      },
    });

    return {
      content: response.message,
    };
  }

  private async storeMessage(data: {
    userId: string;
    message: string;
    isFromAi: boolean;
    options?: string[];
  }) {
    return prisma.message.create({
      data: {
        userId: data.userId,
        message: data.message,
        isFromAi: data.isFromAi,
        options: data.options ? JSON.stringify(data.options) : undefined,
      },
    });
  }
}

export default new MessageService();
