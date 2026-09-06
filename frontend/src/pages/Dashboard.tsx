import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import dashboardApi from "@/api/dashboardApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { formatCurrency } from "@/utils/format";
import type { DashboardSummary } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .summary()
      .then(({ data }) => {
        if (!cancelled) setSummary(data.data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your dashboard right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard…</p>;
  }

  if (error || !summary) {
    return <p className="text-sm text-danger">{error || "No data available yet."}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here's how things look this month.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total balance"
          value={formatCurrency(summary.totalBalance, currency)}
          icon={Wallet}
        />
        <SummaryCard
          label="Monthly income"
          value={formatCurrency(summary.monthlyIncome, currency)}
          icon={TrendingUp}
          tone="positive"
        />
        <SummaryCard
          label="Monthly expenses"
          value={formatCurrency(summary.monthlyExpenses, currency)}
          icon={TrendingDown}
          tone="negative"
        />
        <SummaryCard
          label="Monthly savings"
          value={formatCurrency(summary.monthlySavings, currency)}
          icon={PiggyBank}
        />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">Recent transactions</h2>
        {summary.recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {summary.recentTransactions.map((tx) => (
              <li key={tx._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{tx.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={
                    tx.type === "income"
                      ? "font-medium text-emerald-600 dark:text-emerald-500"
                      : "font-medium text-gray-900 dark:text-gray-50"
                  }
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
