import { motion } from 'framer-motion';
import { CommunicationProfile } from '@/types/event';
import { X, Linkedin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileCardProps {
  profile: CommunicationProfile;
  onClose: () => void;
}

export default function ProfileCard({ profile, onClose }: ProfileCardProps) {
  const getConnectionLabel = (degree: 1 | 2 | 3) => {
    switch (degree) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-sm"
    >
      {/* Close button */}
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Name */}
      <h2 className="text-2xl font-bold text-foreground mb-4">{profile.name}</h2>

      {/* Large Photo with age badge */}
      <div className="relative mb-4">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-full aspect-square object-cover rounded-xl"
        />
        {/* Age badge */}
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{profile.age}</span>
        </div>
        
        {/* Connection degree badge */}
        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-xs font-medium text-primary-foreground">
            {getConnectionLabel(profile.connectionDegree)} connection
          </span>
        </div>
      </div>

      {/* Role and Company */}
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">{profile.role}</p>
        <p className="text-sm text-muted-foreground">{profile.company}</p>
      </div>

      {/* School */}
      <p className="text-sm text-muted-foreground mb-4">{profile.school}</p>

      {/* Bio section */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
          <p className="text-sm text-foreground leading-relaxed">"{profile.bio}"</p>
        </div>
        
        {/* LinkedIn icon */}
        {profile.linkedinUrl && (
          <a
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[#0A66C2] hover:opacity-80 transition-opacity"
          >
            <Linkedin className="h-6 w-6" />
          </a>
        )}
      </div>

      {/* Already know indicator */}
      {profile.alreadyKnow && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-primary font-medium">✓ You already know each other</p>
        </div>
      )}
    </motion.div>
  );
}
