
export interface Task {
  id: string;
  title: string;
  description: string;
  streak: number;
  lastCompleted: string | null; // ISO Date
  stakeAmount: number; // in mock crypto (e.g. SOL)
  status: 'active' | 'broken' | 'completed' | 'missed';
  category: 'Leads' | 'Marketing' | 'Product' | 'Health';
  createdAt: string; // ISO Timestamp
  deadline?: string; // ISO Date string
  deadlineReminder?: 'None' | '15m' | '1h' | '1d';
  contactDetails?: string; // e.g. "LinkedIn URL" or "X Handle"
  outreachMessage?: string; // The approved message
  sourcePlatform?: 'LinkedIn' | 'X' | 'Facebook' | 'Web';
  missedReason?: string;
  aiRecommendation?: string;
  suggestedReplacementTask?: Partial<Task>;
  reminderSent?: boolean; // internal flag to avoid duplicate alerts
  leadId?: string; // Links task to a generated lead
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  linkedinUrl?: string;
  xHandle?: string;
  facebookUrl?: string;
  summary: string;
  personalizedMessage: string;
  status: 'pending' | 'approved' | 'sent' | 'rejected' | 'completed';
  platform: 'LinkedIn' | 'X' | 'Facebook';
  contactInfo: string;
  followUpCount?: number;
  lastResponseStatus?: 'responded' | 'no-reply' | 'declined' | 'pending';
}

export interface SocialGroup {
  id: string;
  name: string;
  members: string[];
}

export interface AccountabilityLog {
  id: string;
  taskId: string;
  action: 'success' | 'missed';
  timestamp: string;
  penaltyApplied?: number;
}
