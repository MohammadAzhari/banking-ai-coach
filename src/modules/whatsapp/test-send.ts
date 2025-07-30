import dotenv from 'dotenv';
import { whatsappService } from './service';

dotenv.config();

async function testSendMessage() {
  try {
    const testPhoneNumber = '966537211368';
    const testMessage = 'Hello from WhatsApp Cloud API test!';

    console.log('Sending test message...');
    const result = await whatsappService.sendMessage(testPhoneNumber, testMessage);
    
    console.log('Message sent successfully!');
    console.log('Response:', result);
  } catch (error: any) {
    console.error('Failed to send message:');
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testSendMessage();