import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import EmptyState from "@/components/common/EmptyState";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useTheme } from "@/context/ThemeContext";
import type { MonthPoint } from "@/utils/trend";

interface SpendingChartProps {
  series: MonthPoint[];
  currency: string;
}

function SpendingTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: MonthPoint }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-sm dark:rounded-lg border border-ash bg-white px-3 py-2 text-xs shadow-editorial dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-medium text-graphite dark:text-gray-50">{point.label}</p>
      <p className="text-brass dark:text-emerald-500">Income {formatCurrency(point.income, currency)}</p>
      <p className="text-ember dark:text-rose-400">Expenses {formatCurrency(point.expense, currency)}</p>
    </div>
  );
}

/** Income vs. expense overview — one of the dashboard's visual anchors. */
export default function SpendingChart({ series, currency }: SpendingChartProps) {
  const { resolvedTheme } = useTheme();

  if (series.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Nothing to chart yet"
        description="Once you log a few expenses and income entries, your spending overview will appear here."
      />
    );
  }

  const incomeColor = resolvedTheme === "dark" ? "#10b981" : "#816729"; // Emerald / Brass
  const expenseColor = resolvedTheme === "dark" ? "#fb7185" : "#FF682C"; // Rose / Ember

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-graphite/60 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brass dark:bg-emerald-500" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ember dark:bg-rose-400" /> Expenses
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={incomeColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={incomeColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={expenseColor} stopOpacity={0.1} />
                <stop offset="100%" stopColor={expenseColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" className="stroke-ash dark:stroke-slate-800" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-graphite/40 dark:text-gray-500"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={0}
              tick={false}
            />
            <Tooltip content={<SpendingTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke={incomeColor}
              strokeWidth={1.5}
              fill="url(#incomeGradient)"
              isAnimationActive
              animationDuration={800}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke={expenseColor}
              strokeWidth={1.5}
              fill="url(#expenseGradient)"
              isAnimationActive
              animationDuration={800}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
