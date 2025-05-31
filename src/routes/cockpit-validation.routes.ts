import { Router } from "express";
import { authenticateApiKey } from "../middleware/auth";
import { Request, Response } from "express";
import { cockpitValidationService } from "../services/analytics/cockpit-validation.service";
import { AppError } from "../middleware/errorHandler";
import { cacheMiddleware } from "../middleware/cache.middleware";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateApiKey);

// Middleware de cache para todas as rotas (5 minutos para validação)
router.use(cacheMiddleware(300));

/**
 * @swagger
 * /api/cockpit/validate:
 *   get:
 *     summary: Valida se o cockpit de uma empresa possui dados (pull requests)
 *     tags: [Cockpit Validation]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *     responses:
 *       200:
 *         description: Status de validação do cockpit
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
 *                     hasData:
 *                       type: boolean
 *                       description: true se possui pull requests, false se vazio
 *                     pullRequestsCount:
 *                       type: number
 *                       description: Quantidade de pull requests encontrados (máximo 50)
 *       401:
 *         description: Não autorizado - API key inválida ou ausente
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/validate", async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        status: "error",
        error: "Missing required parameter: organizationId",
      });
    }

    const data = await cockpitValidationService.validateCockpitData({
      organizationId: organizationId as string,
    });

    return res.json({
      status: "success",
      data,
    });
  } catch (error) {
    console.error("Error validating cockpit:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: "error",
        error: error.message,
      });
    }
    return res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
});

export const cockpitValidationRoutes = router; 