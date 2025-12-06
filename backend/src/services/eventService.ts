import { Event, EventCreateRequest } from '../models/Event.js';
import { logger } from '../utils/logger.js';

/**
 * Simple event service for managing events
 * In production, this would use a database
 */
export class EventService {
  private events: Map<string, Event> = new Map();
  private eventCounter: number = 0;

  /**
   * Create a new event
   */
  async createEvent(request: EventCreateRequest): Promise<Event> {
    const eventId = `event_${++this.eventCounter}_${Date.now()}`;
    const now = new Date();

    const event: Event = {
      id: eventId,
      title: request.title,
      description: request.description,
      date: new Date(request.date),
      host_id: request.hostId,
      guest_ids: request.guestIds,
      created_at: now,
      updated_at: now,
    };

    this.events.set(eventId, event);
    logger.info(`Event created: ${eventId} with ${request.guestIds.length} guests`);

    return event;
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): Event | null {
    return this.events.get(eventId) || null;
  }

  /**
   * Get all events
   */
  getAllEvents(): Event[] {
    return Array.from(this.events.values());
  }

  /**
   * Get events for a user (as host or guest)
   */
  getEventsForUser(userId: string): Event[] {
    return Array.from(this.events.values()).filter(
      event => event.host_id === userId || event.guest_ids.includes(userId)
    );
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    const event = this.events.get(eventId);
    if (!event) return null;

    const updated: Event = {
      ...event,
      ...updates,
      updated_at: new Date(),
    };

    this.events.set(eventId, updated);
    return updated;
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    return this.events.delete(eventId);
  }
}

