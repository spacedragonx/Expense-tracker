import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import expenseApi from "@/api/expenseApi";
import incomeApi from "@/api/incomeApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import Modal from "@/components/common/Modal";
import { fetchAllPages } from "@/utils/fetchAllPages";
import { formatCurrency, formatMonthYear, toDateInputValue } from "@/utils/format";
import type { Expense, Income } from "@/types";

const now = new Date();
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayTransaction =
  | (Expense & { kind: "expense" })
  | (Income & { kind: "income" });

interface DayCell {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  income: number;
  expenses: number;
  transactions: DayTransaction[];
}

/** Always a full 6-week (42-day) grid, Sunday-first, so the layout height never jumps between months. */
function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

function categoryLabel(category: Expense["category"]) {
  return typeof category === "string" ? "—" : category.name;
}

export default function CalendarView() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = new Date(year, month - 1, 1).toISOString();
      const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

      const [expenseList, incomeList] = await Promise.all([
        fetchAllPages<Expense>((page, limit) => expenseApi.list({ page, limit, from, to, sort: "-date" })),
        fetchAllPages<Income>((page, limit) => incomeApi.list({ page, limit, from, to, sort: "-date" })),
      ]);
      setExpenses(expenseList);
      setIncome(incomeList);
    } catch {
      setError("Couldn't load this month's transactions.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedKey(null);
  }, [month, year]);

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

  const days = useMemo<DayCell[]>(() => {
    const todayKey = toDateInputValue(now);
    const grid = buildCalendarGrid(year, month);

    return grid.map((date) => {
      const key = toDateInputValue(date);
      const dayExpenses = expenses.filter((e) => toDateInputValue(e.date) === key);
      const dayIncome = income.filter((i) => toDateInputValue(i.date) === key);
      const transactions: DayTransaction[] = [
        ...dayIncome.map((i) => ({ ...i, kind: "income" as const })),
        ...dayExpenses.map((e) => ({ ...e, kind: "expense" as const })),
      ];

      return {
        date,
        key,
        inMonth: date.getMonth() === month - 1,
        isToday: key === todayKey,
        income: dayIncome.reduce((sum, i) => sum + i.amount, 0),
        expenses: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
        transactions,
      };
    });
  }, [expenses, income, month, year]);

  const monthTotals = useMemo(
    () => ({
      income: income.reduce((sum, i) => sum + i.amount, 0),
      expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    }),
    [expenses, income]
  );

  const selectedDay = days.find((d) => d.key === selectedKey) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">See income and expenses laid out by day.</p>
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

      {!isLoading && !error && (
        <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Income{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-50">
              {formatCurrency(monthTotals.income, currency)}
            </span>
          </span>
          <span>
            Expenses{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-50">
              {formatCurrency(monthTotals.expenses, currency)}
            </span>
          </span>
          <span>
            Net{" "}
            <span
              className={`font-semibold ${
                monthTotals.income - monthTotals.expenses >= 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-danger"
              }`}
            >
              {formatCurrency(monthTotals.income - monthTotals.expenses, currency)}
            </span>
          </span>
        </div>
      )}

      <Card className="!p-3 sm:!p-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-danger">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day) => {
                const hasActivity = day.income > 0 || day.expenses > 0;
                return (
                  <button
                    key={day.key}
                    onClick={() => hasActivity && setSelectedKey(day.key)}
                    disabled={!hasActivity}
                    className={`flex min-h-[72px] flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-colors sm:min-h-[88px] sm:p-2 ${
                      day.inMonth
                        ? "border-gray-100 dark:border-slate-700"
                        : "border-transparent opacity-40"
                    } ${hasActivity ? "cursor-pointer hover:border-primary-200 hover:bg-primary-50/40 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/5" : "cursor-default"}`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                        day.isToday
                          ? "bg-primary-600 font-semibold text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                    <div className="flex w-full flex-col gap-0.5 text-[11px] leading-tight">
                      {day.income > 0 && (
                        <span className="truncate font-medium text-emerald-600 dark:text-emerald-500">
                          +{formatCurrency(day.income, currency)}
                        </span>
                      )}
                      {day.expenses > 0 && (
                        <span className="truncate font-medium text-danger">
                          -{formatCurrency(day.expenses, currency)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedKey(null)}
        title={selectedDay ? selectedDay.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : ""}
      >
        {selectedDay && (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {selectedDay.transactions.map((tx) => (
              <li key={`${tx.kind}-${tx._id}`} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{tx.title}</p>
                  <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                    {tx.kind === "expense" ? categoryLabel(tx.category) : tx.source}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    tx.kind === "income" ? "text-emerald-600 dark:text-emerald-500" : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {tx.kind === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
