import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { toDateInputValue } from "@/utils/format";
import type { Income, IncomeSource } from "@/types";
import type { IncomePayload } from "@/api/incomeApi";

const INCOME_SOURCES: { value: IncomeSource; label: string }[] = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "investments", label: "Investments" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: IncomePayload) => Promise<void>;
  /** Present when editing; absent when creating. */
  initialIncome?: Income | null;
}

const emptyForm = {
  title: "",
  amount: "",
  date: toDateInputValue(new Date()),
  source: "salary" as IncomeSource,
  notes: "",
};

/** Create/edit form for a single income entry, rendered inside a Modal. */
export default function IncomeFormModal({ isOpen, onClose, onSubmit, initialIncome }: IncomeFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialIncome);

  useEffect(() => {
    if (!isOpen) return;
    if (initialIncome) {
      setForm({
        title: initialIncome.title,
        amount: String(initialIncome.amount),
        date: toDateInputValue(initialIncome.date),
        source: initialIncome.source,
        notes: initialIncome.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [isOpen, initialIncome]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.title.trim()) return setError("Title is required.");
    if (!amount || amount <= 0) return setError("Enter an amount greater than 0.");

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        amount,
        date: new Date(form.date).toISOString(),
        source: form.source,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Couldn't save this income.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit income" : "Add income"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
          <select
            className="input"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as IncomeSource }))}
          >
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            className="input"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add income"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
