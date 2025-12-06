import { MessageMetadata } from '../models/ChemistryAnalysis.js';
import { CommunicationProfile } from '../models/CommunicationProfile.js';
import { Calculations } from '../utils/calculations.js';
import { GraphAnalyzer } from './graphAnalyzer.js';
import { logger } from '../utils/logger.js';

/**
 * Builds communication profiles from message metadata
 * CRITICAL: Only uses metadata, never message content
 */
export class ProfileBuilder {
  private profiles: Map<string, CommunicationProfile> = new Map();
  private graphAnalyzer: GraphAnalyzer;

  constructor(graphAnalyzer: GraphAnalyzer) {
    this.graphAnalyzer = graphAnalyzer;
  }

  /**
   * Build or update profile for a user
   */
  async buildProfile(userId: string, messages: MessageMetadata[]): Promise<CommunicationProfile> {
    logger.info(`Building profile for ${userId} from ${messages.length} messages`);

    // 1. Calculate temporal patterns
    const responseTimes = this.calculateResponseTimes(messages);
    const activeHours = this.extractActiveHours(messages);
    const messageFrequency = messages.length / Math.max(this.getDaysSpan(messages), 1);

    // 2. Analyze participation
    const participationMetrics = this.analyzeParticipation(messages, userId);

    // 3. Determine communication style
    const style = this.inferCommunicationStyle(messages);

    // 4. Calculate network metrics
    const networkMetrics = this.graphAnalyzer.calculateNodeMetrics(userId);

    // 5. Derive composite scores
    const socialCatalystScore = this.calculateCatalystScore(
      networkMetrics.betweenness,
      participationMetrics.conversation_initiator_score
    );

    const energyLevel = this.determineEnergyLevel(messageFrequency);

    // 6. Build profile
    const profile: CommunicationProfile = {
      user_id: userId,
      avg_response_time_seconds: Calculations.median(responseTimes) || 0,
      median_response_time_seconds: Calculations.median(responseTimes) || 0,
      active_hours: activeHours,
      message_frequency_per_day: messageFrequency,
      group_participation_rate: participationMetrics.group_participation_rate,
      conversation_initiator_score: participationMetrics.conversation_initiator_score,
      avg_messages_per_conversation: participationMetrics.avg_messages_per_conversation,
      verbosity: style.verbosity,
      consistency_score: style.consistency_score,
      betweenness_centrality: networkMetrics.betweenness,
      clustering_coefficient: networkMetrics.clustering,
      degree: networkMetrics.degree,
      social_catalyst_score: socialCatalystScore,
      energy_level: energyLevel,
      last_updated: new Date(),
      total_messages_analyzed: messages.length,
    };

    this.profiles.set(userId, profile);
    logger.info(`Profile built for ${userId}: catalyst=${socialCatalystScore.toFixed(1)}, energy=${energyLevel}`);
    
    return profile;
  }

  /**
   * Calculate response times from message metadata
   */
  private calculateResponseTimes(messages: MessageMetadata[]): number[] {
    const responseTimes: number[] = [];
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    
    // Group by conversation
    const conversations = new Map<string, MessageMetadata[]>();
    for (const msg of sortedMessages) {
      if (!conversations.has(msg.conversation_id)) {
        conversations.set(msg.conversation_id, []);
      }
      conversations.get(msg.conversation_id)!.push(msg);
    }

    // Calculate time delta between consecutive messages in same conversation
    for (const [_, convMessages] of conversations) {
      for (let i = 1; i < convMessages.length; i++) {
        const timeDelta = (convMessages[i].timestamp - convMessages[i - 1].timestamp) / 1000; // Convert to seconds
        
        // Filter outliers (>24 hours = likely not a response)
        if (timeDelta > 0 && timeDelta < 24 * 60 * 60) {
          responseTimes.push(timeDelta);
        }
      }
    }

    return responseTimes;
  }

  /**
   * Extract active hours from message timestamps
   */
  private extractActiveHours(messages: MessageMetadata[]): number[] {
    const hourCounts = new Map<number, number>();

    for (const msg of messages) {
      const date = new Date(msg.timestamp);
      const hour = date.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    // Sort by frequency and return top 6-8 hours
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hour]) => hour);

    return sortedHours.length > 0 ? sortedHours : [9, 10, 14, 15, 19, 20]; // Default active hours
  }

  /**
   * Analyze participation metrics
   */
  private analyzeParticipation(
    messages: MessageMetadata[],
    userId: string
  ): {
    group_participation_rate: number;
    conversation_initiator_score: number;
    avg_messages_per_conversation: number;
  } {
    // Group messages by conversation
    const conversations = new Map<string, MessageMetadata[]>();
    const groupConversations = new Set<string>();
    const userGroupConversations = new Set<string>();

    for (const msg of messages) {
      if (!conversations.has(msg.conversation_id)) {
        conversations.set(msg.conversation_id, []);
      }
      conversations.get(msg.conversation_id)!.push(msg);

      if (msg.group_id) {
        groupConversations.add(msg.conversation_id);
        if (msg.sender_id === userId) {
          userGroupConversations.add(msg.conversation_id);
        }
      }
    }

    // Calculate group participation rate
    const groupParticipationRate =
      groupConversations.size > 0
        ? userGroupConversations.size / groupConversations.size
        : 0;

    // Calculate conversation initiator score (how often user sent first message)
    let initiatorCount = 0;
    for (const [convId, convMessages] of conversations) {
      const sorted = [...convMessages].sort((a, b) => a.timestamp - b.timestamp);
      if (sorted.length > 0 && sorted[0].sender_id === userId) {
        initiatorCount++;
      }
    }
    const conversationInitiatorScore = conversations.size > 0 
      ? initiatorCount / conversations.size 
      : 0;

    // Calculate average messages per conversation
    const userConversations = Array.from(conversations.values())
      .filter(conv => conv.some(msg => msg.sender_id === userId));
    const avgMessagesPerConversation =
      userConversations.length > 0
        ? userConversations.reduce((sum, conv) => sum + conv.length, 0) / userConversations.length
        : 0;

    return {
      group_participation_rate: Math.min(1, groupParticipationRate),
      conversation_initiator_score: Math.min(1, conversationInitiatorScore),
      avg_messages_per_conversation: avgMessagesPerConversation,
    };
  }

  /**
   * Infer communication style from message metadata
   */
  private inferCommunicationStyle(messages: MessageMetadata[]): {
    verbosity: 'concise' | 'moderate' | 'verbose';
    consistency_score: number;
  } {
    if (messages.length === 0) {
      return { verbosity: 'moderate', consistency_score: 0.5 };
    }

    // Analyze message length distribution
    const lengths = messages.map(m => m.message_length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    let verbosity: 'concise' | 'moderate' | 'verbose';
    if (avgLength < 50) {
      verbosity = 'concise';
    } else if (avgLength < 150) {
      verbosity = 'moderate';
    } else {
      verbosity = 'verbose';
    }

    // Analyze response time consistency (lower std dev = more consistent)
    const responseTimes = this.calculateResponseTimes(messages);
    const stdDev = Calculations.standardDeviation(responseTimes);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 3600;

    // Consistency score: inverse of coefficient of variation
    const coefficientOfVariation = avgResponseTime > 0 ? stdDev / avgResponseTime : 1;
    const consistencyScore = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

    return { verbosity, consistency_score: consistencyScore };
  }

  /**
   * Calculate social catalyst score
   */
  private calculateCatalystScore(
    betweennessCentrality: number,
    initiatorScore: number
  ): number {
    // Catalyst = high centrality + high initiation
    // Score 0-10
    return (betweennessCentrality * 5) + (initiatorScore * 5);
  }

  /**
   * Determine energy level from message frequency
   */
  private determineEnergyLevel(frequencyPerDay: number): 'low' | 'medium' | 'high' {
    if (frequencyPerDay > 30) return 'high';
    if (frequencyPerDay > 15) return 'medium';
    return 'low';
  }

  /**
   * Get days span of messages
   */
  private getDaysSpan(messages: MessageMetadata[]): number {
    if (messages.length === 0) return 1;
    const timestamps = messages.map(m => m.timestamp);
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    return Math.max(1, (max - min) / (24 * 60 * 60 * 1000));
  }

  /**
   * Get profile for a user
   */
  getProfile(userId: string): CommunicationProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * Delete profile (privacy compliance)
   */
  async deleteProfile(userId: string): Promise<void> {
    this.profiles.delete(userId);
    logger.info(`Deleted profile for ${userId}`);
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): CommunicationProfile[] {
    return Array.from(this.profiles.values());
  }
}

