export type UserRole = 'citizen' | 'officer' | 'admin';

export type ComplaintCategory =
  | 'Road Damage / Potholes'
  | 'Garbage Collection'
  | 'Streetlight Failure'
  | 'Water Leakage'
  | 'Drainage Problems'
  | 'Sewage Overflow'
  | 'Public Sanitation'
  | 'Broken Footpaths'
  | 'Traffic Signal Problems'
  | 'Other Civic Issues';

export type ComplaintPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'On Hold'
  | 'Resolved'
  | 'Reopened'
  | 'Rejected';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILocation {
  lat: number;
  lng: number;
  address: string;
  landmark?: string;
  city?: string;
  district?: string;
}

export interface IAIAnalysisResult {
  predictedCategory: ComplaintCategory;
  confidence: number;
  suggestedPriority: ComplaintPriority;
  suggestedDepartment: string;
  extractedKeywords: string[];
  summary: string;
  reasoning: string;
  provider: 'gemini' | 'groq' | 'ollama' | 'rule-based';
  safetyHazardsIdentified?: string[];
}

export interface IComplaintHistoryItem {
  id: string;
  complaintId: string;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  changedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  publicMessage: string;
  internalNote?: string;
  evidenceImages?: string[];
  createdAt: string;
}

export interface IComplaintFeedback {
  rating: number;
  comment: string;
  citizenId: string;
  citizenName: string;
  submittedAt: string;
}

export interface IComplaint {
  id: string;
  complaintId: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  departmentId: string;
  departmentName: string;
  priority: ComplaintPriority;
  aiSuggestedPriority?: ComplaintPriority;
  aiAnalysis?: IAIAnalysisResult;
  status: ComplaintStatus;
  images: string[];
  location: ILocation;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  duplicateOf?: string;
  slaDeadline: string;
  submittedAt: string;
  resolvedAt?: string;
  reopenedCount: number;
  feedback?: IComplaintFeedback;
  history?: IComplaintHistoryItem[];
  isOverdue?: boolean;
}

export interface INotification {
  id: string;
  userId: string;
  roleTarget?: UserRole;
  complaintId?: string;
  title: string;
  message: string;
  type: 'status_change' | 'assignment' | 'escalation' | 'feedback' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface IDepartment {
  id: string;
  name: string;
  code: string;
  description: string;
  categories: ComplaintCategory[];
  headOfficerId?: string;
  headOfficerName?: string;
  slaHours: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}
