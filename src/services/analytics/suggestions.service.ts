import { BigQueryBaseService } from "./bigquery.base.service";
import { QueryParams, SuggestionCategoryCount, RepositorySuggestions } from "../../types/analytics";

export class SuggestionsService extends BigQueryBaseService {
  async getSuggestionsByCategory(params: QueryParams): Promise<SuggestionCategoryCount[]> {
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

    const rows = await this.executeQuery(query, params);

    return rows.map((row) => ({
      category: row.suggestion_category || 'Unknown',
      count: Number(row.suggestions_count),
    }));
  }

  async getSuggestionsByRepository(params: QueryParams): Promise<RepositorySuggestions[]> {
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

    const rows = await this.executeQuery(query, params);

    return rows.map((row) => ({
      repository: row.repository || 'Unknown',
      totalCount: Number(row.total_count),
      categories: row.categories.map((cat: any) => ({
        category: cat.category || 'Unknown',
        count: Number(cat.count)
      }))
    }));
  }
}

export const suggestionsService = new SuggestionsService(); 