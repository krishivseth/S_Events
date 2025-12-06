import express from 'express';
import cors from 'cors';
import { ProfileBuilder } from './services/profileBuilder.js';
import { ChemistryPredictor } from './services/chemistryPredictor.js';
import { EventService } from './services/eventService.js';
import { GraphAnalyzer } from './services/graphAnalyzer.js';
import { KafkaMessageConsumer } from './services/kafkaConsumer.js';
import { MockDataGenerator } from './utils/mockDataGenerator.js';
import { createRouter } from './api/routes.js';
import { requestLogger, errorHandler, corsOptions } from './api/middleware.js';
import { logger } from './utils/logger.js';

/**
 * Main application entry point
 * Series Events Backend - Group Chemistry Prediction Platform
 */
async function main() {
  logger.info('🚀 Starting Series Events Backend...');
  logger.info('✓ Privacy Guard Active - NO message content will be stored');

  // Initialize services
  const graphAnalyzer = new GraphAnalyzer();
  const profileBuilder = new ProfileBuilder(graphAnalyzer);
  const chemistryPredictor = new ChemistryPredictor();
  const eventService = new EventService();

  // Initialize Kafka consumer (optional - will use mock data if not configured)
  let kafkaConsumer: KafkaMessageConsumer | null = null;
  const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || [];
  const kafkaTopic = process.env.KAFKA_TOPIC || 'series-messages';
  const kafkaGroupId = process.env.KAFKA_GROUP_ID || 'series-events-group';

  if (kafkaBrokers.length > 0 && process.env.USE_KAFKA === 'true') {
    try {
      logger.info('Connecting to Kafka cluster...');
      kafkaConsumer = new KafkaMessageConsumer(kafkaBrokers, kafkaTopic, kafkaGroupId);
      await kafkaConsumer.start();
      logger.info('✓ Kafka consumer connected');
    } catch (error) {
      logger.warn('Failed to connect to Kafka, using mock data', { error });
    }
  } else {
    logger.info('Using mock data generator (KAFKA_BROKERS not set or USE_KAFKA=false)');
    
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

  // API Routes
  const apiRouter = createRouter(
    profileBuilder,
    chemistryPredictor,
    eventService,
    graphAnalyzer
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
    logger.info('  POST /api/chemistry/optimize');
    logger.info('  POST /api/events');
    logger.info('  GET  /api/events/:eventId');
    logger.info('  POST /api/events/:eventId/invite');
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

