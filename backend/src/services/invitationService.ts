import axios, { AxiosInstance, AxiosError } from 'axios';
import { SeriesCredentials, validatePhoneNumber, normalizePhoneNumber } from '../models/SeriesConfig.js';
import { Event } from '../models/Event.js';
import { GuestInvite } from '../models/Event.js';
import { logger } from '../utils/logger.js';

/**
 * Series iMessage API Client
 * Handles sending event invitations via Series iMessage Service
 */
export class InvitationService {
  private api: AxiosInstance;
  private credentials: SeriesCredentials;
  private enabled: boolean;

  constructor(credentials: SeriesCredentials | null) {
    // Enable if we have both API key and sender phone
    this.enabled = credentials !== null && 
                   credentials.apiKey !== '' && 
                   credentials.senderPhone !== '';
    
    if (!this.enabled) {
      logger.info('InvitationService: Series iMessage API credentials not provided - using mock mode');
      this.credentials = {
        apiKey: credentials?.apiKey || '',
        senderPhone: credentials?.senderPhone || '',
        apiBaseUrl: credentials?.apiBaseUrl || 'https://series-hackathon-service-202642729529.us-east1.run.app',
      };
      this.api = axios.create({
        baseURL: this.credentials.apiBaseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return;
    }

    this.credentials = credentials;
    this.api = axios.create({
      baseURL: this.credentials.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.apiKey}`,
      },
      timeout: 30000, // 30 second timeout
    });

    logger.info('InvitationService: Initialized with Series API');
  }

  /**
   * Check if service is enabled (has credentials)
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Find existing chat or create a new one
   */
  async getOrCreateChat(phoneNumber: string): Promise<{ id: number } | null> {
    if (!this.enabled) {
      logger.debug('InvitationService: Mock mode - skipping getOrCreateChat');
      return { id: 999999 }; // Mock chat ID
    }

    // Normalize phone number
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      logger.error(`Invalid phone number format: ${phoneNumber}`);
      return null;
    }

    try {
      // Try to find existing chat
      const searchResponse = await this.api.get('/api/chats', {
        params: {
          phone_number: normalized,
        },
      });

      if (searchResponse.data?.data && searchResponse.data.data.length > 0) {
        logger.info(`Found existing chat ${searchResponse.data.data[0].id} for ${normalized}`);
        return { id: searchResponse.data.data[0].id };
      }

      // Create new chat
      logger.info(`Creating new chat for ${normalized}`);
      const createResponse = await this.api.post('/api/chats', {
        chat: {
          phone_numbers: [normalized],
        },
        message: {
          text: 'Hello! You have an event invitation.',
        },
        send_from: this.credentials.senderPhone,
      });

      if (createResponse.data?.data?.id) {
        logger.info(`Created chat ${createResponse.data.data.id}`);
        return { id: createResponse.data.data.id };
      }

      logger.error('Unexpected response format from create chat', createResponse.data);
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Error getting/creating chat', {
        phone: normalized,
        status: axiosError.response?.status,
        message: axiosError.message,
      });
      return null;
    }
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(chatId: number, text: string): Promise<boolean> {
    if (!this.enabled) {
      logger.info(`Mock: Would send message to chat ${chatId}: ${text.substring(0, 50)}...`);
      return true;
    }

    try {
      const response = await this.api.post(`/api/chats/${chatId}/chat_messages`, {
        message: {
          text,
        },
      });

      if (response.status === 200 || response.status === 201) {
        logger.info(`Message sent successfully to chat ${chatId}`);
        return true;
      }

      logger.warn(`Unexpected status code: ${response.status}`);
      return false;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Error sending message', {
        chatId,
        status: axiosError.response?.status,
        message: axiosError.message,
        data: axiosError.response?.data,
      });

      // Retry logic for transient failures
      if (axiosError.response?.status === 429 || axiosError.response?.status >= 500) {
        logger.info(`Retrying message send to chat ${chatId}...`);
        await this.delay(1000);
        return this.sendMessage(chatId, text);
      }

      return false;
    }
  }

  /**
   * Generate personalized invitation message
   */
  generateInviteMessage(event: Event, guest: GuestInvite): string {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const chemistryScore = guest.chemistry_score || 85;
    const name = guest.name || 'there';
    const hostName = event.title.split(' - ')[0] || 'We';

    let message = `Hey ${name}! 🎉\n\n`;
    message += `${hostName} is hosting "${event.title}" on ${eventDate}.\n\n`;

    if (event.description) {
      message += `${event.description}\n\n`;
    }

    message += `Your vibe score with this group: ${chemistryScore}% ✨\n\n`;
    
    if (chemistryScore >= 80) {
      message += `You'd mesh really well with the other attendees!\n\n`;
    } else if (chemistryScore >= 70) {
      message += `This could be a great opportunity to connect!\n\n`;
    }

    message += `Interested? Reply YES to RSVP!`;

    return message;
  }

  /**
   * Send event invitation to a single guest
   */
  async sendEventInvitation(
    event: Event,
    guest: GuestInvite
  ): Promise<{ success: boolean; error?: string; chatId?: number }> {
    if (!guest.phone_number) {
      return {
        success: false,
        error: 'Phone number required for guest',
      };
    }

    // Validate phone number
    const normalized = normalizePhoneNumber(guest.phone_number);
    if (!normalized) {
      return {
        success: false,
        error: `Invalid phone number format: ${guest.phone_number}`,
      };
    }

    // Get or create chat
    const chat = await this.getOrCreateChat(normalized);
    if (!chat) {
      return {
        success: false,
        error: 'Failed to get or create chat',
      };
    }

    // Generate message
    const message = this.generateInviteMessage(event, guest);

    // Send message
    const sent = await this.sendMessage(chat.id, message);
    if (!sent) {
      return {
        success: false,
        error: 'Failed to send message',
        chatId: chat.id,
      };
    }

    return {
      success: true,
      chatId: chat.id,
    };
  }

  /**
   * Send invitations to multiple guests
   */
  async sendBulkInvitations(
    event: Event,
    guests: GuestInvite[]
  ): Promise<Array<{ guest: GuestInvite; success: boolean; error?: string; chatId?: number }>> {
    const results = [];

    for (const guest of guests) {
      logger.info(`Sending invitation to ${guest.name || guest.user_id} at ${guest.phone_number}`);
      const result = await this.sendEventInvitation(event, guest);
      results.push({
        guest,
        ...result,
      });

      // Small delay between sends to avoid rate limiting
      await this.delay(500);
    }

    return results;
  }

  /**
   * Check if a phone number supports iMessage
   */
  async checkIMessageAvailability(phoneNumber: string): Promise<boolean> {
    if (!this.enabled) {
      return true; // Assume available in mock mode
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      return false;
    }

    try {
      // Remove + from phone number for API
      const phoneWithoutPlus = normalized.replace('+', '');
      const response = await this.api.post('/api/i_message_available/check', {
        phone_number: phoneWithoutPlus,
      });

      return response.status === 200 && response.data?.data?.available === true;
    } catch (error) {
      logger.warn(`Failed to check iMessage availability for ${normalized}`, error);
      return true; // Assume available if check fails
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

