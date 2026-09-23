import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, Pencil, Copy, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import expenseApi, { ExpensePayload, ExpenseQuery } from "@/api/expenseApi";
import categoryApi from "@/api/categoryApi";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import ExpenseFormModal from "@/components/expenses/ExpenseFormModal";
import { formatCurrency, formatDate } from "@/utils/format";
import { resolveCategoryIcon, resolveCategoryColor, getCategoryFromField } from "@/utils/categoryIcon";
import type { Category, Expense } from "@/types";

const PAGE_SIZE = 20;

export default function Expenses() {
  const { user } = useAuth();
  const currency = user?.currency || "INR";
  const [searchParams, setSearchParams] = useSearchParams();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: ExpenseQuery = { page, limit: PAGE_SIZE, sort: "-date" };
      if (search.trim()) query.search = search.trim();
      if (categoryFilter) query.category = categoryFilter;

      const { data } = await expenseApi.list(query);
      setExpenses(data.data);
      setTotal(data.pagination.total);
    } catch {
      setError("Couldn't load expenses. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter]);

  // Categories load once; the expense list category dropdown is expense-kind only.
  useEffect(() => {
    categoryApi
      .list("expense")
      .then(({ data }) => setCategories(data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Reset to page 1 whenever filters change so results aren't hidden on a stale page.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const openCreate = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  // Supports the navbar's Quick Add menu, which links here with ?add=1 so the
  // form opens immediately instead of landing on a blank list.
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      openCreate();
      setSearchParams((params) => {
        params.delete("add");
        return params;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: ExpensePayload) => {
    if (editingExpense) {
      await expenseApi.update(editingExpense._id, payload);
    } else {
      await expenseApi.create(payload);
    }
    await loadExpenses();
  };

  const handleDuplicate = async (id: string) => {
    setRowActionId(id);
    try {
      await expenseApi.duplicate(id);
      await loadExpenses();
    } catch {
      setError("Couldn't duplicate that expense.");
    } finally {
      setRowActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setRowActionId(id);
    try {
      await expenseApi.remove(id);
      setConfirmDeleteId(null);
      // If this was the last row on the page, step back a page.
      if (expenses.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await loadExpenses();
      }
    } catch {
      setError("Couldn't delete that expense.");
    } finally {
      setRowActionId(null);
    }
  };

  const categoryName = (category: Expense["category"]) =>
    typeof category === "string" ? categories.find((c) => c._id === category)?.name || "—" : category.name;

  // Group the current page's rows by month (they arrive sorted -date, so
  // this just buckets a run of consecutive same-month rows — no re-sort needed).
  const groupedExpenses = useMemo(() => {
    const groups: { key: string; label: string; items: Expense[] }[] = [];
    for (const expense of expenses) {
      const d = new Date(expense.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(expense);
      } else {
        groups.push({
          key,
          label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
          items: [expense],
        });
      }
    }
    return groups;
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-graphite dark:text-gray-50">Expenses</h1>
          <p className="text-sm text-graphite/60 dark:text-gray-400">Log, filter, and manage every expense.</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus size={16} />
          Add expense
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40 dark:text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search expenses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto min-w-[160px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="!p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-graphite/60 dark:text-gray-400">Loading expenses…</p>
        ) : error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : expenses.length === 0 ? (
          <p className="p-6 text-sm text-graphite/60 dark:text-gray-400">
            No expenses found{search || categoryFilter ? " for these filters." : " yet. Add your first one."}
          </p>
        ) : (
          <div className="divide-y divide-ash dark:divide-slate-700">
            {groupedExpenses.map((group) => (
              <div key={group.key}>
                <p className="sticky top-0 z-10 bg-ivory/90 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-graphite/40 backdrop-blur dark:bg-slate-800/90 dark:text-gray-500 border-b border-ash dark:border-slate-700/60">
                  {group.label}
                </p>
                <ul className="divide-y divide-ash dark:divide-slate-700/60">
                  {group.items.map((expense, index) => {
                    const categoryObj = getCategoryFromField(expense.category);
                    const Icon = resolveCategoryIcon(categoryObj?.icon, "expense");
                    const iconColor = resolveCategoryColor(categoryObj?.color, categoryObj?.name || expense.title);

                    return (
                      <motion.li
                        key={expense._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.25), ease: "easeOut" }}
                        className="group flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-fog dark:hover:bg-slate-800/60"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm dark:rounded-xl transition-transform duration-150 group-hover:scale-105"
                            style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                          >
                            <Icon size={18} strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-graphite dark:text-gray-50">{expense.title}</p>
                            <p className="truncate text-xs text-graphite/60 dark:text-gray-400">
                              {categoryName(expense.category)} · {formatDate(expense.date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-5">
                          <span className="text-sm font-semibold text-graphite dark:text-gray-300">
                            −{formatCurrency(expense.amount, currency)}
                          </span>

                        {confirmDeleteId === expense._id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-graphite/60 dark:text-gray-400">Delete?</span>
                            <button
                              onClick={() => handleDelete(expense._id)}
                              disabled={rowActionId === expense._id}
                              className="text-xs font-medium text-danger hover:underline"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-medium text-graphite/60 hover:underline dark:text-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(expense)}
                              aria-label="Edit"
                              className="rounded-lg p-1.5 text-graphite/40 dark:text-gray-400 hover:bg-white hover:text-graphite dark:hover:bg-slate-700 dark:hover:text-gray-200"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(expense._id)}
                              disabled={rowActionId === expense._id}
                              aria-label="Duplicate"
                              className="rounded-lg p-1.5 text-graphite/40 dark:text-gray-400 hover:bg-white hover:text-graphite dark:hover:bg-slate-700 dark:hover:text-gray-200"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(expense._id)}
                              aria-label="Delete"
                              className="rounded-lg p-1.5 text-graphite/40 dark:text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/20 dark:hover:text-red-400"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!isLoading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-graphite/60 dark:text-gray-400">
          <span>
            Page {page} of {pageCount} · {total} total
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg p-1.5 hover:bg-fog disabled:opacity-40 dark:hover:bg-slate-800"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="rounded-lg p-1.5 hover:bg-fog disabled:opacity-40 dark:hover:bg-slate-800"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        initialExpense={editingExpense}
      />
    </div>
  );
}
