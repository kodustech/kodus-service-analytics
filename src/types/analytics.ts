// Constantes para as tabelas
export const TABLES = {
  PULL_REQUESTS: "pullRequests",
  DEPLOYMENTS: "deployments",
  ISSUES: "issues",
} as const;

export interface QueryParams {
  organizationId: string;
  startDate: string;
  endDate: string;
}

// Sugestões
export interface SuggestionCategory {
  category: string;
  count: number;
}

export interface SuggestionCategoryCount {
  category: string;
  count: number;
}

export interface RepositorySuggestions {
  repository: string;
  totalCount: number;
  categories: SuggestionCategory[];
}

// Lead Time
export interface LeadTimeMetrics {
  leadTimeP75Minutes: number;
  leadTimeP75Hours: number;
}

export interface LeadTimeChartData {
  weekStart: string;
  leadTimeP75Minutes: number;
  leadTimeP75Hours: number;
}

export interface LeadTimeBreakdownData {
  weekStart: string;
  prCount: number;
  codingTimeMinutes: number;
  codingTimeHours: number;
  pickupTimeMinutes: number;
  pickupTimeHours: number;
  reviewTimeMinutes: number;
  reviewTimeHours: number;
  totalTimeMinutes: number;
  totalTimeHours: number;
}

// Pull Requests
export interface PullRequestSizeMetrics {
  averagePRSize: number;
}

export interface PullRequestsByDevChartData {
  weekStart: string;
  author: string;
  prCount: number;
}

export interface PullRequestsOpenedVsClosedData {
  weekStart: string;
  openedCount: number;
  closedCount: number;
  ratio: number;
}

// Developer Activity
export interface DeveloperActivityData {
  developer: string;
  date: string;
  commitCount: number;
  prCount: number;
}
