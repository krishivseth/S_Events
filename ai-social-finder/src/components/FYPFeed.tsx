import { mockProfiles, type Profile } from "@/data/mockProfiles";
import { ProfileCard } from "./ProfileCard";

interface FYPFeedProps {
  onViewProfile: (profile: Profile) => void;
}

export const FYPFeed = ({ onViewProfile }: FYPFeedProps) => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">For You</h2>
          <p className="text-muted-foreground">AI-curated connections based on your vibe</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onClick={() => onViewProfile(profile)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
