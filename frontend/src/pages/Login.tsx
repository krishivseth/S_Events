import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Phone, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Demo users mapped to phone numbers
const DEMO_USERS: Record<string, { userId: string; name: string; phoneNumber: string; avatar: string; isHost?: boolean }> = {
  '+14843693839': {
    userId: 'demo-guest-1',
    name: 'Sarah Kim',
    phoneNumber: '+14843693839',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  '+19178615579': {
    userId: 'demo-guest-2',
    name: 'Alex Thompson',
    phoneNumber: '+19178615579',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
  '+16463230991': {
    userId: 'current-user',
    name: 'You (Host)',
    phoneNumber: '+16463230991',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    isHost: true,
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check password
    if (password !== '123') {
      toast({
        title: 'Invalid password',
        description: 'Password must be "123"',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Normalize phone number (add +1 if missing, handle spaces/dashes)
    let normalized = phoneNumber.trim().replace(/[\s-()]/g, '');
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('1') && normalized.length === 11) {
        normalized = '+' + normalized;
      } else if (normalized.length === 10) {
        normalized = '+1' + normalized;
      } else {
        toast({
          title: 'Invalid phone number',
          description: 'Please enter a valid phone number',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    // Check if user exists
    const user = DEMO_USERS[normalized];
    if (!user) {
      toast({
        title: 'User not found',
        description: 'This phone number is not registered. Use one of the demo numbers.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Login
    login({
      userId: user.userId,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isHost: user.isHost || false,
    });

    toast({
      title: 'Logged in successfully!',
      description: `Welcome, ${user.name}!`,
    });

    setIsLoading(false);
    
    // Navigate to the page user was trying to access, or events
    const from = (location.state as any)?.from || '/events';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Login to Series Events</CardTitle>
            <CardDescription>
              Enter your phone number and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (484) 369-3839"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo numbers: +14843693839, +19178615579, +16463230991
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo password: 123
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Demo Accounts:
              </p>
              <div className="space-y-2">
                {Object.values(DEMO_USERS).map((user) => (
                  <div key={user.userId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.phoneNumber}</div>
                    </div>
                    {user.isHost && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}