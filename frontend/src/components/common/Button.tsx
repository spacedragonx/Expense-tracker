import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost:
    "inline-flex items-center justify-center rounded-sm dark:rounded-xl px-4 py-2 text-sm font-medium text-graphite hover:bg-fog dark:text-gray-300 dark:hover:bg-slate-800 transition-colors",
  danger:
    "inline-flex items-center justify-center rounded-sm dark:rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity",
};

export default function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  return (
    <motion.button 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${VARIANT_CLASSES[variant]} ${className}`} 
      {...rest}
    >
      {children}
    </motion.button>
  );
}
