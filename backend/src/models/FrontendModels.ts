/**
 * Frontend Data Models
 * These match the frontend's TypeScript interfaces
 */

export interface FrontendCommunicationProfile {
  userId: string;
  name: string;
  avatar: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  school: string;
  role: string;
  company: string;
  bio: string;
  connectionDegree: 1 | 2 | 3; // 1st, 2nd, 3rd connection
  alreadyKnow: boolean;
  linkedinUrl?: string;
}

export interface FrontendChemistryAnalysis {
  groupScore: number; // 0-100
  insights: string[];
  warnings: string[];
  pairwiseScores: Record<string, number>; // "user-1_user-2": 85
}

export interface FrontendGuest {
  userId: string;
  name: string;
  avatar: string;
  rsvpStatus: 'pending' | 'accepted' | 'declined';
  individualChemistry: number;
}

export interface FrontendEvent {
  id: string;
  title: string;
  description: string;
  date: Date | string;
  host: string; // userId
  type: 'private' | 'public';
  maxAttendees: number;
  guests: FrontendGuest[];
  chemistryScore: number;
}

/**
 * Extended profile that combines frontend social data with backend communication analysis
 */
export interface ExtendedProfile {
  // Frontend social profile
  userId: string;
  name: string;
  avatar: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  school: string;
  role: string;
  company: string;
  bio: string;
  connectionDegree: 1 | 2 | 3;
  alreadyKnow: boolean;
  linkedinUrl?: string;
  
  // Backend communication analysis (optional, computed if available)
  communicationProfile?: {
    avg_response_time_seconds: number;
    active_hours: number[];
    verbosity: 'concise' | 'moderate' | 'verbose';
    social_catalyst_score: number;
    energy_level: 'low' | 'medium' | 'high';
  };
}

