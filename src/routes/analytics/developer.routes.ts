import { Router, Request, Response } from 'express';
import { developerService } from '../../services/analytics/developer.service';

const router = Router();

router.get('/activity', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await developerService.getDeveloperActivity({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching developer activity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const developerRoutes = router; 