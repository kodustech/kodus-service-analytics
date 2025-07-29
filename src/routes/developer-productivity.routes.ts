import { Router } from "express";
import { authenticateApiKey } from "../middleware/auth";
import { Request, Response } from "express";
import { developerProductivityService } from "../services/analytics/developer-productivity.service";
import { cacheMiddleware } from "../middleware/cache.middleware";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateApiKey);

// Middleware de cache para todas as rotas (15 minutos)
router.use(cacheMiddleware(900));

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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
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
    const { organizationId, startDate, endDate, repository } = req.query;

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
 *     summary: Obtém a frequência de deploys com comparação ao período anterior
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
 *     responses:
 *       200:
 *         description: Dados da frequência de deploys com comparação ao período anterior
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         totalDeployments:
 *                           type: number
 *                           description: Total de deploys no período atual
 *                         averagePerWeek:
 *                           type: number
 *                           description: Média de deploys por semana no período atual
 *                     previousPeriod:
 *                       type: object
 *                       properties:
 *                         totalDeployments:
 *                           type: number
 *                           description: Total de deploys no período anterior
 *                         averagePerWeek:
 *                           type: number
 *                           description: Média de deploys por semana no período anterior
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         percentageChange:
 *                           type: number
 *                           description: Variação percentual entre os períodos (positivo indica melhoria)
 *                         trend:
 *                           type: string
 *                           enum: [improved, worsened, unchanged]
 *                           description: Indica se o índice melhorou, piorou ou permaneceu igual
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
      const { organizationId, startDate, endDate, repository } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await developerProductivityService.getDeployFrequencyHighlight(
        organizationId as string,
        startDate as string,
        endDate as string,
        repository as string | undefined
      );

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching deploy frequency highlight:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/productivity/highlights/lead-time-for-change:
 *   get:
 *     summary: Obtém o lead time para mudanças com comparação ao período anterior
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
 *     responses:
 *       200:
 *         description: Dados do lead time com comparação ao período anterior
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         leadTimeP75Minutes:
 *                           type: number
 *                           description: Lead time P75 em minutos no período atual
 *                         leadTimeP75Hours:
 *                           type: number
 *                           description: Lead time P75 em horas no período atual
 *                     previousPeriod:
 *                       type: object
 *                       properties:
 *                         leadTimeP75Minutes:
 *                           type: number
 *                           description: Lead time P75 em minutos no período anterior
 *                         leadTimeP75Hours:
 *                           type: number
 *                           description: Lead time P75 em horas no período anterior
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         percentageChange:
 *                           type: number
 *                           description: Variação percentual entre os períodos (negativo indica melhoria)
 *                         trend:
 *                           type: string
 *                           enum: [improved, worsened, unchanged]
 *                           description: Indica se o índice melhorou, piorou ou permaneceu igual
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
      const { organizationId, startDate, endDate, repository } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await developerProductivityService.getPullRequestLeadTimeHighlight(
        organizationId as string,
        startDate as string,
        endDate as string,
        repository as string | undefined
      );

      return res.json({
        status: "success",
        data,
      });
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
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
  "/charts/lead-time-for-change",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate, repository } = req.query;

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
        repository: repository as string | undefined,
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
 *     summary: Obtém o tamanho médio dos PRs com comparação ao período anterior
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
 *     responses:
 *       200:
 *         description: Dados do tamanho médio dos PRs com comparação ao período anterior
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         averagePRSize:
 *                           type: number
 *                           description: Tamanho médio dos PRs no período atual
 *                         totalPRs:
 *                           type: number
 *                           description: Total de PRs no período atual
 *                     previousPeriod:
 *                       type: object
 *                       properties:
 *                         averagePRSize:
 *                           type: number
 *                           description: Tamanho médio dos PRs no período anterior
 *                         totalPRs:
 *                           type: number
 *                           description: Total de PRs no período anterior
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         percentageChange:
 *                           type: number
 *                           description: Variação percentual entre os períodos (negativo indica melhoria)
 *                         trend:
 *                           type: string
 *                           enum: [improved, worsened, unchanged]
 *                           description: Indica se o índice melhorou, piorou ou permaneceu igual
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/highlights/pr-size", async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate, repository } = req.query;

    if (!organizationId || !startDate || !endDate) {
      return res.status(400).json({
        error:
          "Missing required parameters: organizationId, startDate, endDate",
      });
    }

    const data = await developerProductivityService.getPullRequestSizeHighlight(
      organizationId as string,
      startDate as string,
      endDate as string,
      repository as string | undefined
    );

    return res.json({
      status: "success",
      data,
    });
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
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
      const { organizationId, startDate, endDate, repository } = req.query;

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
          repository: repository as string | undefined,
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
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
      const { organizationId, startDate, endDate, repository } = req.query;

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
          repository: repository as string | undefined,
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
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
      const { organizationId, startDate, endDate, repository } = req.query;

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
        repository: repository as string | undefined,
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
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
      const { organizationId, startDate, endDate, repository } = req.query;

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
        repository: repository as string | undefined,
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

/**
 * @swagger
 * /api/productivity/dashboard/company:
 *   get:
 *     summary: Dashboard consolidado com todas as métricas por empresa
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
 *       - in: query
 *         name: repository
 *         required: false
 *         schema:
 *           type: string
 *         description: Nome do repositório para filtrar os dados
 *       - in: query
 *         name: complete
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, retorna todas as métricas. Se false, retorna apenas métricas básicas
 *     responses:
 *       200:
 *         description: Dashboard consolidado com todas as métricas da empresa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizationId:
 *                       type: string
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                         endDate:
 *                           type: string
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalPRs:
 *                           type: number
 *                           description: Quantidade total de PRs
 *                         criticalSuggestions:
 *                           type: number
 *                           description: Número de sugestões críticas
 *                         totalSuggestions:
 *                           type: number
 *                           description: Total de sugestões
 *                         topSuggestionsCategories:
 *                           type: array
 *                           description: Top 3 categorias de sugestões
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                         topDeveloper:
 *                           type: object
 *                           description: Desenvolvedor com mais PRs
 *                           properties:
 *                             name:
 *                               type: string
 *                             totalPRs:
 *                               type: number
 *                         companyRanking:
 *                           type: object
 *                           description: Ranking da empresa comparado com outras
 *                           properties:
 *                             rank:
 *                               type: number
 *                             totalCompanies:
 *                               type: number
 *                             percentageOfTotalPRs:
 *                               type: number
 *                             totalPRsAllCompanies:
 *                               type: number
 *                     additionalMetrics:
 *                       type: object
 *                       description: Métricas adicionais (apenas se complete=true)
 *                       properties:
 *                         suggestionsAppliedPercentage:
 *                           type: number
 *                         suggestionsImplementedCount:
 *                           type: number
 *                         cycleTime:
 *                           type: object
 *                         deployFrequency:
 *                           type: object
 *                         bugRatio:
 *                           type: object
 *                         leadTimeBreakdown:
 *                           type: array
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/dashboard/company",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate, repository, complete } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const isComplete = complete === 'true';

      const data = isComplete
        ? await developerProductivityService.getCompleteDashboard({
            organizationId: organizationId as string,
            startDate: startDate as string,
            endDate: endDate as string,
            repository: repository as string | undefined,
              })
        : await developerProductivityService.getCompanyDashboard({
            organizationId: organizationId as string,
            startDate: startDate as string,
            endDate: endDate as string,
            repository: repository as string | undefined,
              });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching company dashboard:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export const developerProductivityRoutes = router;
