import { motion, AnimatePresence } from 'framer-motion';
import { ChemistryAnalysis } from '@/types/event';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface InsightsPanelProps {
  analysis: ChemistryAnalysis;
}

export default function InsightsPanel({ analysis }: InsightsPanelProps) {
  const hasContent = analysis.insights.length > 0 || analysis.warnings.length > 0;

  if (!hasContent) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Chemistry Insights
        </h3>
        <p className="text-sm text-muted-foreground">
          Add at least 2 guests to see chemistry insights
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Chemistry Insights
      </h3>
      
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {analysis.insights.map((insight, index) => (
            <motion.div
              key={insight}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-chemistry-high shrink-0 mt-0.5" />
              <span>{insight}</span>
            </motion.div>
          ))}
          
          {analysis.warnings.map((warning, index) => (
            <motion.div
              key={warning}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: (analysis.insights.length + index) * 0.1 }}
              className="flex items-start gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-chemistry-low shrink-0 mt-0.5" />
              <span className="text-chemistry-low">{warning}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
