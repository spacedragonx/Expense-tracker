import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Landmark } from "lucide-react";
import budgetApi, { BudgetPayload, BudgetSummary } from "@/api/budgetApi";
import categoryApi from "@/api/categoryApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import BudgetFormModal from "@/components/budgets/BudgetFormModal";
import { formatCurrency, formatMonthYear } from "@/utils/format";
import type { Category } from "@/types";

const now = new Date();

function barTone(usedPercent: number, alertThresholdPercent: number) {
  if (usedPercent >= 100) return "bg-danger";
  if (usedPercent >= alertThresholdPercent) return "bg-warning";
  return "bg-primary-500";
}

function categoryLabel(category: BudgetSummary["categoryBreakdown"][number]["category"]) {
  return typeof category === "string" ? category : category.name;
}

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [budgetExists, setBudgetExists] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBudget = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await budgetApi.getForMonth(year, month);
      setSummary(data.data);
      setBudgetExists(true);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSummary(null);
        setBudgetExists(false);
      } else {
        setError("Couldn't load this month's budget.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    categoryApi
      .list("expense")
      .then(({ data }) => setCategories(data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

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

  const handleSubmit = async (payload: BudgetPayload) => {
    await budgetApi.upsert(payload);
    await loadBudget();
  };

  const handleDelete = async () => {
    if (!summary) return;
    setIsDeleting(true);
    try {
      await budgetApi.remove(summary.budget._id);
      setConfirmDelete(false);
      await loadBudget();
    } catch {
      setError("Couldn't delete this budget.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Budgets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set monthly limits and track progress.</p>
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

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading budget…</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !budgetExists || !summary ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
            <Landmark size={22} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No budget set for {formatMonthYear(month, year)} yet.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>Set budget</Button>
        </Card>
      ) : (
        <>
          <Card>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total budget</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  {formatCurrency(summary.budget.totalLimit, currency)}
                </p>
              </div>

              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Delete budget?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs font-medium text-gray-500 hover:underline dark:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsFormOpen(true)}
                    aria-label="Edit budget"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete budget"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
              <div
                className={`h-full rounded-full transition-all ${barTone(
                  summary.usedPercent,
                  summary.budget.alertThresholdPercent
                )}`}
                style={{ width: `${Math.min(100, summary.usedPercent)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatCurrency(summary.totalSpent, currency)} spent</span>
              <span>
                {summary.usedPercent}% ·{" "}
                {summary.totalRemaining >= 0
                  ? `${formatCurrency(summary.totalRemaining, currency)} left`
                  : `${formatCurrency(Math.abs(summary.totalRemaining), currency)} over`}
              </span>
            </div>
          </Card>

          {summary.categoryBreakdown.length > 0 && (
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">By category</h2>
              <ul className="space-y-4">
                {summary.categoryBreakdown.map((item, index) => {
                  const percent = item.limit > 0 ? Math.round((item.spent / item.limit) * 100) : 0;
                  return (
                    <li key={index}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-gray-50">
                          {categoryLabel(item.category)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.spent, currency)} / {formatCurrency(item.limit, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all ${barTone(
                            percent,
                            summary.budget.alertThresholdPercent
                          )}`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}

      <BudgetFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        month={month}
        year={year}
        categories={categories}
        initialBudget={summary?.budget || null}
      />
    </div>
  );
}
