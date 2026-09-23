import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PieChart as PieChartIcon, BarChart3, Radar as RadarIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
  TooltipProps,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import dashboardApi, { SpendingByCategoryItem, TrendAggPoint } from "@/api/dashboardApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import Odometer from "@/components/common/Odometer";
import { formatCurrency, formatMonthYear } from "@/utils/format";
import { categoryColor } from "@/utils/categoryColors";
import { Sector, Text } from "recharts";

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  const popOut = 6;
  const newCx = cx + popOut * Math.cos(-midAngle * RADIAN);
  const newCy = cy + popOut * Math.sin(-midAngle * RADIAN);

  return (
    <Sector
      cx={newCx}
      cy={newCy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ 
        filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))",
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    />
  );
};

const now = new Date();

const TREND_RANGES = [
  { label: "This month", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
];

interface TrendSeriesPoint {
  key: string;
  label: string;
  fullDate?: string;
  income: number;
  expenses: number;
}

/** Builds a gap-free monthly series (oldest -> newest) from the two raw aggregation arrays. */
function buildMonthlyTrendSeries(expenseTrend: TrendAggPoint[], incomeTrend: TrendAggPoint[], months: number) {
  const series: TrendSeriesPoint[] = [];
  const byKey = new Map<string, TrendSeriesPoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const point: TrendSeriesPoint = {
      key,
      label: d.toLocaleDateString(undefined, { month: "short" }),
      fullDate: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
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

/** Builds a gap-free day-by-day series for the specified month, 1st through end of month (or today if current month). */
function buildDailyTrendSeries(expenseTrend: TrendAggPoint[], incomeTrend: TrendAggPoint[], selectedMonth: number, selectedYear: number) {
  const series: TrendSeriesPoint[] = [];
  const byKey = new Map<string, TrendSeriesPoint>();
  
  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
  const lastDay = isCurrentMonth ? now.getDate() : new Date(selectedYear, selectedMonth, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(selectedYear, selectedMonth - 1, day);
    const key = `${selectedYear}-${selectedMonth}-${day}`;
    const point: TrendSeriesPoint = { 
      key, 
      label: String(day), 
      fullDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      income: 0, 
      expenses: 0 
    };
    byKey.set(key, point);
    series.push(point);
  }

  expenseTrend.forEach(({ _id, total }) => {
    const point = byKey.get(`${_id.y}-${_id.m}-${_id.d}`);
    if (point) point.expenses = total;
  });
  incomeTrend.forEach(({ _id, total }) => {
    const point = byKey.get(`${_id.y}-${_id.m}-${_id.d}`);
    if (point) point.income = total;
  });

  return series;
}

/** Shared tooltip: matches the card/dark-mode styling instead of Recharts' hardcoded light box. */
function ChartTooltip({ active, payload, label, currency }: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const tooltipTitle = payload[0]?.payload?.fullDate || label;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      {tooltipTitle !== undefined && <p className="mb-1 font-medium text-gray-900 dark:text-gray-50">{tooltipTitle}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: (entry.color || entry.payload?.fill) as string }} />
            <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-50">
              {formatCurrency(Number(entry.value), currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);

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

  const loadTrend = useCallback(async (trendMonthsCount: number, m: number, y: number) => {
    setIsTrendLoading(true);
    setTrendError(null);
    try {
      const { data } = await dashboardApi.trend({ months: trendMonthsCount, month: m, year: y });
      const series =
        data.data.granularity === "daily"
          ? buildDailyTrendSeries(data.data.expenseTrend, data.data.incomeTrend, m, y)
          : buildMonthlyTrendSeries(data.data.expenseTrend, data.data.incomeTrend, trendMonthsCount);
      setTrendSeries(series);
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
    loadTrend(trendMonths, month, year);
  }, [trendMonths, month, year, loadTrend]);

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
            <div className="relative h-64">
              <ResponsiveContainer width="100%" height="100%">
                {categoryChartType === "donut" ? (
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="category"
                      innerRadius={75}
                      outerRadius={110}
                      paddingAngle={2}
                      strokeWidth={0}
                      activeIndex={hoveredSliceIndex !== null ? hoveredSliceIndex : undefined}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, index) => setHoveredSliceIndex(index)}
                      onMouseLeave={() => setHoveredSliceIndex(null)}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={categoryColor(entry.color, index, entry.category)}
                          fillOpacity={hoveredSliceIndex === null || hoveredSliceIndex === index ? 1 : 0.35}
                          style={{ 
                            cursor: "pointer", 
                            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)" 
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                ) : categoryChartType === "bar" ? (
                  <BarChart 
                    data={categoryData} 
                    layout="vertical" 
                    margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                    onMouseMove={(e: any) => {
                      if (e && e.activeTooltipIndex !== undefined) {
                        setHoveredSliceIndex(e.activeTooltipIndex);
                      }
                    }}
                    onMouseLeave={() => setHoveredSliceIndex(null)}
                  >
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
                    <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={categoryColor(entry.color, index, entry.category)}
                          fillOpacity={hoveredSliceIndex === null || hoveredSliceIndex === index ? 1 : 0.35}
                          style={{ 
                            cursor: "pointer", 
                            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)" 
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <RadarChart 
                    data={categoryData} 
                    outerRadius="75%"
                    onMouseMove={(e: any) => {
                      if (e && e.activeTooltipIndex !== undefined) {
                        setHoveredSliceIndex(e.activeTooltipIndex);
                      }
                    }}
                    onMouseLeave={() => setHoveredSliceIndex(null)}
                  >
                    <PolarGrid stroke="#94a3b8" opacity={0.25} />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={(props: any) => {
                        const { payload, x, y, cx, cy, ...rest } = props;
                        const index = categoryData.findIndex((c) => c.category === payload.value);
                        const isHovered = hoveredSliceIndex === index;
                        return (
                          <Text 
                            {...rest} 
                            x={x} y={y} cx={cx} cy={cy} 
                            fill={isHovered ? "#8b5cf6" : "#94a3b8"} 
                            fontSize={10} 
                            fontWeight={isHovered ? "bold" : "normal"}
                            className="transition-colors duration-300"
                          >
                            {payload.value}
                          </Text>
                        );
                      }} 
                    />
                    <Radar
                      dataKey="total"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.35}
                      strokeWidth={2}
                      activeDot={false}
                      dot={(props: any) => {
                        const { cx, cy, index } = props;
                        const isHovered = hoveredSliceIndex === index;
                        return (
                          <circle 
                            key={`dot-${index}`}
                            cx={cx} 
                            cy={cy} 
                            r={isHovered ? 5 : 0} 
                            fill="#8b5cf6" 
                            stroke="#fff" 
                            strokeWidth={2} 
                            style={{ transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)" }}
                          />
                        );
                      }}
                    />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                  </RadarChart>
                )}
              </ResponsiveContainer>
              
              {categoryChartType === "donut" && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="h-5 w-full flex items-center justify-center overflow-hidden mb-1">
                    <AnimatePresence mode="popLayout">
                      <motion.p
                        key={hoveredSliceIndex !== null ? categoryData[hoveredSliceIndex].category : "total"}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[100px]"
                      >
                        {hoveredSliceIndex !== null ? categoryData[hoveredSliceIndex].category : "Total"}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    <Odometer
                      value={hoveredSliceIndex !== null ? categoryData[hoveredSliceIndex].total : categoryTotal}
                      currency={currency}
                    />
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-3">
              {categoryData.map((item, index) => {
                const percent = categoryTotal > 0 ? Math.round((item.total / categoryTotal) * 100) : 0;
                const color = categoryColor(item.color, index, item.category);
                return (
                  <li
                    key={item.category}
                    onMouseEnter={() => setHoveredSliceIndex(index)}
                    onMouseLeave={() => setHoveredSliceIndex(null)}
                    className={`flex items-center justify-between rounded-lg px-1.5 py-1 text-sm transition-colors ${
                      hoveredSliceIndex === index ? "bg-gray-50 dark:bg-slate-800" : ""
                    }`}
                  >
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
                  interval={trendMonths === 1 ? "preserveStartEnd" : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(value: any) => formatCurrency(Number(value), currency).replace(/\.00$/, "")}
                  width={70}
                />
                <Tooltip
                  content={<ChartTooltip currency={currency} />}
                  cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
