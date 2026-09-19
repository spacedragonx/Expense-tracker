import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import EmptyState from "@/components/common/EmptyState";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/format";
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
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lift dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-medium text-gray-900 dark:text-gray-50">{point.label}</p>
      <p className="text-emerald-600 dark:text-emerald-500">Income {formatCurrency(point.income, currency)}</p>
      <p className="text-rose-500 dark:text-rose-400">Expenses {formatCurrency(point.expense, currency)}</p>
    </div>
  );
}

/** Income vs. expense overview — one of the dashboard's visual anchors. */
export default function SpendingChart({ series, currency }: SpendingChartProps) {
  if (series.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Nothing to chart yet"
        description="Once you log a few expenses and income entries, your spending overview will appear here."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> Expenses
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" className="stroke-gray-100 dark:stroke-slate-800" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-gray-400 dark:text-gray-500"
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
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#incomeGradient)"
              isAnimationActive
              animationDuration={800}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#fb7185"
              strokeWidth={2}
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
