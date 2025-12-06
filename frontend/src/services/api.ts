/**
 * API Service Layer
 * Handles all backend API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error or invalid response');
  }
}

/**
 * Chemistry API
 */
export const chemistryApi = {
  /**
   * Predict chemistry for a group of profiles
   */
  async predict(profiles: any[]): Promise<any> {
    return fetchApi<any>('/chemistry/predict-frontend', {
      method: 'POST',
      body: JSON.stringify({ profiles }),
    });
  },

  /**
   * Optimize guest list
   */
  async optimize(profiles: any[]): Promise<any> {
    return fetchApi<any>('/chemistry/optimize-frontend', {
      method: 'POST',
      body: JSON.stringify({ profiles }),
    });
  },

  /**
   * Get individual chemistry score
   */
  async getIndividual(profile: any): Promise<{ userId: string; chemistry: number }> {
    return fetchApi<{ userId: string; chemistry: number }>('/chemistry/individual', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    });
  },
};

/**
 * Events API
 */
export const eventsApi = {
  /**
   * Create a new event
   */
  async create(eventData: any): Promise<any> {
    return fetchApi<any>('/events-frontend', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  /**
   * Get event by ID
   */
  async getById(eventId: string): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}`);
  },

  /**
   * Get all events for a user
   */
  async getByUser(userId: string): Promise<any[]> {
    return fetchApi<any[]>(`/events-frontend/user/${userId}`);
  },

  /**
   * Send invitations for an event
   */
  async sendInvites(eventId: string, invites: Array<{ userId?: string; phoneNumber?: string; name?: string }>): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ invites }),
    });
  },

  /**
   * Update an event
   */
  async update(eventId: string, eventData: any): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  /**
   * Send reminders for an event
   */
  async sendReminders(eventId: string): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}/reminders`, {
      method: 'POST',
    });
  },

  /**
   * Cancel/delete an event
   */
  async delete(eventId: string): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update RSVP status for current user
   */
  async updateRSVP(eventId: string, userId: string, status: 'accepted' | 'declined' | 'maybe'): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}/rsvp`, {
      method: 'PUT',
      body: JSON.stringify({ userId, status }),
    });
  },

  /**
   * Create/Open group chat for event guests
   */
  async createGroupChat(eventId: string): Promise<any> {
    return fetchApi<any>(`/events-frontend/${eventId}/group-chat`, {
      method: 'POST',
    });
  },
};

/**
 * Profiles API
 */
export const profilesApi = {
  /**
   * Get all available profiles
   */
  async getAll(): Promise<any[]> {
    return fetchApi<any[]>('/profiles');
  },

  /**
   * Get profile by userId
   */
  async getById(userId: string): Promise<any> {
    return fetchApi<any>(`/profile/${userId}`);
  },
};

/**
 * Health check
 */
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return fetchApi<{ status: string; timestamp: string }>('/health');
  },
};

/**
 * Export all APIs
 */
export default {
  chemistry: chemistryApi,
  events: eventsApi,
  profiles: profilesApi,
  health: healthApi,
};

