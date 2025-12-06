/**
 * Fixed demo profiles for the two demo phone numbers
 * These profiles are always used when inviting to events
 */

export interface DemoProfile {
  userId: string;
  name: string;
  phoneNumber: string;
  avatar: string;
  role: string;
  company: string;
  school: string;
  bio: string;
}

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  '+14843693839': {
    userId: 'demo-guest-1',
    name: 'Sarah Kim',
    phoneNumber: '+14843693839',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    role: 'Product Manager',
    company: 'Google',
    school: 'Stanford University',
    bio: 'Product Manager at Google, passionate about building great user experiences. Love connecting with fellow tech enthusiasts!',
  },
  '+19178615579': {
    userId: 'demo-guest-2',
    name: 'Alex Thompson',
    phoneNumber: '+19178615579',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'Software Engineer',
    company: 'Meta',
    school: 'MIT',
    bio: 'Software Engineer at Meta. Always excited to meet new people and discuss the latest in tech!',
  },
};

/**
 * Get demo profile by phone number
 */
export function getDemoProfile(phoneNumber: string): DemoProfile | null {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized ? DEMO_PROFILES[normalized] || null : null;
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
