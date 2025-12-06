import { motion } from 'framer-motion';
import { CommunicationProfile } from '@/types/event';
import { X, Linkedin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockProfiles } from '@/data/mockEventData';
import { useMemo } from 'react';

interface ProfileViewProps {
  profile: CommunicationProfile;
  onClose: () => void;
}

interface ConnectionNode {
  id: string;
  x: number;
  y: number;
  avatar?: string;
  name?: string;
}

export default function ProfileView({ profile, onClose }: ProfileViewProps) {
  const getConnectionLabel = (degree: 1 | 2 | 3) => {
    switch (degree) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
    }
  };

  // Generate connection nodes for the background graph
  const connectionNodes = useMemo(() => {
    const nodes: ConnectionNode[] = [];
    const connections = mockProfiles.filter(p => p.userId !== profile.userId).slice(0, 10);
    
    connections.forEach((conn, i) => {
      const angle = (i / connections.length) * Math.PI * 2;
      // Smaller radius on mobile
      const baseRadius = typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 200;
      const randomOffset = typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 100;
      const radius = baseRadius + Math.random() * randomOffset;
      nodes.push({
        id: conn.userId,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        avatar: conn.avatar,
        name: conn.name,
      });
    });
    
    return nodes;
  }, [profile.userId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10">
        <h1 className="text-xs sm:text-sm font-medium text-muted-foreground">Profile Preview</h1>
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full"
      >
        <X className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Centered Content */}
      <div className="h-full w-full flex items-center justify-center px-4 sm:px-0 overflow-hidden">
        <div className="relative" onClick={e => e.stopPropagation()}>
          {/* Social Graph Background */}
          <div className="absolute inset-0 pointer-events-none hidden sm:block">
            {/* Connection lines */}
            <svg className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              {connectionNodes.map((node, i) => (
                <motion.line
                  key={`line-${node.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.15 }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${node.x}px)`}
                  y2={`calc(50% + ${node.y}px)`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
              ))}
            </svg>

            {/* Connection Nodes */}
            {connectionNodes.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 200 }}
                className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card border border-border shadow-sm overflow-hidden"
                style={{
                  left: `calc(50% + ${node.x}px)`,
                  top: `calc(50% + ${node.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative bg-card rounded-2xl shadow-xl border border-border p-4 sm:p-6 w-[calc(100vw-2rem)] max-w-80 z-10"
          >
            {/* Connection degree badge */}
            <div className="absolute -top-3 right-4 bg-primary rounded-full px-2.5 sm:px-3 py-1">
              <span className="text-[10px] sm:text-xs font-medium text-primary-foreground">
                {getConnectionLabel(profile.connectionDegree)} connection
              </span>
            </div>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">{profile.name}</h2>

            {/* Photo with age badge */}
            <div className="relative mb-3 sm:mb-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full aspect-square object-cover rounded-xl"
              />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-background/90 backdrop-blur-sm rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">{profile.age}</span>
              </div>
            </div>

            {/* Role and Company */}
            <p className="text-xs sm:text-sm font-medium text-foreground">{profile.role}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">{profile.company}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{profile.school}</p>

            {/* Bio section */}
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">"{profile.bio}"</p>
              </div>
              
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#0A66C2] hover:opacity-80 transition-opacity"
                >
                  <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              )}
            </div>

            {profile.alreadyKnow && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                <p className="text-[10px] sm:text-xs text-primary font-medium">✓ You already know each other</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
