export interface CommunicationProfile {
  user_id: string;
  
  // Temporal patterns
  avg_response_time_seconds: number;
  median_response_time_seconds: number;
  active_hours: number[]; // [0-23]
  message_frequency_per_day: number;
  
  // Participation metrics
  group_participation_rate: number; // 0-1 (% of group convos participated in)
  conversation_initiator_score: number; // 0-1 (% of convos started)
  avg_messages_per_conversation: number;
  
  // Communication style
  verbosity: 'concise' | 'moderate' | 'verbose';
  consistency_score: number; // how consistent response times are
  
  // Network position (from graph analysis)
  betweenness_centrality: number; // connector between groups
  clustering_coefficient: number; // how tight their network is
  degree: number; // number of unique contacts
  
  // Derived scores
  social_catalyst_score: number; // 0-10 (high centrality + initiator)
  energy_level: 'low' | 'medium' | 'high'; // based on frequency
  
  // Metadata
  last_updated: Date;
  total_messages_analyzed: number;
}

