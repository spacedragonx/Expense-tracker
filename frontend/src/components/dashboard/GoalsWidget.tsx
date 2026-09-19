import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency } from "@/utils/format";
import { resolveCategoryIcon } from "@/utils/categoryIcon";
import type { Goal } from "@/types";

interface GoalsWidgetProps {
  goals: Goal[];
  currency: string;
}

function GoalBar({ goal, currency }: { goal: Goal; currency: string }) {
  const [width, setWidth] = useState(0);
  const Icon = resolveCategoryIcon(goal.icon, "expense");
  const pct = Math.min(100, Math.max(0, goal.progressPercent));
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  useEffect(() => {
    // Animate from 0 -> actual value on mount rather than snapping in.
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="group rounded-xl p-2 -mx-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-transform duration-150 group-hover:scale-105 dark:bg-primary-500/10 dark:text-primary-500">
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{goal.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">{pct.toFixed(0)}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      {!goal.isCompleted && (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {formatCurrency(remaining, currency)} remaining
        </p>
      )}
    </div>
  );
}

/** Compact goal-progress list. Shows up to 3 goals, prioritizing incomplete ones. */
export default function GoalsWidget({ goals, currency }: GoalsWidgetProps) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Set a savings goal to stay motivated and track your progress."
        action={
          <Link to="/goals" className="btn-secondary">
            Create a goal
          </Link>
        }
        compact
      />
    );
  }

  const visible = [...goals].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)).slice(0, 3);

  return (
    <div className="space-y-1">
      {visible.map((goal) => (
        <GoalBar key={goal._id} goal={goal} currency={currency} />
      ))}
      {goals.length > 3 && (
        <Link
          to="/goals"
          className="block pt-2 text-center text-xs font-medium text-primary-600 hover:underline dark:text-primary-500"
        >
          View all goals
        </Link>
      )}
    </div>
  );
}
