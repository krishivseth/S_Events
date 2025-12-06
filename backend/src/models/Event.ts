export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  host_id: string;
  guest_ids: string[];
  created_at: Date;
  updated_at: Date;
}

export interface EventCreateRequest {
  title: string;
  description: string;
  date: string; // ISO date string
  hostId: string;
  guestIds: string[];
}

