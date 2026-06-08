export const endpoints = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
  AUTH_VERIFY_RESET_TOKEN: "/auth/verify-reset-token",
  AUTH_RESET_PASSWORD: "/auth/reset-password",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_ME: "/auth/me",

  // Users
  USERS: "/users",
  USERS_PROFILE: "/users/profile",
  USERS_BY_ID: (id: string) => `/users/${id}`,
  USERS_RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  USERS_WORKLOAD: (deptId: string) => `/users/workload/${deptId}`,

  // Departments / Categories (same backend resource)
  DEPARTMENTS: "/departments",
  DEPARTMENTS_BY_ID: (id: string) => `/departments/${id}`,
  DEPARTMENTS_CATEGORIES: (id: string) => `/departments/${id}/categories`,
  DEPARTMENTS_MEMBERS: (id: string) => `/departments/${id}/members`,
  DEPARTMENTS_MEMBERS_BY_USER: (id: string, userId: string) => `/departments/${id}/members/${userId}`,

  // Categories (sub-categories of departments)
  CATEGORIES: "/categories",

  // Tickets
  TICKETS: "/tickets",
  TICKETS_BY_ID: (id: string) => `/tickets/${id}`,
  TICKETS_MESSAGES: (id: string) => `/tickets/${id}/messages`,
  TICKETS_ASSIGN: (id: string) => `/tickets/${id}/assign`,
  TICKETS_RESOLVE: (id: string) => `/tickets/${id}/resolve`,
  TICKETS_CLIENT_RESOLVE: (id: string) => `/tickets/${id}/client-resolve`,
  TICKETS_RATE: (id: string) => `/tickets/${id}/rate`,
  TICKETS_CLOSE: (id: string) => `/tickets/${id}/close`,
  TICKETS_REOPEN: (id: string) => `/tickets/${id}/reopen`,
  TICKETS_ESCALATE: (id: string) => `/tickets/${id}/escalate`,
  TICKETS_HISTORY: (id: string) => `/tickets/${id}/history`,
  TICKETS_SLA: (id: string) => `/tickets/${id}/sla`,
  TICKETS_ATTACHMENTS: (id: string) => `/tickets/${id}/attachments`,
  TICKETS_ATTACHMENT_URL: (id: string, attId: string) => `/tickets/${id}/attachments/${attId}/url`,
  TICKETS_ATTACHMENT_DELETE: (id: string, attId: string) => `/tickets/${id}/attachments/${attId}`,

  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATIONS_UNREAD_COUNT: "/notifications/unread-count",
  NOTIFICATIONS_READ_ALL: "/notifications/read-all",
  NOTIFICATIONS_READ: (id: string) => `/notifications/${id}/read`,

  // Analytics
  ANALYTICS_OVERVIEW: "/analytics/overview",
  ANALYTICS_TREND: "/analytics/trend",
  ANALYTICS_AGENTS: "/analytics/agents",
  ANALYTICS_DEPARTMENTS: "/analytics/departments",
  ANALYTICS_STATUS: "/analytics/stats/status",
  ANALYTICS_PRIORITY: "/analytics/stats/priority",
  ANALYTICS_MONTHLY: "/analytics/monthly",
  ANALYTICS_RESOLUTION: "/analytics/resolution-time",
  ANALYTICS_SLA_TREND: "/analytics/sla-trend",

  // SLA
  SLA_CONFIGS: "/sla/configs",
  SLA_CONFIGS_BY_ID: (id: string) => `/sla/configs/${id}`,

  // Audit
  AUDIT_LOGS: "/audit",

  // Health
  HEALTH: "/health",
} as const;
