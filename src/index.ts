import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";
import { analyticsRoutes } from "./routes/index";
import { logger } from "./utils/logger";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();
const port = process.env.PORT || 3000;

// Indica que o Express deve confiar nos cabeçalhos do proxy (ex.: ELB)
app.set("trust proxy", 1);

// Segurança básica
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting: 1000 requisições por IP a cada 1 minuto
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto (em ms)
  max: 1000,          // até 1000 requisições por IP nesse período
});
app.use(limiter);

// Documentação Swagger (antes das rotas da API)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas principais
app.use("/api", analyticsRoutes);

// Tratamento de erros
app.use(errorHandler);

// Inicia o servidor
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});