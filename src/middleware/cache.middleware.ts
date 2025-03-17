import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';

export const cacheMiddleware = (ttl: number = 900) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Cria uma chave única baseada na rota e parâmetros
    const key = `${req.originalUrl}`;

    // Tenta obter do cache
    const cachedResponse = cacheService.get(key);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Se não estiver no cache, intercepta a resposta
    const originalJson = res.json;
    res.json = function (data: any) {
      // Salva no cache
      cacheService.set(key, data, ttl);
      // Chama o método original
      return originalJson.call(this, data);
    };

    next();
  };
}; 