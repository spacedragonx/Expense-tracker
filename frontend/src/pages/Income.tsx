import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import incomeApi, { IncomePayload, IncomeQuery } from "@/api/incomeApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import IncomeFormModal from "@/components/income/IncomeFormModal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Income, IncomeSource } from "@/types";

const PAGE_SIZE = 20;

const SOURCE_LABELS: Record<IncomeSource, string> = {
  salary: "Salary",
  freelance: "Freelance",
  investments: "Investments",
  business: "Business",
  other: "Other",
};

export default function IncomePage() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [sourceFilter, setSourceFilter] = useState<IncomeSource | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadIncomes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: IncomeQuery = { page, limit: PAGE_SIZE, sort: "-date" };
      if (sourceFilter) query.source = sourceFilter;

      const { data } = await incomeApi.list(query);
      setIncomes(data.data);
      setTotal(data.pagination.total);
    } catch {
      setError("Couldn't load income. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, sourceFilter]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  // Reset to page 1 whenever filters change so results aren't hidden on a stale page.
  useEffect(() => {
    setPage(1);
  }, [sourceFilter]);

  const openCreate = () => {
    setEditingIncome(null);
    setIsFormOpen(true);
  };

  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: IncomePayload) => {
    if (editingIncome) {
      await incomeApi.update(editingIncome._id, payload);
    } else {
      await incomeApi.create(payload);
    }
    await loadIncomes();
  };

  const handleDelete = async (id: string) => {
    setRowActionId(id);
    try {
      await incomeApi.remove(id);
      setConfirmDeleteId(null);
      // If this was the last row on the page, step back a page.
      if (incomes.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await loadIncomes();
      }
    } catch {
      setError("Couldn't delete that income entry.");
    } finally {
      setRowActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Income</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track salary, freelance, and other income.</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus size={16} />
          Add income
        </Button>
      </div>

      <Card className="!p-4">
        <select
          className="input w-auto min-w-[180px]"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as IncomeSource | "")}
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Card>

      <Card className="!p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading income…</p>
        ) : error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : incomes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
            No income entries found{sourceFilter ? " for this source." : " yet. Add your first one."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {incomes.map((income) => (
              <li key={income._id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{income.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(income.date)} · {SOURCE_LABELS[income.source]}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                    +{formatCurrency(income.amount, currency)}
                  </span>

                  {confirmDeleteId === income._id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
                      <button
                        onClick={() => handleDelete(income._id)}
                        disabled={rowActionId === income._id}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-medium text-gray-500 hover:underline dark:text-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(income)}
                        aria-label="Edit"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(income._id)}
                        aria-label="Delete"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!isLoading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Page {page} of {pageCount} · {total} total
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg p-1.5 hover:bg-gray-50 disabled:opacity-40 dark:hover:bg-slate-800"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="rounded-lg p-1.5 hover:bg-gray-50 disabled:opacity-40 dark:hover:bg-slate-800"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <IncomeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialIncome={editingIncome}
      />
    </div>
  );
}
