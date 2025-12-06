export interface ChemistryPrediction {
  group_score: number; // 0-100
  confidence: number; // 0-1
  insights: string[];
  warnings: string[];
  pairwise_scores: Record<string, number>; // "user1_user2" -> score
  recommended_additions: string[]; // user IDs that would improve chemistry
  recommended_removals: string[]; // user IDs causing friction
}

export interface MessageMetadata {
  timestamp: number;
  sender_id: string;
  message_length: number;
  conversation_id: string;
  recipient_id?: string;
  group_id?: string;
}

