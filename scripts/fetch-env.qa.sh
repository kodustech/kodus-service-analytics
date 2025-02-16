#!/bin/bash

# Lista de todas as chaves que você precisa
KEYS=(
    "/qa/kodus-service-analytics/PORT"
    "/qa/kodus-service-analytics/API_KEY"
    "/qa/kodus-service-analytics/GOOGLE_APPLICATION_CREDENTIALS"
    "/qa/kodus-service-analytics/GOOGLE_CLOUD_PROJECT_ID"
    "/qa/kodus-service-analytics/BIGQUERY_MONGO_DATASET"
    "/qa/kodus-service-analytics/BIGQUERY_POSTGRES_DATASET"
)

# Lista de todas as chaves que você precisa

ENV_FILE=".env.qa"

# Limpe o arquivo .env existente ou crie um novo
> $ENV_FILE

# Busque cada chave e adicione-a ao arquivo .env
for KEY in "${KEYS[@]}"; do
  VALUE=$(aws ssm get-parameter --name "$KEY" --with-decryption --query "Parameter.Value" --output text)
  echo "${KEY##*/}=$VALUE" >> $ENV_FILE
done