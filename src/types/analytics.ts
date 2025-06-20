// Constantes para as tabelas
export const TABLES = {
  PULL_REQUESTS: "pullRequests",
  DEPLOYMENTS: "deployments",
  ISSUES: "issues",
  PULL_REQUEST_TYPES: "pull_request_types",
  ORGANIZATION: "organizations",
  SUGGESTIONS_VIEW: "suggestions_view",
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

export interface LeadTimeHighlight {
  currentPeriod: {
    leadTimeP75Minutes: number;
    leadTimeP75Hours: number;
  };
  previousPeriod: {
    leadTimeP75Minutes: number;
    leadTimeP75Hours: number;
  };
  comparison: {
    percentageChange: number;
    trend: "improved" | "worsened" | "unchanged";
  };
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

export interface PRSizeHighlight {
  currentPeriod: {
    averagePRSize: number;
    totalPRs: number;
  };
  previousPeriod: {
    averagePRSize: number;
    totalPRs: number;
  };
  comparison: {
    percentageChange: number;
    trend: "improved" | "worsened" | "unchanged";
  };
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

export interface BugRatioData {
  weekStart: string;
  totalPRs: number;
  bugFixPRs: number;
  ratio: number;
}

export interface BugRatioHighlight {
  currentPeriod: {
    totalPRs: number;
    bugFixPRs: number;
    ratio: number;
  };
  previousPeriod: {
    totalPRs: number;
    bugFixPRs: number;
    ratio: number;
  };
  comparison: {
    percentageChange: number;
    trend: "improved" | "worsened" | "unchanged";
  };
}

export interface DeployFrequencyHighlight {
  currentPeriod: {
    totalDeployments: number;
    averagePerWeek: number;
  };
  previousPeriod: {
    totalDeployments: number;
    averagePerWeek: number;
  };
  comparison: {
    percentageChange: number;
    trend: "improved" | "worsened" | "unchanged";
  };
}

export interface SuggestionsImplementationRate {
  suggestionsSent: number;
  suggestionsImplemented: number;
  implementationRate: number;
}

// Dashboard consolidado por empresa
export interface CompanyDashboard {
  organizationId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalPRs: number;
    criticalSuggestions: number;
    totalSuggestions: number;
    topSuggestionsCategories: {
      category: string;
      count: number;
    }[];
    topDeveloper: {
      name: string;
      totalPRs: number;
    };
    companyRanking: {
      rank: number;
      totalCompanies: number;
      percentageOfTotalPRs: number;
      totalPRsAllCompanies: number;
    };
  };
  additionalMetrics?: {
    suggestionsAppliedPercentage?: number;
    suggestionsImplementedCount?: number;
    cycleTime?: LeadTimeHighlight;
    deployFrequency?: DeployFrequencyHighlight;
    bugRatio?: BugRatioHighlight;
    leadTimeBreakdown?: LeadTimeBreakdownData[];
  };
}
