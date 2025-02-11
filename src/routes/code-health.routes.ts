import { Router } from "express";
import { authenticateApiKey } from "../middleware/auth";
import { Request, Response } from "express";
import { codeHealthService } from "../services/analytics/code-health-service";

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

export const codeHealthRoutes = router;
