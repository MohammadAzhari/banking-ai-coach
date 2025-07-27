import transactionService from '../transaction/service';
import aiService from '../ai/service';

class MessageService {

  async sendMessage(data: any): Promise<void> {
    // send message to user whatsapp
    console.log('Sending message to user whatsapp', data);
  }

  async onReceiveMessage(userId: string, messageText: string): Promise<void> {
    try {
      console.log(`Receiving message from user ${userId}: "${messageText}"`);
      
      // Use simplified transaction service method
      const response = await transactionService.processUserMessage(userId, messageText);
      
      if (response) {
        await this.sendMessage(response);
      } else {
        await this.sendMessage({
          content: "I encountered an error processing your message. Please try again.",
          options: ["Try again", "Contact support"]
        });
      }
      
    } catch (error) {
      console.error('Error processing received message:', error);
      await this.sendMessage({
        content: "I encountered an error processing your message. Please try again.",
        options: ["Try again", "Contact support"]
      });
    }
  }
}

export default new MessageService();
