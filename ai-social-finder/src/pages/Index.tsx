import { useState } from "react";
import { Hero } from "@/components/Hero";
import { ChatInterface } from "@/components/ChatInterface";
import { FYPFeed } from "@/components/FYPFeed";
import { Profile } from "@/components/Profile";
import { ProfileModal } from "@/components/ProfileModal";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, User } from "lucide-react";
import type { Profile as ProfileType } from "@/data/mockProfiles";

type View = "home" | "chat" | "fyp" | "profile";

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const [initialMessage, setInitialMessage] = useState<string>("");

  const handleViewProfile = (profile: ProfileType) => {
    setSelectedProfile(profile);
  };

  const handleCloseProfile = () => {
    setSelectedProfile(null);
  };

  const handleGetStarted = (message?: string) => {
    if (message) {
      setInitialMessage(message);
    }
    setCurrentView("chat");
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Desktop Navigation */}
      {currentView !== "home" && (
        <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">
                VibeMeet
              </h1>
              
              <div className="flex gap-2">
                <Button
                  variant={currentView === "fyp" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("fyp")}
                  className={currentView === "fyp" ? "bg-primary" : ""}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  For You
                </Button>
                
                <Button
                  variant={currentView === "chat" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("chat")}
                  className={currentView === "chat" ? "bg-primary" : ""}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Find Me Someone
                </Button>

                <Button
                  variant={currentView === "profile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("profile")}
                  className={currentView === "profile" ? "bg-primary" : ""}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={currentView !== "home" ? "md:pt-20" : ""}>
        {currentView === "home" && (
          <Hero onGetStarted={handleGetStarted} />
        )}
        
        {currentView === "chat" && (
          <ChatInterface 
            onViewProfile={handleViewProfile} 
            initialMessage={initialMessage}
          />
        )}
        
        {currentView === "fyp" && (
          <FYPFeed onViewProfile={handleViewProfile} />
        )}

        {currentView === "profile" && (
          <Profile />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeView={currentView} onViewChange={setCurrentView} />

      {/* Profile Modal */}
      <ProfileModal
        profile={selectedProfile}
        open={!!selectedProfile}
        onClose={handleCloseProfile}
      />
    </div>
  );
};

export default Index;
