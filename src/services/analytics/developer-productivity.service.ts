import { BigQueryBaseService } from "./bigquery.base.service";
import {
  DeveloperActivityData,
  LeadTimeBreakdownData,
  LeadTimeChartData,
  LeadTimeMetrics,
  PullRequestsByDevChartData,
  PullRequestSizeMetrics,
  PullRequestsOpenedVsClosedData,
  DeployFrequencyHighlight,
  TABLES,
  LeadTimeHighlight,
  PRSizeHighlight,
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
        DATE(DATE_TRUNC(TIMESTAMP(closedAt), WEEK(MONDAY))) AS week_start,
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

    const rows = await this.executeQuery(query, {
      startDate: params.startDate,
      endDate: params.endDate,
      organizationId: params.organizationId,
    });

    return rows.map((row) => ({
      weekStart: row.week_start.value,
      prCount: Number(row.pr_count),
    }));
  }

  async getDeployFrequencyHighlight(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<DeployFrequencyHighlight> {
    // Validação do formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new AppError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    // Calculate periods using Date objects but only considering days
    const currentStartDate = new Date(startDate);
    const currentEndDate = new Date(endDate);

    // Calculate number of days in current period
    const daysDiff = Math.floor(
      (currentEndDate.getTime() - currentStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Calculate previous period dates properly
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1); // Day before current start
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousEndDate.getDate() - daysDiff); // Same duration as current period

    const pullRequestsTable = this.getTablePath("MONGO", TABLES.PULL_REQUESTS);

    const query = `
      WITH current_period AS (
        SELECT
          COUNT(*) as total_deployments,
          COUNT(*) / CEIL(DATE_DIFF(DATE(@currentEndDate), DATE(@currentStartDate), DAY) / 7) as avg_per_week
        FROM ${pullRequestsTable}
        WHERE closedAt IS NOT NULL
          AND status = 'closed'
          AND DATE(closedAt) >= DATE(@currentStartDate)
          AND DATE(closedAt) <= DATE(@currentEndDate)
          AND organizationId = @organizationId
      ),
      previous_period AS (
        SELECT
          COUNT(*) as total_deployments,
          COUNT(*) / CEIL(DATE_DIFF(DATE(@previousEndDate), DATE(@previousStartDate), DAY) / 7) as avg_per_week
        FROM ${pullRequestsTable}
        WHERE closedAt IS NOT NULL
          AND status = 'closed'
          AND DATE(closedAt) >= DATE(@previousStartDate)
          AND DATE(closedAt) <= DATE(@previousEndDate)
          AND organizationId = @organizationId
      )
      SELECT
        c.total_deployments as current_total_deployments,
        c.avg_per_week as current_avg_per_week,
        p.total_deployments as previous_total_deployments,
        p.avg_per_week as previous_avg_per_week
      FROM current_period c
      CROSS JOIN previous_period p;
    `;

    const rows = await this.executeQuery(query, {
      currentStartDate: startDate,
      currentEndDate: endDate,
      previousStartDate: previousStartDate.toISOString().split("T")[0],
      previousEndDate: previousEndDate.toISOString().split("T")[0],
      organizationId,
    });

    const result = rows[0] || {
      current_total_deployments: 0,
      current_avg_per_week: 0,
      previous_total_deployments: 0,
      previous_avg_per_week: 0,
    };

    const currentAvg = Number(result.current_avg_per_week.toFixed(2));
    const previousAvg = Number(result.previous_avg_per_week.toFixed(2));

    // Calculate percentage change and trend
    let percentageChange = 0;
    let trend: "improved" | "worsened" | "unchanged" = "unchanged";

    if (previousAvg > 0) {
      percentageChange = Number(
        (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(2)
      );
      // For deploy frequency, an increase is an improvement
      if (percentageChange > 0) {
        trend = "improved";
      } else if (percentageChange < 0) {
        trend = "worsened";
      }
    } else if (currentAvg > 0) {
      percentageChange = 100;
      trend = "improved";
    }

    return {
      currentPeriod: {
        totalDeployments: Number(result.current_total_deployments),
        averagePerWeek: currentAvg,
      },
      previousPeriod: {
        totalDeployments: Number(result.previous_total_deployments),
        averagePerWeek: previousAvg,
      },
      comparison: {
        percentageChange,
        trend,
      },
    };
  }

  async getPullRequestLeadTimeHighlight(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<LeadTimeHighlight> {
    // Calculate the duration of the current period
    const currentStartDate = new Date(startDate);
    const currentEndDate = new Date(endDate);
    const periodDurationMs =
      currentEndDate.getTime() - currentStartDate.getTime();

    // Calculate the previous period dates
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1); // Subtract 1 day to not overlap
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousEndDate.getTime() - periodDurationMs);

    const query = `
      WITH pr_lead_times AS (
        SELECT
          CASE
            WHEN TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@currentStartDate) AND TIMESTAMP(@currentEndDate)
            THEN 'current'
            ELSE 'previous'
          END as period,
          TIMESTAMP_DIFF(
            TIMESTAMP(pr.closedAt),
            TIMESTAMP(MIN(JSON_VALUE(c.commit_timestamp))),
            MINUTE
          ) as lead_time_minutes
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        JOIN ${this.getTablePath("MONGO", "commits_view")} AS c
          ON pr._id = c.pull_request_id
        WHERE pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@previousStartDate) AND TIMESTAMP(@currentEndDate)
          AND pr.organizationId = @organizationId
        GROUP BY pr._id, pr.closedAt, period
        HAVING COUNT(c.commit_hash) > 0
      )
      SELECT
        COALESCE(
          MAX(CASE WHEN period = 'current' THEN lead_time_p75 ELSE NULL END),
          0
        ) as current_lead_time_p75_minutes,
        COALESCE(
          MAX(CASE WHEN period = 'previous' THEN lead_time_p75 ELSE NULL END),
          0
        ) as previous_lead_time_p75_minutes
      FROM (
        SELECT
          period,
          APPROX_QUANTILES(lead_time_minutes, 100)[OFFSET(75)] as lead_time_p75
        FROM pr_lead_times
        GROUP BY period
      );
    `;

    const rows = await this.executeQuery(query, {
      currentStartDate: startDate,
      currentEndDate: endDate,
      previousStartDate: previousStartDate.toISOString().split("T")[0],
      previousEndDate: previousEndDate.toISOString().split("T")[0],
      organizationId,
    });

    const result = rows[0] || {
      current_lead_time_p75_minutes: 0,
      previous_lead_time_p75_minutes: 0,
    };

    // Ensure we have numeric values, defaulting to 0 if null/undefined
    const currentMinutes = Number(
      (result.current_lead_time_p75_minutes || 0).toFixed(2)
    );
    const previousMinutes = Number(
      (result.previous_lead_time_p75_minutes || 0).toFixed(2)
    );

    // Calculate percentage change and trend
    let percentageChange = 0;
    let trend: "improved" | "worsened" | "unchanged" = "unchanged";

    if (previousMinutes > 0) {
      percentageChange = Number(
        (((currentMinutes - previousMinutes) / previousMinutes) * 100).toFixed(
          2
        )
      );
      // For lead time, a decrease is an improvement
      if (percentageChange < 0) {
        trend = "improved";
      } else if (percentageChange > 0) {
        trend = "worsened";
      }
    } else if (currentMinutes > 0) {
      percentageChange = 100;
      trend = "worsened";
    }

    return {
      currentPeriod: {
        leadTimeP75Minutes: currentMinutes,
        leadTimeP75Hours: Number((currentMinutes / 60).toFixed(2)),
      },
      previousPeriod: {
        leadTimeP75Minutes: previousMinutes,
        leadTimeP75Hours: Number((previousMinutes / 60).toFixed(2)),
      },
      comparison: {
        percentageChange,
        trend,
      },
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
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK(MONDAY)) AS week_start,
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
  ): Promise<PRSizeHighlight> {
    // Calculate the duration of the current period
    const currentStartDate = new Date(startDate);
    const currentEndDate = new Date(endDate);
    const periodDurationMs =
      currentEndDate.getTime() - currentStartDate.getTime();

    // Calculate the previous period dates
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1); // Subtract 1 day to not overlap
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousEndDate.getTime() - periodDurationMs);

    const query = `
      WITH pr_sizes AS (
        SELECT
          CASE
            WHEN TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@currentStartDate) AND TIMESTAMP(@currentEndDate)
            THEN 'current'
            ELSE 'previous'
          END as period,
          pr.totalChanges as pr_size
        FROM ${this.getTablePath("MONGO", "pullRequests")} AS pr
        WHERE pr.closedAt IS NOT NULL
          AND pr.status = 'closed'
          AND TIMESTAMP(pr.closedAt) BETWEEN TIMESTAMP(@previousStartDate) AND TIMESTAMP(@currentEndDate)
          AND pr.organizationId = @organizationId
      )
      SELECT
        period,
        COUNT(*) as total_prs,
        ROUND(AVG(pr_size), 2) as avg_pr_size
      FROM pr_sizes
      GROUP BY period;
    `;

    const rows = await this.executeQuery(query, {
      currentStartDate: startDate,
      currentEndDate: endDate,
      previousStartDate: previousStartDate.toISOString().split("T")[0],
      previousEndDate: previousEndDate.toISOString().split("T")[0],
      organizationId,
    });

    // Initialize default values
    let currentPeriod = {
      averagePRSize: 0,
      totalPRs: 0,
    };
    let previousPeriod = {
      averagePRSize: 0,
      totalPRs: 0,
    };

    // Process query results
    rows.forEach((row) => {
      if (row.period === "current") {
        currentPeriod = {
          averagePRSize: Number(row.avg_pr_size || 0),
          totalPRs: Number(row.total_prs || 0),
        };
      } else {
        previousPeriod = {
          averagePRSize: Number(row.avg_pr_size || 0),
          totalPRs: Number(row.total_prs || 0),
        };
      }
    });

    // Calculate percentage change and trend
    let percentageChange = 0;
    let trend: "improved" | "worsened" | "unchanged" = "unchanged";

    if (previousPeriod.averagePRSize > 0) {
      percentageChange = Number(
        (
          ((currentPeriod.averagePRSize - previousPeriod.averagePRSize) /
            previousPeriod.averagePRSize) *
          100
        ).toFixed(2)
      );
      // For PR size, a decrease is an improvement (smaller PRs are better)
      if (percentageChange < 0) {
        trend = "improved";
      } else if (percentageChange > 0) {
        trend = "worsened";
      }
    } else if (currentPeriod.averagePRSize > 0) {
      percentageChange = 100;
      trend = "worsened";
    }

    return {
      currentPeriod,
      previousPeriod,
      comparison: {
        percentageChange,
        trend,
      },
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
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK(MONDAY)) AS week_start,
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
          TIMESTAMP_TRUNC(TIMESTAMP(pr.createdAt), WEEK(MONDAY)) AS week_start,
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
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK(MONDAY)) AS week_start,
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
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK(MONDAY)) AS week_start,
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
          TIMESTAMP_TRUNC(TIMESTAMP(pr.closedAt), WEEK(MONDAY))
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
