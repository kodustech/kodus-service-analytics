import { Router } from "express";
import { authenticateApiKey } from "../middleware/auth";
import { Request, Response } from "express";
import { developerProductivityService } from "../services/analytics/developer-productivity.service";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateApiKey);

/**
 * @swagger
 * /api/productivity/charts/deploy-frequency:
 *   get:
 *     summary: Obtém a frequência de deploys
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Frequência de deploys por período
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/charts/deploy-frequency", async (req, res, next) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required parameters: organizationId, startDate, endDate",
      });
    }

    const data = await developerProductivityService.getDeployFrequencyChartData(
      {
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      }
    );

    res.json({
      status: "success",
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/productivity/highlights/deploy-frequency:
 *   get:
 *     summary: Obtém os destaques da frequência de deploys
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Métricas de destaque da frequência de deploys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deployFrequency:
 *                   type: object
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/highlights/deploy-frequency",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const deployFrequency =
        await developerProductivityService.getDeployFrequencyHighlight(
          organizationId as string,
          startDate as string,
          endDate as string
        );

      res.json({ deployFrequency });
    } catch (error) {
      console.error("Error fetching deploy frequency highlight:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/highlights/lead-time-for-change:
 *   get:
 *     summary: Obtém os destaques do lead time para mudanças
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Métricas de destaque do lead time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageLeadTime:
 *                   type: number
 *                 totalPRs:
 *                   type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/highlights/lead-time-for-change",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const leadTimeMetrics =
        await developerProductivityService.getPullRequestLeadTimeHighlight(
          organizationId as string,
          startDate as string,
          endDate as string
        );

      return res.json(leadTimeMetrics);
    } catch (error) {
      console.error("Error fetching PR lead time:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/charts/lead-time:
 *   get:
 *     summary: Obtém o lead time dos deploys
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lead time médio por período
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       averageLeadTime:
 *                         type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/lead-time",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await developerProductivityService.getLeadTimeChartData({
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching lead time chart data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/highlights/pr-size:
 *   get:
 *     summary: Obtém os destaques do tamanho dos PRs
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Métricas de destaque do tamanho dos PRs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageSize:
 *                   type: number
 *                 totalPRs:
 *                   type: number
 *                 sizeDistribution:
 *                   type: object
 *                   properties:
 *                     small:
 *                       type: number
 *                     medium:
 *                       type: number
 *                     large:
 *                       type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/highlights/pr-size", async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        error:
          "Missing required parameters: organizationId, startDate, endDate",
      });
    }

    const prSizeMetrics =
      await developerProductivityService.getPullRequestSizeHighlight(
        organizationId as string,
        startDate as string,
        endDate as string
      );

    return res.json(prSizeMetrics);
  } catch (error) {
    console.error("Error fetching PR size metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/productivity/charts/pull-requests-by-developer:
 *   get:
 *     summary: Obtém estatísticas de pull requests por desenvolvedor
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Estatísticas de PRs por desenvolvedor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       developer:
 *                         type: string
 *                       count:
 *                         type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/pull-requests-by-developer",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data =
        await developerProductivityService.getPullRequestsByDevChartData({
          organizationId: organizationId as string,
          startDate: startDate as string,
          endDate: endDate as string,
        });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching PRs by dev chart data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/charts/pull-requests-opened-vs-closed:
 *   get:
 *     summary: Obtém comparação entre PRs abertos e fechados
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Comparação de PRs abertos vs fechados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       opened:
 *                         type: number
 *                       closed:
 *                         type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/pull-requests-opened-vs-closed",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data =
        await developerProductivityService.getPullRequestsOpenedVsClosedData({
          organizationId: organizationId as string,
          startDate: startDate as string,
          endDate: endDate as string,
        });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching PRs opened vs closed data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/charts/lead-time-breakdown:
 *   get:
 *     summary: Obtém o detalhamento do lead time
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Detalhamento das etapas do lead time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stage:
 *                         type: string
 *                       averageTime:
 *                         type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/lead-time-breakdown",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await developerProductivityService.getLeadTimeBreakdownData({
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching lead time breakdown data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/charts/developer-activity:
 *   get:
 *     summary: Obtém métricas de atividade dos desenvolvedores
 *     tags: [Developer Productivity]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data inicial (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *         description: Data final (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Métricas de atividade dos desenvolvedores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       developer:
 *                         type: string
 *                       commits:
 *                         type: number
 *                       pullRequests:
 *                         type: number
 *                       reviews:
 *                         type: number
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/developer-activity",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await developerProductivityService.getDeveloperActivityData({
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching developer activity data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export const developerProductivityRoutes = router;
