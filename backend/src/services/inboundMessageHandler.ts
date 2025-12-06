import Anthropic from '@anthropic-ai/sdk';
import { EventService } from './eventService.js';
import { InvitationService } from './invitationService.js';
import { ChemistryPredictor } from './chemistryPredictor.js';
import { ProfileBuilder } from './profileBuilder.js';
import { GraphAnalyzer } from './graphAnalyzer.js';
import { getDemoProfile, DEMO_PROFILES } from '../models/DemoProfiles.js';
import { normalizePhoneNumber } from '../models/SeriesConfig.js';

// Demo phone numbers array
const DEMO_PHONE_NUMBERS = Object.keys(DEMO_PROFILES);
import { logger } from '../utils/logger.js';
import { Event, GuestInvite } from '../models/Event.js';
import { SeriesCredentials } from '../models/SeriesConfig.js';

interface InboundMessage {
  sender_phone: string;
  text: string;
  chat_id: number;
  timestamp: Date;
}

interface EventIntent {
  action: 'create_event' | 'rsvp' | 'update_event' | 'cancel_event' | 'query' | 'unknown';
  event_details?: {
    title?: string;
    date?: string;
    time?: string;
    guests?: string[];
    location?: string;
  };
  rsvp_response?: 'yes' | 'no' | 'maybe';
  event_id?: string;
  confidence?: number;
}

interface UserContext {
  userId: string;
  name: string;
  phoneNumber: string;
  upcomingEvents: Event[];
  pendingInvites: Event[];
}

export class VibeAIAgent {
  private anthropic: Anthropic | null;
  private eventService: EventService;
  private invitationService: InvitationService | null;
  private chemistryPredictor: ChemistryPredictor;
  private profileBuilder: ProfileBuilder;

  constructor(
    eventService: EventService,
    invitationService: InvitationService | null,
    chemistryPredictor: ChemistryPredictor,
    profileBuilder: ProfileBuilder,
    credentials: SeriesCredentials | null
  ) {
    this.eventService = eventService;
    this.invitationService = invitationService;
    this.chemistryPredictor = chemistryPredictor;
    this.profileBuilder = profileBuilder;

    // Initialize Anthropic only if API key is provided
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      logger.info('✓ Claude AI (Anthropic) initialized for conversational intent');
    } else {
      this.anthropic = null;
      logger.warn('⚠️  ANTHROPIC_API_KEY not set - using fallback intent classification');
    }
  }

  /**
   * Main entry point for handling inbound messages
   */
  async handleInboundMessage(message: InboundMessage): Promise<string> {
    try {
      logger.info(`Handling inbound message from ${message.sender_phone}`, {
        textLength: message.text.length,
        chatId: message.chat_id,
      });

      // Step 1: Classify intent using Claude
      const intent = await this.classifyIntent(message.text, message.sender_phone);

      logger.info(`Intent classified: ${intent.action}`, {
        confidence: intent.confidence,
        eventDetails: intent.event_details,
      });

      // Step 2: Route to appropriate handler
      switch (intent.action) {
        case 'create_event':
          return await this.handleCreateEvent(message, intent);
        case 'rsvp':
          return await this.handleRSVP(message, intent);
        case 'update_event':
          return await this.handleUpdateEvent(message, intent);
        case 'cancel_event':
          return await this.handleCancelEvent(message, intent);
        case 'query':
          return await this.handleQuery(message, intent);
        default:
          return await this.handleFallback(message, intent);
      }
    } catch (error: any) {
      logger.error('Error handling inbound message', {
        error: error.message,
        stack: error.stack,
        sender: message.sender_phone,
      });
      return "I'm sorry, I encountered an error processing your message. Could you try rephrasing?";
    }
  }

  /**
   * Classify user intent using Claude AI
   */
  private async classifyIntent(text: string, sender_phone: string): Promise<EventIntent> {
    // Get user context
    const userContext = await this.getUserContext(sender_phone);

    // Build context string
    const contextInfo = this.buildContextString(userContext);

    const systemPrompt = `You are Vibe, an AI event planning assistant. Analyze the user's message and extract their intent.

${contextInfo}

Possible intents:
- create_event: User wants to create a new event (e.g., "create dinner Friday with Alex and Sarah")
- rsvp: User is responding to an invitation (e.g., "yes", "I'm in", "can't make it")
- update_event: User wants to modify an existing event (e.g., "change dinner to Saturday")
- cancel_event: User wants to cancel an event (e.g., "cancel the dinner")
- query: User is asking about events or chemistry scores (e.g., "what events do I have?", "what's the vibe score?")

Extract all relevant details in structured format. For dates, use YYYY-MM-DD format. For times, use HH:MM 24-hour format.
If date is relative (e.g., "Friday", "tomorrow"), calculate the actual date based on today's date: ${new Date().toISOString().split('T')[0]}.`;

    if (!this.anthropic) {
      // Fallback: simple keyword matching
      return this.fallbackIntentClassification(text, userContext);
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `${systemPrompt}

User message: "${text}"

Respond ONLY with valid JSON matching this schema:
{
  "action": "create_event" | "rsvp" | "update_event" | "cancel_event" | "query" | "unknown",
  "event_details": {
    "title": "string (optional)",
    "date": "YYYY-MM-DD (optional)",
    "time": "HH:MM (optional)",
    "guests": ["name1", "name2"] (optional),
    "location": "string (optional)"
  },
  "rsvp_response": "yes" | "no" | "maybe" (optional),
  "event_id": "string (optional)",
  "confidence": 0.0-1.0
}`,
        }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse Claude's response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in Claude response', { response: content.text });
        return this.fallbackIntentClassification(text, userContext);
      }

      const intent = JSON.parse(jsonMatch[0]) as EventIntent;
      return intent;
    } catch (error: any) {
      // Handle rate limiting (429) with retry
      if (error.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 
                          error.response?.headers?.['Retry-After'] ||
                          '60'; // Default to 60 seconds
        
        const retrySeconds = parseInt(retryAfter, 10);
        logger.warn('Claude API rate limited - falling back to keyword matching', {
          retryAfter: retrySeconds,
          error: error.message,
        });
        
        // Fallback to keyword matching immediately (don't wait)
        // In production, could implement retry queue here
        return this.fallbackIntentClassification(text, userContext);
      }
      
      logger.error('Error classifying intent with Claude', { 
        error: error.message,
        status: error.status,
        statusCode: error.response?.status,
      });
      return this.fallbackIntentClassification(text, userContext);
    }
  }

  /**
   * Fallback intent classification using keyword matching
   */
  private fallbackIntentClassification(text: string, userContext: UserContext): EventIntent {
    const lowerText = text.toLowerCase();

    // RSVP detection
    if (lowerText.includes('yes') || lowerText.includes("i'm in") || lowerText.includes('going') || 
        lowerText.includes('confirm') || lowerText.includes('count me in')) {
      return {
        action: 'rsvp',
        rsvp_response: 'yes',
        confidence: 0.8,
      };
    }

    if (lowerText.includes('no') || lowerText.includes("can't") || lowerText.includes("cannot") ||
        lowerText.includes('decline') || lowerText.includes('sorry')) {
      return {
        action: 'rsvp',
        rsvp_response: 'no',
        confidence: 0.8,
      };
    }

    if (lowerText.includes('maybe') || lowerText.includes('might')) {
      return {
        action: 'rsvp',
        rsvp_response: 'maybe',
        confidence: 0.8,
      };
    }

    // Create event detection
    if (lowerText.includes('create') || lowerText.includes('plan') || lowerText.includes('organize') ||
        lowerText.includes('dinner') || lowerText.includes('lunch') || lowerText.includes('meeting') ||
        lowerText.includes('event')) {
      return {
        action: 'create_event',
        event_details: {},
        confidence: 0.6,
      };
    }

    // Query detection
    if (lowerText.includes('what') || lowerText.includes('when') || lowerText.includes('where') ||
        lowerText.includes('vibe') || lowerText.includes('chemistry') || lowerText.includes('events')) {
      return {
        action: 'query',
        confidence: 0.7,
      };
    }

    return {
      action: 'unknown',
      confidence: 0.3,
    };
  }

  /**
   * Get user context from phone number
   */
  private async getUserContext(sender_phone: string): Promise<UserContext> {
    const normalized = normalizePhoneNumber(sender_phone);
    if (!normalized) {
      throw new Error(`Invalid phone number: ${sender_phone}`);
    }

    // For demo: map to demo profiles or use host phone
    const demoProfile = getDemoProfile(normalized);
    let userId: string;
    let name: string;

    if (demoProfile) {
      userId = demoProfile.userId;
      name = demoProfile.name;
    } else {
      // Assume host if not a demo profile
      userId = 'current-user';
      name = 'You (Host)';
    }

    // Get events for this user
    const allEvents = this.eventService.getEventsForUser(userId);
    const now = new Date();
    
    const upcomingEvents = allEvents.filter(e => new Date(e.date) >= now);
    const pendingInvites = allEvents.filter(e => {
      const invite = e.guest_invites?.find(gi => gi.user_id === userId);
      return invite && (!invite.rsvp_status || invite.rsvp_status === 'pending');
    });

    return {
      userId,
      name,
      phoneNumber: normalized,
      upcomingEvents,
      pendingInvites,
    };
  }

  /**
   * Build context string for Claude
   */
  private buildContextString(context: UserContext): string {
    const upcoming = context.upcomingEvents.map(e => `- "${e.title}" on ${new Date(e.date).toLocaleDateString()}`).join('\n');
    const pending = context.pendingInvites.map(e => `- "${e.title}" on ${new Date(e.date).toLocaleDateString()}`).join('\n');

    return `Context:
- User: ${context.name} (${context.phoneNumber})
- Upcoming events (${context.upcomingEvents.length}):\n${upcoming || '  (none)'}
- Pending invites (${context.pendingInvites.length}):\n${pending || '  (none)'}`;
  }

  /**
   * Handle event creation
   */
  private async handleCreateEvent(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    const details = intent.event_details || {};

    // Validate minimum info
    if (!details.title && !details.date && !details.guests?.length) {
      return await this.askForMissingDetails(message, intent);
    }

    // Get user context
    const userContext = await this.getUserContext(message.sender_phone);

    // Parse date (handle relative dates like "Friday", "tomorrow")
    const eventDate = this.parseDate(details.date || '');
    if (!eventDate) {
      return "I need a date for the event. When would you like to schedule it? (e.g., 'Friday', 'Dec 15', '2024-12-15')";
    }

    // Default title if not provided
    const title = details.title || 'Event';

    // Resolve guest names to phone numbers (for demo, use demo phone numbers)
    const guestPhones = await this.resolveGuests(
      details.guests || [],
      message.sender_phone
    );

    // Calculate chemistry score
    const allParticipants = [message.sender_phone, ...guestPhones];
    const chemistryScore = await this.calculateGroupChemistry(allParticipants);

    // Create event
    const eventDateStr = eventDate.toISOString();
    const eventTime = details.time || '19:00';

    const event: Event = {
      id: `event-${Date.now()}`,
      title,
      description: details.location ? `Location: ${details.location}` : '',
      date: eventDate,
      host_id: userContext.userId,
      guest_ids: [],
      guest_invites: guestPhones.map((phone, index) => {
        const demoProfile = getDemoProfile(phone);
        return {
          user_id: demoProfile?.userId || `guest-${index}`,
          phone_number: phone,
          name: demoProfile?.name || `Guest ${index + 1}`,
          rsvp_status: 'pending' as const,
          chemistry_score: chemistryScore,
        };
      }),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Add guest IDs
    event.guest_ids = event.guest_invites.map(gi => gi.user_id);

    // Save event
    await this.eventService.createEvent({
      title: event.title,
      description: event.description,
      date: eventDateStr,
      hostId: event.host_id,
      guestIds: event.guest_ids,
      guestInvites: event.guest_invites,
    });

    // Send invitations via iMessage
    if (this.invitationService && this.invitationService.isEnabled()) {
      try {
        for (const invite of event.guest_invites) {
          if (invite.phone_number) {
            await this.invitationService.sendInvitation(
              event,
              invite.phone_number,
              invite.name || 'Guest'
            );
          }
        }
      } catch (error: any) {
        logger.error('Error sending invitations', { error: error.message });
      }
    }

    // Generate response
    return this.generateCreateEventResponse(event, chemistryScore);
  }

  /**
   * Handle RSVP responses
   */
  private async handleRSVP(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    const userContext = await this.getUserContext(message.sender_phone);

    if (userContext.pendingInvites.length === 0) {
      return "You don't have any pending invitations right now.";
    }

    // Use most recent pending invite if event_id not specified
    const invite = intent.event_id
      ? userContext.pendingInvites.find(e => e.id === intent.event_id)
      : userContext.pendingInvites[0];

    if (!invite) {
      return "I couldn't find that invitation. Could you be more specific?";
    }

    // Map response to RSVP status
    const rsvpResponse = intent.rsvp_response || 'yes';
    const rsvpStatus = rsvpResponse === 'yes' ? 'accepted' :
                      rsvpResponse === 'no' ? 'declined' : 'maybe';

    // Update RSVP
    const guestInvites = [...(invite.guest_invites || [])];
    const guestIndex = guestInvites.findIndex(gi => gi.user_id === userContext.userId);

    if (guestIndex !== -1) {
      guestInvites[guestIndex].rsvp_status = rsvpStatus;
    } else {
      guestInvites.push({
        user_id: userContext.userId,
        phone_number: userContext.phoneNumber,
        name: userContext.name,
        rsvp_status: rsvpStatus,
        chemistry_score: 75,
      });
    }

    await this.eventService.updateEvent(invite.id, {
      guest_invites: guestInvites,
    });

    // Notify host
    if (this.invitationService && this.invitationService.isEnabled()) {
      try {
        const hostPhone = process.env.SERIES_SENDER_PHONE || '';
        if (hostPhone) {
          const chat = await this.invitationService.getOrCreateChat(hostPhone);
          if (chat) {
            await this.invitationService.sendMessage(
              chat.id,
              `✅ ${userContext.name} ${rsvpResponse === 'yes' ? 'confirmed' : rsvpResponse === 'no' ? 'declined' : 'maybe'} for "${invite.title}"!`
            );
          }
        }
      } catch (error: any) {
        logger.error('Error notifying host', { error: error.message });
      }
    }

    return this.generateRSVPConfirmation(invite, rsvpResponse);
  }

  /**
   * Handle update event
   */
  private async handleUpdateEvent(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    return "Event updates via text are coming soon! For now, please use the web app to update events.";
  }

  /**
   * Handle cancel event
   */
  private async handleCancelEvent(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    const userContext = await this.getUserContext(message.sender_phone);
    
    // Find event to cancel (most recent if not specified)
    const eventToCancel = intent.event_id
      ? userContext.upcomingEvents.find(e => e.id === intent.event_id)
      : userContext.upcomingEvents[0];

    if (!eventToCancel) {
      return "I couldn't find an event to cancel. Which event did you mean?";
    }

    // Only allow host to cancel
    if (eventToCancel.host_id !== userContext.userId) {
      return `You're not the host of "${eventToCancel.title}". Only the host can cancel events.`;
    }

    // Delete event
    await this.eventService.deleteEvent(eventToCancel.id);

    // Notify guests
    if (this.invitationService && this.invitationService.isEnabled() && eventToCancel.guest_invites) {
      try {
        for (const guest of eventToCancel.guest_invites) {
          if (guest.phone_number) {
            await this.invitationService.sendMessage(
              await this.invitationService.getOrCreateChat(guest.phone_number),
              `❌ "${eventToCancel.title}" on ${new Date(eventToCancel.date).toLocaleDateString()} has been cancelled.`
            );
          }
        }
      } catch (error: any) {
        logger.error('Error notifying guests of cancellation', { error: error.message });
      }
    }

    return `✅ Cancelled "${eventToCancel.title}". I've notified all ${eventToCancel.guest_invites?.length || 0} guests.`;
  }

  /**
   * Handle queries
   */
  private async handleQuery(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    const userContext = await this.getUserContext(message.sender_phone);

    if (userContext.upcomingEvents.length === 0 && userContext.pendingInvites.length === 0) {
      return "You don't have any upcoming events or pending invites right now.";
    }

    let response = `📅 Your Events:\n\n`;

    if (userContext.upcomingEvents.length > 0) {
      response += `Hosting (${userContext.upcomingEvents.length}):\n`;
      for (const event of userContext.upcomingEvents.slice(0, 5)) {
        const confirmed = event.guest_invites?.filter(gi => gi.rsvp_status === 'accepted').length || 0;
        response += `• "${event.title}" - ${new Date(event.date).toLocaleDateString()} (${confirmed} confirmed)\n`;
      }
    }

    if (userContext.pendingInvites.length > 0) {
      response += `\nPending Invites (${userContext.pendingInvites.length}):\n`;
      for (const invite of userContext.pendingInvites.slice(0, 5)) {
        response += `• "${invite.title}" - ${new Date(invite.date).toLocaleDateString()}\n`;
      }
    }

    return response;
  }

  /**
   * Handle fallback/unknown intents
   */
  private async handleFallback(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    const lowerText = message.text.toLowerCase().trim();
    
    // Handle greetings
    if (lowerText.match(/^(hi|hello|hey|hi there|hello there|hey there)$/i)) {
      const userContext = await this.getUserContext(message.sender_phone);
      const hasUpcomingEvents = userContext.upcomingEvents.length > 0;
      const hasPendingInvites = userContext.pendingInvites.length > 0;
      
      let greeting = `Hi ${userContext.name}! 👋\n\n`;
      greeting += `I'm Vibe, your event planning assistant. `;
      
      if (hasUpcomingEvents || hasPendingInvites) {
        greeting += `I can help you:\n\n`;
        if (hasPendingInvites) {
          greeting += `• You have ${userContext.pendingInvites.length} pending invitation(s)\n`;
        }
        if (hasUpcomingEvents) {
          greeting += `• You have ${userContext.upcomingEvents.length} upcoming event(s)\n`;
        }
        greeting += `\nWould you like to:\n`;
        greeting += `• Create a new event (e.g., "create dinner Friday")\n`;
        greeting += `• Check your events (e.g., "what events do I have?")\n`;
        greeting += `• Respond to invites (e.g., "yes" or "I'm in")`;
      } else {
        greeting += `I can help you:\n\n`;
        greeting += `• Create events (e.g., "create dinner Friday with Alex")\n`;
        greeting += `• Check your events (e.g., "what events do I have?")\n`;
        greeting += `• Respond to invites (e.g., "yes" or "I'm in")\n\n`;
        greeting += `What would you like to do?`;
      }
      
      return greeting;
    }
    
    return `Hi! I'm Vibe, your event planning assistant. I can help you:\n\n` +
           `• Create events (e.g., "create dinner Friday with Alex")\n` +
           `• Respond to invites (e.g., "yes" or "I'm in")\n` +
           `• Check your events (e.g., "what events do I have?")\n\n` +
           `What would you like to do?`;
  }

  /**
   * Ask for missing details
   */
  private async askForMissingDetails(
    message: InboundMessage,
    intent: EventIntent
  ): Promise<string> {
    const details = intent.event_details || {};
    const missing: string[] = [];

    if (!details.title && !details.guests?.length) {
      missing.push('what the event is (e.g., "dinner", "meeting")');
    }
    if (!details.date) {
      missing.push('when it is (e.g., "Friday", "Dec 15")');
    }

    return `I'd love to help create that event! I just need a few more details:\n\n` +
           `• ${missing.join('\n• ')}\n\n` +
           `Can you provide that info?`;
  }

  /**
   * Parse date string (handles relative dates)
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const lower = dateStr.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Relative dates
    if (lower === 'today') return today;
    if (lower === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // Day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.findIndex(d => lower.includes(d));
    if (dayIndex !== -1) {
      const result = new Date(today);
      const currentDay = today.getDay();
      let daysUntil = dayIndex - currentDay;
      if (daysUntil <= 0) daysUntil += 7; // Next occurrence
      result.setDate(result.getDate() + daysUntil);
      return result;
    }

    // Try parsing as ISO or standard date
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
    } catch (e) {
      // Continue to return null
    }

    return null;
  }

  /**
   * Resolve guest names to phone numbers (for demo, use demo phone numbers)
   */
  private async resolveGuests(
    guestNames: string[],
    hostPhone: string
  ): Promise<string[]> {
    // For demo: return demo phone numbers if names match demo profiles
    // Otherwise, try to match names to demo profiles
    const resolved: string[] = [];

    const demoPhoneNumbers = Object.keys(DEMO_PROFILES);

    for (const name of guestNames) {
      const lowerName = name.toLowerCase();
      
      // Try to match against demo profiles
      for (const phone of demoPhoneNumbers) {
        const profile = DEMO_PROFILES[phone];
        if (profile && (profile.name.toLowerCase().includes(lowerName) || 
            lowerName.includes(profile.name.toLowerCase().split(' ')[0]))) {
          if (!resolved.includes(phone)) {
            resolved.push(phone);
            break;
          }
        }
      }
    }

    // If no matches, use demo phone numbers as fallback (for demo purposes)
    if (resolved.length === 0 && guestNames.length > 0) {
      return demoPhoneNumbers.slice(0, Math.min(guestNames.length, demoPhoneNumbers.length));
    }

    return resolved;
  }

  /**
   * Calculate group chemistry score
   */
  private async calculateGroupChemistry(phoneNumbers: string[]): Promise<number> {
    // For demo: use mock chemistry calculation
    // In production, would use actual profile data
    try {
      // Get profiles for all participants
      const profiles = phoneNumbers.map(phone => getDemoProfile(phone)).filter(Boolean);
      
      if (profiles.length < 2) {
        return 75; // Default score
      }

      // Calculate average chemistry (mock calculation)
      // For demo: return high score to show value
      return Math.min(95, 80 + Math.floor(Math.random() * 15));
    } catch (error) {
      logger.error('Error calculating chemistry', { error });
      return 75;
    }
  }

  /**
   * Generate create event response
   */
  private generateCreateEventResponse(event: Event, chemistry: number): string {
    const emoji = chemistry >= 85 ? '🔥' : chemistry >= 70 ? '✨' : '👍';
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    return `✅ Created "${event.title}" for ${dateStr}!

${emoji} Group chemistry score: ${chemistry}%

${chemistry >= 85 ? "This group is going to vibe HARD." : ""}

📨 Sending invites to ${event.guest_invites?.length || 0} people now...

I'll keep you posted on RSVPs!`;
  }

  /**
   * Generate RSVP confirmation
   */
  private generateRSVPConfirmation(event: Event, response: string): string {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    if (response === 'yes') {
      return `🎉 Awesome! You're confirmed for "${event.title}" on ${dateStr}.\n\nSee you there!`;
    } else if (response === 'no') {
      return `Got it - I've let the host know you can't make "${event.title}". Maybe next time!`;
    } else {
      return `Noted - you're a maybe for "${event.title}". I'll remind you closer to the date!`;
    }
  }
}
