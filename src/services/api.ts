import {
  IUser,
  IComplaint,
  INotification,
  IDepartment,
  IAIAnalysisResult,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types/index.ts';

const API_BASE = '/api';

// Helper for fetch with token and credentials
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('peoplefix_token') || localStorage.getItem('civicfix_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    register: (body: any) =>
      request<{ message: string; user: IUser; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: any) =>
      request<{ message: string; user: IUser; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: () => request<{ user: IUser }>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) =>
      request<{ message: string; resetToken?: string; instructions?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (body: any) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    changePassword: (body: any) =>
      request<{ message: string }>('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getDemoAccounts: () =>
      request<{
        accounts: Array<{ role: string; email: string; label: string; passwordHint: string }>;
      }>('/auth/demo-accounts'),
  },

  // Complaints
  complaints: {
    create: (body: any) =>
      request<{ message: string; complaint: IComplaint }>('/complaints', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getMy: () => request<{ complaints: IComplaint[] }>('/complaints/my'),
    getAll: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ complaints: IComplaint[]; total: number; page: number; limit: number }>(
        `/complaints?${query}`
      );
    },
    getById: (id: string) => request<{ complaint: IComplaint; history: any[] }>(`/complaints/${id}`),
    reopen: (id: string, reason: string) =>
      request<{ message: string; complaint: IComplaint }>(`/complaints/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    submitFeedback: (id: string, rating: number, comment: string) =>
      request<{ message: string; complaint: IComplaint }>(`/complaints/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      }),
  },

  // Officer
  officer: {
    getStats: () =>
      request<{
        totalDepartment: number;
        assignedToMeCount: number;
        pendingCount: number;
        inProgressCount: number;
        resolvedCount: number;
        overdueCount: number;
        avgResolutionHours: number;
        priorityCounts: Record<string, number>;
        departmentName: string;
      }>('/officer/stats'),
    getComplaints: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request<{ complaints: IComplaint[] }>(`/officer/complaints?${query}`);
    },
    updateStatus: (
      id: string,
      body: {
        newStatus: ComplaintStatus;
        publicMessage: string;
        internalNote?: string;
        evidenceImages?: string[];
      }
    ) =>
      request<{ message: string; complaint: IComplaint; historyItem: any }>(
        `/officer/complaints/${id}/status`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      ),
    assign: (
      id: string,
      body: {
        actionType?: 'accept' | 'reject';
        assignedOfficerId?: string;
        reason?: string;
      }
    ) =>
      request<{ message: string }>(`/officer/complaints/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getTeam: () => request<{ officers: any[] }>('/officer/team'),
  },

  // Admin
  admin: {
    getDashboard: () =>
      request<{
        totalCitizens: number;
        totalOfficers: number;
        totalDepartments: number;
        totalComplaints: number;
        pendingCount: number;
        resolvedCount: number;
        overdueCount: number;
        resolutionRate: number;
        avgResolutionHours: number;
      }>('/admin/dashboard'),
    getAnalytics: () =>
      request<{
        categoryData: Array<{ category: string; count: number }>;
        priorityData: Array<{ priority: string; count: number }>;
        statusData: Array<{ status: string; count: number }>;
        departmentPerformance: Array<{
          department: string;
          code: string;
          total: number;
          resolved: number;
          overdue: number;
          slaComplianceRate: number;
        }>;
        monthlyTrends: Array<{ month: string; reported: number; resolved: number }>;
      }>('/admin/analytics'),
    getUsers: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request<{ users: IUser[] }>(`/admin/users?${query}`);
    },
    createUser: (body: any) =>
      request<{ message: string; user: IUser }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateUser: (id: string, body: any) =>
      request<{ message: string; user: IUser }>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getDepartments: () => request<{ departments: IDepartment[] }>('/admin/departments'),
    createDepartment: (body: any) =>
      request<{ message: string; department: IDepartment }>('/admin/departments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateDepartment: (id: string, body: any) =>
      request<{ message: string; department: IDepartment }>(`/admin/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getEscalations: () => request<{ escalations: any[] }>('/admin/escalations'),
    resolveEscalation: (id: string) =>
      request<{ message: string }>(`/admin/escalations/${id}/resolve`, {
        method: 'POST',
      }),
    getAuditLogs: () => request<{ logs: any[] }>('/admin/audit-logs'),
    generateReport: (reportType: 'daily' | 'monthly' | 'executive') =>
      request<{ reportText: string; generatedAt: string; provider: string }>(
        '/admin/generate-report',
        {
          method: 'POST',
          body: JSON.stringify({ reportType }),
        }
      ),
  },

  // AI
  ai: {
    analyzeDescription: (body: { description: string; title?: string; category?: string }) =>
      request<{ result: IAIAnalysisResult }>('/ai/analyze-description', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    classifyImage: (body: { image: string; description?: string }) =>
      request<{
        result: {
          predictedCategory: ComplaintCategory;
          confidence: number;
          explanation: string;
          provider: string;
        };
      }>('/ai/classify-image', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    detectDuplicates: (body: {
      category: ComplaintCategory;
      title: string;
      description?: string;
      location: { lat: number; lng: number };
    }) =>
      request<{
        hasDuplicates: boolean;
        count: number;
        duplicates: Array<{
          complaint: IComplaint;
          similarityScore: number;
          distanceMeters: number;
          reasons: string[];
        }>;
      }>('/ai/detect-duplicates', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getSimilarComplaints: (category: string, complaintId?: string) =>
      request<{
        category: string;
        suggestedActions: string[];
        similarResolvedCount: number;
        averageResolutionHours: number;
        similarPastComplaints: any[];
      }>(`/ai/similar-complaints?category=${encodeURIComponent(category)}${complaintId ? `&complaintId=${complaintId}` : ''}`),
  },

  // Map
  map: {
    getComplaints: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request<{ complaints: any[] }>(`/map/complaints?${query}`);
    },
    getNearby: (lat: number, lng: number, radiusMeters = 3000) =>
      request<{ nearby: any[] }>(`/map/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`),
  },

  // Notifications
  notifications: {
    getAll: () => request<{ notifications: INotification[]; unreadCount: number }>('/notifications'),
    markRead: (id: string) => request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),
  },
};
