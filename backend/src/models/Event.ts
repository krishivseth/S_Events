export interface GuestInvite {
  user_id: string;
  phone_number?: string;
  rsvp_status?: 'pending' | 'accepted' | 'declined';
  chemistry_score?: number;
  name?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  host_id: string;
  guest_ids: string[];
  guest_invites?: GuestInvite[]; // Detailed guest info with phone numbers
  created_at: Date;
  updated_at: Date;
}

export interface EventCreateRequest {
  title: string;
  description: string;
  date: string; // ISO date string
  hostId: string;
  guestIds: string[];
  guestInvites?: GuestInvite[]; // Optional phone numbers when creating
}

export interface InviteRequest {
  userId?: string;
  phoneNumber: string;
  name?: string;
}

