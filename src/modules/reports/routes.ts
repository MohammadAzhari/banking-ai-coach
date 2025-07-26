import { Router, Request, Response } from 'express';
import reportsService from './service';

const router = Router();

// POST /short-reports/:userId
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

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

// GET /short-reports/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const shortReports = await reportsService.getShortReportsByUserId(userId);

    res.json(shortReports);

  } catch (error) {
    console.error('Error fetching short reports:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// GET /short-reports/report/:id
router.get('/report/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        error: 'Report ID is required' 
      });
    }

    const shortReport = await reportsService.getShortReportById(id);

    if (!shortReport) {
      return res.status(404).json({ 
        error: 'Short report not found' 
      });
    }

    res.json(shortReport);

  } catch (error) {
    console.error('Error fetching short report:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;
