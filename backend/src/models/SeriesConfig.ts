/**
 * Series API Configuration Models
 * Credentials and configuration for Series iMessage API and Kafka
 */

export interface SeriesCredentials {
  // iMessage API credentials
  apiKey: string;
  senderPhone: string; // E.164 format phone number
  apiBaseUrl?: string; // Defaults to hackathon service URL

  // Kafka credentials
  kafka?: {
    brokers: string[]; // Array of broker URLs
    topic: string;
    groupId: string;
    clientId: string;
    // Confluent Cloud SASL authentication
    apiKey?: string;
    apiSecret?: string;
    securityProtocol?: 'SASL_SSL' | 'PLAINTEXT';
    saslMechanism?: 'PLAIN';
  };
}

/**
 * Load Series credentials from environment variables
 * Returns null if no credentials available, otherwise returns partial credentials
 */
export function loadSeriesCredentials(): SeriesCredentials | null {
  const apiKey = process.env.SERIES_API_KEY || '';
  const senderPhone = process.env.SERIES_SENDER_PHONE || '';
  const apiBaseUrl = process.env.SERIES_API_BASE_URL || 
    'https://series-hackathon-service-202642729529.us-east1.run.app';

  // Check if we have at least some credentials (Kafka or iMessage API)
  const hasKafka = process.env.SERIES_KAFKA_BROKERS && 
                   process.env.SERIES_KAFKA_TOPIC && 
                   process.env.SERIES_KAFKA_GROUP_ID && 
                   process.env.SERIES_KAFKA_CLIENT_ID;
  
  const hasIMessage = apiKey && senderPhone;

  // Allow partial credentials (Kafka-only or iMessage-only)
  if (!hasKafka && !hasIMessage) {
    return null;
  }

  // Create credentials even if iMessage API not configured (for Kafka-only use)
  const credentials: SeriesCredentials = {
    apiKey: apiKey || '', // Allow empty if not configured
    senderPhone: senderPhone || '', // Allow empty if not configured
    apiBaseUrl,
  };

  // Load Kafka config if available
  const kafkaBrokers = process.env.SERIES_KAFKA_BROKERS?.split(',');
  const kafkaTopic = process.env.SERIES_KAFKA_TOPIC;
  const kafkaGroupId = process.env.SERIES_KAFKA_GROUP_ID;
  const kafkaClientId = process.env.SERIES_KAFKA_CLIENT_ID;
  const kafkaApiKey = process.env.SERIES_KAFKA_API_KEY;
  const kafkaApiSecret = process.env.SERIES_KAFKA_API_SECRET;

  if (kafkaBrokers && kafkaTopic && kafkaGroupId && kafkaClientId) {
    credentials.kafka = {
      brokers: kafkaBrokers.filter(Boolean).map(b => b.trim()),
      topic: kafkaTopic,
      groupId: kafkaGroupId,
      clientId: kafkaClientId,
      // Confluent Cloud SASL authentication
      apiKey: kafkaApiKey,
      apiSecret: kafkaApiSecret,
      securityProtocol: kafkaApiKey && kafkaApiSecret ? 'SASL_SSL' : 'PLAINTEXT',
      saslMechanism: kafkaApiKey && kafkaApiSecret ? 'PLAIN' : undefined,
    };
  }

  return credentials;
}

/**
 * Validate phone number format (E.164)
 */
export function validatePhoneNumber(phone: string): boolean {
  // E.164 format: + followed by country code and number (max 15 digits)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present
    const digits = cleaned.replace(/^1/, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
  }

  // If already in E.164 format, return as is
  if (validatePhoneNumber(cleaned)) {
    return cleaned;
  }

  return null;
}

