import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, PlusCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/chat', label: 'Chat AI', icon: Calendar },
    { path: '/create-event', label: 'Create', icon: PlusCircle },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-1">
          <span className="font-bold text-2xl tracking-tight">S_</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={`relative rounded-full ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name}
            </span>
          )}
          {!user && (
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          )}
          {user && (
            <>
              <Link to="/privacy">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-border py-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <item.icon className="w-5 h-5" />
              </Button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
