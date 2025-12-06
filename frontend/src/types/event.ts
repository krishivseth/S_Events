export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  host: string;
  type: 'private' | 'public';
  maxAttendees: number;
  guests: Guest[];
  chemistryScore: number;
}

export interface Guest {
  userId: string;
  name: string;
  avatar: string;
  rsvpStatus: 'pending' | 'accepted' | 'declined';
  individualChemistry: number;
}

export interface CommunicationProfile {
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

export interface ChemistryAnalysis {
  groupScore: number;
  insights: string[];
  warnings: string[];
  pairwiseScores: Record<string, number>;
}

export interface GraphNode {
  id: string;
  name: string;
  avatar: string;
  chemistry: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}
