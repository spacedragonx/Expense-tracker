import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

/**
 * Friendly, compact empty state used in place of a big blank card.
 * Intentionally small — the redesign goal is fewer, quieter empty spaces.
 */
export default function EmptyState({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${compact ? "py-6" : "py-10"}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
        <Icon size={18} />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{title}</p>
      <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
