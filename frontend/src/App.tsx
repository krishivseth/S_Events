/**
 * App.tsx - Main Application Entry Point
 * 
 * This is the root component that sets up:
 * - React Query for data fetching and caching
 * - Tooltip provider for UI tooltips
 * - Toast notifications (both shadcn and Sonner)
 * - React Router for client-side routing
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Page components
import Index from "./pages/Index";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import CreateEvent from "./pages/CreateEvent";
import GuestListBuilder from "./pages/GuestListBuilder";
import EventDashboard from "./pages/EventDashboard";
import EventDetail from "./pages/EventDetail";
import EditEvent from "./pages/EditEvent";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Create a React Query client for data fetching
const queryClient = new QueryClient();

/**
 * Main App component
 * Wraps the entire application with necessary providers and defines routes
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Toast notifications */}
        <Toaster />
        <Sonner />
        
        {/* Client-side routing */}
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Index />} />
            
            {/* Login */}
            <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
            
            {/* Chat with AI - protected */}
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            
            {/* Event creation flow - protected */}
            <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/guest-builder" element={<ProtectedRoute><GuestListBuilder /></ProtectedRoute>} />
            
            {/* Event management - protected */}
            <Route path="/events" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
            <Route path="/events/:eventId" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/events/:eventId/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
            
            {/* Static pages */}
            <Route path="/privacy" element={<Privacy />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
