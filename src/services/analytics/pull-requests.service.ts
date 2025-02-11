import { BigQueryBaseService } from "./bigquery.base.service";
import { 
  QueryParams, 
  PullRequestSizeMetrics, 
  PullRequestsByDevChartData,
  PullRequestsOpenedVsClosedData 
} from "../../types/analytics";

export class PullRequestsService extends BigQueryBaseService {
  async getPullRequestSizeHighlight(params: QueryParams): Promise<PullRequestSizeMetrics> {
    const query = `
      SELECT
        SAFE_DIVIDE(SUM(pr.totalChanges), COUNT(pr._id)) AS avg_pr_size
      FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
      WHERE pr.closedAt IS NOT NULL
        AND pr.status = 'closed'
        AND TIMESTAMP(pr.closedAt) >= TIMESTAMP(@startDate)
        AND TIMESTAMP(pr.closedAt) <= TIMESTAMP(@endDate)
        AND pr.organizationId = @organizationId;
    `;

    const rows = await this.executeQuery(query, params);

    return {
      averagePRSize: Number((rows[0]?.avg_pr_size || 0).toFixed(2)),
    };
  }

  async getPullRequestsByDev(params: QueryParams): Promise<PullRequestsByDevChartData[]> {
    const query = `
      WITH pr_weekly AS (
        SELECT
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK) AS week_start,
          JSON_VALUE(auth.author_username) AS author,
          COUNT(pr._id) AS pr_count
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        JOIN ${this.getTablePath("MONGO", "pull_request_author_view")} AS auth
          ON pr._id = auth.pull_request_id
        WHERE pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) >= TIMESTAMP(@startDate)
          AND TIMESTAMP(pr.closedAt) <= TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY week_start, author
      )
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', week_start) as week_start,
        author,
        pr_count
      FROM pr_weekly
      ORDER BY week_start, author;
    `;

    const rows = await this.executeQuery(query, params);

    return rows.map((row) => ({
      weekStart: row.week_start,
      author: row.author,
      prCount: Number(row.pr_count),
    }));
  }

  async getPullRequestsOpenedVsClosed(params: QueryParams): Promise<PullRequestsOpenedVsClosedData[]> {
    const query = `
      WITH open_prs AS (
        SELECT
          TIMESTAMP_TRUNC(TIMESTAMP(pr.createdAt), WEEK) AS week_start,
          COUNT(*) AS opened_count
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        WHERE pr.createdAt IS NOT NULL
          AND TIMESTAMP(pr.createdAt) >= TIMESTAMP(@startDate)
          AND TIMESTAMP(pr.createdAt) <= TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY week_start
      ),
      closed_prs AS (
        SELECT
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK) AS week_start,
          COUNT(*) AS closed_count
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        WHERE pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) >= TIMESTAMP(@startDate)
          AND TIMESTAMP(pr.closedAt) <= TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY week_start
      )
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', COALESCE(o.week_start, c.week_start)) AS week_start,
        COALESCE(o.opened_count, 0) AS opened_count,
        COALESCE(c.closed_count, 0) AS closed_count,
        SAFE_DIVIDE(
          COALESCE(c.closed_count, 0),
          NULLIF(COALESCE(o.opened_count, 0), 0)
        ) AS ratio
      FROM open_prs AS o
      FULL JOIN closed_prs AS c
        ON o.week_start = c.week_start
      ORDER BY week_start;
    `;

    const rows = await this.executeQuery(query, params);

    return rows.map((row) => ({
      weekStart: row.week_start,
      openedCount: Number(row.opened_count),
      closedCount: Number(row.closed_count),
      ratio: Number((row.ratio || 0).toFixed(2)),
    }));
  }
}

export const pullRequestsService = new PullRequestsService(); 