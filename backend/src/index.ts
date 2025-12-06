import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ProfileBuilder } from './services/profileBuilder.js';
import { ChemistryPredictor } from './services/chemistryPredictor.js';
import { EventService } from './services/eventService.js';
import { GraphAnalyzer } from './services/graphAnalyzer.js';
import { KafkaMessageConsumer } from './services/kafkaConsumer.js';
import { InvitationService } from './services/invitationService.js';
import { MockDataGenerator } from './utils/mockDataGenerator.js';
import { MessageMetadata } from './models/ChemistryAnalysis.js';
import { createRouter } from './api/routes.js';
import { requestLogger, errorHandler, corsOptions } from './api/middleware.js';
import { logger } from './utils/logger.js';
import { loadSeriesCredentials } from './models/SeriesConfig.js';
import { VibeAIAgent } from './services/inboundMessageHandler.js';
import { MessagePoller } from './services/messagePoller.js';

/**
 * Main application entry point
 * Series Events Backend - Group Chemistry Prediction Platform
 */
async function main() {
  logger.info('🚀 Starting Series Events Backend...');
  logger.info('✓ Privacy Guard Active - NO message content will be stored');

  // Load Series credentials
  const seriesCredentials = loadSeriesCredentials();
  const useSeriesAPI = process.env.USE_SERIES_API === 'true' && seriesCredentials !== null;

  if (seriesCredentials) {
    if (seriesCredentials.kafka) {
      logger.info('✓ Series Kafka credentials loaded');
      logger.info(`  Topic: ${seriesCredentials.kafka.topic}`);
      logger.info(`  Brokers: ${seriesCredentials.kafka.brokers.length}`);
      logger.info(`  Auth: ${seriesCredentials.kafka.saslUsername ? 'SASL_SSL' : 'None'}`);
    }
    if (seriesCredentials.apiKey && seriesCredentials.senderPhone) {
      logger.info('✓ Series iMessage API credentials loaded');
      logger.info(`  Sender: ${seriesCredentials.senderPhone}`);
    }
    if (!seriesCredentials.kafka && (!seriesCredentials.apiKey || !seriesCredentials.senderPhone)) {
      logger.info('ℹ️  Partial Series credentials loaded - some features may be unavailable');
    }
  } else {
    logger.info('ℹ️  Series API credentials not provided - using mock mode');
    logger.info('   Set USE_SERIES_API=true and provide credentials to enable');
  }

  // Initialize services
  const graphAnalyzer = new GraphAnalyzer();
  const profileBuilder = new ProfileBuilder(graphAnalyzer);
  const chemistryPredictor = new ChemistryPredictor();
  const eventService = new EventService();
  const invitationService = new InvitationService(seriesCredentials);

  // Initialize Kafka consumer (use Series credentials or environment variables)
  let kafkaConsumer: KafkaMessageConsumer | null = null;

  if (useSeriesAPI && seriesCredentials?.kafka) {
    // Use Series credentials
    try {
      logger.info('Connecting to Series Kafka cluster...');
      kafkaConsumer = KafkaMessageConsumer.fromCredentials(seriesCredentials);
      if (kafkaConsumer) {
        await kafkaConsumer.start();
        logger.info('✓ Kafka consumer connected (Series credentials)');
      }
    } catch (error) {
      logger.warn('Failed to connect to Kafka with Series credentials, using mock data', { error });
    }
    
    // If Kafka is connected, set up batch processing to build profiles
    if (kafkaConsumer) {
      // Set callback to process messages and build profiles
      kafkaConsumer.setBatchCallback(async (messages) => {
        if (messages.length === 0) return;

        logger.info(`Processing ${messages.length} Kafka messages for profile building`);
        
        // Build graph from messages
        graphAnalyzer.buildGraphFromMessages(messages);

        // Group messages by user
        const userMessages = new Map<string, MessageMetadata[]>();
        for (const msg of messages) {
          if (!userMessages.has(msg.sender_id)) {
            userMessages.set(msg.sender_id, []);
          }
          userMessages.get(msg.sender_id)!.push(msg);
        }

        // Build/update profiles for users
        for (const [userId, userMsgList] of userMessages) {
          try {
            await profileBuilder.buildProfile(userId, userMsgList);
          } catch (error) {
            logger.error(`Error building profile for ${userId}`, { error });
          }
        }

        logger.info(`Updated ${userMessages.size} user profiles from Kafka messages`);
      });
      
      logger.info('✓ Kafka batch processing configured for profile building');
    }
  } else {
    // SECURITY: NO FALLBACK - Only use Series Kafka credentials
    // This prevents accidentally connecting to generic/wrong Kafka topics
    logger.warn('⚠️  Series Kafka credentials not found!');
    logger.warn('    ONLY Series credentials (SERIES_KAFKA_*) are accepted');
    logger.warn('    No fallback to generic KAFKA_* environment variables');
    
    // Generate mock data for demo
    const mockMessages = MockDataGenerator.generateMockMessages(10, 30, 5);
    logger.info(`Generated ${mockMessages.length} mock messages`);

    // Build graph
    graphAnalyzer.buildGraphFromMessages(mockMessages);

    // Build profiles for all users
    const userIds = new Set(mockMessages.map(m => m.sender_id));
    logger.info(`Building profiles for ${userIds.size} users...`);

    for (const userId of userIds) {
      const userMessages = mockMessages.filter(m => m.sender_id === userId);
      await profileBuilder.buildProfile(userId, userMessages);
    }

      logger.info(`✓ ${userIds.size} profiles built from mock data`);
  }

  // Set up Express app
  const app = express();
  const port = process.env.PORT || 3001;

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(requestLogger);

  // Initialize Vibe AI Agent for conversational event management
  const vibeAIAgent = new VibeAIAgent(
    eventService,
    invitationService,
    chemistryPredictor,
    profileBuilder,
    seriesCredentials
  );

  // Initialize Message Poller (alternative to webhooks - polls Series API for messages)
  const messagePoller = new MessagePoller(seriesCredentials, vibeAIAgent);
  
  // Start polling for messages if enabled (no webhook needed!)
  if (messagePoller.isEnabled()) {
    await messagePoller.start();
    logger.info('✓ Message poller started - checking for new messages every 5 seconds');
    logger.info('  No webhook configuration needed!');
  } else {
    logger.info('ℹ️  Message poller not enabled (missing Series API credentials)');
  }

  // API Routes
  const apiRouter = createRouter(
    profileBuilder,
    chemistryPredictor,
    eventService,
    graphAnalyzer,
    invitationService,
    vibeAIAgent
  );
  app.use('/api', apiRouter);

  // Error handling
  app.use(errorHandler);

  // Start server
  app.listen(port, () => {
    logger.info(`✅ Server running on port ${port}`);
    logger.info(`📡 API available at http://localhost:${port}/api`);
    logger.info(`❤️  Health check: http://localhost:${port}/api/health`);
    logger.info('');
    logger.info('Available endpoints:');
    logger.info('  GET  /api/profile/:userId');
    logger.info('  POST /api/chemistry/predict');
    logger.info('  POST /api/chemistry/predict-frontend');
    logger.info('  POST /api/chemistry/optimize');
    logger.info('  POST /api/chemistry/optimize-frontend');
    logger.info('  POST /api/events');
    logger.info('  POST /api/events-frontend');
    logger.info('  GET  /api/events/:eventId');
    logger.info('  GET  /api/events-frontend/:eventId');
    logger.info('  PUT  /api/events-frontend/:eventId');
    logger.info('  DELETE /api/events-frontend/:eventId');
    logger.info('  GET  /api/events/user/:userId');
    logger.info('  GET  /api/events-frontend/user/:userId');
    logger.info('  POST /api/events/:eventId/invite');
    logger.info('  POST /api/events-frontend/:eventId/invite');
    logger.info('  POST /api/events-frontend/:eventId/group-chat');
    logger.info('  POST /api/events-frontend/:eventId/reminders');
    logger.info('  GET  /api/privacy/export/:userId');
    logger.info('  DELETE /api/privacy/delete/:userId');
    logger.info('');
    logger.info('🔒 Privacy: NO message content is ever stored - only metadata');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    if (kafkaConsumer) {
      await kafkaConsumer.stop();
    }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    if (kafkaConsumer) {
      await kafkaConsumer.stop();
    }
    process.exit(0);
  });
}

// Start the application
main().catch(error => {
  logger.error('Fatal error starting application', { error });
  process.exit(1);
});

