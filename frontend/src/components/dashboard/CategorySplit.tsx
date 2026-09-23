import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import EmptyState from "@/components/common/EmptyState";
import Odometer from "@/components/common/Odometer";
import { categoryColor } from "@/utils/categoryColors";
import type { SpendingByCategoryItem } from "@/api/dashboardApi";
import { Sector } from "recharts";

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  // Shift out by 8px
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

/** At-a-glance view of where this month's spending went. Analytics has the full drill-down. */
export default function CategorySplit({ data, currency }: CategorySplitProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    <div className="flex items-center gap-6">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="category"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={2}
              strokeWidth={0}
              activeIndex={hoveredIndex !== null ? hoveredIndex : undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {slices.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={entry.fill}
                  fillOpacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.35}
                  style={{ 
                    cursor: "pointer", 
                    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)" 
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
          <div className="h-4 w-full flex items-center justify-center overflow-hidden mb-0.5">
            <AnimatePresence mode="popLayout">
              <motion.p
                key={hoveredIndex !== null ? slices[hoveredIndex].category : "total"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] uppercase tracking-wider text-graphite/60 dark:text-gray-400 line-clamp-1 max-w-[80px]"
              >
                {hoveredIndex !== null ? slices[hoveredIndex].category : "Total"}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="text-xs font-semibold text-graphite dark:text-gray-50">
            <Odometer
              value={hoveredIndex !== null ? slices[hoveredIndex].total : total}
              currency={currency}
            />
          </p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {slices.map((slice, index) => {
          const isActive = hoveredIndex === index;
          const isFaded = hoveredIndex !== null && !isActive;

          return (
            <li 
              key={slice.category} 
              className={`flex items-center justify-between text-xs transition-all duration-300 cursor-default ${isFaded ? 'opacity-40' : 'opacity-100'}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span 
                  className={`h-2 w-2 shrink-0 rounded-full transition-transform duration-300 ${isActive ? 'scale-125' : 'scale-100'}`} 
                  style={{ backgroundColor: slice.fill }} 
                />
                <span className={`truncate transition-colors duration-300 ${isActive ? 'font-medium text-graphite dark:text-gray-50' : 'text-graphite/80 dark:text-gray-300'}`}>
                  {slice.category}
                </span>
              </span>
              <span className={`shrink-0 transition-colors duration-300 ${isActive ? 'font-medium text-graphite dark:text-gray-50' : 'text-graphite/60 dark:text-gray-400'}`}>
                {total > 0 ? Math.round((slice.total / total) * 100) : 0}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
