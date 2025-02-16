#!/bin/bash

# Lista de todas as chaves que você precisa
KEYS=(
    "/prod/kodus-service-analytics/PORT"
    "/prod/kodus-service-analytics/API_KEY"
    "/prod/kodus-service-analytics/GOOGLE_APPLICATION_CREDENTIALS"
    "/prod/kodus-service-analytics/GOOGLE_CLOUD_PROJECT_ID"
    "/prod/kodus-service-analytics/BIGQUERY_MONGO_DATASET"
    "/prod/kodus-service-analytics/BIGQUERY_POSTGRES_DATASET"
)

# Lista de todas as chaves que você precisa

ENV_FILE=".env.prod"

# Limpe o arquivo .env existente ou crie um novo
> $ENV_FILE

# Busque cada chave e adicione-a ao arquivo .env
for KEY in "${KEYS[@]}"; do
  VALUE=$(aws ssm get-parameter --name "$KEY" --with-decryption --query "Parameter.Value" --output text)
  echo "${KEY##*/}=$VALUE" >> $ENV_FILE
done