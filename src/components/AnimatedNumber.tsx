import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  format?: 'currency' | 'default';
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.5,
  decimals = 0,
  format = 'default',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;
    const diff = endValue - startValue;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      const current = startValue + diff * progress;
      setDisplayValue(current);

      if (progress === 1) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value, duration]);

  const formattedValue =
    format === 'currency'
      ? `₹${displayValue.toLocaleString('en-IN', {
          maximumFractionDigits: decimals,
          minimumFractionDigits: decimals,
        })}`
      : displayValue.toFixed(decimals);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {formattedValue}
    </motion.span>
  );
};

export default AnimatedNumber;
