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

// Page components
import Index from "./pages/Index";
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
    <TooltipProvider>
      {/* Toast notifications */}
      <Toaster />
      <Sonner />
      
      {/* Client-side routing */}
      <BrowserRouter>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<Index />} />
          
          {/* Event creation flow */}
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/guest-builder" element={<GuestListBuilder />} />
          
          {/* Event management */}
          <Route path="/events" element={<EventDashboard />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/events/:eventId/edit" element={<EditEvent />} />
          
          {/* Static pages */}
          <Route path="/privacy" element={<Privacy />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
