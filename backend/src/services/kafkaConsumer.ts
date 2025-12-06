import { Kafka, Consumer, EachMessagePayload, KafkaConfig } from 'kafkajs';
import { MessageMetadata } from '../models/ChemistryAnalysis.js';
import { PrivacyGuard } from '../utils/privacy.js';
import { logger } from '../utils/logger.js';
import { SeriesCredentials } from '../models/SeriesConfig.js';
import fs from 'fs';
import path from 'path';

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
  private clientId: string;
  private batchInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private logFile: string;

  constructor(
    brokers: string[],
    topic: string,
    groupId: string,
    clientId?: string,
    authConfig?: {
      saslUsername?: string;
      saslPassword?: string;
      securityProtocol?: 'SASL_SSL' | 'PLAINTEXT';
    }
  ) {
    this.brokers = brokers;
    this.topic = topic;
    this.groupId = groupId;
    this.clientId = clientId || 'series-events-consumer';
    this.logFile = path.join(process.cwd(), 'kafka-messages.log');

    // Build Kafka config with optional SASL authentication
    const kafkaConfig: KafkaConfig = {
      clientId: this.clientId,
      brokers: brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };

    // Add SASL_SSL authentication if credentials provided (Confluent Cloud)
    if (authConfig?.saslUsername && authConfig?.saslPassword) {
      kafkaConfig.ssl = true;
      kafkaConfig.sasl = {
        mechanism: 'plain',
        username: authConfig.saslUsername,
        password: authConfig.saslPassword,
      };
      logger.info('Kafka configured with SASL_SSL authentication (Confluent Cloud)');
    }

    this.kafka = new Kafka(kafkaConfig);

    logger.info(`Kafka consumer initialized: topic=${topic}, group=${groupId}, clientId=${this.clientId}`);
  }

  /**
   * Create from Series credentials (includes SASL auth if provided)
   */
  static fromCredentials(credentials: SeriesCredentials): KafkaMessageConsumer | null {
    if (!credentials.kafka) {
      return null;
    }

    return new KafkaMessageConsumer(
      credentials.kafka.brokers,
      credentials.kafka.topic,
      credentials.kafka.groupId,
      credentials.kafka.clientId,
      {
        saslUsername: credentials.kafka.saslUsername,
        saslPassword: credentials.kafka.saslPassword,
        securityProtocol: credentials.kafka.securityProtocol,
      }
    );
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

      const rawMessageString = message.value.toString();

      // Log raw message to file for schema inspection
      try {
        fs.appendFileSync(this.logFile, `${new Date().toISOString()}\n${rawMessageString}\n\n`);
      } catch (logError) {
        // Non-critical - continue processing even if log write fails
        logger.debug('Failed to write to log file', { error: logError });
      }

      // Parse message (assuming JSON)
      let rawMessage: any;
      try {
        rawMessage = JSON.parse(rawMessageString);
      } catch (parseError) {
        logger.warn('Failed to parse message as JSON', { error: parseError });
        return;
      }

      // Flexible parsing - handle schema variations
      const parsedMetadata = this.parseMessageMetadata(rawMessage);
      if (!parsedMetadata) {
        logger.debug('Message did not match expected metadata format - skipping');
        return;
      }

      // Sanitize and validate (privacy check)
      const sanitized = PrivacyGuard.sanitizeMessageData(parsedMetadata);
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
   * Parse message metadata with flexible schema handling
   */
  private parseMessageMetadata(raw: any): any | null {
    // Expected format from docs
    if (raw.sender_id && raw.timestamp) {
      return {
        timestamp: raw.timestamp,
        sender_id: raw.sender_id,
        message_length: raw.message_length || 0,
        conversation_id: raw.conversation_id || raw.conv_id || `conv_${Date.now()}`,
        recipient_id: raw.recipient_id || raw.recipient || undefined,
        group_id: raw.group_id || undefined,
      };
    }

    // Alternative format variations
    if (raw.from_phone || raw.sent_from) {
      return {
        timestamp: raw.sent_at ? new Date(raw.sent_at).getTime() : Date.now(),
        sender_id: raw.from_phone || raw.sent_from,
        message_length: raw.text?.length || raw.message_length || 0,
        conversation_id: raw.chat_id?.toString() || raw.conversation_id || `conv_${Date.now()}`,
        recipient_id: undefined, // May need to infer from chat
        group_id: raw.group ? raw.chat_id?.toString() : undefined,
      };
    }

    // Unknown format - log for inspection
    logger.debug('Unknown message format', { keys: Object.keys(raw) });
    return null;
  }

  /**
   * Set callback for batch processing
   */
  private batchCallback?: (messages: MessageMetadata[]) => Promise<void>;

  /**
   * Set callback to be called when batch is processed
   */
  setBatchCallback(callback: (messages: MessageMetadata[]) => Promise<void>): void {
    this.batchCallback = callback;
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

    // Get messages for processing
    const messagesToProcess = [...this.messageBuffer];
    const uniqueUsers = new Set(messagesToProcess.map(m => m.sender_id));
    logger.info(`Batch contains messages from ${uniqueUsers.size} unique users`);

    // Call batch callback if set (for profile building)
    if (this.batchCallback) {
      try {
        await this.batchCallback(messagesToProcess);
      } catch (error) {
        logger.error('Error in batch callback', { error });
      }
    }

    // Clear buffer (in production, would move to persistent storage)
    // For demo, we'll keep a rolling window
    if (this.messageBuffer.length > 10000) {
      this.messageBuffer = this.messageBuffer.slice(-5000); // Keep last 5000
    } else {
      // Clear processed messages
      this.messageBuffer = [];
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

