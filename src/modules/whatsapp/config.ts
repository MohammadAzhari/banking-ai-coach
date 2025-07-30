import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const whatsappConfig = {
  apiVersion: 'v23.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  apiUrl: 'https://graph.facebook.com',
};

// Debug: Log to verify values are loaded
console.log('WhatsApp Config loaded:', {
  phoneNumberId: whatsappConfig.phoneNumberId ? 'Set' : 'Not set',
  accessToken: whatsappConfig.accessToken ? 'Set' : 'Not set',
  verifyToken: whatsappConfig.verifyToken ? 'Set' : 'Not set',
});