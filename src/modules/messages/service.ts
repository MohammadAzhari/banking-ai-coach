import transactionService from '../transaction/service';
import aiService from '../ai/service';
import { prisma } from '../../configs/db'

class MessageService {

  async sendMessage(data: any): Promise<void> {
    // send message to user whatsapp
    console.log('Sending message to user whatsapp', data);
  }

  async onReceiveMessage(userId: string, messageText: string): Promise<void> {
    try {
      console.log(`Receiving message from user ${userId}: "${messageText}"`);
      
      // Use simplified transaction service method
      const response = await this.processUserMessage(userId, messageText);
      
      if (response) {
        await this.sendMessage(response);
      } else {
        await this.sendMessage({
          content: "I encountered an error processing your message. Please try again.",
        });
      }
      
    } catch (error) {
      console.error('Error processing received message:', error);
      await this.sendMessage({
        content: "I encountered an error processing your message. Please try again.",
      });
    }
  }

  async processUserMessage(userId: string, userMessage: string): Promise<{ content: string; options?: string[] } | null> {
    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
      },
      orderBy: { date: 'desc' },
    });

    if (latestTransaction && !latestTransaction.isConversationClosed) {
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
        await transactionService.updateTransactionContext(latestTransaction.id, result.context);
        await transactionService.updateTransactionResponseId(latestTransaction.id, result.response.responseId);
        return result.response;
      } else {
        // Close transaction and update context
        await transactionService.updateTransactionContext(latestTransaction.id, result.context);
        await transactionService.closeTransactionConversation(latestTransaction.id);
        return {
          content: result.response.content + " Thanks for the context! Is there anything else I can help you with?",
          options: ["Show spending report", "Help with budgeting", "Nothing for now"]
        };
      }
    }

    // handle this case later
    return null;
  }
}

export default new MessageService();
