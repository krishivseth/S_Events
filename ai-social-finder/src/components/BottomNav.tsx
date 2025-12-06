import { Home, Sparkles, MessageCircle, User } from "lucide-react";

interface BottomNavProps {
  activeView: "home" | "fyp" | "chat" | "profile";
  onViewChange: (view: "home" | "fyp" | "chat" | "profile") => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
  const navItems = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "fyp" as const, icon: Sparkles, label: "For You" },
    { id: "chat" as const, icon: MessageCircle, label: "Find" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-primary/10 z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "fill-primary" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
