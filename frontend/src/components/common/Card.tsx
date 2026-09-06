import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Thin wrapper around the `.card` utility so pages don't repeat the class string. */
export default function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}
