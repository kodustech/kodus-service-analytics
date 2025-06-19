import { BigQuery } from '@google-cloud/bigquery';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

export interface HealthStatus {
  status: 'UP' | 'WARNING' | 'DOWN';
  timestamp: string;
  responseTime?: string;
  error?: string;
  details?: string;
}

export interface ApiHealthStatus extends HealthStatus {
  api: string;
  endpoints?: Record<string, 'UP' | 'DOWN'>;
  dependencies?: Record<string, HealthStatus>;
}

export interface SystemHealthStatus extends HealthStatus {
  dependencies: Record<string, HealthStatus>;
}

class HealthService {
  private bigquery: BigQuery;
  private cache: NodeCache;

  constructor() {
    this.bigquery = new BigQuery();
    this.cache = new NodeCache();
  }

  /**
   * Health check básico - verifica apenas se o serviço está rodando
   */
  async getBasicHealth(): Promise<HealthStatus> {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      responseTime: '0ms'
    };
  }

  /**
   * Health check com dependências - verifica BigQuery, Cache, etc.
   */
  async getReadinessHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    
    const [bigqueryHealth, cacheHealth, memoryHealth] = await Promise.all([
      this.checkBigQuery(),
      this.checkCache(),
      this.checkMemory()
    ]);

    const allUp = [bigqueryHealth, cacheHealth, memoryHealth].every(
      health => health.status === 'UP'
    );

    const responseTime = `${Date.now() - startTime}ms`;

    return {
      status: allUp ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      responseTime,
      dependencies: {
        bigquery: bigqueryHealth,
        cache: cacheHealth,
        memory: memoryHealth
      }
    };
  }

  /**
   * Health check específico da API de Developer Productivity
   */
  async getProductivityHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    const [bigqueryHealth, cacheHealth] = await Promise.all([
      this.checkBigQueryProductivityDatasets(),
      this.checkCache()
    ]);

    const allUp = [bigqueryHealth, cacheHealth].every(
      health => health.status === 'UP'
    );

    return {
      status: allUp ? 'UP' : 'DOWN',
      api: 'productivity',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      endpoints: {
        '/api/productivity/charts/deploy-frequency': allUp ? 'UP' : 'DOWN',
        '/api/productivity/highlights/deploy-frequency': allUp ? 'UP' : 'DOWN',
        '/api/productivity/charts/lead-time': allUp ? 'UP' : 'DOWN',
        '/api/productivity/highlights/lead-time': allUp ? 'UP' : 'DOWN'
      },
      dependencies: {
        bigquery_productivity: bigqueryHealth,
        cache: cacheHealth
      }
    };
  }

  /**
   * Health check específico da API de Code Health
   */
  async getCodeHealthHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    const [bigqueryHealth, cacheHealth] = await Promise.all([
      this.checkBigQueryCodeHealthDatasets(),
      this.checkCache()
    ]);

    const allUp = [bigqueryHealth, cacheHealth].every(
      health => health.status === 'UP'
    );

    return {
      status: allUp ? 'UP' : 'DOWN',
      api: 'code-health',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      endpoints: {
        '/api/code-health/charts/quality-metrics': allUp ? 'UP' : 'DOWN',
        '/api/code-health/highlights/coverage': allUp ? 'UP' : 'DOWN'
      },
      dependencies: {
        bigquery_code_health: bigqueryHealth,
        cache: cacheHealth
      }
    };
  }

  /**
   * Health check específico da API de Cockpit
   */
  async getCockpitHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    const [bigqueryHealth, cacheHealth] = await Promise.all([
      this.checkBigQueryCockpitDatasets(),
      this.checkCache()
    ]);

    const allUp = [bigqueryHealth, cacheHealth].every(
      health => health.status === 'UP'
    );

    return {
      status: allUp ? 'UP' : 'DOWN',
      api: 'cockpit',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      endpoints: {
        '/api/cockpit/validation': allUp ? 'UP' : 'DOWN'
      },
      dependencies: {
        bigquery_cockpit: bigqueryHealth,
        cache: cacheHealth
      }
    };
  }

  /**
   * Health check específico do BigQuery
   */
  async getBigQueryHealth(): Promise<HealthStatus> {
    return this.checkBigQuery();
  }

  // Métodos privados para verificação de dependências

  private async checkBigQuery(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Testa uma query simples para verificar conectividade
      const query = 'SELECT 1 as test';
      const [rows] = await this.bigquery.query(query);
      
      if (rows && rows.length > 0) {
        return {
          status: 'UP',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`
        };
      } else {
        throw new Error('Query returned empty result');
      }
    } catch (error) {
      logger.error('BigQuery health check failed:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkBigQueryProductivityDatasets(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Verificar se os datasets de produtividade estão acessíveis
      const datasets = await this.bigquery.getDatasets();
      const hasProductivityData = datasets[0].some(dataset => 
        dataset.id?.includes('productivity') || dataset.id?.includes('developer')
      );

      if (hasProductivityData || datasets[0].length > 0) {
        return {
          status: 'UP',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`
        };
      } else {
        throw new Error('No productivity datasets found');
      }
    } catch (error) {
      logger.error('BigQuery productivity datasets health check failed:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkBigQueryCodeHealthDatasets(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Verificar se os datasets de code health estão acessíveis
      const datasets = await this.bigquery.getDatasets();
      const hasCodeHealthData = datasets[0].some(dataset => 
        dataset.id?.includes('code') || dataset.id?.includes('quality')
      );

      if (hasCodeHealthData || datasets[0].length > 0) {
        return {
          status: 'UP',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`
        };
      } else {
        throw new Error('No code health datasets found');
      }
    } catch (error) {
      logger.error('BigQuery code health datasets health check failed:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkBigQueryCockpitDatasets(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Verificar se os datasets de cockpit estão acessíveis
      const datasets = await this.bigquery.getDatasets();
      const hasCockpitData = datasets[0].some(dataset => 
        dataset.id?.includes('cockpit') || dataset.id?.includes('validation')
      );

      if (hasCockpitData || datasets[0].length > 0) {
        return {
          status: 'UP',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`
        };
      } else {
        throw new Error('No cockpit datasets found');
      }
    } catch (error) {
      logger.error('BigQuery cockpit datasets health check failed:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkCache(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Testa operação básica de cache
      const testKey = 'health-check-test';
      const testValue = 'test-value';
      
      this.cache.set(testKey, testValue, 1); // 1 segundo de TTL
      const retrieved = this.cache.get(testKey);
      
      if (retrieved === testValue) {
        this.cache.del(testKey); // Limpa o teste
        return {
          status: 'UP',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`
        };
      } else {
        throw new Error('Cache test failed');
      }
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkMemory(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const usagePercent = (usedMB / totalMB) * 100;

      let status: 'UP' | 'WARNING' | 'DOWN';
      let details: string | undefined;

      if (usagePercent < 85) {
        status = 'UP';
        details = `Memory usage: ${usagePercent.toFixed(1)}%`;
      } else if (usagePercent < 95) {
        status = 'WARNING';
        details = `High memory usage: ${usagePercent.toFixed(1)}% - Consider monitoring`;
      } else {
        status = 'DOWN';
        details = `Critical memory usage: ${usagePercent.toFixed(1)}% - Action required`;
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        details
      };
    } catch (error) {
      logger.error('Memory health check failed:', error);
      return {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const healthService = new HealthService(); 