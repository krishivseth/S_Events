import { motion } from 'framer-motion';
import { CommunicationProfile } from '@/types/event';
import { getIndividualChemistry } from '@/services/chemistryCalculator';
import { Plus, Minus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GuestCardProps {
  profile: CommunicationProfile;
  isSelected: boolean;
  onToggle: () => void;
  onViewProfile?: () => void;
  index?: number;
}

export default function GuestCard({ profile, isSelected, onToggle, onViewProfile, index = 0 }: GuestCardProps) {
  const chemistry = getIndividualChemistry(profile);
  
  const getChemistryColor = (score: number) => {
    if (score >= 85) return 'text-chemistry-high';
    if (score >= 70) return 'text-chemistry-medium';
    return 'text-chemistry-low';
  };

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
      transition={{ delay: index * 0.03 }}
      className={`rounded-2xl border bg-card p-3 transition-all duration-200 cursor-pointer relative ${
        isSelected ? 'ring-2 ring-foreground bg-secondary' : 'hover:bg-secondary/50'
      }`}
      onClick={onViewProfile}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="relative">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-14 h-14 rounded-full object-cover"
          />
          {profile.alreadyKnow && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-foreground rounded-full flex items-center justify-center">
              <Users className="w-2.5 h-2.5 text-background" />
            </div>
          )}
        </div>
        
        <div className="w-full">
          <h3 className="font-medium text-sm truncate">{profile.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-xs font-bold ${getChemistryColor(chemistry)}`}>
            {chemistry}%
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {getConnectionLabel(profile.connectionDegree)}
          </Badge>
        </div>
        
        <Button
          size="sm"
          variant={isSelected ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-full h-7 text-xs"
        >
          {isSelected ? <Minus className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
          {isSelected ? 'Remove' : 'Add'}
        </Button>
      </div>
    </motion.div>
  );
}
