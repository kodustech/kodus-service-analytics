# Health Check - Kodus Analytics Service

Este documento descreve as rotas de health check implementadas no serviço de analytics.

## Visão Geral

O sistema de health check foi projetado para monitorar diferentes aspectos do serviço:

- **Health básico**: Verifica se o serviço está rodando
- **Health com dependências**: Verifica se todas as dependências externas estão funcionando
- **Health por API**: Verifica cada módulo específico do sistema

## Endpoints Disponíveis

### 1. Health Check Básico
```
GET /health
```
**Uso**: Verificação rápida se o serviço está ativo
**Response**: Sempre 200 se o processo estiver rodando
**Ideal para**: Load balancers, Kubernetes liveness probe

**Exemplo de resposta:**
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": "0ms"
}
```

### 2. Health Check com Dependências
```
GET /health/ready
```
**Uso**: Verificar se o serviço está pronto para receber tráfego
**Response**: 200 se tudo OK, 503 se alguma dependência falhar
**Ideal para**: Kubernetes readiness probe, deploy automation

**Exemplo de resposta:**
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": "245ms",
  "dependencies": {
    "bigquery": {
      "status": "UP",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "responseTime": "150ms"
    },
    "cache": {
      "status": "UP",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "responseTime": "5ms"
    },
    "memory": {
      "status": "UP",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "responseTime": "1ms"
    }
  }
}
```

### 3. Health Check por API

#### Developer Productivity
```
GET /health/productivity
```
Verifica especificamente a API de produtividade de desenvolvedores.

#### Code Health
```
GET /health/code-health
```
Verifica especificamente a API de qualidade de código.

#### Cockpit
```
GET /health/cockpit
```
Verifica especificamente a API de validação do cockpit.

**Exemplo de resposta (APIs específicas):**
```json
{
  "status": "UP",
  "api": "productivity",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": "180ms",
  "endpoints": {
    "/api/productivity/charts/deploy-frequency": "UP",
    "/api/productivity/highlights/deploy-frequency": "UP",
    "/api/productivity/charts/lead-time": "UP",
    "/api/productivity/highlights/lead-time": "UP"
  },
  "dependencies": {
    "bigquery_productivity": {
      "status": "UP",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "responseTime": "120ms"
    },
    "cache": {
      "status": "UP",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "responseTime": "8ms"
    }
  }
}
```

### 4. Health Check do BigQuery
```
GET /health/bigquery
```
Verifica especificamente a conectividade com o BigQuery.

## Status Codes

- **200 OK**: Tudo funcionando
- **503 Service Unavailable**: Serviço ou dependências indisponíveis

## Como Usar

### Para Monitoramento
```bash
# Verificação básica
curl http://localhost:3000/health

# Verificação completa
curl http://localhost:3000/health/ready

# Verificação específica de uma API
curl http://localhost:3000/health/productivity
```

### Para Kubernetes
```yaml
# Liveness Probe
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

# Readiness Probe  
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Para Load Balancers (AWS ELB)
```
Health Check Path: /health
Healthy Threshold: 2
Unhealthy Threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
```

## Troubleshooting

### Se `/health/ready` retornar 503:
1. Verificar `/health/bigquery` para problemas com BigQuery
2. Verificar logs do serviço para detalhes do erro
3. Verificar conectividade de rede

### Se uma API específica retornar 503:
1. Verificar a API específica: `/health/productivity`, `/health/code-health`, etc.
2. Verificar se os datasets específicos estão acessíveis no BigQuery
3. Verificar permissões de acesso aos recursos

### Problemas comuns:
- **BigQuery DOWN**: Credenciais inválidas ou problemas de rede
- **Cache DOWN**: Problemas de memória ou configuração
- **Memory DOWN**: Uso de memória > 90%

## Logs

Todos os health checks são logados. Em caso de falha, verificar os logs:
```bash
# Exemplo de logs de erro
2024-01-15T10:30:00.000Z [ERROR] BigQuery health check failed: Authentication failed
2024-01-15T10:30:00.000Z [ERROR] Cache health check failed: Cache test failed
``` 