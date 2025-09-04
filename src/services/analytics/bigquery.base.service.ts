import { BigQuery } from "@google-cloud/bigquery";
import { logger } from "../../utils/logger";
import { AppError } from "../../middleware/errorHandler";

export const DATASETS = {
    MONGO: process.env.BIGQUERY_MONGO_DATASET || "kodus_mongo",
    POSTGRES: process.env.BIGQUERY_POSTGRES_DATASET || "kodus_postgres",
    CUSTOM_TABLES:
        process.env.BIGQUERY_CUSTOM_TABLES_DATASET || "kodus_custom_tables",
} as const;

export abstract class BigQueryBaseService {
    protected bigquery: BigQuery;

    constructor() {
        this.bigquery = new BigQuery({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }

    protected getTablePath(dataset: keyof typeof DATASETS, table: string) {
        return `\`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${DATASETS[dataset]}.${table}\``;
    }

    protected async executeQuery(
        query: string,
        params: Record<string, any> = {}
    ) {
        try {
            const [rows] = await this.bigquery.query({ query, params });
            return rows;
        } catch (error) {
            logger.error("Error executing BigQuery query:", error);
            throw new AppError(500, "Error executing query");
        }
    }
}
