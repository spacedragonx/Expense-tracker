import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PieChart as PieChartIcon, BarChart3, Radar as RadarIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import dashboardApi, { SpendingByCategoryItem, TrendAggPoint } from "@/api/dashboardApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import { formatCurrency, formatMonthYear } from "@/utils/format";

const now = new Date();

/** Fallback swatches for categories that have no `color` set, cycled in order. */
const FALLBACK_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#64748b",
];

const TREND_RANGES = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
];

interface TrendSeriesPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
}

/** Builds a gap-free monthly series (oldest -> newest) from the two raw aggregation arrays. */
function buildTrendSeries(expenseTrend: TrendAggPoint[], incomeTrend: TrendAggPoint[], months: number) {
  const series: TrendSeriesPoint[] = [];
  const byKey = new Map<string, TrendSeriesPoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const point: TrendSeriesPoint = {
      key,
      label: d.toLocaleDateString(undefined, { month: "short" }),
      income: 0,
      expenses: 0,
    };
    byKey.set(key, point);
    series.push(point);
  }

  expenseTrend.forEach(({ _id, total }) => {
    const point = byKey.get(`${_id.y}-${_id.m}`);
    if (point) point.expenses = total;
  });
  incomeTrend.forEach(({ _id, total }) => {
    const point = byKey.get(`${_id.y}-${_id.m}`);
    if (point) point.income = total;
  });

  return series;
}

export default function Analytics() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryData, setCategoryData] = useState<SpendingByCategoryItem[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryChartType, setCategoryChartType] = useState<"donut" | "bar" | "radar">("donut");

  const [trendMonths, setTrendMonths] = useState(6);
  const [trendSeries, setTrendSeries] = useState<TrendSeriesPoint[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);

  const loadCategoryBreakdown = useCallback(async () => {
    setIsCategoryLoading(true);
    setCategoryError(null);
    try {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0, 23, 59, 59, 999);
      const { data } = await dashboardApi.spendingByCategory({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setCategoryData(data.data);
    } catch {
      setCategoryError("Couldn't load the category breakdown.");
    } finally {
      setIsCategoryLoading(false);
    }
  }, [month, year]);

  const loadTrend = useCallback(async (months: number) => {
    setIsTrendLoading(true);
    setTrendError(null);
    try {
      const { data } = await dashboardApi.trend({ months });
      setTrendSeries(buildTrendSeries(data.data.expenseTrend, data.data.incomeTrend, months));
    } catch {
      setTrendError("Couldn't load the trend.");
    } finally {
      setIsTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategoryBreakdown();
  }, [loadCategoryBreakdown]);

  useEffect(() => {
    loadTrend(trendMonths);
  }, [trendMonths, loadTrend]);

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const categoryTotal = useMemo(
    () => categoryData.reduce((sum, item) => sum + item.total, 0),
    [categoryData]
  );

  const trendTotals = useMemo(
    () =>
      trendSeries.reduce(
        (acc, point) => ({ income: acc.income + point.income, expenses: acc.expenses + point.expenses }),
        { income: 0, expenses: 0 }
      ),
    [trendSeries]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Spending trends and category breakdowns.</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Spending by category</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1 dark:border-slate-700">
              <button
                onClick={() => setCategoryChartType("donut")}
                aria-label="Donut chart"
                title="Donut chart"
                className={`rounded-lg p-1.5 transition-colors ${
                  categoryChartType === "donut"
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                }`}
              >
                <PieChartIcon size={15} />
              </button>
              <button
                onClick={() => setCategoryChartType("bar")}
                aria-label="Bar chart"
                title="Bar chart"
                className={`rounded-lg p-1.5 transition-colors ${
                  categoryChartType === "bar"
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 size={15} />
              </button>
              <button
                onClick={() => setCategoryChartType("radar")}
                aria-label="Radar chart"
                title="Radar chart"
                className={`rounded-lg p-1.5 transition-colors ${
                  categoryChartType === "radar"
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                }`}
              >
                <RadarIcon size={15} />
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 px-1 py-1 dark:border-slate-700">
              <button
                onClick={goToPreviousMonth}
                aria-label="Previous month"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                {formatMonthYear(month, year)}
              </span>
              <button
                onClick={goToNextMonth}
                aria-label="Next month"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {isCategoryLoading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : categoryError ? (
          <p className="py-10 text-center text-sm text-danger">{categoryError}</p>
        ) : categoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
              <PieChartIcon size={22} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No expenses recorded for {formatMonthYear(month, year)} yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {categoryChartType === "donut" ? (
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="category"
                      innerRadius={58}
                      outerRadius={90}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, _name: any, item: any) => [
                        formatCurrency(Number(value), currency),
                        item?.payload?.category,
                      ]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                  </PieChart>
                ) : categoryChartType === "bar" ? (
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.15} />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(value: any) => formatCurrency(Number(value), currency).replace(/\.00$/, "")}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      width={110}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value), currency)}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <RadarChart data={categoryData} outerRadius="75%">
                    <PolarGrid stroke="#94a3b8" opacity={0.25} />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Radar
                      dataKey="total"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.35}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value), currency)}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                  </RadarChart>
                )}
              </ResponsiveContainer>
            </div>

            <ul className="space-y-3">
              {categoryData.map((item, index) => {
                const percent = categoryTotal > 0 ? Math.round((item.total / categoryTotal) * 100) : 0;
                const color = item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                return (
                  <li key={item.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-gray-900 dark:text-gray-50">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <span>{formatCurrency(item.total, currency)}</span>
                      <span className="w-9 text-right text-xs">{percent}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Income vs expenses</h2>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1 dark:border-slate-700">
            {TREND_RANGES.map((range) => (
              <button
                key={range.months}
                onClick={() => setTrendMonths(range.months)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  trendMonths === range.months
                    ? "bg-primary-500 text-white"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {!isTrendLoading && !trendError && trendSeries.length > 0 && (
          <div className="mb-4 flex gap-6 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Income{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-50">
                {formatCurrency(trendTotals.income, currency)}
              </span>
            </span>
            <span>
              Expenses{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-50">
                {formatCurrency(trendTotals.expenses, currency)}
              </span>
            </span>
            <span>
              Net{" "}
              <span
                className={`font-semibold ${
                  trendTotals.income - trendTotals.expenses >= 0
                    ? "text-emerald-600 dark:text-emerald-500"
                    : "text-danger"
                }`}
              >
                {formatCurrency(trendTotals.income - trendTotals.expenses, currency)}
              </span>
            </span>
          </div>
        )}

        {isTrendLoading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : trendError ? (
          <p className="py-10 text-center text-sm text-danger">{trendError}</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.15} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(value: any) => formatCurrency(Number(value), currency).replace(/\.00$/, "")}
                  width={70}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
