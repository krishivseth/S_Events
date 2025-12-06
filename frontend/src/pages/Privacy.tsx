import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PrivacyDashboard from '@/components/PrivacyDashboard';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Privacy & Profile</h1>
            <p className="text-muted-foreground">
              Control how your communication patterns are analyzed
            </p>
          </div>

          <PrivacyDashboard />
        </motion.div>
      </main>
    </div>
  );
}
