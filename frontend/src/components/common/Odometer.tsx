import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { formatCurrency } from "@/utils/format";

interface OdometerProps {
  value: number;
  currency: string;
}

export default function Odometer({ value, currency }: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  
  // Track the numeric value using a motion value
  const motionValue = useMotionValue(value);
  
  // Add a spring configuration to smoothly animate transitions
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 600,
  });

  // Whenever the target value changes, update the motion value
  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  // Subscribe to spring value changes and format it into the span
  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatCurrency(Math.round(latest), currency);
      }
    });
  }, [springValue, currency]);

  // Initial render with the exact formatted value
  return <span ref={ref}>{formatCurrency(Math.round(value), currency)}</span>;
}
