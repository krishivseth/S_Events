import { MessageMetadata } from '../models/ChemistryAnalysis.js';
import { CommunicationProfile } from '../models/CommunicationProfile.js';
import { logger } from './logger.js';

/**
 * Mock data generator for demo/development when Kafka isn't available
 * Generates realistic communication patterns
 */
export class MockDataGenerator {
  /**
   * Generate realistic message metadata for multiple users
   */
  static generateMockMessages(
    userCount: number = 10,
    days: number = 30,
    conversationsPerUser: number = 5
  ): MessageMetadata[] {
    const messages: MessageMetadata[] = [];
    const users = Array.from({ length: userCount }, (_, i) => `user_${i}`);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    logger.info(`Generating mock data: ${userCount} users, ${days} days`);

    // Create conversation groups
    const conversations: string[] = [];
    for (let i = 0; i < conversationsPerUser * userCount; i++) {
      conversations.push(`conv_${i}`);
    }

    // Generate messages with realistic patterns
    for (let day = 0; day < days; day++) {
      const dayStart = now - (day * dayMs);
      
      for (const user of users) {
        // Some users are more active (power law distribution)
        const activityLevel = Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low';
        const baseMessagesPerDay = activityLevel === 'high' ? 40 : activityLevel === 'medium' ? 20 : 10;
        const messagesPerDay = Math.floor(Math.random() * baseMessagesPerDay) + 5;

        // Active hours (most people active 9-11am, 2-4pm, 7-10pm)
        const activeHours = this.generateActiveHours(activityLevel);

        for (let i = 0; i < messagesPerDay; i++) {
          const hour = activeHours[Math.floor(Math.random() * activeHours.length)];
          const minute = Math.floor(Math.random() * 60);
          const timestamp = dayStart + (hour * 60 * 60 * 1000) + (minute * 60 * 1000);

          // Pick conversation (some are 1:1, some are group)
          const convId = conversations[Math.floor(Math.random() * conversations.length)];
          const isGroup = Math.random() < 0.3; // 30% group conversations

          // Message length varies by user style
          const verbosity = Math.random();
          let messageLength: number;
          if (verbosity < 0.3) {
            messageLength = Math.floor(Math.random() * 40) + 10; // concise
          } else if (verbosity < 0.7) {
            messageLength = Math.floor(Math.random() * 100) + 40; // moderate
          } else {
            messageLength = Math.floor(Math.random() * 300) + 150; // verbose
          }

          messages.push({
            timestamp,
            sender_id: user,
            message_length: messageLength,
            conversation_id: convId,
            recipient_id: isGroup ? undefined : users[Math.floor(Math.random() * users.length)],
            group_id: isGroup ? `group_${convId}` : undefined,
          });
        }
      }
    }

    // Sort by timestamp
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate active hours based on activity level
   */
  private static generateActiveHours(activityLevel: 'low' | 'medium' | 'high'): number[] {
    const baseHours = [9, 10, 14, 15, 19, 20, 21]; // Common active times
    const spread = activityLevel === 'high' ? 4 : activityLevel === 'medium' ? 3 : 2;
    
    const hours = new Set<number>();
    for (const hour of baseHours) {
      for (let i = -spread; i <= spread; i++) {
        const h = (hour + i + 24) % 24;
        hours.add(h);
      }
    }

    return Array.from(hours).sort((a, b) => a - b);
  }

  /**
   * Generate mock communication profiles
   */
  static generateMockProfiles(
    count: number = 10,
    messages: MessageMetadata[] = []
  ): CommunicationProfile[] {
    const profiles: CommunicationProfile[] = [];
    const userMessages = new Map<string, MessageMetadata[]>();

    // Group messages by user
    for (const msg of messages) {
      if (!userMessages.has(msg.sender_id)) {
        userMessages.set(msg.sender_id, []);
      }
      userMessages.get(msg.sender_id)!.push(msg);
    }

    // Generate profiles for requested users
    for (let i = 0; i < count; i++) {
      const userId = `user_${i}`;
      const userMsgList = userMessages.get(userId) || [];

      // Calculate response times (mock)
      const avgResponseTime = Math.floor(Math.random() * 3600) + 300; // 5min to 1hr
      const activeHours = this.generateActiveHours(
        Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low'
      );

      const verbosity = Math.random() < 0.3 ? 'concise' : Math.random() < 0.7 ? 'moderate' : 'verbose';

      profiles.push({
        user_id: userId,
        avg_response_time_seconds: avgResponseTime,
        median_response_time_seconds: avgResponseTime * 0.8,
        active_hours: activeHours,
        message_frequency_per_day: userMsgList.length / 30 || Math.random() * 30 + 5,
        group_participation_rate: Math.random() * 0.5 + 0.5,
        conversation_initiator_score: Math.random() * 0.4 + 0.2,
        avg_messages_per_conversation: Math.random() * 10 + 5,
        verbosity: verbosity,
        consistency_score: Math.random() * 0.5 + 0.5,
        betweenness_centrality: Math.random(),
        clustering_coefficient: Math.random(),
        degree: Math.floor(Math.random() * 20) + 5,
        social_catalyst_score: Math.random() * 10,
        energy_level: userMsgList.length > 500 ? 'high' : userMsgList.length > 200 ? 'medium' : 'low',
        last_updated: new Date(),
        total_messages_analyzed: userMsgList.length,
      });
    }

    return profiles;
  }
}

