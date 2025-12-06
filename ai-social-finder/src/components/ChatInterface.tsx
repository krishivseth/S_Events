import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { mockProfiles, type Profile } from "@/data/mockProfiles";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  profiles?: Profile[];
}

interface ChatInterfaceProps {
  onViewProfile: (profile: Profile) => void;
  initialMessage?: string;
}

export const ChatInterface = ({ onViewProfile, initialMessage }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Tell me what type of person you're looking for and I'll help you find them."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle initial message from hero page
  React.useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setInput(initialMessage);
      // Auto-submit the initial message
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 500);
    }
  }, [initialMessage]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const filteredProfiles = mockProfiles.slice(0, 3);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I found ${filteredProfiles.length} people who match your vibe! Here are some great connections:`,
        profiles: filteredProfiles
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSend = () => {
    handleSendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-6">
      <div className="flex-1 overflow-y-auto space-y-6 mb-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-primary/10"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">VibeMeet</span>
                </div>
              )}
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              {message.profiles && (
                <div className="mt-4 space-y-3">
                  {message.profiles.map(profile => (
                    <div
                      key={profile.id}
                      className="p-4 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                      onClick={() => onViewProfile(profile)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{profile.name}</h4>
                          <p className="text-sm text-muted-foreground">{profile.location}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-2xl font-bold text-primary">{profile.vibeMatch}%</div>
                          <div className="text-xs text-muted-foreground">vibe match</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profile.interests.slice(0, 3).map(interest => (
                          <span key={interest} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-primary/10 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Finding your vibe matches...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me to find someone... e.g., 'find runners in NYC'"
          className="flex-1 bg-card border-primary/20 focus:border-primary/40"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="bg-primary hover:opacity-90 transition-all shadow-glow"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
