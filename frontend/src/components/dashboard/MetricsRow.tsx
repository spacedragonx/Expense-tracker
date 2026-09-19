import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "positive" | "negative" | "neutral";
}

interface MetricsRowProps {
  income: number;
  expenses: number;
  savingsRate: number | null; // percent, 0-100, or null if undeterminable
  currency: string;
}

const TONE_CLASSES: Record<Metric["tone"], string> = {
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
  negative: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  neutral: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-500",
};

/**
 * Compact supporting-metrics row (income / expenses / savings rate).
 * Deliberately smaller than the old 4-equal-card layout so Total Balance
 * (HeroBalance) stays the dashboard's clear visual anchor.
 */
export default function MetricsRow({ income, expenses, savingsRate, currency }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <MetricCell
        label="Income this month"
        display={formatCurrency(income, currency)}
        tone="positive"
        iconLabel="↑"
      />
      <MetricCell
        label="Expenses this month"
        display={formatCurrency(expenses, currency)}
        tone="negative"
        iconLabel="↓"
      />
      <MetricCell
        label="Savings rate"
        display={savingsRate === null ? "—" : `${savingsRate.toFixed(0)}%`}
        tone="neutral"
        iconLabel="%"
      />
    </div>
  );
}

function MetricCell({
  label,
  display,
  tone,
  iconLabel,
}: {
  label: string;
  display: string;
  tone: Metric["tone"];
  iconLabel: string;
}) {
  return (
    <div className="card flex items-center gap-3 !p-3.5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${TONE_CLASSES[tone]}`}>
        {iconLabel}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-50">{display}</p>
      </div>
    </div>
  );
}
