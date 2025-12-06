import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Globe, Lock, ArrowLeft, Save, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import { toast } from '@/hooks/use-toast';
import { mockEvents } from '@/data/mockEventData';

// Mock event data for editing
const getEventData = (eventId: string) => {
  const eventMap: Record<string, any> = {
    'event-1': {
      id: 'event-1',
      title: 'Founder Dinner - Series A Celebration',
      description: 'An intimate dinner for founders who recently closed their Series A. Share war stories, celebrate wins, and connect with fellow entrepreneurs who understand the journey.\n\nDress code: Smart casual\nFood and drinks will be provided.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'The Standard, High Line',
      address: '848 Washington St, New York, NY 10014',
      isPrivate: true,
      maxAttendees: 10,
      coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
    },
    'event-2': {
      id: 'event-2',
      title: 'Tech & Wine Meetup',
      description: 'Casual networking over wine tasting. Meet fellow tech enthusiasts in a relaxed setting.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: 'Corkbuzz Wine Studio',
      address: '13 E 13th St, New York, NY 10003',
      isPrivate: false,
      maxAttendees: 25,
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    },
  };
  return eventMap[eventId] || null;
};

export default function EditEvent() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    address: '',
    isPrivate: true,
    maxAttendees: 10,
    coverImage: '',
  });

  useEffect(() => {
    if (eventId) {
      const event = getEventData(eventId);
      if (event) {
        setFormData({
          title: event.title,
          description: event.description,
          date: event.date.toISOString().split('T')[0],
          time: event.date.toTimeString().slice(0, 5),
          location: event.location,
          address: event.address || '',
          isPrivate: event.isPrivate,
          maxAttendees: event.maxAttendees,
          coverImage: event.coverImage || '',
        });
      }
      setIsLoading(false);
    }
  }, [eventId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Event updated!", description: "Your changes have been saved." });
    navigate(`/events/${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-2xl flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Edit Event</h1>
          <div className="w-10" />
        </div>
      </header>
      
      <main className="container max-w-2xl pt-20 pb-12 px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Label className="text-sm text-muted-foreground mb-2 block">Cover Image</Label>
            <CoverImagePicker
              value={formData.coverImage}
              onChange={(value) => setFormData(f => ({ ...f, coverImage: value }))}
              className="h-40 sm:h-52"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Founder Dinner, Tech Meetup, etc."
                  value={formData.title}
                  onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's the occasion? What should guests expect?"
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  className="mt-1.5 min-h-[120px]"
                  required
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Date & Time
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <div className="relative mt-1.5">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Venue Name</Label>
                <Input
                  id="location"
                  placeholder="e.g. The Standard, High Line"
                  value={formData.location}
                  onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g. 848 Washington St, New York, NY"
                  value={formData.address}
                  onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Event Settings
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.isPrivate ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {formData.isPrivate ? 'Private Event' : 'Public Event'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.isPrivate 
                        ? 'Only invited guests can see this event' 
                        : 'Anyone can discover and request to join'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, isPrivate: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min={2}
                  max={100}
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData(f => ({ ...f, maxAttendees: parseInt(e.target.value) || 10 }))}
                  className="mt-1.5 w-32"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Button type="submit" size="lg" className="w-full">
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
