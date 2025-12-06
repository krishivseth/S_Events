import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Globe, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CoverImagePicker } from '@/components/CoverImagePicker';
import Navbar from '@/components/Navbar';
import { CommunicationProfile } from '@/types/event';

interface LocationState {
  preserveGuests?: boolean;
  selectedGuests?: CommunicationProfile[];
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  // Pre-fill with example event for demo
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: 'Founder Dinner - Series A Celebration',
    description: 'An intimate dinner for founders who recently closed their Series A. Share war stories, celebrate wins, and connect with fellow entrepreneurs in a relaxed setting.',
    date: getDefaultDate(),
    time: '19:00',
    isPrivate: true,
    maxAttendees: 10,
    coverImage: '',
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store in sessionStorage for demo
    sessionStorage.setItem('newEvent', JSON.stringify(formData));
    // Pass preserved guests if they exist
    navigate('/guest-builder', { 
      state: state?.preserveGuests ? { selectedGuests: state.selectedGuests } : undefined 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container pt-28 sm:pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Event</h1>
            <p className="text-muted-foreground">
              Let AI help you find the perfect guest combinations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Label className="text-sm text-muted-foreground mb-2 block">Cover Image (optional)</Label>
              <CoverImagePicker
                value={formData.coverImage}
                onChange={(value) => setFormData(f => ({ ...f, coverImage: value }))}
                className="h-40 sm:h-52"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
                    className="mt-1.5 min-h-[100px]"
                    required
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
              transition={{ delay: 0.4 }}
            >
              <Button 
                type="submit" 
                size="lg" 
                className="w-full glow-primary animate-pulse-glow"
              >
                Find Perfect Guests
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
