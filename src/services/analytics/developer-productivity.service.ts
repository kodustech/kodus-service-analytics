import { BigQueryBaseService } from "./bigquery.base.service";
import {
  DeveloperActivityData,
  LeadTimeBreakdownData,
  LeadTimeChartData,
  LeadTimeMetrics,
  PullRequestsByDevChartData,
  PullRequestSizeMetrics,
  PullRequestsOpenedVsClosedData,
  TABLES,
} from "../../types/analytics";
import { AppError } from "../../middleware/errorHandler";

export class DeveloperProductivityService extends BigQueryBaseService {
  async getDeployFrequencyChartData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }) {
    // Validação básica dos parâmetros
    if (!params.organizationId || !params.startDate || !params.endDate) {
      throw new AppError(400, "Missing required parameters");
    }

    // Validação do formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.startDate) || !dateRegex.test(params.endDate)) {
      throw new AppError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    const pullRequestsTable = this.getTablePath("MONGO", TABLES.PULL_REQUESTS);

    const query = `
      SELECT
        DATE_TRUNC(TIMESTAMP(closedAt), WEEK) AS week_start,
        COUNT(*) AS pr_count
      FROM ${pullRequestsTable} AS pr
      WHERE 1=1
        AND closedAt IS NOT NULL
        AND status = 'closed'
        AND TIMESTAMP(closedAt) >= TIMESTAMP(@startDate)
        AND TIMESTAMP(closedAt) <= TIMESTAMP(@endDate)
        AND organizationId = @organizationId
      GROUP BY week_start
      ORDER BY week_start
    `;

    return this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });
  }

  async getDeployFrequencyHighlight(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // Validação do formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new AppError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    const pullRequestsTable = this.getTablePath("MONGO", TABLES.PULL_REQUESTS);

    const query = `
        WITH weekly_deploys AS (
            SELECT
                DATE_TRUNC(TIMESTAMP(closedAt), WEEK) AS week_start,
                COUNT(*) AS pr_count
            FROM ${pullRequestsTable}
            WHERE 1=1
                AND closedAt IS NOT NULL
                AND status = 'closed'
                AND TIMESTAMP(closedAt) >= TIMESTAMP(@startDate)
                AND TIMESTAMP(closedAt) <= TIMESTAMP(@endDate)
                AND organizationId = @organizationId
            GROUP BY week_start
        )
        SELECT
            ROUND(AVG(pr_count), 2) AS deploy_frequency
        FROM weekly_deploys;
    `;

    const rows = await this.executeQuery(query, {
      startDate,
      endDate,
      organizationId,
    });

    if (!rows || rows.length === 0) {
      return 0;
    }

    const result = rows[0]?.deploy_frequency;
    return result === null || result === undefined ? 0 : Number(result);
  }

  async getPullRequestLeadTimeHighlight(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<LeadTimeMetrics> {
    const query = `
      WITH pr_lead_times AS (
        SELECT
          pr._id AS pull_request_id,
          TIMESTAMP_DIFF(TIMESTAMP(pr.closedAt), TIMESTAMP(MIN(JSON_VALUE(c.commit_timestamp))), MINUTE) AS lead_time_minutes
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        JOIN ${this.getTablePath(
          "MONGO",
          "commits_view"
        )} AS c ON pr._id = c.pull_request_id
        WHERE 1=1
          AND pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) >= TIMESTAMP(@startDate)
          AND TIMESTAMP(pr.closedAt) <= TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY pr._id, pr.closedAt
        HAVING COUNT(c.commit_hash) > 0
      )
      SELECT
        APPROX_QUANTILES(lead_time_minutes, 100)[OFFSET(75)] AS lead_time_p75_minutes
      FROM pr_lead_times;
    `;

    const rows = await this.executeQuery(query, {
      organizationId,
      startDate,
      endDate,
    });

    const minutes = rows[0]?.lead_time_p75_minutes || 0;
    return {
      leadTimeP75Minutes: Number(minutes.toFixed(2)),
      leadTimeP75Hours: Number((minutes / 60).toFixed(2)),
    };
  }

  async getLeadTimeChartData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<LeadTimeChartData[]> {
    const query = `
      WITH pr_lead_times AS (
        SELECT
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK) AS week_start,
          TIMESTAMP_DIFF(
            TIMESTAMP(pr.closedAt),
            TIMESTAMP(MIN(JSON_VALUE(c.commit_timestamp))),
            MINUTE
          ) AS lead_time_minutes
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        JOIN ${this.getTablePath("MONGO", "commits_view")} AS c
          ON pr._id = c.pull_request_id
        WHERE pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) >= TIMESTAMP(@startDate)
          AND TIMESTAMP(pr.closedAt) <= TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY pr._id, pr.closedAt
        HAVING COUNT(c.commit_hash) > 0
      )
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', week_start) as week_start,
        APPROX_QUANTILES(lead_time_minutes, 100)[OFFSET(75)] AS lead_time_p75_minutes
      FROM pr_lead_times
      GROUP BY week_start
      ORDER BY week_start;
    `;

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      weekStart: row.week_start,
      leadTimeP75Minutes: Number(row.lead_time_p75_minutes.toFixed(2)),
      leadTimeP75Hours: Number((row.lead_time_p75_minutes / 60).toFixed(2)),
    }));
  }

  async getPullRequestSizeHighlight(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<PullRequestSizeMetrics> {
    const query = `
      SELECT
        SAFE_DIVIDE(SUM(pr.totalChanges), COUNT(pr._id)) AS avg_pr_size
      FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
      WHERE 1=1
        AND pr.closedAt IS NOT NULL
        AND pr.status = 'closed'
        AND TIMESTAMP(pr.closedAt) >= TIMESTAMP(@startDate)
        AND TIMESTAMP(pr.closedAt) <= TIMESTAMP(@endDate)
        AND pr.organizationId = @organizationId;
    `;

    const rows = await this.executeQuery(query, {
      organizationId,
      startDate,
      endDate,
    });

    return {
      averagePRSize: Number((rows[0]?.avg_pr_size || 0).toFixed(2)),
    };
  }

  async getPullRequestsByDevChartData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<PullRequestsByDevChartData[]> {
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

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      weekStart: row.week_start,
      author: row.author,
      prCount: Number(row.pr_count),
    }));
  }

  async getPullRequestsOpenedVsClosedData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<PullRequestsOpenedVsClosedData[]> {
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

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      weekStart: row.week_start,
      openedCount: Number(row.opened_count),
      closedCount: Number(row.closed_count),
      ratio: Number((row.ratio || 0).toFixed(2)),
    }));
  }

  async getLeadTimeBreakdownData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<LeadTimeBreakdownData[]> {
    const query = `
      WITH pr_lead_times AS (
        SELECT
          pr._id,
          TIMESTAMP(pr.openedAt) AS opened_at,
          TIMESTAMP(pr.closedAt) AS closed_at,
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK) AS week_start,
          MIN(TIMESTAMP(JSON_VALUE(c.commit_timestamp))) AS first_commit,
          MAX(TIMESTAMP(JSON_VALUE(c.commit_timestamp))) AS last_commit
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        JOIN ${this.getTablePath("MONGO", "commits_view")} AS c
          ON pr._id = c.pull_request_id
        WHERE pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
          AND pr.organizationId = @organizationId
        GROUP BY
          pr._id,
          TIMESTAMP(pr.openedAt),
          TIMESTAMP(pr.closedAt),
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK)
      )
      SELECT
        FORMAT_TIMESTAMP('%Y-%m-%d', week_start) as week_start,
        COUNT(*) AS pr_count,
        ROUND(APPROX_QUANTILES(NULLIF(TIMESTAMP_DIFF(last_commit, first_commit, SECOND), 0), 100)[OFFSET(75)] / 60, 2) AS coding_time_minutes,
        ROUND(APPROX_QUANTILES(NULLIF(TIMESTAMP_DIFF(opened_at, last_commit, SECOND), 0), 100)[OFFSET(75)] / 60, 2) AS pickup_time_minutes,
        ROUND(APPROX_QUANTILES(NULLIF(TIMESTAMP_DIFF(closed_at, opened_at, SECOND), 0), 100)[OFFSET(75)] / 60, 2) AS review_time_minutes,
        ROUND(
          (
            APPROX_QUANTILES(NULLIF(TIMESTAMP_DIFF(last_commit, first_commit, SECOND), 0), 100)[OFFSET(75)] +
            APPROX_QUANTILES(NULLIF(TIMESTAMP_DIFF(opened_at, last_commit, SECOND), 0), 100)[OFFSET(75)] +
            APPROX_QUANTILES(NULLIF(TIMESTAMP_DIFF(closed_at, opened_at, SECOND), 0), 100)[OFFSET(75)]
          ) / 60,
          2
        ) AS total_time_minutes
      FROM pr_lead_times
      WHERE first_commit IS NOT NULL
        AND last_commit IS NOT NULL
        AND opened_at IS NOT NULL
        AND closed_at IS NOT NULL
        AND first_commit <= last_commit
        AND last_commit <= opened_at
        AND opened_at <= closed_at
      GROUP BY week_start
      ORDER BY week_start;
    `;

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      weekStart: row.week_start,
      prCount: Number(row.pr_count),
      codingTimeMinutes: Number(row.coding_time_minutes.toFixed(2)),
      codingTimeHours: Number((row.coding_time_minutes / 60).toFixed(2)),
      pickupTimeMinutes: Number(row.pickup_time_minutes.toFixed(2)),
      pickupTimeHours: Number((row.pickup_time_minutes / 60).toFixed(2)),
      reviewTimeMinutes: Number(row.review_time_minutes.toFixed(2)),
      reviewTimeHours: Number((row.review_time_minutes / 60).toFixed(2)),
      totalTimeMinutes: Number(row.total_time_minutes.toFixed(2)),
      totalTimeHours: Number((row.total_time_minutes / 60).toFixed(2)),
    }));
  }

  async getDeveloperActivityData(params: {
    organizationId: string;
    startDate: string;
    endDate: string;
  }): Promise<DeveloperActivityData[]> {
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

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      developer: row.developer,
      date: row.date,
      commitCount: Number(row.commit_count),
      prCount: Number(row.pr_count),
    }));
  }
}

export const developerProductivityService = new DeveloperProductivityService();
