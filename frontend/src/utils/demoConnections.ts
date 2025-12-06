/**
 * Demo profile connections for social graph insights
 * This matches the backend DemoProfiles connections structure
 */

export interface Connection {
  userId: string;
  connectionType: '1st' | '2nd' | '3rd';
  context?: string; // "Met at Stanford" or "Work together"
  mutualFriends?: string[];
}

export interface DemoProfile {
  userId: string;
  name: string;
  phoneNumber: string;
  connections: Connection[];
}

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  '+14843693839': {
    userId: 'demo-guest-1',
    name: 'Sarah Kim',
    phoneNumber: '+14843693839',
    connections: [
      {
        userId: 'demo-guest-2',
        connectionType: '1st',
        context: 'Met at tech conference'
      },
      {
        userId: 'current-user',
        connectionType: '1st',
        context: 'Stanford classmates'
      }
    ]
  },
  '+19178615579': {
    userId: 'demo-guest-2',
    name: 'Alex Thompson',
    phoneNumber: '+19178615579',
    connections: [
      {
        userId: 'demo-guest-1',
        connectionType: '1st',
        context: 'Met at tech conference'
      },
      {
        userId: 'current-user',
        connectionType: '1st',
        context: 'College friends'
      }
    ]
  },
  'current-user': {
    userId: 'current-user',
    name: 'You (Host)',
    phoneNumber: '+16463230991',
    connections: [
      {
        userId: 'demo-guest-1',
        connectionType: '1st',
        context: 'Stanford classmates'
      },
      {
        userId: 'demo-guest-2',
        connectionType: '1st',
        context: 'College friends'
      }
    ]
  },
};

/**
 * Get demo profile by userId or phone number
 */
export function getDemoProfile(userIdOrPhone: string): DemoProfile | null {
  // Try by userId first
  for (const profile of Object.values(DEMO_PROFILES)) {
    if (profile.userId === userIdOrPhone) {
      return profile;
    }
  }
  
  // Try by phone number
  const normalized = normalizePhoneNumber(userIdOrPhone);
  if (normalized && DEMO_PROFILES[normalized]) {
    return DEMO_PROFILES[normalized];
  }
  
  return null;
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle various formats
  if (cleaned.startsWith('+1')) {
    return cleaned;
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    return '+' + cleaned;
  } else if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  return null;
}

/**
 * Find which guests are friends (1st degree connections) of the current user
 */
export function findKnownGuestsGoing(
  currentUserId: string,
  guests: Array<{ id: string; name: string; userId?: string }>
): Array<{ id: string; name: string; context?: string }> {
  const currentProfile = getDemoProfile(currentUserId);
  if (!currentProfile || !currentProfile.connections) {
    return [];
  }

  return guests
    .filter(guest => {
      const guestUserId = guest.userId || guest.id;
      const connection = currentProfile.connections.find(
        c => c.userId === guestUserId && c.connectionType === '1st'
      );
      return !!connection;
    })
    .map(guest => {
      const guestUserId = guest.userId || guest.id;
      const connection = currentProfile.connections.find(
        c => c.userId === guestUserId && c.connectionType === '1st'
      );
      return {
        id: guest.id,
        name: guest.name,
        context: connection?.context
      };
    });
}

