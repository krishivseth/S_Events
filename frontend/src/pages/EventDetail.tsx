import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, ArrowLeft, Share2, 
  Check, X, MessageSquare, Copy, MoreHorizontal, Pencil 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { mockProfiles } from '@/data/mockEventData';

// Mock event data - in real app this would come from API
const eventData: Record<string, {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  address?: string;
  host: { name: string; avatar: string };
  isHosted: boolean;
  rsvpStatus?: 'going' | 'maybe' | 'pending';
  guests: Array<{ id: string; name: string; avatar: string; status: 'going' | 'maybe' | 'invited' }>;
  maxAttendees: number;
  coverImage?: string;
}> = {
  'event-1': {
    id: 'event-1',
    title: 'Founder Dinner - Series A Celebration',
    description: 'An intimate dinner for founders who recently closed their Series A. Share war stories, celebrate wins, and connect with fellow entrepreneurs who understand the journey.\n\nDress code: Smart casual\nFood and drinks will be provided.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: 'The Standard, High Line',
    address: '848 Washington St, New York, NY 10014',
    host: { name: 'You', avatar: mockProfiles[0].avatar },
    isHosted: true,
    guests: mockProfiles.slice(0, 8).map((p, i) => ({
      id: p.userId,
      name: p.name,
      avatar: p.avatar,
      status: i < 5 ? 'going' : i < 7 ? 'maybe' : 'invited'
    })),
    maxAttendees: 10,
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
  },
  'event-2': {
    id: 'event-2',
    title: 'Tech & Wine Meetup',
    description: 'Casual networking over wine tasting. Meet fellow tech enthusiasts in a relaxed setting. We\'ll have a sommelier guide us through 5 different wines while we chat about the latest in tech.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    location: 'Corkbuzz Wine Studio',
    address: '13 E 13th St, New York, NY 10003',
    host: { name: 'You', avatar: mockProfiles[1].avatar },
    isHosted: true,
    guests: mockProfiles.slice(3, 15).map((p, i) => ({
      id: p.userId,
      name: p.name,
      avatar: p.avatar,
      status: i < 8 ? 'going' : i < 10 ? 'maybe' : 'invited'
    })),
    maxAttendees: 25,
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
  },
  'inv-1': {
    id: 'inv-1',
    title: 'Summer Rooftop Mixer',
    description: 'Join us for an evening of networking with stunning city views. Connect with professionals from tech, finance, and creative industries.\n\nDrinks and light bites provided. Bring a friend!',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    location: 'Westlight Rooftop',
    address: '111 N 12th St, Brooklyn, NY 11249',
    host: { name: 'Sarah Chen', avatar: mockProfiles[3].avatar },
    isHosted: false,
    rsvpStatus: 'pending',
    guests: mockProfiles.slice(5, 18).map((p, i) => ({
      id: p.userId,
      name: p.name,
      avatar: p.avatar,
      status: i < 10 ? 'going' : 'maybe'
    })),
    maxAttendees: 40,
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop',
  },
  'inv-2': {
    id: 'inv-2',
    title: 'Founder Dinner',
    description: 'An intimate dinner for startup founders to share experiences, challenges, and opportunities. Limited to 15 guests to ensure meaningful conversations.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: 'Private Dining Room',
    address: 'Location shared upon RSVP',
    host: { name: 'Alex Rivera', avatar: mockProfiles[2].avatar },
    isHosted: false,
    rsvpStatus: 'going',
    guests: mockProfiles.slice(0, 12).map((p, i) => ({
      id: p.userId,
      name: p.name,
      avatar: p.avatar,
      status: 'going'
    })),
    maxAttendees: 15,
    coverImage: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&auto=format&fit=crop',
  },
  'inv-3': {
    id: 'inv-3',
    title: 'Design Community Meetup',
    description: 'Monthly gathering for designers of all disciplines. This month we\'re discussing the future of AI in design tools and how to stay relevant in a changing landscape.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    location: 'WeWork Williamsburg',
    address: '134 N 4th St, Brooklyn, NY 11249',
    host: { name: 'Maya Johnson', avatar: mockProfiles[4].avatar },
    isHosted: false,
    rsvpStatus: 'maybe',
    guests: mockProfiles.slice(2, 20).map((p, i) => ({
      id: p.userId,
      name: p.name,
      avatar: p.avatar,
      status: i < 15 ? 'going' : 'maybe'
    })),
    maxAttendees: 50,
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop',
  },
};

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = eventId ? eventData[eventId] : null;

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <Button variant="outline" onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const goingCount = event.guests.filter(g => g.status === 'going').length;
  const maybeCount = event.guests.filter(g => g.status === 'maybe').length;

  const handleRSVP = (status: 'going' | 'declined') => {
    toast({
      title: status === 'going' ? "You're going!" : "RSVP declined",
      description: status === 'going' 
        ? `See you at ${event.title}!` 
        : "We'll miss you at this one.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share it with your friends." });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-2xl flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/events')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleCopyLink}>
              <Share2 className="w-5 h-5" />
            </Button>
            {event.isHosted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/events/${eventId}/edit`)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Event
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/guest-builder?eventId=${eventId}`)}>
                    <Users className="w-4 h-4 mr-2" />
                    Manage Guests
                  </DropdownMenuItem>
                  <DropdownMenuItem>Send Reminders</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Cancel Event</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-2xl pt-14 pb-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-48 sm:h-64 overflow-hidden"
        >
          {event.coverImage ? (
            <img 
              src={event.coverImage} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/30" />
            </div>
          )}
        </motion.div>

        {/* Content */}
        <div className="px-4 -mt-8 relative">
          {/* Date Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex bg-card border border-border rounded-xl px-4 py-3 shadow-lg mb-6"
          >
            <div className="text-center">
              <div className="text-sm font-medium text-primary uppercase">
                {event.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-2xl font-bold">
                {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </motion.div>

          {/* Title & Host */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">{event.title}</h1>
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="w-10 h-10">
                <AvatarImage src={event.host.avatar} />
                <AvatarFallback>{event.host.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <p className="font-medium">{event.host.name}</p>
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4 mb-8"
          >
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{event.location}</p>
                {event.address && (
                  <p className="text-sm text-muted-foreground">{event.address}</p>
                )}
              </div>
            </div>
          </motion.div>

          <Separator className="my-6" />

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="font-semibold mb-3">About this event</h2>
            <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
          </motion.div>

          <Separator className="my-6" />

          {/* Guest List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">
                Guests
                <span className="text-muted-foreground font-normal ml-2">
                  {goingCount} going · {maybeCount} maybe
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {event.guests.slice(0, 8).map((guest, index) => (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={guest.avatar} />
                      <AvatarFallback>{guest.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{guest.name}</span>
                  </div>
                  <Badge 
                    variant={guest.status === 'going' ? 'default' : 'secondary'}
                    className={guest.status === 'going' ? 'bg-chemistry-high' : ''}
                  >
                    {guest.status === 'going' ? 'Going' : guest.status === 'maybe' ? 'Maybe' : 'Invited'}
                  </Badge>
                </motion.div>
              ))}
              
              {event.guests.length > 8 && (
                <Button variant="ghost" className="w-full text-muted-foreground">
                  View all {event.guests.length} guests
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Fixed Bottom RSVP Bar */}
      {!event.isHosted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4"
        >
          <div className="container max-w-2xl flex gap-3">
            {event.rsvpStatus === 'pending' ? (
              <>
                <Button 
                  className="flex-1"
                  onClick={() => handleRSVP('going')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Going
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleRSVP('declined')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-chemistry-high">
                    {event.rsvpStatus === 'going' ? 'Going' : 'Maybe'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">You've RSVP'd to this event</span>
                </div>
                <Button variant="outline" size="sm">
                  Change RSVP
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Fixed Bottom Bar for Hosts */}
      {event.isHosted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4"
        >
          <div className="container max-w-2xl flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Invite Link
            </Button>
            <Button className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Guests
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}