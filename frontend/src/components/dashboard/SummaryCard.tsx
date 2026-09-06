import { LucideIcon } from "lucide-react";
import Card from "@/components/common/Card";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "negative";
}

const TONE_CLASSES: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
  neutral: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-500",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
  negative: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-500",
};

/** Single stat tile used across the dashboard summary row. */
export default function SummaryCard({ label, value, icon: Icon, tone = "neutral" }: SummaryCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{value}</p>
      </div>
    </Card>
  );
}
