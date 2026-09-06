import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors",
  danger:
    "inline-flex items-center justify-center rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity",
};

export default function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  return (
    <button className={`${VARIANT_CLASSES[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
