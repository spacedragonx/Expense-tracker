import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency } from "@/utils/format";
import { categoryColor } from "@/utils/categoryColors";
import type { SpendingByCategoryItem } from "@/api/dashboardApi";

interface CategorySplitProps {
  data: SpendingByCategoryItem[];
  currency: string;
}

interface Slice {
  category: string;
  total: number;
  fill: string;
}

/** Collapses the long tail into a single "Other" slice so the donut stays readable. */
function toSlices(data: SpendingByCategoryItem[]): Slice[] {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const head = sorted.slice(0, 5).map((item, index) => ({
    category: item.category,
    total: item.total,
    fill: categoryColor(item.color, index, item.category),
  }));
  const tail = sorted.slice(5);
  if (tail.length === 0) return head;
  return [
    ...head,
    { category: "Other", total: tail.reduce((sum, item) => sum + item.total, 0), fill: "#94a3b8" },
  ];
}

function CategoryTooltip({
  active,
  payload,
  currency,
  total,
}: {
  active?: boolean;
  payload?: { payload: Slice }[];
  currency: string;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  const percent = total > 0 ? Math.round((slice.total / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lift dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-medium text-gray-900 dark:text-gray-50">{slice.category}</p>
      <p className="text-gray-500 dark:text-gray-400">
        {formatCurrency(slice.total, currency)} · {percent}%
      </p>
    </div>
  );
}

/** At-a-glance view of where this month's spending went. Analytics has the full drill-down. */
export default function CategorySplit({ data, currency }: CategorySplitProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="No spending yet"
        description="Log an expense with a category to see where your money is going."
      />
    );
  }

  const slices = toSlices(data);
  const total = slices.reduce((sum, slice) => sum + slice.total, 0);

  return (
    <div>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="category"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive
              animationDuration={800}
            >
              {slices.map((slice) => (
                <Cell key={slice.category} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip currency={currency} total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">This month</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.category} className="flex items-center justify-between text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
              <span className="truncate text-gray-600 dark:text-gray-300">{slice.category}</span>
            </span>
            <span className="shrink-0 text-gray-500 dark:text-gray-400">
              {total > 0 ? Math.round((slice.total / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
