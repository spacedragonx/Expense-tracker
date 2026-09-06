import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { formatMonthYear } from "@/utils/format";
import type { Budget, Category } from "@/types";
import type { BudgetPayload } from "@/api/budgetApi";

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: BudgetPayload) => Promise<void>;
  month: number;
  year: number;
  categories: Category[];
  /** Present when editing an existing budget for this month; absent when setting one for the first time. */
  initialBudget?: Budget | null;
}

interface CategoryLimitRow {
  category: string;
  limit: string;
}

/** Create/edit form for a month's budget, including optional per-category limits. */
export default function BudgetFormModal({
  isOpen,
  onClose,
  onSubmit,
  month,
  year,
  categories,
  initialBudget,
}: BudgetFormModalProps) {
  const [totalLimit, setTotalLimit] = useState("");
  const [alertThresholdPercent, setAlertThresholdPercent] = useState("80");
  const [rows, setRows] = useState<CategoryLimitRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialBudget);

  useEffect(() => {
    if (!isOpen) return;
    if (initialBudget) {
      setTotalLimit(String(initialBudget.totalLimit));
      setAlertThresholdPercent(String(initialBudget.alertThresholdPercent ?? 80));
      setRows(
        initialBudget.categoryLimits.map((cl) => ({
          category: typeof cl.category === "string" ? cl.category : cl.category._id,
          limit: String(cl.limit),
        }))
      );
    } else {
      setTotalLimit("");
      setAlertThresholdPercent("80");
      setRows([]);
    }
    setError(null);
  }, [isOpen, initialBudget]);

  const usedCategoryIds = new Set(rows.map((r) => r.category));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c._id));

  const addRow = () => {
    if (availableCategories.length === 0) return;
    setRows((r) => [...r, { category: availableCategories[0]._id, limit: "" }]);
  };

  const updateRow = (index: number, patch: Partial<CategoryLimitRow>) => {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    setRows((r) => r.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const limit = Number(totalLimit);
    const threshold = Number(alertThresholdPercent);
    if (!limit || limit <= 0) return setError("Enter a total limit greater than 0.");
    if (!threshold || threshold < 1 || threshold > 100) return setError("Alert threshold must be 1–100.");
    for (const row of rows) {
      if (!row.limit || Number(row.limit) <= 0) {
        return setError("Every category limit needs an amount greater than 0.");
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        month,
        year,
        totalLimit: limit,
        alertThresholdPercent: threshold,
        categoryLimits: rows.map((r) => ({ category: r.category, limit: Number(r.limit) })),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Couldn't save this budget.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit budget · ${formatMonthYear(month, year)}` : `Set budget · ${formatMonthYear(month, year)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Total limit</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              value={totalLimit}
              onChange={(e) => setTotalLimit(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alert at (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="input"
              value={alertThresholdPercent}
              onChange={(e) => setAlertThresholdPercent(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Category limits <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addRow}
              disabled={availableCategories.length === 0}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline disabled:opacity-40 disabled:no-underline dark:text-primary-500"
            >
              <Plus size={13} />
              Add category
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No per-category limits set — only the total limit will be tracked.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className="input flex-1"
                    value={row.category}
                    onChange={(e) => updateRow(index, { category: e.target.value })}
                  >
                    {/* Include the currently-selected category even if it's "used" elsewhere, so its own option isn't dropped from its own row. */}
                    {[categories.find((c) => c._id === row.category), ...availableCategories]
                      .filter((c, i, arr): c is Category => Boolean(c) && arr.findIndex((x) => x?._id === c._id) === i)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Limit"
                    className="input w-28"
                    value={row.limit}
                    onChange={(e) => updateRow(index, { limit: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label="Remove"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Set budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
