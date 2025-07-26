import { Router, Request, Response } from 'express';
import reportsService from './service';

const router = Router();

// POST /short-reports
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;

    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const shortReport = await reportsService.generateShortReport(userId);

    res.status(201).json({
      shortReport,
      message: 'Short report generated successfully. AI analysis initiated in background.'
    });

  } catch (error) {
    console.error('Error generating short report:', error);
    
    if (error instanceof Error && error.message === 'No unreported transactions found for this user') {
      return res.status(404).json({ 
        error: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;
