import { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

/** Fades/slides its child in the first time it scrolls into view. Transform + opacity only. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`lp-reveal ${inView ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Renders children only once the placeholder is near the viewport. Paired with
 * React.lazy this keeps below-the-fold bundles (Recharts) off the critical path.
 */
export function MountWhenVisible({
  children,
  minHeight,
  rootMargin = "300px 0px",
}: {
  children: ReactNode;
  minHeight: number;
  rootMargin?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin });
  return (
    <div ref={ref} style={inView ? undefined : { minHeight }}>
      {inView ? children : null}
    </div>
  );
}
