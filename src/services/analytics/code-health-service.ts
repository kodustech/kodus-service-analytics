import { BigQueryBaseService } from "./bigquery.base.service";
import {
  RepositorySuggestions,
  SuggestionCategoryCount,
  BugRatioData,
  BugRatioHighlight,
  TABLES,
  SuggestionsImplementationRate,
} from "../../types/analytics";
import { AppError } from "../../middleware/errorHandler";

export class CodeHealthService extends BigQueryBaseService {
  async getSuggestionsByCategory(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<SuggestionCategoryCount[]> {
    const query = `
          SELECT
            JSON_VALUE(sug, '$.label') AS suggestion_category,
            COUNT(*) AS suggestions_count
          FROM ${this.getTablePath("MONGO", "pullRequests")}
          CROSS JOIN UNNEST(JSON_EXTRACT_ARRAY(files)) AS file_obj
          CROSS JOIN UNNEST(JSON_EXTRACT_ARRAY(file_obj, '$.suggestions')) AS sug
          WHERE organizationId = @organizationId
            AND closedAt IS NOT NULL 
            AND closedAt <> ''
            AND TIMESTAMP(closedAt) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
            AND JSON_VALUE(sug, '$.deliveryStatus') = 'sent'
          GROUP BY suggestion_category
          ORDER BY suggestions_count DESC;
        `;

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      category: row.suggestion_category || "Unknown",
      count: Number(row.suggestions_count),
    }));
  }

  async getSuggestionsByRepository(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<RepositorySuggestions[]> {
    const query = `
          WITH repo_suggestions AS (
            SELECT
              JSON_VALUE(pr.repository, '$.name') AS repository,
              JSON_VALUE(sug, '$.label') AS suggestion_category,
              COUNT(*) AS suggestions_count
            FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
            CROSS JOIN UNNEST(JSON_EXTRACT_ARRAY(files)) AS file_obj
            CROSS JOIN UNNEST(JSON_EXTRACT_ARRAY(file_obj, '$.suggestions')) AS sug
            WHERE pr.organizationId = @organizationId
              AND pr.closedAt IS NOT NULL 
              AND pr.closedAt <> ''
              AND TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
              AND JSON_VALUE(sug, '$.deliveryStatus') = 'sent'
            GROUP BY repository, suggestion_category
          )
          SELECT
            repository,
            ARRAY_AGG(STRUCT(
              suggestion_category AS category,
              suggestions_count AS count
            )) AS categories,
            SUM(suggestions_count) AS total_count
          FROM repo_suggestions
          GROUP BY repository
          ORDER BY total_count DESC;
        `;

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      repository: row.repository || "Unknown",
      totalCount: Number(row.total_count),
      categories: row.categories.map((cat: any) => ({
        category: cat.category || "Unknown",
        count: Number(cat.count),
      })),
    }));
  }

  async getBugRatioData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<BugRatioData[]> {
    const pullRequestsTable = this.getTablePath("MONGO", TABLES.PULL_REQUESTS);
    const prTypesTable = this.getTablePath(
      "CUSTOM_TABLES",
      TABLES.PULL_REQUEST_TYPES
    );

    const query = `
      WITH weekly_prs AS (
        SELECT
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK(MONDAY)) AS week_start,
          COUNT(*) as total_prs,
          COUNTIF(prt.type = 'Bug Fix') as bug_fix_prs,
          SAFE_DIVIDE(COUNTIF(prt.type = 'Bug Fix'), COUNT(*)) as ratio
        FROM ${pullRequestsTable} AS pr
        LEFT JOIN ${prTypesTable} AS prt
          ON pr._id = prt.pullRequestId
        WHERE pr.closedAt IS NOT NULL AND pr.closedAt <> ''
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY week_start
      )
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', week_start) as week_start,
        total_prs,
        bug_fix_prs,
        ratio
      FROM weekly_prs
      ORDER BY week_start ASC;
    `;

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      weekStart: row.week_start,
      totalPRs: Number(row.total_prs),
      bugFixPRs: Number(row.bug_fix_prs),
      ratio: Number((row.ratio || 0).toFixed(2)),
    }));
  }

  async getBugRatioHighlight(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<BugRatioHighlight> {
    const pullRequestsTable = this.getTablePath("MONGO", TABLES.PULL_REQUESTS);
    const prTypesTable = this.getTablePath(
      "CUSTOM_TABLES",
      TABLES.PULL_REQUEST_TYPES
    );

    // Calculate the duration of the current period
    const currentStartDate = new Date(params.startDate);
    const currentEndDate = new Date(params.endDate);
    const periodDurationMs =
      currentEndDate.getTime() - currentStartDate.getTime();

    // Calculate the previous period dates
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousEndDate.getTime() - periodDurationMs);

    // Debug logs
    console.log("Dates for query:", {
      currentStartDate: params.startDate,
      currentEndDate: params.endDate,
      previousStartDate: previousStartDate.toISOString().split("T")[0],
      previousEndDate: previousEndDate.toISOString().split("T")[0],
    });

    const query = `
      WITH current_period AS (
        SELECT
          COUNT(*) as total_prs,
          COUNTIF(prt.type = 'Bug Fix') as bug_fix_prs,
          SAFE_DIVIDE(COUNTIF(prt.type = 'Bug Fix'), COUNT(*)) as ratio
        FROM ${pullRequestsTable} AS pr
        LEFT JOIN ${prTypesTable} AS prt
          ON pr._id = prt.pullRequestId
        WHERE pr.closedAt IS NOT NULL AND pr.closedAt <> ''   
          AND pr.status = 'closed'
          AND DATE(TIMESTAMP(pr.closedAt)) BETWEEN DATE(@startDate) AND DATE(@endDate)
          AND pr.organizationId = @organizationId
      ),
      previous_period AS (
        SELECT
          COUNT(*) as total_prs,
          COUNTIF(prt.type = 'Bug Fix') as bug_fix_prs,
          SAFE_DIVIDE(COUNTIF(prt.type = 'Bug Fix'), COUNT(*)) as ratio
        FROM ${pullRequestsTable} AS pr
        LEFT JOIN ${prTypesTable} AS prt
          ON pr._id = prt.pullRequestId
        WHERE pr.closedAt IS NOT NULL AND pr.closedAt <> ''
          AND pr.status = 'closed'
          AND DATE(TIMESTAMP(pr.closedAt)) BETWEEN DATE(@previousStartDate) AND DATE(@previousEndDate)
          AND pr.organizationId = @organizationId
      )
      SELECT
        c.total_prs as current_total_prs,
        c.bug_fix_prs as current_bug_fix_prs,
        c.ratio as current_ratio,
        p.total_prs as previous_total_prs,
        p.bug_fix_prs as previous_bug_fix_prs,
        p.ratio as previous_ratio
      FROM current_period c
      CROSS JOIN previous_period p;
    `;

    // Debug log para a query
    console.log("Query:", query);

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      previousStartDate: previousStartDate.toISOString().split("T")[0],
      previousEndDate: previousEndDate.toISOString().split("T")[0],
      organizationId: params.organizationId,
    });

    // Debug log para os resultados
    console.log("Query results:", rows[0]);

    const result = rows[0] || {
      current_total_prs: 0,
      current_bug_fix_prs: 0,
      current_ratio: 0,
      previous_total_prs: 0,
      previous_bug_fix_prs: 0,
      previous_ratio: 0,
    };

    const currentRatio = Number((result.current_ratio || 0).toFixed(2));
    const previousRatio = Number((result.previous_ratio || 0).toFixed(2));

    // Calculate percentage change and trend
    let percentageChange = 0;
    let trend: "improved" | "worsened" | "unchanged" = "unchanged";

    if (previousRatio > 0) {
      percentageChange = Number(
        (((currentRatio - previousRatio) / previousRatio) * 100).toFixed(2)
      );
      // For bug ratio, a decrease is an improvement
      if (percentageChange < 0) {
        trend = "improved";
      } else if (percentageChange > 0) {
        trend = "worsened";
      }
    } else if (currentRatio > 0) {
      percentageChange = 100;
      trend = "worsened";
    }

    // Convert ratios to percentages
    const currentRatioPercentage = currentRatio * 100;
    const previousRatioPercentage = previousRatio * 100;

    return {
      currentPeriod: {
        totalPRs: Number(result.current_total_prs),
        bugFixPRs: Number(result.current_bug_fix_prs),
        ratio: Number(currentRatioPercentage.toFixed(2)),
      },
      previousPeriod: {
        totalPRs: Number(result.previous_total_prs),
        bugFixPRs: Number(result.previous_bug_fix_prs),
        ratio: Number(previousRatioPercentage.toFixed(2)),
      },
      comparison: {
        percentageChange: Number(percentageChange.toFixed(2)),
        trend,
      },
    };
  }

  async getSuggestionsImplementationRate(params: {
    organizationId: string;
  }): Promise<SuggestionsImplementationRate> {
    const suggestionsViewTable = this.getTablePath(
      "MONGO",
      TABLES.SUGGESTIONS_VIEW
    );

    const pullRequestsTable = this.getTablePath("MONGO", TABLES.PULL_REQUESTS);

    const organizationTable = this.getTablePath(
      "POSTGRES",
      TABLES.ORGANIZATION
    );

    const query = `SELECT
  COUNT(*) AS suggestions_sent,
  SUM(CASE 
        WHEN suggestionImplementationStatus IN ('implemented', 'partially_implemented') 
        THEN 1 
        ELSE 0 
      END) AS suggestions_implemented,
  SAFE_DIVIDE(
    SUM(CASE WHEN suggestionImplementationStatus IN ('implemented', 'partially_implemented') THEN 1 ELSE 0 END),
    COUNT(*)
  ) AS implementation_rate
FROM ${suggestionsViewTable} as sv
INNER JOIN ${pullRequestsTable} as pr
  ON sv.pullRequestId = pr._id 
INNER JOIN ${organizationTable} as o
  ON o.uuid = pr.organizationId
WHERE sv.suggestionDeliveryStatus = 'sent'
  AND o.uuid = @organizationId
  AND DATE(TIMESTAMP(suggestionCreatedAt)) >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 WEEK);
`;

    const rows = await this.executeQuery(query, {
      organizationId: params.organizationId,
    });

    return {
      suggestionsSent: Number(rows[0].suggestions_sent),
      suggestionsImplemented: Number(rows[0].suggestions_implemented),
      implementationRate: Number((rows[0].implementation_rate || 0).toFixed(2)),
    };
  }
}

export const codeHealthService = new CodeHealthService();
