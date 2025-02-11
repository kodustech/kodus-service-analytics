# API de Métricas de Produtividade

API REST para análise de métricas de produtividade de desenvolvedores, fornecendo insights sobre frequência de deploys, tempo de ciclo e outras métricas relevantes.

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Conta no Google Cloud Platform com BigQuery habilitado
- Chave de serviço do Google Cloud (arquivo JSON)

## Configuração do Ambiente

1. Clone o repositório
2. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

3. Configure as variáveis no arquivo `.env`:
- `PORT`: Porta do servidor (padrão: 3000)
- `API_KEY`: Chave de API para autenticação
- `GOOGLE_APPLICATION_CREDENTIALS`: Caminho para credenciais do Google Cloud
- `GOOGLE_CLOUD_PROJECT_ID`: ID do projeto no Google Cloud
- `BIGQUERY_MONGO_DATASET`: Dataset MongoDB no BigQuery
- `BIGQUERY_POSTGRES_DATASET`: Dataset PostgreSQL no BigQuery

## Executando com Docker

### Ambiente de Desenvolvimento
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Ambiente de Produção
```bash
docker-compose up --build
```

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build do projeto
npm run build

# Executar testes
npm test
```

## Documentação da API

A documentação completa da API está disponível através do Swagger UI em:
```
http://localhost:3000/api-docs
```

## Autenticação

Todas as requisições devem incluir o header `X-API-KEY`:
```
X-API-KEY: sua-api-key-aqui
```

Para gerar uma API Key segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Recursos de Segurança

- Autenticação via API Key
- Rate limiting
- Headers de segurança (Helmet)
- CORS configurável
- Logging seguro
- Tratamento centralizado de erros
- Proteção contra SQL injection

## Scripts Disponíveis

- `npm run dev`: Modo desenvolvimento
- `npm run build`: Build do projeto
- `npm start`: Modo produção
- `npm test`: Executa testes
- `npm run lint`: Executa linter
- `npm run format`: Formata código

## Tecnologias

- Node.js
- Express
- TypeScript
- Docker
- Jest
- Swagger/OpenAPI
- Google BigQuery

## Licença

Este projeto está sob a licença MIT. 