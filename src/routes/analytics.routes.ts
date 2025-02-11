import { Router } from "express";
import { bigQueryService } from "../services/bigquery.service";
import { authenticateApiKey } from "../middleware/auth";
import { Request, Response } from "express";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateApiKey);

// Rota para obter deploy frequency
router.get("/cockpit/charts/deploy-frequency", async (req, res, next) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required parameters: organizationId, startDate, endDate",
      });
    }

    const data = await bigQueryService.getDeployFrequencyChartData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/cockpit/highlights/deploy-frequency', async (req: Request, res: Response) => {
    try {
        const { organizationId, startDate, endDate } = req.query;

        if (!organizationId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const deployFrequency = await bigQueryService.getDeployFrequencyHighlight(
            organizationId as string,
            startDate as string,
            endDate as string
        );

        res.json({ deployFrequency });
    } catch (error) {
        console.error('Error fetching deploy frequency highlight:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/cockpit/highlights/lead-time-for-change', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const leadTimeMetrics = await bigQueryService.getPullRequestLeadTimeHighlight(
      organizationId as string,
      startDate as string,
      endDate as string
    );

    return res.json(leadTimeMetrics);
  } catch (error) {
    console.error('Error fetching PR lead time:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cockpit/charts/lead-time-for-change', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getLeadTimeChartData({
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

router.get('/cockpit/highlights/pr-size', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const prSizeMetrics = await bigQueryService.getPullRequestSizeHighlight(
      organizationId as string,
      startDate as string,
      endDate as string
    );

    return res.json(prSizeMetrics);
  } catch (error) {
    console.error('Error fetching PR size metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cockpit/charts/pull-requests-by-developer', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getPullRequestsByDevChartData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching PRs by dev chart data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cockpit/charts/pull-requests-opened-vs-closed', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getPullRequestsOpenedVsClosedData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching PRs opened vs closed data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cockpit/charts/lead-time-breakdown', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getLeadTimeBreakdownData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching lead time breakdown data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cockpit/charts/developer-activity', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getDeveloperActivityData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching developer activity data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cockpit/charts/suggestions-by-category', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getSuggestionsByCategory({
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

router.get('/cockpit/charts/suggestions-by-repository', async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizationId, startDate, endDate' 
      });
    }

    const data = await bigQueryService.getSuggestionsByRepository({
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

export const analyticsRoutes = router;
