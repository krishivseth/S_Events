import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Calendar, Linkedin } from 'lucide-react';
import { currentUserProfile, mockProfiles } from '@/data/mockEventData';
import userAvatar from '@/assets/user-avatar.jpg';

interface ConnectionNode {
  id: string;
  x: number;
  y: number;
  avatar?: string;
  name?: string;
}

export default function PrivacyDashboard() {
  const [settings, setSettings] = useState({
    shareAvailability: true,
    appearInRecommendations: true
  });

  // Generate connection nodes for the background graph
  const connectionNodes = useMemo(() => {
    const nodes: ConnectionNode[] = [];
    const connections = mockProfiles.slice(0, 8);
    
    connections.forEach((conn, i) => {
      const angle = (i / connections.length) * Math.PI * 2;
      const baseRadius = typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : 140;
      const randomOffset = typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : 50;
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
  }, []);

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy Controls
          </CardTitle>
          <CardDescription>
            Manage how your communication patterns are used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Share availability for events</p>
                <p className="text-sm text-muted-foreground">Let hosts see when you're free</p>
              </div>
            </div>
            <Switch
              checked={settings.shareAvailability}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, shareAvailability: checked }))}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Appear in event recommendations</p>
                <p className="text-sm text-muted-foreground">Be suggested as a potential guest</p>
              </div>
            </div>
            <Switch
              checked={settings.appearInRecommendations}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, appearInRecommendations: checked }))}
            />
          </motion.div>
        </CardContent>
      </Card>

      {/* Your Profile Card with Connections Graph */}
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          {/* Social Graph Background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Connection lines */}
            <svg className="absolute w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
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
                className="absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-card border border-border shadow-sm overflow-hidden"
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
            className="relative bg-card rounded-2xl shadow-lg border border-border p-4 w-64 z-10"
          >
            <h3 className="text-base font-semibold mb-3">Your Profile</h3>
            
            {/* Photo with age badge */}
            <div className="relative mb-3">
              <img
                src={userAvatar}
                alt={currentUserProfile.name}
                className="w-full aspect-square object-cover rounded-xl"
              />
              <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">{currentUserProfile.age}</span>
              </div>
            </div>

            {/* Role and Company */}
            <p className="text-xs font-medium text-foreground">{currentUserProfile.role}</p>
            <p className="text-xs text-muted-foreground mb-0.5">{currentUserProfile.company}</p>
            <p className="text-xs text-muted-foreground mb-3">{currentUserProfile.school}</p>

            {/* Bio section */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Bio</p>
                <p className="text-xs text-foreground leading-relaxed">"{currentUserProfile.bio}"</p>
              </div>
              
              {currentUserProfile.linkedinUrl && (
                <a
                  href={currentUserProfile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#0A66C2] hover:opacity-80 transition-opacity"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
