import { Transaction } from "@prisma/client";
import { prisma } from "../../configs/db";
import { CreateTransactionRequest } from "./types";
import aiService from "../ai/service";
import messageService from "../messages/service";

class TransactionService {
  async createTransaction(
    userId: string,
    data: CreateTransactionRequest
  ): Promise<Transaction> {
    const transaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: data.amount,
          category: data.category,
          type: data.type,
          storeName: data.storeName,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: data.type === 'CREDIT' ? data.amount : -data.amount,
          }
        }
      });

      return transaction;
    });
    // Background callback to ask for more context
    this.requestContextInBackground(transaction.id);

    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      orderBy: { date: "desc" },
    });
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return await prisma.transaction.findUnique({
      where: { id },
    });
  }

  async updateTransactionContext(
    transactionId: string,
    context: string
  ): Promise<boolean> {
    try {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { context },
      });
      return true;
    } catch (error) {
      console.error("Error updating transaction context:", error);
      return false;
    }
  }

  async getUnreportedTransactionsByUserId(
    userId: string
  ): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        userId,
        isReported: false,
      },
      orderBy: { date: "desc" },
    });
  }

  async markTransactionsAsReported(userId: string): Promise<void> {
    await prisma.transaction.updateMany({
      where: {
        userId,
        isReported: false,
      },
      data: {
        isReported: true,
      },
    });
  }

  async processUserMessage(userId: string, userMessage: string): Promise<{ content: string; options: string[] } | null> {
    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        isConversationClosed: false,
      },
      orderBy: { date: 'desc' },
    });

    if (latestTransaction) {
      // Transaction is open - check user message and extract context
      const result = await aiService.extractContextFromMessage(latestTransaction.id, userMessage);
      
      if (!result) {
        return {
          content: "I'm having trouble understanding your message. Could you please rephrase it?",
          options: ["Help with my recent transaction", "Ask something else"]
        };
      }

      if (!result.isRelated) {
        return {
          content: `I notice you have an ongoing conversation about your $${latestTransaction.amount} transaction at ${latestTransaction.storeName || 'Unknown'}. Your message seems unrelated. Would you like to close that conversation?`,
          options: ["Yes, close it", "No, continue previous", "Help with both"]
        };
      }

      if (result.needFurtherInfo) {
        // Update context and send response asking for more info
        await this.updateTransactionContext(latestTransaction.id, result.context);
        await this.updateTransactionResponseId(latestTransaction.id, result.response.responseId);
        return result.response;
      } else {
        // Close transaction and update context
        await this.updateTransactionContext(latestTransaction.id, result.context);
        await this.closeTransactionConversation(latestTransaction.id);
        return {
          content: result.response.content + " Thanks for the context! Is there anything else I can help you with?",
          options: ["Show spending report", "Help with budgeting", "Nothing for now"]
        };
      }
    } else {
      // No open transaction - general message
      return {
        content: "Hello! I'm your AI financial assistant. I help you understand your spending patterns. Feel free to ask me anything about your finances!",
        options: [
          "Show my recent transactions",
          "Generate a spending report", 
          "Help me budget better"
        ]
      };
    }
  }

  async getLatestOpenTransaction(userId: string): Promise<Transaction | null> {
    return await prisma.transaction.findFirst({
      where: {
        userId,
        isConversationClosed: false,
      },
      orderBy: { date: 'desc' },
    });
  }

  async closeTransactionConversation(transactionId: string): Promise<boolean> {
    try {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { isConversationClosed: true }
      });
      return true;
    } catch (error) {
      console.error('Error closing transaction conversation:', error);
      return false;
    }
  }

  async updateTransactionResponseId(transactionId: string, responseId: string): Promise<boolean> {
    try {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { latestResponseId: responseId }
      });
      return true;
    } catch (error) {
      console.error('Error updating transaction response ID:', error);
      return false;
    }
  }

  private async requestContextInBackground(
    transactionId: string
  ): Promise<void> {
    try {
      console.log(
        `Background: Requesting context for transaction ${transactionId}`
      );

      const aiResponse = await aiService.generateContextQuestionForTransaction(
        transactionId
      );

      if (aiResponse) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { latestResponseId: aiResponse.responseId },
        });
        // TODO: need to get user whatsapp/phone id from db
        // Send the content message (options can be used for interactive responses)
        await messageService.sendMessage(aiResponse);
      } else {
        console.log(
          `No AI response generated for transaction ${transactionId}`
        );
      }
    } catch (error) {
      console.error(
        `Error in requestContextInBackground for transaction ${transactionId}:`,
        error
      );
    }
  }
}

export default new TransactionService();
