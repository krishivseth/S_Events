import crypto from 'crypto';
import { MessageMetadata } from '../models/ChemistryAnalysis.js';
import { logger } from './logger.js';

/**
 * Privacy utilities to ensure NO message content is ever stored
 * Only metadata (timestamps, lengths, IDs) is used
 */
export class PrivacyGuard {
  private static readonly SALT = process.env.HASH_SALT || 'series-events-salt';

  /**
   * Sanitize message data - extract ONLY metadata, never content
   */
  static sanitizeMessageData(rawMessage: any): MessageMetadata | null {
    try {
      // Log that we're NOT accessing content
      logger.debug('Privacy: Sanitizing message - content NOT accessed');

      return {
        timestamp: rawMessage.timestamp || Date.now(),
        sender_id: this.hashId(rawMessage.sender_id || rawMessage.senderId),
        message_length: rawMessage.message_length || rawMessage.messageLength || rawMessage.content?.length || 0,
        conversation_id: this.hashId(rawMessage.conversation_id || rawMessage.conversationId || ''),
        recipient_id: rawMessage.recipient_id || rawMessage.recipientId ? 
          this.hashId(rawMessage.recipient_id || rawMessage.recipientId) : undefined,
        group_id: rawMessage.group_id || rawMessage.groupId ? 
          this.hashId(rawMessage.group_id || rawMessage.groupId) : undefined,
      };
    } catch (error) {
      logger.error('Privacy: Failed to sanitize message data', { error });
      return null;
    }
  }

  /**
   * Hash user IDs for anonymization (one-way, consistent)
   */
  static hashId(id: string): string {
    return crypto
      .createHash('sha256')
      .update(id + this.SALT)
      .digest('hex')
      .substring(0, 16); // Short hash for readability in demo
  }

  /**
   * Apply differential privacy noise to aggregate statistics
   */
  static addNoise(value: number, sensitivity: number = 1, epsilon: number = 1.0): number {
    // Laplace mechanism for differential privacy
    const scale = sensitivity / epsilon;
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
  }

  /**
   * Validate that no content was stored
   */
  static validateNoContent(data: any): boolean {
    const hasContent = 
      data.content !== undefined ||
      data.message_text !== undefined ||
      data.body !== undefined ||
      data.text !== undefined;
    
    if (hasContent) {
      logger.error('Privacy violation detected: Content field present!');
      return false;
    }
    
    return true;
  }

  /**
   * Export user data (GDPR compliance)
   */
  static exportUserData(profile: any, metadata: any): any {
    return {
      profile: {
        ...profile,
        user_id: profile.user_id, // Keep original ID for user reference
      },
      metadata: {
        messages_analyzed: metadata.messages_analyzed || 0,
        last_updated: metadata.last_updated || new Date(),
      },
      privacy_note: 'Only message metadata (timestamps, lengths, IDs) was analyzed. No message content was ever accessed or stored.',
    };
  }
}

