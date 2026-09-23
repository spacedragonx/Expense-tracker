import { useMemo, useState } from "react";
import { BarChart3, PieChart as PieChartIcon, Radar as RadarIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { FALLBACK_COLORS } from "@/utils/categoryColors";
import { formatCurrency } from "@/utils/format";

/**
 * Demo charts for the landing page. Same chart types and interactions as the
 * Analytics page, but fed static sample data (no API, no auth). This module pulls
 * in Recharts, so the landing page loads it lazily and only near the viewport.
 */

type CategoryChart = "donut" | "bar" | "radar";

// Colours come from the app's shared, colour-blind-tested category palette.
const CATEGORIES = [
  { category: "Housing", total: 24000, color: FALLBACK_COLORS[3] }, // blue
  { category: "Food & Dining", total: 9800, color: FALLBACK_COLORS[4] }, // vermillion
  { category: "Shopping", total: 6400, color: FALLBACK_COLORS[5] }, // reddish purple
  { category: "Transport", total: 5200, color: FALLBACK_COLORS[0] }, // orange
  { category: "Health", total: 3100, color: FALLBACK_COLORS[2] }, // bluish green
];
const CATEGORY_TOTAL = CATEGORIES.reduce((sum, c) => sum + c.total, 0);

// Income/expenses use the palette's green and vermillion rather than green/red, which
// colour-blind viewers can't tell apart.
const LINE_COLORS = {
  light: { income: FALLBACK_COLORS[2], expenses: FALLBACK_COLORS[4], radar: "#0f766e" },
  dark: { income: FALLBACK_COLORS[2], expenses: FALLBACK_COLORS[4], radar: "#2dd4bf" },
};

const TREND_RANGES = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
];
const DEMO_INCOME = [62000, 64000, 63000, 66000, 65000, 70000, 68000, 72000, 71000, 74000, 73000, 78000];
const DEMO_EXPENSES = [41000, 44000, 39000, 47000, 43000, 52000, 45000, 49000, 46000, 51000, 48000, 50500];
// Last 12 month labels, oldest -> newest, evaluated once at module load.
const TREND = DEMO_INCOME.map((income, i) => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() - (DEMO_INCOME.length - 1 - i), 1);
  return { label: d.toLocaleDateString(undefined, { month: "short" }), income, expenses: DEMO_EXPENSES[i] };
});

const inr = (n: number) => formatCurrency(n).replace(/\.00$/, "");
const compactFmt = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const compactInr = (n: number) => `₹${compactFmt.format(n)}`;

const AXIS_TICK = { fontSize: 11, fill: "#94a3b8" };
const GRID_PROPS = { strokeDasharray: "3 3", stroke: "#94a3b8", opacity: 0.2 };

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const title = payload[0]?.payload?.category ?? label;
  return (
    <div className="lp-tip">
      {title !== undefined && <p>{title}</p>}
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name}>
          <span className="lp-dot" style={{ backgroundColor: (entry.color || entry.payload?.fill) as string }} />
          <span>{entry.name}:</span>
          <strong style={{ fontWeight: 500, color: "var(--text-primary)" }}>{inr(Number(entry.value))}</strong>
        </div>
      ))}
    </div>
  );
}

function CategoryCard() {
  const { resolvedTheme } = useTheme();
  const accent = LINE_COLORS[resolvedTheme].radar;
  const [type, setType] = useState<CategoryChart>("donut");
  const [hovered, setHovered] = useState<number | null>(null);

  const toggles: { id: CategoryChart; label: string; icon: JSX.Element }[] = [
    { id: "donut", label: "Donut chart", icon: <PieChartIcon size={14} /> },
    { id: "bar", label: "Bar chart", icon: <BarChart3 size={14} /> },
    { id: "radar", label: "Radar chart", icon: <RadarIcon size={14} /> },
  ];

  return (
    <div className="lp-dc">
      <div className="lp-dc-head">
        <h3 className="lp-dc-title">Spending by category</h3>
        <div className="lp-seg" role="group" aria-label="Chart type">
          {toggles.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={type === t.id}
              aria-label={t.label}
              title={t.label}
              onClick={() => setType(t.id)}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="lp-chart-h" role="img" aria-label="Demo chart of spending by category">
        <ResponsiveContainer width="100%" height="100%">
          {type === "donut" ? (
            <PieChart>
              <Pie
                data={CATEGORIES}
                dataKey="total"
                nameKey="category"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
                animationDuration={800}
                onMouseEnter={(_, index) => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              >
                {CATEGORIES.map((c, i) => (
                  <Cell
                    key={c.category}
                    fill={c.color}
                    fillOpacity={hovered === null || hovered === i ? 1 : 0.35}
                    style={{ cursor: "pointer", transition: "fill-opacity 150ms ease" }}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          ) : type === "bar" ? (
            <BarChart data={CATEGORIES} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
              <CartesianGrid {...GRID_PROPS} horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={compactInr} />
              <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} width={96} tick={AXIS_TICK} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="total" name="Spent" radius={[0, 6, 6, 0]} animationDuration={800}>
                {CATEGORIES.map((c) => (
                  <Cell key={c.category} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <RadarChart data={CATEGORIES} outerRadius="72%">
              <PolarGrid stroke="#94a3b8" opacity={0.25} />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar
                dataKey="total"
                name="Spent"
                stroke={accent}
                fill={accent}
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={800}
              />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      <ul className="lp-legend">
        {CATEGORIES.map((c, i) => (
          <li
            key={c.category}
            data-active={hovered === i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="lp-legend-name">
              <span className="lp-dot" style={{ backgroundColor: c.color }} />
              {c.category}
            </span>
            <span className="lp-legend-num">
              {inr(c.total)} · {Math.round((c.total / CATEGORY_TOTAL) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendCard() {
  const { resolvedTheme } = useTheme();
  const colors = LINE_COLORS[resolvedTheme];
  const [months, setMonths] = useState(6);

  const series = useMemo(() => TREND.slice(-months), [months]);
  const totals = useMemo(
    () =>
      series.reduce(
        (acc, p) => ({ income: acc.income + p.income, expenses: acc.expenses + p.expenses }),
        { income: 0, expenses: 0 }
      ),
    [series]
  );

  return (
    <div className="lp-dc">
      <div className="lp-dc-head">
        <h3 className="lp-dc-title">Income vs expenses</h3>
        <div className="lp-seg" role="group" aria-label="Time range">
          {TREND_RANGES.map((r) => (
            <button key={r.months} type="button" aria-pressed={months === r.months} onClick={() => setMonths(r.months)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="lp-summary">
        <span>
          Income <strong>{inr(totals.income)}</strong>
        </span>
        <span>
          Expenses <strong>{inr(totals.expenses)}</strong>
        </span>
        <span>
          Net <strong style={{ color: "var(--accent-secondary)" }}>{inr(totals.income - totals.expenses)}</strong>
        </span>
      </p>

      <div className="lp-chart-h-lg" role="img" aria-label="Demo chart of income versus expenses over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ left: 4, right: 18, top: 4, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ ...AXIS_TICK, fontSize: 12 }} interval={0} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ ...AXIS_TICK, fontSize: 12 }}
              tickFormatter={compactInr}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke={colors.income}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={colors.expenses}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function LandingCharts() {
  return (
    <div className="lp-charts">
      <CategoryCard />
      <TrendCard />
    </div>
  );
}
