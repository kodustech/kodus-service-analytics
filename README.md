# Kodus Analytics Service

Serviço de analytics que integra com o Google BigQuery para expor métricas via API REST.

## Requisitos

- Node.js 18+
- Conta no Google Cloud Platform com BigQuery habilitado
- Chave de serviço do Google Cloud (arquivo JSON)

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Configure as seguintes variáveis no arquivo `.env`:
- `PORT`: Porta onde o servidor irá rodar (padrão: 3000)
- `API_KEY`: Chave de API para autenticação (gere uma chave segura)
- `GOOGLE_APPLICATION_CREDENTIALS`: Caminho para o arquivo de credenciais do Google Cloud
- `GOOGLE_CLOUD_PROJECT_ID`: ID do projeto no Google Cloud
- `BIGQUERY_MONGO_DATASET`: Nome do dataset MongoDB no BigQuery
- `BIGQUERY_POSTGRES_DATASET`: Nome do dataset PostgreSQL no BigQuery

## Desenvolvimento

Para rodar o servidor em modo de desenvolvimento:
```bash
npm run dev
```

## Build e Produção

Para fazer o build do projeto:
```bash
npm run build
```

Para rodar em produção:
```bash
npm start
```

## Autenticação

O serviço utiliza autenticação via API Key. Todas as requisições devem incluir o header `X-API-KEY` com a chave configurada no ambiente:

```
X-API-KEY: sua-api-key-aqui
```

## Endpoints

### GET /api/analytics/deploy-frequency
Retorna a frequência de deploys (PRs fechados) por semana para uma organização específica.

Query Parameters:
- `organizationId`: ID da organização (obrigatório)
- `startDate`: Data inicial no formato YYYY-MM-DD (obrigatório)
- `endDate`: Data final no formato YYYY-MM-DD (obrigatório)

Exemplo de requisição:
```bash
curl -X GET 'http://localhost:3000/api/analytics/deploy-frequency?organizationId=123&startDate=2024-01-01&endDate=2024-02-28' \
-H 'X-API-KEY: sua-api-key-aqui'
```

Exemplo de resposta:
```json
{
  "status": "success",
  "data": [
    {
      "week_start": "2024-01-01T00:00:00.000Z",
      "pr_count": 15
    },
    {
      "week_start": "2024-01-08T00:00:00.000Z",
      "pr_count": 23
    }
  ]
}
```

### GET /api/analytics/combined-metrics
Retorna métricas combinadas de PRs e deploys por semana, utilizando dados de ambos os datasets (MongoDB e PostgreSQL).

Query Parameters:
- `organizationId`: ID da organização (obrigatório)
- `startDate`: Data inicial no formato YYYY-MM-DD (obrigatório)
- `endDate`: Data final no formato YYYY-MM-DD (obrigatório)

Exemplo de resposta:
```json
{
  "status": "success",
  "data": [
    {
      "week_start": "2024-01-01T00:00:00.000Z",
      "pr_count": 15,
      "deploy_count": 12
    },
    {
      "week_start": "2024-01-08T00:00:00.000Z",
      "pr_count": 23,
      "deploy_count": 18
    }
  ]
}
```

## Segurança

O serviço implementa:
- Autenticação via API Key
- Rate limiting
- Helmet para headers de segurança
- CORS configurável
- Logging seguro
- Tratamento de erros centralizado
- Proteção contra SQL injection usando parâmetros tipados

## Gerando uma API Key Segura

Para gerar uma API Key segura, você pode usar o seguinte comando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e configure no arquivo `.env` como valor da variável `API_KEY`. 