import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, Wallet, Target, AlertTriangle } from "lucide-react";
import dashboardApi, { SpendingByCategoryItem, TrendResponse } from "@/api/dashboardApi";
import goalApi from "@/api/goalApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import { HeroBalanceSkeleton, ActivityFeedSkeleton, MetricSkeleton, Skeleton } from "@/components/common/Skeleton";
import HeroBalance from "@/components/dashboard/HeroBalance";
import MetricsRow from "@/components/dashboard/MetricsRow";
import FinancialPulse from "@/components/dashboard/FinancialPulse";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CategorySplit from "@/components/dashboard/CategorySplit";
import GoalsWidget from "@/components/dashboard/GoalsWidget";
import { buildMonthlySeries, monthOverMonthChange } from "@/utils/trend";
import type { DashboardSummary, Goal } from "@/types";

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";
  const firstName = user?.name?.split(" ")[0];

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const [categories, setCategories] = useState<SpendingByCategoryItem[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    dashboardApi
      .summary()
      .then(({ data }) => {
        if (!cancelled) setSummary(data.data);
      })
      .catch(() => {
        if (!cancelled) setSummaryError("Couldn't load your dashboard right now.");
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    dashboardApi
      .trend({ months: 6 })
      .then(({ data }) => {
        if (!cancelled) setTrend(data.data);
      })
      .catch(() => {
        if (!cancelled) setTrend({ expenseTrend: [], incomeTrend: [], granularity: "monthly" });
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    dashboardApi
      .spendingByCategory({ from: monthStart })
      .then(({ data }) => {
        if (!cancelled) setCategories(data.data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });

    goalApi
      .list()
      .then(({ data }) => {
        if (!cancelled) setGoals(data.data);
      })
      .catch(() => {
        if (!cancelled) setGoals([]);
      })
      .finally(() => {
        if (!cancelled) setGoalsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const topCategory = categories[0] ?? null;
  const series = trend ? buildMonthlySeries(trend) : [];
  const changePercent = trend ? monthOverMonthChange(series, "net") : null;
  const savingsRate =
    summary && summary.monthlyIncome > 0 ? (summary.monthlySavings / summary.monthlyIncome) * 100 : null;

  if (summaryError) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
        <AlertTriangle size={16} className="shrink-0" />
        {summaryError}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* MAIN — hero balance, spending overview, recent activity (~70-75%) */}
      <div className="space-y-6">
        {summaryLoading || !summary ? (
          <HeroBalanceSkeleton />
        ) : (
          <HeroBalance
            totalBalance={summary.totalBalance}
            changePercent={trendLoading ? null : changePercent}
            series={series}
            currency={currency}
            greeting={`${greetingForNow()}${firstName ? `, ${firstName}` : ""}`}
          />
        )}

        {summaryLoading || !summary ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        ) : (
          <MetricsRow
            income={summary.monthlyIncome}
            expenses={summary.monthlyExpenses}
            savingsRate={savingsRate}
            currency={currency}
          />
        )}

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">Spending overview</h2>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Income vs. expenses over the last 6 months</p>
          {trendLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : <SpendingChart series={series} currency={currency} />}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">Recent activity</h2>
          {summaryLoading || !summary ? (
            <ActivityFeedSkeleton />
          ) : (
            <ActivityFeed transactions={summary.recentTransactions} currency={currency} />
          )}
        </Card>
      </div>

      {/* SUPPORT — insights, goals, quick actions (~25-30%) */}
      <div className="space-y-6">
        {trendLoading || categoryLoading ? (
          <div className="card-subtle space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <FinancialPulse series={series} topCategory={topCategory} currency={currency} />
        )}

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Where it went</h2>
            <Link to="/analytics" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-500">
              Details
            </Link>
          </div>
          {categoryLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <CategorySplit data={categories} currency={currency} />
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Goals</h2>
            <Link to="/goals" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-500">
              Manage
            </Link>
          </div>
          {goalsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <GoalsWidget goals={goals} currency={currency} />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Quick actions</h2>
          <div className="space-y-1.5">
            <QuickActionLink to="/expenses?add=1" label="Add expense" icon={Receipt} />
            <QuickActionLink to="/income?add=1" label="Add income" icon={Wallet} />
            <QuickActionLink to="/goals" label="Add goal" icon={Target} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickActionLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Receipt }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
        <Icon size={15} />
      </span>
      {label}
    </Link>
  );
}
