import { Router, Request, Response } from 'express';
import { pullRequestsService } from '../../services/analytics/pull-requests.service';

const router = Router();

router.get('/size/highlight', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await pullRequestsService.getPullRequestSizeHighlight({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json(data);
  } catch (error) {
    console.error('Error fetching PR size highlight:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/by-developer', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await pullRequestsService.getPullRequestsByDev({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching PRs by developer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/opened-vs-closed', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await pullRequestsService.getPullRequestsOpenedVsClosed({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching PRs opened vs closed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const pullRequestsRoutes = router; 