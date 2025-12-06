import axios, { AxiosInstance, AxiosError } from 'axios';
import { SeriesCredentials, validatePhoneNumber, normalizePhoneNumber } from '../models/SeriesConfig.js';
import { Event } from '../models/Event.js';
import { GuestInvite } from '../models/Event.js';
import { logger } from '../utils/logger.js';
import { getDemoProfile, DEMO_PROFILES } from '../models/DemoProfiles.js';

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
   * Check if recipient is authorized (demo numbers only)
   */
  private isAuthorizedRecipient(phoneNumber: string): boolean {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) return false;
    
    // Only allow demo profile phone numbers
    const demoNumbers = Object.keys(DEMO_PROFILES)
      .map(p => normalizePhoneNumber(p))
      .filter((p): p is string => p !== null);
    
    return demoNumbers.includes(normalized);
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
      // Try to find existing chat (API docs: GET /api/chats with phone_number query param)
      const searchResponse = await this.api.get('/api/chats', {
        params: {
          phone_number: normalized,
        },
      });

      // Response structure: { data: [...], meta: {...} } - data is array directly
      const chats = searchResponse.data?.data || searchResponse.data || [];
      const chatsArray = Array.isArray(chats) ? chats : [];
      
      // Find chat that contains this phone number
      const existingChat = chatsArray.find((chat: any) => 
        chat.chat_handles?.some((handle: any) => handle.phone_number === normalized)
      );
      
      if (existingChat) {
        logger.info(`Found existing chat ${existingChat.id} for ${normalized}`);
        return { id: existingChat.id };
      }

      // Create new chat (API docs: POST /api/chats with chat, message, send_from)
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

      // Response structure: { data: { id: ..., chat_messages: {...} } }
      if (createResponse.data?.data?.id) {
        logger.info(`Created chat ${createResponse.data.data.id}`);
        return { id: createResponse.data.data.id };
      }

      logger.error('Unexpected response format from create chat', {
        status: createResponse.status,
        data: createResponse.data,
      });
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Error getting/creating chat', {
        phone: normalized,
        status: axiosError.response?.status,
        message: axiosError.message,
        responseData: axiosError.response?.data,
        url: axiosError.config?.url,
      });
      return null;
    }
  }

  /**
   * Send a message to a chat (with recipient validation)
   */
  async sendMessage(chatId: number, text: string, recipientPhoneNumber?: string): Promise<boolean> {
    // SECURITY: If recipient phone is provided, validate it
    if (recipientPhoneNumber && !this.isAuthorizedRecipient(recipientPhoneNumber)) {
      logger.warn('InvitationService: Blocked message to unauthorized recipient', {
        chatId,
        recipientPhoneNumber,
      });
      return false;
    }
    if (!this.enabled) {
      logger.info(`Mock: Would send message to chat ${chatId}: ${text.substring(0, 50)}...`);
      return true;
    }

    try {
      // API docs: POST /api/chats/{chat_id}/chat_messages
      // Request body: { message: { text: "...", attachments?: [...] } }
      const response = await this.api.post(`/api/chats/${chatId}/chat_messages`, {
        message: {
          text,
        },
      });

      // Response: 200 OK or 201 Created with { data: { id, text, sent_at, ... } }
      if (response.status === 200 || response.status === 201) {
        const messageId = response.data?.data?.id;
        logger.info(`Message sent successfully to chat ${chatId}, message ID: ${messageId}`);
        return true;
      }

      logger.warn(`Unexpected status code: ${response.status}`, { data: response.data });
      return false;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Error sending message', {
        chatId,
        status: axiosError.response?.status,
        message: axiosError.message,
        data: axiosError.response?.data,
      });

      // Retry logic for transient failures (429 rate limit or 5xx server errors)
      if (axiosError.response?.status === 429 || axiosError.response?.status >= 500) {
        const retryAfter = axiosError.response?.headers?.['retry-after'] || 
                          axiosError.response?.headers?.['Retry-After'] ||
                          (axiosError.response?.status === 429 ? '10' : '2'); // 10s for rate limit, 2s for server errors
        
        const retrySeconds = parseInt(retryAfter, 10);
        const retryMs = retrySeconds * 1000;
        
        logger.warn(`Rate limited or server error (${axiosError.response?.status}) - retrying after ${retrySeconds}s`, {
          chatId,
          retryAfter: retrySeconds,
          status: axiosError.response?.status,
        });
        
        await this.delay(retryMs);
        
        // Only retry once to avoid infinite loops
        // In production, could implement exponential backoff with max retries
        try {
          return await this.sendMessage(chatId, text);
        } catch (retryError) {
          logger.error('Retry failed - giving up', {
            chatId,
            error: (retryError as any).message,
          });
          return false;
        }
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
   * Generate reminder message for an event
   */
  generateReminderMessage(event: Event): string {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    let message = `📅 Reminder: "${event.title}" is coming up!\n\n`;
    message += `Date: ${eventDate}\n\n`;

    if (event.description) {
      message += `${event.description}\n\n`;
    }

    message += `Don't forget to RSVP if you haven't already!\n`;
    message += `Looking forward to seeing you there! 🎉`;

    return message;
  }

  /**
   * Create or find a group chat with multiple phone numbers
   */
  async getOrCreateGroupChat(phoneNumbers: string[]): Promise<{ id: number } | null> {
    if (!this.enabled) {
      logger.debug('InvitationService: Mock mode - skipping getOrCreateGroupChat');
      return { id: 999999 }; // Mock chat ID
    }

    // Normalize all phone numbers
    const normalizedNumbers = phoneNumbers
      .map(phone => normalizePhoneNumber(phone))
      .filter((phone): phone is string => phone !== null);

    if (normalizedNumbers.length === 0) {
      logger.error('No valid phone numbers provided for group chat');
      return null;
    }

    try {
      // Try to find existing group chat with all these numbers
      // First, try to find a chat with the first phone number
      const searchResponse = await this.api.get('/api/chats', {
        params: {
          phone_number: normalizedNumbers[0],
        },
      });

      const chats = searchResponse.data?.data || searchResponse.data || [];
      const chatsArray = Array.isArray(chats) ? chats : [];

      // Find chat that contains all the phone numbers
      const existingGroupChat = chatsArray.find((chat: any) => {
        const chatPhones = chat.chat_handles?.map((h: any) => h.phone_number) || [];
        return normalizedNumbers.every(phone => chatPhones.includes(phone)) &&
               normalizedNumbers.length === chatPhones.length;
      });

      if (existingGroupChat) {
        logger.info(`Found existing group chat ${existingGroupChat.id} with ${normalizedNumbers.length} participants`);
        return { id: existingGroupChat.id };
      }

      // Create new group chat (API docs: POST /api/chats with chat.phone_numbers array)
      logger.info(`Creating new group chat with ${normalizedNumbers.length} participants`);
      const createResponse = await this.api.post('/api/chats', {
        chat: {
          phone_numbers: normalizedNumbers, // Multiple phone numbers = group chat
        },
        message: {
          text: 'Hello! This is a group chat for your event.',
        },
        send_from: this.credentials.senderPhone,
      });

      // Response structure: { data: { id: ..., chat_messages: {...} } }
      // Also check if response.data.id exists directly (some API variations)
      const chatId = createResponse.data?.data?.id || createResponse.data?.id;
      if (chatId) {
        logger.info(`Created group chat ${chatId}`);
        return { id: chatId };
      }

      logger.error('Unexpected response format from create group chat', {
        status: createResponse.status,
        data: createResponse.data,
        dataKeys: createResponse.data ? Object.keys(createResponse.data) : [],
      });
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Error getting/creating group chat', {
        phoneCount: normalizedNumbers.length,
        status: axiosError.response?.status,
        message: axiosError.message,
        responseData: axiosError.response?.data,
        url: axiosError.config?.url,
      });
      return null;
    }
  }

  /**
   * Send a message to a group chat
   */
  async sendGroupMessage(chatId: number, text: string): Promise<boolean> {
    // Same as sendMessage, but for clarity we have a separate method
    return this.sendMessage(chatId, text);
  }

  /**
   * Send reminder to a guest
   */
  async sendReminder(event: Event, guest: GuestInvite): Promise<{ success: boolean; error?: string }> {
    if (!guest.phone_number) {
      return {
        success: false,
        error: 'Phone number required for guest',
      };
    }

    const normalized = normalizePhoneNumber(guest.phone_number);
    if (!normalized) {
      return {
        success: false,
        error: `Invalid phone number format: ${guest.phone_number}`,
      };
    }

    const chat = await this.getOrCreateChat(normalized);
    if (!chat) {
      return {
        success: false,
        error: 'Failed to get or create chat',
      };
    }

    const message = this.generateReminderMessage(event);
    // Validate recipient before sending reminder
    if (!this.isAuthorizedRecipient(normalized)) {
      logger.warn('InvitationService: Blocked reminder to unauthorized recipient', {
        guest: guest.user_id,
        phoneNumber: normalized,
      });
      return {
        success: false,
        error: 'Recipient not authorized (must be demo profile)',
      };
    }

    const sent = await this.sendMessage(chat.id, message, normalized);

    if (!sent) {
      return {
        success: false,
        error: 'Failed to send reminder',
      };
    }

    return { success: true };
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

    // SECURITY: Only send invitations to authorized recipients (demo profiles)
    if (!this.isAuthorizedRecipient(normalized)) {
      logger.warn('InvitationService: Blocked invitation to unauthorized recipient', {
        guest: guest.user_id,
        phoneNumber: normalized,
      });
      return {
        success: false,
        error: 'Recipient not authorized (must be demo profile)',
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

    // Send message (pass recipient phone for validation)
    const sent = await this.sendMessage(chat.id, message, normalized);
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
      // API docs: POST /api/i_message_availability/check
      // Request: { phone_number: "13343284472" } (can include +)
      const response = await this.api.post('/api/i_message_availability/check', {
        phone_number: normalized, // Keep + in phone number as per examples
      });

      // Response: { data: { available: true/false } }
      return response.status === 200 && response.data?.available === true;
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

