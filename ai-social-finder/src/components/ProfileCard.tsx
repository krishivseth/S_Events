import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";
import type { Profile } from "@/data/mockProfiles";

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
}

export const ProfileCard = ({ profile, onClick }: ProfileCardProps) => {
  return (
    <Card
      className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all cursor-pointer group bg-card/50 backdrop-blur-sm shadow-card hover:shadow-glow"
      onClick={onClick}
    >
      <div className="aspect-square bg-primary relative overflow-hidden">
        <img
          src={profile.imageUrl}
          alt={profile.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-bold text-primary">{profile.vibeMatch}%</span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">{profile.name}, {profile.age}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3 h-3" />
              <span>{profile.location}</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {profile.bio}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.interests.slice(0, 3).map((interest) => (
            <Badge key={interest} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              {interest}
            </Badge>
          ))}
        </div>
        
        {profile.mutualConnection && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-3 border-t border-primary/10">
            <Users className="w-3 h-3" />
            <span>Mutual: {profile.mutualConnection}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
