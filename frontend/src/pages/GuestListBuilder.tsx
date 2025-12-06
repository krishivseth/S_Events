import { useState, useMemo, useEffect } from 'react';
import { ChemistryAnalysis } from '@/types/event';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Send, Wand2, Filter, ChevronRight, Calendar, Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import ChemistryGraph from '@/components/ChemistryGraph';
import ChemistryScore from '@/components/ChemistryScore';
import GuestCard from '@/components/GuestCard';
import InsightsPanel from '@/components/InsightsPanel';
import ProfileView from '@/components/ProfileView';
import AvailabilityHeatmap, { getBestTimeSlot } from '@/components/AvailabilityHeatmap';
import { mockProfiles } from '@/data/mockEventData';
import { CommunicationProfile } from '@/types/event';
import { calculateGroupChemistry, optimizeGuestList } from '@/services/chemistryCalculator';
import { toast } from '@/hooks/use-toast';
import { eventsApi } from '@/services/api';

// Mock existing event guest data - in real app this would come from API
const existingEventGuests: Record<string, string[]> = {
  'event-1': ['user-1', 'user-2', 'user-3', 'user-5', 'user-8'],
  'event-2': ['user-4', 'user-6', 'user-7', 'user-9', 'user-10', 'user-11', 'user-12'],
};

interface LocationState {
  selectedGuests?: CommunicationProfile[];
}

export default function GuestListBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const isEditMode = !!eventId;
  const locationState = location.state as LocationState | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<CommunicationProfile[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCurating, setIsCurating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<CommunicationProfile | null>(null);
  const [inviteMessage, setInviteMessage] = useState(
    `Hey [Name]! You're invited to an exclusive event with fellow [School] alumni. Based on your profile, we think you'd be a great fit!`
  );
  const [suggestedTime, setSuggestedTime] = useState<{ day: string; slot: string } | null>(null);
  const [activeTab, setActiveTab] = useState('chemistry');
  
  // Event date/time state - load from sessionStorage
  const [eventDateTime, setEventDateTime] = useState<{ date: string; time: string }>(() => {
    const savedEvent = sessionStorage.getItem('newEvent');
    if (savedEvent) {
      const parsed = JSON.parse(savedEvent);
      return { date: parsed.date || '', time: parsed.time || '19:00' };
    }
    // Default to a week from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    return { date: defaultDate.toISOString().split('T')[0], time: '19:00' };
  });

  // Update sessionStorage when date/time changes
  const handleEventDateTimeChange = (newDateTime: { date: string; time: string }) => {
    setEventDateTime(newDateTime);
    const savedEvent = sessionStorage.getItem('newEvent');
    if (savedEvent) {
      const parsed = JSON.parse(savedEvent);
      sessionStorage.setItem('newEvent', JSON.stringify({ ...parsed, ...newDateTime }));
    } else {
      sessionStorage.setItem('newEvent', JSON.stringify(newDateTime));
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load guests from location state (preserved from CreateEvent) or existing event
  useEffect(() => {
    if (locationState?.selectedGuests && locationState.selectedGuests.length > 0) {
      setSelectedGuests(locationState.selectedGuests);
    } else if (eventId && existingEventGuests[eventId]) {
      const guestIds = existingEventGuests[eventId];
      const guests = mockProfiles.filter(p => guestIds.includes(p.userId));
      setSelectedGuests(guests);
    }
  }, [eventId, locationState]);

  const filteredProfiles = useMemo(() => {
    return mockProfiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedFilter) {
        return matchesSearch && profile.school === selectedFilter;
      }
      return matchesSearch;
    });
  }, [searchQuery, selectedFilter]);

  const [analysis, setAnalysis] = useState<ChemistryAnalysis>({
    groupScore: 0,
    insights: [],
    warnings: [],
    pairwiseScores: {},
  });

  // Update analysis when selectedGuests changes
  useEffect(() => {
    calculateGroupChemistry(selectedGuests).then(setAnalysis).catch(() => {
      // Fallback to empty analysis on error
      setAnalysis({
        groupScore: 0,
        insights: [],
        warnings: [],
        pairwiseScores: {},
      });
    });
  }, [selectedGuests]);

  const allSchools = useMemo(() => {
    const schools = new Set<string>();
    mockProfiles.forEach(p => schools.add(p.school));
    return Array.from(schools).slice(0, 6);
  }, []);

  const toggleGuest = (profile: CommunicationProfile) => {
    setSelectedGuests(prev => {
      const isSelected = prev.some(g => g.userId === profile.userId);
      if (isSelected) {
        return prev.filter(g => g.userId !== profile.userId);
      }
      return [...prev, profile];
    });
    // Clear suggested time when guests change
    setSuggestedTime(null);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { optimizedGuests, removed } = await optimizeGuestList(selectedGuests);
    
    if (removed.length > 0) {
      setSelectedGuests(optimizedGuests);
      toast({
        title: "Guest List Optimized!",
        description: `Removed ${removed.map(r => r.name).join(' & ')} to improve group chemistry.`,
      });
    } else {
      toast({
        title: "Already Optimized!",
        description: "Your guest list is already at peak chemistry.",
      });
    }
    
    setIsOptimizing(false);
  };

  const handleAutoCurate = async () => {
    setIsCurating(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Greedy algorithm to maximize chemistry score
    const targetSize = Math.min(8, Math.max(5, mockProfiles.length));
    let bestGroup: CommunicationProfile[] = [];
    let bestScore = 0;
    
    // Start with profiles that have high individual chemistry (1st/2nd degree, already know)
    const rankedProfiles = [...mockProfiles].sort((a, b) => {
      // Prioritize 1st degree connections
      const degreeScoreA = a.connectionDegree === 1 ? 30 : a.connectionDegree === 2 ? 15 : 0;
      const degreeScoreB = b.connectionDegree === 1 ? 30 : b.connectionDegree === 2 ? 15 : 0;
      // Bonus for already knowing
      const knowScoreA = a.alreadyKnow ? 20 : 0;
      const knowScoreB = b.alreadyKnow ? 20 : 0;
      return (degreeScoreB + knowScoreB) - (degreeScoreA + knowScoreA);
    });
    
    // Greedy selection: add guests one by one, picking the one that maximizes score
    const currentGroup: CommunicationProfile[] = [];
    const available = [...rankedProfiles];
    
    // Start with the best-ranked profile
    if (available.length > 0) {
      currentGroup.push(available.shift()!);
    }
    
    // Greedily add guests that maximize chemistry
    while (currentGroup.length < targetSize && available.length > 0) {
      let bestCandidate: CommunicationProfile | null = null;
      let bestCandidateScore = -1;
      let bestCandidateIndex = -1;
      
      for (let i = 0; i < available.length; i++) {
        const candidate = available[i];
        const testGroup = [...currentGroup, candidate];
        const analysis = await calculateGroupChemistry(testGroup);
        
        if (analysis.groupScore > bestCandidateScore) {
          bestCandidateScore = analysis.groupScore;
          bestCandidate = candidate;
          bestCandidateIndex = i;
        }
      }
      
      if (bestCandidate && bestCandidateIndex >= 0) {
        currentGroup.push(bestCandidate);
        available.splice(bestCandidateIndex, 1);
      } else {
        break;
      }
    }
    
    const finalAnalysis = await calculateGroupChemistry(currentGroup);
    bestGroup = currentGroup;
    bestScore = finalAnalysis.groupScore;
    
    setSelectedGuests(bestGroup);
    
    // Get best time for the curated group
    const bestTime = getBestTimeSlot(bestGroup);
    if (bestTime) {
      setSuggestedTime({ day: bestTime.day, slot: bestTime.slot });
    }
    
    toast({
      title: "Event Curated!",
      description: `Selected ${bestGroup.length} guests with ${bestScore}% chemistry score.`,
    });
    
    setIsCurating(false);
  };

  const handleSaveChanges = async () => {
    setIsSending(true);
    
    try {
      let currentEventId = eventId;
      
      // If creating new event, first create the event
      if (!isEditMode) {
        const savedEvent = sessionStorage.getItem('newEvent');
        if (!savedEvent) {
          toast({
            title: "Error",
            description: "Event data not found. Please create an event first.",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }
        
        const eventData = JSON.parse(savedEvent);
        const eventDate = new Date(`${eventData.date}T${eventData.time || '19:00'}`);
        
        // Create the event
        const newEvent = await eventsApi.create({
          title: eventData.title || 'New Event',
          description: eventData.description || '',
          date: eventDate.toISOString(),
          host: 'current-user', // TODO: Get from auth context
          type: eventData.isPrivate ? 'private' : 'public',
          maxAttendees: eventData.maxAttendees || 20,
          guests: selectedGuests.map(g => ({
            userId: g.userId,
            name: g.name,
            avatar: g.avatar,
            rsvpStatus: 'pending',
            individualChemistry: g.individualChemistry || 75,
          })),
        });
        
        currentEventId = newEvent.id;
      }
      
      if (!currentEventId) {
        throw new Error('Event ID is required');
      }
      
      // Send invitations
      const invites = selectedGuests.map(guest => ({
        userId: guest.userId,
        phoneNumber: guest.phoneNumber || '', // May not have phone in mock data
        name: guest.name,
      }));
      
      const result = await eventsApi.sendInvites(currentEventId, invites);
      
      setIsSending(false);
      setShowInviteModal(false);
      
      if (result.success) {
        const successfulCount = result.successful || result.invitations?.filter((i: any) => i.status === 'sent').length || 0;
        
        toast({
          title: "Invitations Sent!",
          description: `Successfully sent ${successfulCount} invitation(s) via iMessage.`,
        });
        
        if (isEditMode) {
          navigate(`/events/${currentEventId}`);
        } else {
          // Clear session storage
          sessionStorage.removeItem('newEvent');
          navigate('/events');
        }
      } else {
        throw new Error(result.error || 'Failed to send invitations');
      }
    } catch (error: any) {
      setIsSending(false);
      console.error('Error sending invitations:', error);
      toast({
        title: "Error Sending Invitations",
        description: error.message || 'Failed to send invitations. Please try again.',
        variant: "destructive",
      });
    }
  };

  // Get dimensions for the graph
  const [graphSize, setGraphSize] = useState({ width: 500, height: 450 });
  
  useEffect(() => {
    const updateSize = () => {
      const rightPanel = document.getElementById('right-panel');
      if (rightPanel) {
        setGraphSize({
          width: rightPanel.clientWidth - 48,
          height: 400
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container pt-20 pb-12 px-4">
        <div className="grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-8rem)]">
          {/* Left Panel - Guest Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-4">
              {isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mb-2 -ml-2"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Event
                </Button>
              )}
              <h2 className="text-2xl font-bold mb-1">
                {isEditMode ? 'Manage Guests' : 'Select Guests'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {selectedGuests.length} guests selected
              </p>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, school, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                {allSchools.map(school => (
                  <Badge
                    key={school}
                    variant={selectedFilter === school ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap text-xs"
                    onClick={() => setSelectedFilter(selectedFilter === school ? null : school)}
                  >
                    {school}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Guest List */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredProfiles.map((profile, index) => (
                    <GuestCard
                      key={profile.userId}
                      profile={profile}
                      isSelected={selectedGuests.some(g => g.userId === profile.userId)}
                      onToggle={() => toggleGuest(profile)}
                      onViewProfile={() => setViewingProfile(profile)}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Chemistry Visualization */}
          <motion.div
            id="right-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="rounded-2xl border bg-card p-6 flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
                  <TabsTrigger value="availability" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Availability
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chemistry" className="flex-1 flex flex-col mt-0">
                  {/* Chemistry Score */}
                  <div className="text-center mb-2">
                    <ChemistryScore score={analysis.groupScore} size="lg" />
                  </div>

                  {/* Graph - expanded to fill space */}
                  <div className="flex-1 min-h-[300px] w-full">
                    <ChemistryGraph
                      guests={selectedGuests}
                      analysis={analysis}
                      width={graphSize.width + 32}
                      height={Math.max(graphSize.height - 100, 300)}
                    />
                  </div>

                  {/* Insights */}
                  <InsightsPanel analysis={analysis} />
                </TabsContent>

                <TabsContent value="availability" className="mt-0">
                  <AvailabilityHeatmap 
                    guests={selectedGuests} 
                    suggestedTime={suggestedTime}
                    eventDateTime={eventDateTime}
                    onEventDateTimeChange={handleEventDateTimeChange}
                  />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-4">
                {/* Auto Curate Button */}
                <Button
                  className="w-full glow-primary"
                  onClick={handleAutoCurate}
                  disabled={isCurating}
                >
                  {isCurating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mr-2"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Curating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Auto-Curate Event
                    </>
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleOptimize}
                    disabled={selectedGuests.length < 3 || isOptimizing}
                  >
                    {isOptimizing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Optimize List
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowInviteModal(true)}
                    disabled={selectedGuests.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Save Changes' : 'Send Invites'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Actions - Back to Edit Event */}
        <div className="mt-8 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/create-event', { state: { preserveGuests: true, selectedGuests } })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit Event Details
          </Button>
        </div>
      </main>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              {isEditMode ? 'Save Guest List' : 'Send Invitations'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Review and save changes to your guest list'
                : 'AI will personalize each invitation based on shared interests'}
              {suggestedTime && (
                <span className="block mt-1 text-primary">
                  Event scheduled for {suggestedTime.day} at {suggestedTime.slot}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              {selectedGuests.slice(0, 3).map(guest => (
                <div key={guest.userId} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Personalized message ready
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
              {selectedGuests.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{selectedGuests.length - 3} more guests
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="invite-message" className="text-sm font-medium">
                Your Message <span className="text-muted-foreground font-normal">(use [Name] and [School] as placeholders)</span>
              </Label>
              <Textarea
                id="invite-message"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Write your invite message..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSending}>
              {isSending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  {isEditMode ? 'Saving...' : 'Sending...'}
                </>
              ) : (
                <>
                  {isEditMode ? 'Save Changes' : `Send ${selectedGuests.length} Invitations`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal */}
      <AnimatePresence>
        {viewingProfile && (
          <ProfileView
            profile={viewingProfile}
            onClose={() => setViewingProfile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
