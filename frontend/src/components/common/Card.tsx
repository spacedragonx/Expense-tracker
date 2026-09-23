import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

/** Thin wrapper around the `.card` utility so pages don't repeat the class string. */
export default function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card ${className}`} 
      {...rest}
    >
      {children}
    </motion.div>
  );
}
