import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import expenseApi from "@/api/expenseApi";
import incomeApi from "@/api/incomeApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import { fetchAllPages } from "@/utils/fetchAllPages";
import { downloadCsv } from "@/utils/csv";
import { formatCurrency, formatDate, formatMonthYear } from "@/utils/format";
import type { Expense, Income } from "@/types";

const now = new Date();

type Period = "monthly" | "yearly";

const PERIOD_TABS: { value: Period; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

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

type Row = (Expense & { kind: "expense" }) | (Income & { kind: "income" });

function categoryLabel(category: Expense["category"]) {
  return typeof category === "string" ? "Uncategorized" : category.name;
}

function categoryColor(category: Expense["category"]) {
  return typeof category === "string" ? undefined : category.color;
}

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  const [period, setPeriod] = useState<Period>("monthly");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { from, to, label } = useMemo(() => {
    if (period === "monthly") {
      return {
        from: new Date(year, month - 1, 1),
        to: new Date(year, month, 0, 23, 59, 59, 999),
        label: formatMonthYear(month, year),
      };
    }
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31, 23, 59, 59, 999),
      label: String(year),
    };
  }, [period, month, year]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fromIso = from.toISOString();
      const toIso = to.toISOString();
      const [expenseList, incomeList] = await Promise.all([
        fetchAllPages<Expense>((page, limit) => expenseApi.list({ page, limit, from: fromIso, to: toIso, sort: "-date" })),
        fetchAllPages<Income>((page, limit) => incomeApi.list({ page, limit, from: fromIso, to: toIso, sort: "-date" })),
      ]);
      setExpenses(expenseList);
      setIncome(incomeList);
    } catch {
      setError("Couldn't load the report for this period.");
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const goToPrevious = () => {
    if (period === "monthly") {
      if (month === 1) {
        setMonth(12);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    } else {
      setYear((y) => y - 1);
    }
  };

  const goToNext = () => {
    if (period === "monthly") {
      if (month === 12) {
        setMonth(1);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    } else {
      setYear((y) => y + 1);
    }
  };

  const totalIncome = useMemo(() => income.reduce((sum, i) => sum + i.amount, 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const net = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; color?: string; total: number }>();
    expenses.forEach((expense) => {
      const name = categoryLabel(expense.category);
      const existing = map.get(name);
      if (existing) {
        existing.total += expense.amount;
      } else {
        map.set(name, { name, color: categoryColor(expense.category), total: expense.amount });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const rows = useMemo<Row[]>(() => {
    return [
      ...expenses.map((e) => ({ ...e, kind: "expense" as const })),
      ...income.map((i) => ({ ...i, kind: "income" as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, income]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const header = ["Date", "Type", "Title", "Category / Source", "Payment Method", "Amount", "Currency", "Notes"];
      const csvRows = rows.map((row) => [
        formatDate(row.date),
        row.kind === "expense" ? "Expense" : "Income",
        row.title,
        row.kind === "expense" ? categoryLabel(row.category) : row.source,
        row.kind === "expense" ? row.paymentMethod : "",
        row.amount.toFixed(2),
        row.currency || currency,
        row.notes || "",
      ]);
      const filename = period === "monthly" ? `report-${year}-${String(month).padStart(2, "0")}.csv` : `report-${year}.csv`;
      downloadCsv(filename, [header, ...csvRows]);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Export monthly and yearly financial summaries.</p>
        </div>
        <Button
          onClick={handleExport}
          variant="secondary"
          disabled={isLoading || Boolean(error) || rows.length === 0 || isExporting}
          className="gap-1.5"
        >
          <Download size={15} />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 p-0.5 dark:border-slate-700">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPeriod(tab.value)}
              className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                period === tab.value
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-200 px-1 py-1 dark:border-slate-700">
          <button
            onClick={goToPrevious}
            aria-label="Previous period"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-sm font-medium text-gray-900 dark:text-gray-50">{label}</span>
          <button
            onClick={goToNext}
            aria-label="Next period"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-danger">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Income</p>
              <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-500">
                {formatCurrency(totalIncome, currency)}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Expenses</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-50">
                {formatCurrency(totalExpenses, currency)}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Net savings</p>
              <p className={`mt-1 text-xl font-semibold ${net >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-danger"}`}>
                {formatCurrency(net, currency)}
                <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                  ({savingsRate}% of income)
                </span>
              </p>
            </Card>
          </div>

          {categoryBreakdown.length > 0 && (
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">Spending by category</h2>
              <ul className="space-y-3">
                {categoryBreakdown.map((item, index) => {
                  const percent = totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0;
                  const color = item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                  return (
                    <li key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2.5 font-medium text-gray-900 dark:text-gray-50">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          {item.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.total, currency)} · {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card className="!p-0">
            <h2 className="px-5 pb-3 pt-5 text-sm font-semibold text-gray-900 dark:text-gray-50">
              Transactions ({rows.length})
            </h2>
            {rows.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">No transactions for this period.</p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto dark:divide-slate-700">
                {rows.map((row) => (
                  <li key={`${row.kind}-${row._id}`} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{row.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(row.date)} · {row.kind === "expense" ? categoryLabel(row.category) : row.source}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        row.kind === "income" ? "text-emerald-600 dark:text-emerald-500" : "text-gray-900 dark:text-gray-50"
                      }`}
                    >
                      {row.kind === "income" ? "+" : "-"}
                      {formatCurrency(row.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
