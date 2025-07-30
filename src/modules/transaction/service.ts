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
        
        const transaction = await prisma.transaction.update({
          where: { id: transactionId },
          data: { latestResponseId: aiResponse.responseId },
        });
        // TODO: need to get user whatsapp/phone id from db
        // Send the content message (options can be used for interactive responses)
        await messageService.sendMessage(transaction.userId, aiResponse);
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
