import { BigQueryBaseService, DATASETS } from "./bigquery.base.service";
import { logger } from "../../utils/logger";
import { TABLES } from "../../types/analytics";

interface CockpitValidationParams {
  organizationId: string;
}

interface CockpitValidationResult {
  hasData: boolean;
  pullRequestsCount: number;
}

class CockpitValidationService extends BigQueryBaseService {
  async validateCockpitData(
    params: CockpitValidationParams
  ): Promise<CockpitValidationResult> {
    const { organizationId } = params;

    try {
      // Verifica dados de pull requests
      const pullRequestsQuery = `
        SELECT COUNT(*) as count
        FROM (
          SELECT 1
          FROM ${this.getTablePath("MONGO", TABLES.PULL_REQUESTS)}
          WHERE organizationId = @organizationId
          LIMIT 50
        )
      `;

      const [pullRequestsResult] = await Promise.all([
        this.executeQuery(pullRequestsQuery, { organizationId }),
      ]);

      const pullRequestsCount = pullRequestsResult[0]?.count || 0;
      const hasData = pullRequestsCount > 0;

      logger.info(
        `Cockpit validation for organization ${organizationId}: hasData=${hasData}, PRs=${pullRequestsCount}`
      );

      return {
        hasData,
        pullRequestsCount,
      };
    } catch (error) {
      logger.error("Error validating cockpit data:", error);
      throw error;
    }
  }
}

export const cockpitValidationService = new CockpitValidationService();
