import { Router } from "express";
import { authenticateApiKey } from "../middleware/auth";
import { Request, Response } from "express";
import { codeHealthService } from "../services/analytics/code-health-service";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateApiKey);

// Rota para obter deploy frequency

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 * 
 * /api/code-health/charts/suggestions-by-category:
 *   get:
 *     summary: Obtém sugestões agrupadas por categoria
 *     tags: [Code Health]
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
 *         description: Lista de sugestões por categoria
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
 *                       category:
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
  "/charts/suggestions-by-category",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await codeHealthService.getSuggestionsByCategory({
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching suggestions by category:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/code-health/charts/suggestions-by-repository:
 *   get:
 *     summary: Obtém sugestões agrupadas por repositório e categoria
 *     tags: [Code Health]
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
 *         description: Lista de sugestões por repositório
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
 *                       repository:
 *                         type: string
 *                       count:
 *                         type: number
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/suggestions-by-repository",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error:
            "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await codeHealthService.getSuggestionsByRepository({
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching suggestions by repository:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/code-health/charts/bug-ratio:
 *   get:
 *     summary: Obtém dados semanais da proporção de bug fixes em relação ao total de PRs
 *     tags: [Code Health]
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
 *         description: Lista de dados semanais do bug ratio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   weekStart:
 *                     type: string
 *                     description: Data de início da semana (YYYY-MM-DD)
 *                   totalPRs:
 *                     type: number
 *                     description: Total de PRs na semana
 *                   bugFixPRs:
 *                     type: number
 *                     description: Total de PRs de correção de bugs na semana
 *                   ratio:
 *                     type: number
 *                     description: Proporção de bug fixes em relação ao total (entre 0 e 1)
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/charts/bug-ratio",
  async (req: Request, res: Response) => {
    const { organizationId, startDate, endDate } = req.query;

    if (!organizationId || !startDate || !endDate) {
      throw new AppError(400, "Missing required parameters");
    }

    const data = await codeHealthService.getBugRatioData({
      organizationId: organizationId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json(data);
  }
);

/**
 * @swagger
 * /api/code-health/highlights/bug-ratio:
 *   get:
 *     summary: Obtém a proporção de bug fixes em relação ao total de PRs, comparando com o período anterior
 *     tags: [Code Health]
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
 *         description: Dados do bug ratio com comparação ao período anterior
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
 *                         totalPRs:
 *                           type: number
 *                           description: Total de PRs no período atual
 *                         bugFixPRs:
 *                           type: number
 *                           description: Total de PRs de correção de bugs no período atual
 *                         ratio:
 *                           type: number
 *                           description: Proporção de bug fixes em relação ao total no período atual (entre 0 e 1)
 *                     previousPeriod:
 *                       type: object
 *                       properties:
 *                         totalPRs:
 *                           type: number
 *                           description: Total de PRs no período anterior
 *                         bugFixPRs:
 *                           type: number
 *                           description: Total de PRs de correção de bugs no período anterior
 *                         ratio:
 *                           type: number
 *                           description: Proporção de bug fixes em relação ao total no período anterior (entre 0 e 1)
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
  "/highlights/bug-ratio",
  async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: "Missing required parameters: organizationId, startDate, endDate",
        });
      }

      const data = await codeHealthService.getBugRatioHighlight({
        organizationId: organizationId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Error fetching bug ratio highlight:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export const codeHealthRoutes = router;
