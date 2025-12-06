import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ChemistryScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ChemistryScore({ score, size = 'md', showLabel = true }: ChemistryScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const startValue = displayScore;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (score - startValue) * eased);
      
      setDisplayScore(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
    setPrevScore(score);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-chemistry-high';
    if (s >= 70) return 'text-chemistry-medium';
    return 'text-chemistry-low';
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-5xl',
    lg: 'text-7xl'
  };

  const isImproving = score > prevScore;

  return (
    <div className="text-center">
      <motion.div
        key={score}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative inline-block rounded-2xl p-4 bg-secondary/50"
      >
        <span className={`font-mono font-bold ${sizeClasses[size]} ${getScoreColor(score)}`}>
          {displayScore}
        </span>
        <span className={`${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'} ${getScoreColor(score)}`}>%</span>
        
        <AnimatePresence>
          {isImproving && score !== prevScore && (
            <motion.span
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute -top-2 right-0 text-chemistry-high text-sm font-semibold"
            >
              +{score - prevScore}%
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {showLabel && (
        <p className="text-muted-foreground text-sm mt-2">Group Chemistry Score</p>
      )}
    </div>
  );
}
