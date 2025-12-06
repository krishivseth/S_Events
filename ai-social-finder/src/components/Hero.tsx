import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";

interface HeroProps {
  onGetStarted: (initialMessage?: string) => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGetStarted(prompt);
    }
  };

  const examplePrompts = [
    "Find me someone to run with in NYC",
    "Show me tech professionals in Brooklyn",
    "Connect me with designers who love coffee",
    "Find entrepreneurs interested in Web3"
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-primary/10 blur-3xl" />
      
      <div className="relative z-10 text-center max-w-3xl mx-auto w-full mt-16">
        <h1 className="text-6xl md:text-7xl font-bold mb-12 text-primary animate-fade-in">
          VibeMeet
        </h1>
        
        {/* ChatGPT-style prompt bar */}
        <form onSubmit={handleSubmit} className="animate-fade-in mb-8" style={{ animationDelay: "0.1s" }}>
          <div className="relative group">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Who are you looking for?"
              className="w-full h-16 px-6 pr-14 text-lg bg-card/80 backdrop-blur-sm border-2 border-primary/20 focus:border-primary/50 rounded-2xl shadow-card transition-all placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-primary hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </form>
        
        {/* Example prompts */}
        <div className="flex flex-wrap gap-3 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {examplePrompts.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="px-4 py-2 text-sm rounded-full bg-card/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 hover:bg-card/70 transition-all text-muted-foreground hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {[
            { title: "AI Vibe Matching", desc: "Our AI understands your personality and finds compatible connections" },
            { title: "Smart Discovery", desc: "Search through mutuals and extended networks with natural language" },
            { title: "Curated Feed", desc: "Get personalized recommendations for networking, dating, or friendships" }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-all">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
