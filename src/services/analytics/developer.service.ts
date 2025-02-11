import { BigQueryBaseService } from "./bigquery.base.service";
import { QueryParams, DeveloperActivityData } from "../../types/analytics";

export class DeveloperService extends BigQueryBaseService {
  async getDeveloperActivity(params: QueryParams): Promise<DeveloperActivityData[]> {
    const query = `
      WITH commit_activity AS (
        SELECT
          DATE(TIMESTAMP(JSON_VALUE(c.commit_timestamp))) AS activity_date,
          JSON_VALUE(c.commit_author) AS developer,
          COUNT(DISTINCT JSON_VALUE(c.commit_hash)) AS commit_count
        FROM ${this.getTablePath("MONGO", "commits_view")} AS c
        JOIN ${this.getTablePath("MONGO", "pullRequests")} AS pr
          ON c.pull_request_id = pr._id
        WHERE TIMESTAMP(JSON_VALUE(c.commit_timestamp)) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
          AND JSON_VALUE(c.commit_author) IS NOT NULL
          AND TRIM(JSON_VALUE(c.commit_author)) != ''
          AND pr.organizationId = @organizationId
        GROUP BY 
          activity_date,
          developer
      ),
      pr_activity AS (
        SELECT
          DATE(TIMESTAMP(pr.createdAt)) AS activity_date,
          JSON_VALUE(auth.author_username) AS developer,
          COUNT(pr._id) AS pr_count
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        JOIN ${this.getTablePath("MONGO", "pull_request_author_view")} AS auth
          ON pr._id = auth.pull_request_id
        WHERE TIMESTAMP(pr.createdAt) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
          AND JSON_VALUE(auth.author_username) IS NOT NULL
          AND TRIM(JSON_VALUE(auth.author_username)) != ''
        GROUP BY 
          activity_date,
          developer
      )
      SELECT
        COALESCE(c.developer, p.developer) AS developer,
        COALESCE(c.activity_date, p.activity_date) AS date,
        COALESCE(c.commit_count, 0) AS commit_count,
        COALESCE(p.pr_count, 0) AS pr_count
      FROM commit_activity c
      FULL OUTER JOIN pr_activity p
        ON c.developer = p.developer 
        AND c.activity_date = p.activity_date
      WHERE COALESCE(c.commit_count, 0) + COALESCE(p.pr_count, 0) > 0
      ORDER BY 
        developer ASC,
        date ASC;
    `;

    const rows = await this.executeQuery(query, params);

    return rows.map((row) => ({
      developer: row.developer,
      date: row.date,
      commitCount: Number(row.commit_count),
      prCount: Number(row.pr_count),
    }));
  }
}

export const developerService = new DeveloperService(); 