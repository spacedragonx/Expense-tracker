import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { toDateInputValue } from "@/utils/format";
import type { Category, Expense, PaymentMethod } from "@/types";
import type { ExpensePayload } from "@/api/expenseApi";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "wallet", label: "Wallet" },
  { value: "other", label: "Other" },
];

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  categories: Category[];
  /** Present when editing; absent when creating. */
  initialExpense?: Expense | null;
}

const emptyForm = {
  title: "",
  amount: "",
  date: toDateInputValue(new Date()),
  category: "",
  paymentMethod: "card" as PaymentMethod,
  notes: "",
  tags: "",
};

/** Create/edit form for a single expense, rendered inside a Modal. */
export default function ExpenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialExpense,
}: ExpenseFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialExpense);

  useEffect(() => {
    if (!isOpen) return;
    if (initialExpense) {
      setForm({
        title: initialExpense.title,
        amount: String(initialExpense.amount),
        date: toDateInputValue(initialExpense.date),
        category:
          typeof initialExpense.category === "string" ? initialExpense.category : initialExpense.category._id,
        paymentMethod: initialExpense.paymentMethod,
        notes: initialExpense.notes || "",
        tags: initialExpense.tags?.join(", ") || "",
      });
    } else {
      setForm({ ...emptyForm, category: categories[0]?._id || "" });
    }
    setError(null);
  }, [isOpen, initialExpense, categories]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.title.trim()) return setError("Title is required.");
    if (!amount || amount <= 0) return setError("Enter an amount greater than 0.");
    if (!form.category) return setError("Choose a category.");

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        amount,
        date: new Date(form.date).toISOString(),
        category: form.category,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim() || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Couldn't save this expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit expense" : "Add expense"}>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.length === 0 && <option value="">No categories yet</option>}
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment</label>
            <select
              className="input"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags <span className="font-normal text-gray-400">(comma-separated)</span>
          </label>
          <input
            className="input"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="groceries, weekly"
          />
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
          <Button type="submit" disabled={isSubmitting || categories.length === 0}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
