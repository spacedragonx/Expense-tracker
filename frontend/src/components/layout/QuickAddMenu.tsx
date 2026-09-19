import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Receipt, Wallet, Target } from "lucide-react";

const ACTIONS = [
  { label: "Add Expense", to: "/expenses?add=1", icon: Receipt },
  { label: "Add Income", to: "/income?add=1", icon: Wallet },
  { label: "Add Goal", to: "/goals", icon: Target },
];

/**
 * Emerald Quick Add button that reveals a compact action menu on click.
 * Navigates to the relevant page with ?add=1, which Expenses/Income read
 * to auto-open their existing create form (see the useEffect added there).
 */
export default function QuickAddMenu() {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`btn-primary gap-1.5 transition-all duration-150 ${
          pressed ? "scale-95" : "hover:-translate-y-0.5 hover:shadow-lift"
        }`}
      >
        <Plus size={16} className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`} />
        <span className="hidden sm:inline">Quick Add</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 origin-top-right animate-scale-in rounded-xl border border-gray-100 bg-white py-1 shadow-lift dark:border-slate-700 dark:bg-slate-800"
        >
          {ACTIONS.map(({ label, to, icon: Icon }) => (
            <button
              key={label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(to);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              <Icon size={15} className="text-gray-400 dark:text-gray-500" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
