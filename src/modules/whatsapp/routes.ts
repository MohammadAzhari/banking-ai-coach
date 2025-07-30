import { Router, Request, Response } from 'express';
import { whatsappService } from './service';
import { whatsappConfig } from './config';

const router = Router();

// Simple in-memory storage for conversation state (in production, use a database)
const conversationState = new Map<string, string>();

// Webhook verification endpoint (GET)
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === whatsappConfig.verifyToken) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook endpoint for receiving messages (POST)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    
    const message = whatsappService.processWebhookMessage(req.body);
    
    if (message) {
      console.log('Processed message:', message);
      
      const userState = conversationState.get(message.from) || 'initial';
      
      // Handle conversation flow
      if (message.body.toLowerCase().trim() === 'hi' && userState === 'initial') {
        // User said HI, ask for name
        await whatsappService.sendMessage(
          message.from, 
          "Hello! What's your name?"
        );
        conversationState.set(message.from, 'waiting_for_name');
        
      } else if (userState === 'waiting_for_name') {
        // User provided their name, send button options
        const userName = message.body;
        
        await whatsappService.sendButtonMessage(
          message.from,
          `Nice to meet you, ${userName}! What would you like to do?`,
          [
            { id: 'learn_finance', title: 'Learn Finance' },
            { id: 'finance_freedom', title: 'Finance Freedom' },
            { id: 'other', title: 'Other' }
          ]
        );
        conversationState.set(message.from, 'waiting_for_choice');
        
      } else if (userState === 'waiting_for_choice') {
        // Handle button selection
        let responseMessage = '';
        
        switch (message.body) {
          case 'learn_finance':
            responseMessage = "Great choice! Let's start your finance learning journey. What specific topic interests you?";
            break;
          case 'finance_freedom':
            responseMessage = "Excellent! Financial freedom is a great goal. Let's explore strategies to achieve it.";
            break;
          case 'other':
            responseMessage = "Sure! Please tell me what you'd like to know about.";
            break;
          default:
            responseMessage = "I didn't understand that. Please click one of the buttons above.";
        }
        
        await whatsappService.sendMessage(message.from, responseMessage);
        // Reset state or move to next state as needed
        conversationState.set(message.from, 'initial');
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200);
  }
});

// Endpoint to send a message
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    const result = await whatsappService.sendMessage(to, message);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;