import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Receipt, TrendingUp } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency } from "@/utils/format";
import { resolveCategoryIcon, resolveCategoryColor, getCategoryFromField } from "@/utils/categoryIcon";
import type { DashboardSummary, Expense, Income, IncomeSource } from "@/types";

type Transaction = DashboardSummary["recentTransactions"][number];

// `Transaction` is `(Expense | Income) & { type }` — the `type` tag doesn't
// discriminate the union for the compiler (it's added uniformly to both
// sides), so branch-specific fields (category, source) need an explicit
// narrowing cast rather than a plain property access.
const asExpense = (tx: Transaction) => tx as unknown as Expense;
const asIncome = (tx: Transaction) => tx as unknown as Income;

interface ActivityFeedProps {
  transactions: Transaction[];
  currency: string;
}

const SOURCE_LABEL: Record<IncomeSource, string> = {
  salary: "Salary",
  freelance: "Freelance",
  investments: "Investments",
  business: "Business",
  other: "Other income",
};

function dayBucket(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Polished activity feed: grouped by day, with category icon chips and income/expense treatment. */
export default function ActivityFeed({ transactions, currency }: ActivityFeedProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Start tracking your first expense to see your spending patterns here."
        action={
          <Link to="/expenses" className="btn-primary">
            Add expense
          </Link>
        }
      />
    );
  }

  // `order` is the flat position across all groups so the entry stagger keeps
  // running across day buckets instead of restarting at each heading.
  const groups: { bucket: string; items: { tx: Transaction; order: number }[] }[] = [];
  transactions.forEach((tx, order) => {
    const bucket = dayBucket(tx.date);
    const group = groups.find((g) => g.bucket === bucket);
    if (group) group.items.push({ tx, order });
    else groups.push({ bucket, items: [{ tx, order }] });
  });

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.bucket}>
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-graphite/40 dark:text-gray-500">
            {group.bucket}
          </p>
          <ul className="divide-y divide-ash dark:divide-slate-700/60">
            {group.items.map(({ tx, order }) => {
              const isIncome = tx.type === "income";
              const category = !isIncome ? getCategoryFromField(asExpense(tx).category) : null;
              const Icon = isIncome ? TrendingUp : resolveCategoryIcon(category?.icon, "expense");
              const iconColor = isIncome ? "#10b981" : resolveCategoryColor(category?.color, category?.name || tx.title);
              const subLabel = isIncome
                ? SOURCE_LABEL[asIncome(tx).source as IncomeSource] || "Income"
                : category?.name || "Uncategorized";

              return (
                <motion.li
                  key={tx._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(order * 0.03, 0.24), ease: "easeOut" }}
                  className="group flex items-center gap-3 px-1 py-2.5 transition-colors hover:bg-fog dark:hover:bg-slate-800/60"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm dark:rounded-xl transition-transform duration-150 group-hover:scale-105"
                    style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-graphite dark:text-gray-50">{tx.title}</p>
                    <p className="truncate text-xs text-graphite/60 dark:text-gray-400">
                      {subLabel} · {new Date(tx.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      isIncome ? "text-brass dark:text-emerald-500" : "text-graphite dark:text-gray-300"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      ))}

      <Link
        to="/expenses"
        className="block pt-1 text-center text-xs font-medium text-graphite/60 hover:text-graphite hover:underline dark:text-primary-500"
      >
        View all transactions
      </Link>
    </div>
  );
}
