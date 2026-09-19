import { Sparkles, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import type { MonthPoint } from "@/utils/trend";
import type { SpendingByCategoryItem } from "@/api/dashboardApi";

interface FinancialPulseProps {
  series: MonthPoint[];
  topCategory: SpendingByCategoryItem | null;
  currency: string;
}

/**
 * Small "intelligent" insight surface. Derives its message from data already
 * fetched for the dashboard (monthly trend + category breakdown) rather than
 * a separate insights endpoint, so it stays lightweight and in sync.
 */
export default function FinancialPulse({ series, topCategory, currency }: FinancialPulseProps) {
  const curr = series[series.length - 1];
  const prev = series[series.length - 2];

  let headline = "Your financial pulse";
  let body = "Keep logging transactions to start seeing personalized insights here.";
  let supporting: string | null = null;
  let Icon = Sparkles;
  let trendTone: "positive" | "negative" | "neutral" = "neutral";

  if (curr && prev) {
    const delta = curr.expense - prev.expense;
    const percent = prev.expense ? (Math.abs(delta) / prev.expense) * 100 : null;

    if (delta < 0) {
      headline = "You're spending less this month";
      Icon = TrendingDown;
      trendTone = "positive";
    } else if (delta > 0) {
      headline = "You're spending more this month";
      Icon = TrendingUp;
      trendTone = "negative";
    } else {
      headline = "Your spending is steady this month";
    }

    supporting = `${formatCurrency(curr.expense, currency)} spent${
      percent !== null ? ` · ${delta <= 0 ? "↓" : "↑"} ${percent.toFixed(0)}% vs last month` : ""
    }`;

    body = topCategory
      ? `Most of it went to ${topCategory.category}.`
      : "Add a category to your expenses to see where it's going.";
  }

  const toneClasses =
    trendTone === "positive"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
      : trendTone === "negative"
        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500"
        : "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500";

  return (
    <div className="card-subtle p-4 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses}`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Financial pulse
          </p>
          <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-50">{headline}</p>
          {supporting && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{supporting}</p>}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{body}</p>
          <Link
            to="/analytics"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            View insights
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
