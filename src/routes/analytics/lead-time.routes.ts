import { Router, Request, Response } from 'express';
import { leadTimeService } from '../../services/analytics/lead-time.service';

const router = Router();

router.get('/highlight', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await leadTimeService.getLeadTimeHighlight({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json(data);
  } catch (error) {
    console.error('Error fetching lead time highlight:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/chart', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await leadTimeService.getLeadTimeChartData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching lead time chart data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/breakdown', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await leadTimeService.getLeadTimeBreakdown({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching lead time breakdown:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const leadTimeRoutes = router; 