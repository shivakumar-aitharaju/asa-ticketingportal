export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  TeamLeader = "team_leader",
  Agent = "agent",
  Client = "client",
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  departmentId?: string | null;
  department?: Department | null;
  isActive: boolean;
  avatarUrl?: string | null;
  notificationPrefs: Record<string, unknown>;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthLoginResponse {
  data: {
    token: string;
    refreshToken: string;
    user: User;
  };
}

export interface ApiError {
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}
