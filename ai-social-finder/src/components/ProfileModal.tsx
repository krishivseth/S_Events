import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Instagram, Linkedin, ExternalLink, MessageSquare } from "lucide-react";
import type { Profile } from "@/data/mockProfiles";

interface ProfileModalProps {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ profile, open, onClose }: ProfileModalProps) => {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">{profile.name}, {profile.age}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="aspect-video bg-primary rounded-xl overflow-hidden">
            <img
              src={profile.imageUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{profile.vibeMatch}%</div>
                <div className="text-xs text-muted-foreground">vibe match</div>
              </div>
            </div>
          </div>
          
          {profile.mutualConnection && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm">Mutual connection: <span className="font-semibold">{profile.mutualConnection}</span></span>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground">{profile.bio}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Conversation Starter</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "Hey! I noticed you're into {profile.interests[0].toLowerCase()}. {
                profile.interests[0].toLowerCase().includes('running') ? "What's your favorite running route?" :
                profile.interests[0].toLowerCase().includes('coffee') ? "Have you tried any good coffee spots lately?" :
                profile.interests[0].toLowerCase().includes('yoga') ? "How long have you been practicing?" :
                profile.interests[0].toLowerCase().includes('hiking') ? "What's the best trail you've done recently?" :
                profile.interests[0].toLowerCase().includes('travel') ? "Where was your last trip?" :
                profile.interests[0].toLowerCase().includes('photography') ? "What kind of photography do you focus on?" :
                profile.interests[0].toLowerCase().includes('art') ? "Do you have a favorite artist or style?" :
                profile.interests[0].toLowerCase().includes('music') ? "What's been on your playlist lately?" :
                `I'd love to hear more about it!`
              }"
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            {profile.platforms.instagram && (
              <Button
                className="flex-1 bg-accent hover:opacity-90"
                onClick={() => window.open(profile.platforms.instagram, "_blank")}
              >
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            )}
            
            {profile.platforms.linkedin && (
              <Button
                variant="outline"
                className="flex-1 border-primary/30 hover:bg-primary/10"
                onClick={() => window.open(profile.platforms.linkedin, "_blank")}
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
