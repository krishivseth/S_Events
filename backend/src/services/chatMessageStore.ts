/**
 * In-memory chat message store for web chat
 * Stores messages between users and the bot
 */

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metadata?: {
    eventId?: string;
    type?: 'invitation' | 'reminder' | 'cancellation' | 'rsvp_confirmation';
  };
}

class ChatMessageStore {
  private messages: Map<string, ChatMessage[]> = new Map();

  /**
   * Add a message to a user's chat history
   */
  addMessage(userId: string, message: Omit<ChatMessage, 'id'>): ChatMessage {
    const fullMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const userMessages = this.messages.get(userId) || [];
    userMessages.push(fullMessage);
    this.messages.set(userId, userMessages);

    return fullMessage;
  }

  /**
   * Get all messages for a user
   */
  getMessages(userId: string, limit?: number): ChatMessage[] {
    const userMessages = this.messages.get(userId) || [];
    if (limit) {
      return userMessages.slice(-limit);
    }
    return userMessages;
  }

  /**
   * Add a system message (from bot)
   */
  addSystemMessage(userId: string, text: string, metadata?: ChatMessage['metadata']): ChatMessage {
    return this.addMessage(userId, {
      userId,
      text,
      sender: 'bot',
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Clear messages for a user (for testing)
   */
  clearMessages(userId: string): void {
    this.messages.delete(userId);
  }

  /**
   * Get all users with messages
   */
  getAllUserIds(): string[] {
    return Array.from(this.messages.keys());
  }
}

// Singleton instance
export const chatMessageStore = new ChatMessageStore();

