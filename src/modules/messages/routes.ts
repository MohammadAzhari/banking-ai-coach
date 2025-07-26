import { Router, Request, Response } from 'express';
import messageService from './service';

const router = Router();

// POST /messages
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string' 
      });
    }

    await messageService.onReceiveMessage(text.trim());

    res.status(201).json({
      message: 'Message sent successfully. Processing initiated in background.'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;
