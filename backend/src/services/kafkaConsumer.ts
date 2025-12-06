import { Kafka, Consumer, EachMessagePayload, KafkaConfig } from 'kafkajs';
import { MessageMetadata } from '../models/ChemistryAnalysis.js';
import { PrivacyGuard } from '../utils/privacy.js';
import { logger } from '../utils/logger.js';

/**
 * Kafka Consumer Service
 * Connects to Series' Kafka cluster and processes message metadata
 */
export class KafkaMessageConsumer {
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private messageBuffer: MessageMetadata[] = [];
  private brokers: string[];
  private topic: string;
  private groupId: string;
  private batchInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(brokers: string[], topic: string, groupId: string) {
    this.brokers = brokers;
    this.topic = topic;
    this.groupId = groupId;

    const kafkaConfig: KafkaConfig = {
      clientId: 'series-events-consumer',
      brokers: brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };

    this.kafka = new Kafka(kafkaConfig);

    logger.info(`Kafka consumer initialized: topic=${topic}, group=${groupId}`);
  }

  /**
   * Start consuming messages
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Consumer already running');
      return;
    }

    try {
      this.consumer = this.kafka.consumer({ groupId: this.groupId });
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });

      this.isRunning = true;
      logger.info('Kafka consumer started successfully');

      // Set up batch processing (every 5 seconds)
      this.batchInterval = setInterval(() => {
        this.processBatch();
      }, 5000);

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      });
    } catch (error) {
      logger.error('Failed to start Kafka consumer', { error });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Process a single message
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const message = payload.message;
      if (!message.value) {
        return;
      }

      // Parse message (assuming JSON)
      let rawMessage: any;
      try {
        rawMessage = JSON.parse(message.value.toString());
      } catch (parseError) {
        logger.warn('Failed to parse message as JSON', { error: parseError });
        return;
      }

      // Sanitize and validate (privacy check)
      const sanitized = PrivacyGuard.sanitizeMessageData(rawMessage);
      if (!sanitized) {
        logger.warn('Message sanitization failed - skipping');
        return;
      }

      // Validate no content was stored
      if (!PrivacyGuard.validateNoContent(sanitized)) {
        logger.error('Privacy violation detected - content found in message');
        return;
      }

      // Add to buffer
      this.messageBuffer.push(sanitized);
      logger.debug(`Message buffered: sender=${sanitized.sender_id}, conv=${sanitized.conversation_id}`);

      // Log privacy guarantee
      if (this.messageBuffer.length % 100 === 0) {
        logger.info(`✓ Privacy Guard: ${this.messageBuffer.length} messages processed - NO content stored`);
      }
    } catch (error) {
      logger.error('Error processing message', { error });
    }
  }

  /**
   * Process buffered messages in batch
   */
  private async processBatch(): Promise<void> {
    if (this.messageBuffer.length === 0) {
      return;
    }

    const batchSize = this.messageBuffer.length;
    logger.info(`Processing batch of ${batchSize} messages`);

    // Emit event or trigger profile updates
    // This will be handled by the main service that coordinates everything
    // For now, just log
    const uniqueUsers = new Set(this.messageBuffer.map(m => m.sender_id));
    logger.info(`Batch contains messages from ${uniqueUsers.size} unique users`);

    // Clear buffer (in production, would move to persistent storage)
    // For demo, we'll keep a rolling window
    if (this.messageBuffer.length > 10000) {
      this.messageBuffer = this.messageBuffer.slice(-5000); // Keep last 5000
    }
  }

  /**
   * Stop consuming messages
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }

    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }

    logger.info('Kafka consumer stopped');
  }

  /**
   * Get recent messages for a user
   */
  getRecentMessages(userId: string, hours: number = 24): MessageMetadata[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return this.messageBuffer.filter(
      msg => msg.sender_id === userId && msg.timestamp >= cutoffTime
    );
  }

  /**
   * Get all buffered messages (for profile building)
   */
  getAllMessages(): MessageMetadata[] {
    return [...this.messageBuffer];
  }

  /**
   * Clear message buffer (for privacy/deletion)
   */
  clearBuffer(): void {
    this.messageBuffer = [];
    logger.info('Message buffer cleared');
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return this.isRunning && this.consumer !== null;
  }
}

