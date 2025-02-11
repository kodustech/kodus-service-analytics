import { BigQueryBaseService } from "./bigquery.base.service";
import { QueryParams, LeadTimeMetrics, LeadTimeChartData, LeadTimeBreakdownData } from "../../types/analytics";

export class LeadTimeService extends BigQueryBaseService {
  async getLeadTimeHighlight(params: QueryParams): Promise<LeadTimeMetrics> {
    const query = `
      WITH pr_lead_times AS (
        SELECT
          pr._id AS pull_request_id,
          TIMESTAMP_DIFF(TIMESTAMP(pr.closedAt), TIMESTAMP(MIN(JSON_VALUE(c.commit_timestamp))), MINUTE) AS lead_time_minutes
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
        APPROX_QUANTILES(lead_time_minutes, 100)[OFFSET(75)] AS lead_time_p75_minutes
      FROM pr_lead_times;
    `;

    const rows = await this.executeQuery(query, params);

    const minutes = rows[0]?.lead_time_p75_minutes || 0;
    return {
      leadTimeP75Minutes: Number(minutes.toFixed(2)),
      leadTimeP75Hours: Number((minutes / 60).toFixed(2)),
    };
  }

  async getLeadTimeChartData(params: QueryParams): Promise<LeadTimeChartData[]> {
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

    const rows = await this.executeQuery(query, params);

    return rows.map((row) => ({
      weekStart: row.week_start,
      leadTimeP75Minutes: Number(row.lead_time_p75_minutes.toFixed(2)),
      leadTimeP75Hours: Number((row.lead_time_p75_minutes / 60).toFixed(2)),
    }));
  }

  async getLeadTimeBreakdown(params: QueryParams): Promise<LeadTimeBreakdownData[]> {
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

    const rows = await this.executeQuery(query, params);

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
}

export const leadTimeService = new LeadTimeService(); 