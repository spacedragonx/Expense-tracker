import { useEffect, useRef, useState } from "react";

interface Options {
  /** Stop observing after the first time the element is seen (default true). */
  once?: boolean;
  rootMargin?: string;
}

/**
 * Tracks whether an element is in (or near) the viewport using a single
 * IntersectionObserver. Used for scroll-reveal animations and to defer heavy
 * work (e.g. loading the charts bundle) until it is actually needed.
 * Where IntersectionObserver is unavailable the element is treated as visible.
 */
export function useInView<T extends Element>({ once = true, rootMargin = "0px 0px -8% 0px" }: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  return [ref, inView] as const;
}

export default useInView;
