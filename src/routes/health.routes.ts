import { Router, Request, Response, NextFunction } from "express";
import { healthService } from "../services/health.service";
import { logger } from "../utils/logger";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [UP, DOWN]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         responseTime:
 *           type: string
 *           example: "150ms"
 *         error:
 *           type: string
 *     SystemHealthStatus:
 *       allOf:
 *         - $ref: '#/components/schemas/HealthStatus'
 *         - type: object
 *           properties:
 *             dependencies:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/HealthStatus'
 *     ApiHealthStatus:
 *       allOf:
 *         - $ref: '#/components/schemas/HealthStatus'
 *         - type: object
 *           properties:
 *             api:
 *               type: string
 *             endpoints:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *                 enum: [UP, DOWN]
 *             dependencies:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/HealthStatus'
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check básico
 *     description: Verifica se o serviço está rodando. Sempre retorna 200 se o processo estiver ativo.
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Serviço está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getBasicHealth();
    res.json(health);
  } catch (error) {
    logger.error("Basic health check failed:", error);
    next(error);
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Health check com dependências
 *     description: Verifica se o serviço está pronto para receber tráfego, testando todas as dependências externas.
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Serviço e todas as dependências estão funcionando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemHealthStatus'
 *       503:
 *         description: Serviço ou dependências estão indisponíveis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemHealthStatus'
 */
router.get("/ready", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getReadinessHealth();
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Readiness health check failed:", error);
    next(error);
  }
});

/**
 * @swagger
 * /health/productivity:
 *   get:
 *     summary: Health check da API de Developer Productivity
 *     description: Verifica se a API de produtividade de desenvolvedor está funcionando e suas dependências estão acessíveis.
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: API de produtividade está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiHealthStatus'
 *       503:
 *         description: API de produtividade ou suas dependências estão indisponíveis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiHealthStatus'
 */
router.get("/productivity", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getProductivityHealth();
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Productivity health check failed:", error);
    next(error);
  }
});

/**
 * @swagger
 * /health/code-health:
 *   get:
 *     summary: Health check da API de Code Health
 *     description: Verifica se a API de qualidade de código está funcionando e suas dependências estão acessíveis.
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: API de code health está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiHealthStatus'
 *       503:
 *         description: API de code health ou suas dependências estão indisponíveis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiHealthStatus'
 */
router.get("/code-health", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getCodeHealthHealth();
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Code health health check failed:", error);
    next(error);
  }
});

/**
 * @swagger
 * /health/cockpit:
 *   get:
 *     summary: Health check da API de Cockpit
 *     description: Verifica se a API de validação do cockpit está funcionando e suas dependências estão acessíveis.
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: API de cockpit está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiHealthStatus'
 *       503:
 *         description: API de cockpit ou suas dependências estão indisponíveis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiHealthStatus'
 */
router.get("/cockpit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getCockpitHealth();
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Cockpit health check failed:", error);
    next(error);
  }
});

/**
 * @swagger
 * /health/bigquery:
 *   get:
 *     summary: Health check específico do BigQuery
 *     description: Verifica especificamente a conectividade e funcionalidade do BigQuery.
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: BigQuery está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: BigQuery está indisponível
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
router.get("/bigquery", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.getBigQueryHealth();
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("BigQuery health check failed:", error);
    next(error);
  }
});

export const healthRoutes = router; 