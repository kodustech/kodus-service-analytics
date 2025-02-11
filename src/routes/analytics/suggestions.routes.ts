import { Router, Request, Response } from 'express';
import { suggestionsService } from '../../services/analytics/suggestions.service';

const router = Router();

router.get('/category', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await suggestionsService.getSuggestionsByCategory({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching suggestions by category:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/repository', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await suggestionsService.getSuggestionsByRepository({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching suggestions by repository:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const suggestionsRoutes = router; 