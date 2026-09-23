import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useTheme } from "@/context/ThemeContext";
import type { MonthPoint } from "@/utils/trend";

interface HeroBalanceProps {
  totalBalance: number;
  changePercent: number | null;
  series: MonthPoint[];
  currency: string;
  greeting: string;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-sm dark:rounded-lg border border-ash bg-white px-3 py-2 text-xs shadow-editorial dark:border-slate-700 dark:bg-slate-800">
      <p className="font-medium text-graphite dark:text-gray-50">{point.label}</p>
      <p className="text-graphite/60 dark:text-gray-400">
        Net {point.net >= 0 ? "+" : ""}
        {Math.round(point.net).toLocaleString()}
      </p>
    </div>
  );
}

/**
 * The dashboard's primary visual anchor: large balance figure, month-over-month
 * change indicator, and a smooth net-position area chart beneath it.
 */
export default function HeroBalance({ totalBalance, changePercent, series, currency, greeting }: HeroBalanceProps) {
  const { resolvedTheme } = useTheme();
  const isPositiveChange = (changePercent ?? 0) >= 0;
  const hasSeries = series.length >= 2;

  // Use ember color for light mode, fallback to emerald for dark mode in Recharts
  const chartColor = resolvedTheme === "dark" ? "#10b981" : "#FF682C"; 

  return (
    <div className="card dark:glow-emerald animate-fade-in-up">
      <p className="text-sm text-graphite/60 dark:text-gray-400">{greeting}</p>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span className="text-4xl font-display font-semibold tracking-tight text-graphite dark:text-gray-50 sm:text-5xl">
          {formatCurrency(totalBalance, currency)}
        </span>
        {changePercent !== null && (
          <span
            className={`mb-1.5 inline-flex items-center gap-0.5 rounded-sm dark:rounded-full px-2 py-0.5 text-xs font-semibold ${
              isPositiveChange
                ? "bg-fog text-graphite dark:bg-emerald-500/10 dark:text-emerald-500"
                : "bg-fog text-ember dark:bg-rose-500/10 dark:text-rose-400"
            }`}
          >
            {isPositiveChange ? <ArrowUpRight size={13} strokeWidth={1.5} /> : <ArrowDownRight size={13} strokeWidth={1.5} />}
            {Math.abs(changePercent).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-graphite/40 dark:text-gray-500">Total balance · net position this month</p>

      <div className="mt-6 h-40 sm:h-48">
        {hasSeries ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="heroBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-gray-400 dark:text-gray-500"
                interval="preserveStartEnd"
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: chartColor, strokeOpacity: 0.1, strokeWidth: 24 }} />
              <Area
                type="monotone"
                dataKey="net"
                stroke={chartColor}
                strokeWidth={1.5}
                fill="url(#heroBalanceGradient)"
                isAnimationActive
                animationDuration={700}
                dot={false}
                activeDot={{ r: 4, fill: chartColor, stroke: "white", strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md dark:rounded-xl border border-dashed border-ash dark:border-slate-700">
            <p className="text-xs text-graphite/40 dark:text-gray-500">
              Add a few transactions to see your balance trend here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
