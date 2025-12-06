import axios, { AxiosInstance } from 'axios';
import { SeriesCredentials } from '../models/SeriesConfig.js';
import { VibeAIAgent } from './inboundMessageHandler.js';
import { normalizePhoneNumber } from '../models/SeriesConfig.js';
import { logger } from '../utils/logger.js';
import { getDemoProfile, DEMO_PROFILES } from '../models/DemoProfiles.js';

/**
 * Message Poller Service
 * Polls Series API for messages sent to our sender phone number
 * This works without webhooks by periodically checking for new messages
 */
export class MessagePoller {
  private api: AxiosInstance;
  private credentials: SeriesCredentials;
  private enabled: boolean;
  private vibeAIAgent: VibeAIAgent;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastMessageId: number | null = null;
  private processedMessageIds: Set<number> = new Set(); // Track processed messages
  private isPolling: boolean = false;
  private pollIntervalMs: number = 3000; // Poll every 3 seconds (faster response)

  constructor(
    credentials: SeriesCredentials | null,
    vibeAIAgent: VibeAIAgent
  ) {
    this.vibeAIAgent = vibeAIAgent;
    
    // Enable if we have API credentials
    this.enabled = credentials !== null && 
                   credentials.apiKey !== '' && 
                   credentials.senderPhone !== '';
    
    if (!this.enabled) {
      logger.info('MessagePoller: Series API credentials not provided - polling disabled');
      this.credentials = {
        apiKey: '',
        senderPhone: '',
        apiBaseUrl: credentials?.apiBaseUrl || 'https://series-hackathon-service-202642739529.us-east1.run.app',
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
      timeout: 30000,
    });

    logger.info('MessagePoller: Initialized with Series API');
  }

  /**
   * Start polling for new messages
   */
  async start(): Promise<void> {
    if (!this.enabled) {
      logger.warn('MessagePoller: Cannot start - not enabled');
      return;
    }

    if (this.isPolling) {
      logger.warn('MessagePoller: Already polling');
      return;
    }

    this.isPolling = true;
    logger.info(`MessagePoller: Starting to poll for messages every ${this.pollIntervalMs}ms`);
    logger.info(`MessagePoller: Enabled=${this.enabled}, SenderPhone=${this.credentials.senderPhone}`);
    
    // Poll immediately, then set up interval
    logger.info('MessagePoller: Calling initial poll...');
    await this.pollForMessages();
    logger.info('MessagePoller: Initial poll complete');

    this.pollInterval = setInterval(async () => {
      await this.pollForMessages();
    }, this.pollIntervalMs);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    logger.info('MessagePoller: Stopped polling');
  }

  /**
   * Poll Series API for new messages sent to our sender phone
   */
  private async pollForMessages(): Promise<void> {
    try {
      logger.info('MessagePoller: === POLL CYCLE START ===');
      
      // Get chats for our sender phone number
      const normalizedSender = normalizePhoneNumber(this.credentials.senderPhone);
      if (!normalizedSender) {
        logger.error('MessagePoller: Invalid sender phone number');
        return;
      }

      logger.info(`MessagePoller: Polling for messages from ${normalizedSender}...`);

      // Get all chats (our sender phone should be in all chats)
      try {
        logger.info('MessagePoller: Fetching chats from API...');
        const response = await this.api.get('/api/chats');
        const chats = response.data?.data || response.data || [];
        const chatsArray = Array.isArray(chats) ? chats : [];

        logger.info(`MessagePoller: Found ${chatsArray.length} total chats`);

        // Process each chat to check for new messages
        let processedCount = 0;
        let skippedCount = 0;
        
        for (const chat of chatsArray) {
          // Skip group chats for now (focus on 1-on-1)
          if (chat.group === true) {
            skippedCount++;
            continue;
          }

          // Check if this chat has participants other than our sender
          const chatHandles = chat.chat_handles || [];
          const otherParticipants = chatHandles
            .map((h: any) => normalizePhoneNumber(h.phone_number))
            .filter((phone: string | null): phone is string => 
              phone !== null && phone !== normalizedSender
            );

          if (otherParticipants.length === 0) {
            skippedCount++;
            continue; // Skip chats with only our sender
          }

          // Log which chat we're checking
          const chatDisplay = chat.display_name || otherParticipants[0] || 'Unknown';
          logger.info(`MessagePoller: Checking chat ${chat.id}: ${chatDisplay}`);
          
          // Process this chat for new messages
          await this.processChat(chat, normalizedSender);
          processedCount++;
        }
        
        logger.info(`MessagePoller: Processed ${processedCount} chats, skipped ${skippedCount}`);

        logger.info('MessagePoller: === POLL CYCLE END ===');
        return; // Success
      } catch (error: any) {
        logger.error('MessagePoller: Error getting chats', {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        logger.info('MessagePoller: === POLL CYCLE END (with error) ===');
      }

      // Fallback: Try alternative endpoints
      await this.pollMessagesDirectly(normalizedSender);

    } catch (error: any) {
      logger.error('MessagePoller: Error polling for messages', {
        error: error.message,
        status: error.response?.status,
      });
    }
  }

  /**
   * Poll messages directly from messages endpoint
   */
  private async pollMessagesDirectly(senderPhone: string): Promise<void> {
    try {
      // Try to get recent messages
      const response = await this.api.get('/api/messages', {
        params: {
          recipient: senderPhone,
          limit: 10,
          since: this.lastMessageId || undefined,
        },
      });

      const messages = response.data?.data || response.data || [];
      const messagesArray = Array.isArray(messages) ? messages : [];

      for (const message of messagesArray) {
        // Check if this is a new message
        const messageId = message.id || message.message_id;
        if (messageId && (!this.lastMessageId || messageId > this.lastMessageId)) {
          await this.processMessage(message);
          if (messageId > (this.lastMessageId || 0)) {
            this.lastMessageId = messageId;
          }
        }
      }
    } catch (error: any) {
      // This endpoint might not exist, that's okay
      logger.debug('MessagePoller: Direct message polling not available', {
        error: error.message,
      });
    }
  }

  /**
   * Process a chat and check for new messages
   */
  private async processChat(chat: any, senderPhone: string): Promise<void> {
    try {
      const chatId = chat.id || chat.chat_id;
      if (!chatId) {
        logger.warn('MessagePoller: Chat has no ID, skipping');
        return;
      }

      logger.info(`MessagePoller: >>> Fetching messages for chat ${chatId}...`);

      // Get recent messages for this chat (get last 20 to catch any we missed)
      const messagesResponse = await this.api.get(`/api/chats/${chatId}/chat_messages`, {
        params: {
          limit: 20,
          order_by: 'created_at',
          order: 'desc',
        },
      });

      const messages = messagesResponse.data?.data || messagesResponse.data || [];
      const messagesArray = Array.isArray(messages) ? messages : [];

      logger.info(`MessagePoller: >>> Chat ${chatId} has ${messagesArray.length} messages`);

      // Process messages in reverse order (oldest first) to maintain order
      const sortedMessages = [...messagesArray].reverse();

      for (const message of sortedMessages) {
        const messageId = message.id || message.message_id || message.chat_message_id;
        
        if (!messageId) {
          logger.debug('MessagePoller: Skipping message without ID', { chatId });
          continue; // Skip messages without ID
        }

        // Skip if we already processed this message
        if (this.processedMessageIds.has(messageId)) {
          logger.debug('MessagePoller: Skipping already processed message', {
            chatId,
            messageId,
          });
          continue;
        }
        
        // Also skip if this message ID is less than lastMessageId (older than what we've seen)
        if (this.lastMessageId !== null && typeof messageId === 'number' && messageId <= this.lastMessageId) {
          logger.debug('MessagePoller: Skipping old message', {
            chatId,
            messageId,
            lastMessageId: this.lastMessageId,
          });
          // Mark as processed to avoid re-checking
          this.processedMessageIds.add(messageId);
          continue;
        }

        // Get sender phone from message (Series API uses 'sent_from')
        const messageSenderPhone = message.sent_from || 
                                 message.sender_phone || 
                                 message.from || 
                                 message.sender?.phone_number ||
                                 message.phone_number;

        // Normalize both phones for comparison
        const normalizedMessageSender = normalizePhoneNumber(messageSenderPhone);
        const normalizedSender = normalizePhoneNumber(senderPhone);
        
        // Only process messages NOT from our sender (incoming messages)
        if (normalizedMessageSender && normalizedMessageSender !== normalizedSender) {
          // SECURITY: Only process messages from authorized users (demo profiles or our Kafka topic)
          if (!this.isAuthorizedSender(normalizedMessageSender)) {
            logger.debug('MessagePoller: Ignoring message from unauthorized sender', {
              chatId,
              messageId,
              sender: normalizedMessageSender,
            });
            // Mark as processed but don't respond (silent ignore)
            this.processedMessageIds.add(messageId);
            continue;
          }
          
          const messageText = message.text || message.body || message.content || message.message_text;
          
          if (messageText && messageText.trim().length > 0) {
            logger.info('MessagePoller: Found new incoming message', {
              chatId,
              messageId,
              sender: normalizedMessageSender,
              textLength: messageText.length,
              textPreview: messageText.substring(0, 50),
              sentAt: message.sent_at || message.created_at,
            });

            // Mark as processed BEFORE async call to prevent race conditions
            this.processedMessageIds.add(messageId);
            
            // Update last message ID immediately
            if (!this.lastMessageId || messageId > this.lastMessageId) {
              this.lastMessageId = messageId;
            }

            await this.processMessage({
              ...message,
              chat_id: chatId,
              sent_from: normalizedMessageSender, // Series API format (normalized)
              sender_phone: normalizedMessageSender, // Also include for compatibility
              text: messageText,
              chat: chat,
            });
          }
        } else if (normalizedMessageSender === normalizedSender) {
          logger.debug('MessagePoller: Skipping message from sender (our own message)', {
            chatId,
            messageId,
          });
        }
      }
    } catch (error: any) {
      logger.debug('MessagePoller: Error processing chat', {
        chatId: chat.id,
        error: error.message,
        status: error.response?.status,
      });
    }
  }

  /**
   * Process a single message through the AI agent
   */
  private async processMessage(message: any): Promise<void> {
    try {
      // Extract message data (Series API format: sent_from, text, sent_at)
      const senderPhone = message.sent_from || 
                         message.sender_phone || 
                         message.from || 
                         message.phone_number ||
                         message.sender?.phone_number;
      
      const text = message.text || 
                   message.body || 
                   message.content ||
                   message.message_text;

      const chatId = message.chat_id || 
                     message.chat?.id || 
                     message.conversation_id;

      // Series API uses 'sent_at' for timestamp
      const timestamp = message.sent_at ? 
                        new Date(message.sent_at) :
                        (message.timestamp ? new Date(message.timestamp) : new Date());

      // Skip if this is a message we sent (don't process our own messages)
      const normalizedSenderPhone = normalizePhoneNumber(senderPhone);
      const normalizedCredentialsPhone = normalizePhoneNumber(this.credentials.senderPhone);
      
      if (normalizedSenderPhone && normalizedSenderPhone === normalizedCredentialsPhone) {
        logger.debug('MessagePoller: Skipping message from self', { sender: normalizedSenderPhone });
        return;
      }

      // Skip if no text or sender
      if (!senderPhone || !text) {
        return;
      }

      logger.info('MessagePoller: Processing new message', {
        messageId,
        sender: senderPhone,
        textLength: text.length,
        chatId,
        textPreview: text.substring(0, 100),
      });

      // Process through Vibe AI agent
      const response = await this.vibeAIAgent.handleInboundMessage({
        sender_phone: senderPhone,
        text: text,
        chat_id: chatId || 0,
        timestamp,
      });

      logger.info('MessagePoller: Got response from AI agent', {
        responseLength: response.length,
        responsePreview: response.substring(0, 100),
      });

      // Send response back via iMessage (only to authorized recipients)
      const normalized = normalizePhoneNumber(senderPhone);
      if (normalized) {
        // SECURITY: Only send responses to authorized users (demo profiles)
        if (!this.isAuthorizedSender(normalized)) {
          logger.warn('MessagePoller: Blocked response to unauthorized sender', {
            sender: normalized,
            responseLength: response.length,
          });
          return; // Don't send response to unauthorized users
        }
        // Use the chat from the message
        let responseChatId = chatId;
        
        if (!responseChatId) {
          logger.info('MessagePoller: Chat ID not found, attempting to find or create chat', {
            sender: normalized,
          });
          responseChatId = await this.findOrCreateChat(normalized);
        }
        
        if (responseChatId) {
          try {
            logger.info('MessagePoller: Sending response via iMessage', {
              chatId: responseChatId,
              sender: normalized,
              responseLength: response.length,
            });
            
            const sendResponse = await this.api.post(`/api/chats/${responseChatId}/chat_messages`, {
              message: {
                text: response,
              },
              send_from: this.credentials.senderPhone,
            });
            
            logger.info('MessagePoller: ✅ Sent response via iMessage', {
              chatId: responseChatId,
              sender: normalized,
              messageId: sendResponse.data?.data?.id || sendResponse.data?.id,
            });
          } catch (error: any) {
            const status = error.response?.status;
            const isRateLimit = status === 429;
            const isServerError = status >= 500;
            
            // Retry on rate limits or server errors
            if (isRateLimit || isServerError) {
              const retryAfter = error.response?.headers?.['retry-after'] || 
                                error.response?.headers?.['Retry-After'] ||
                                (isRateLimit ? '10' : '2');
              
              const retrySeconds = parseInt(retryAfter, 10);
              const retryMs = retrySeconds * 1000;
              
              logger.warn('MessagePoller: Rate limited or server error - retrying', {
                chatId: responseChatId,
                sender: normalized,
                status,
                retryAfter: retrySeconds,
              });
              
              // Retry once after delay
              await new Promise(resolve => setTimeout(resolve, retryMs));
              
              try {
                const retryResponse = await this.api.post(`/api/chats/${responseChatId}/chat_messages`, {
                  message: {
                    text: response,
                  },
                  send_from: this.credentials.senderPhone,
                });
                
                logger.info('MessagePoller: ✅ Sent response via iMessage (after retry)', {
                  chatId: responseChatId,
                  sender: normalized,
                  messageId: retryResponse.data?.data?.id || retryResponse.data?.id,
                });
              } catch (retryError: any) {
                logger.error('MessagePoller: ❌ Failed to send response (retry failed)', {
                  error: retryError.message,
                  status: retryError.response?.status,
                  chatId: responseChatId,
                  sender: normalized,
                });
              }
            } else {
              logger.error('MessagePoller: ❌ Failed to send response', {
                error: error.message,
                status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                chatId: responseChatId,
                sender: normalized,
              });
            }
          }
        } else {
          logger.error('MessagePoller: Could not find/create chat for response', {
            sender: normalized,
            originalChatId: chatId,
          });
        }
      } else {
        logger.error('MessagePoller: Could not normalize phone number for response', {
          senderPhone,
        });
      }
    } catch (error: any) {
      logger.error('MessagePoller: Error processing message', {
        error: error.message,
        message: message,
      });
    }
  }

  /**
   * Find or create a chat for a phone number
   */
  private async findOrCreateChat(phoneNumber: string): Promise<number | null> {
    try {
      // Try to find existing chat
      const searchResponse = await this.api.get('/api/chats', {
        params: {
          phone_number: phoneNumber,
        },
      });

      const chats = searchResponse.data?.data || searchResponse.data || [];
      const chatsArray = Array.isArray(chats) ? chats : [];
      
      if (chatsArray.length > 0) {
        return chatsArray[0].id || chatsArray[0].chat_id;
      }

      // Create new chat
      const createResponse = await this.api.post('/api/chats', {
        chat: {
          phone_numbers: [phoneNumber],
        },
        message: {
          text: 'Hello!',
        },
        send_from: this.credentials.senderPhone,
      });

      return createResponse.data?.data?.id || null;
    } catch (error: any) {
      logger.error('MessagePoller: Error finding/creating chat', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Check if polling is enabled (credentials available)
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
