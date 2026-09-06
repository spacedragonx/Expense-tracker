import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import type { Category, CategoryKind } from "@/types";
import type { CategoryPayload } from "@/api/categoryApi";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryPayload) => Promise<void>;
  /** Which tab the modal was opened from; fixes the kind for new categories. */
  kind: CategoryKind;
  /** Present when editing; absent when creating. */
  initialCategory?: Category | null;
}

const emptyForm = { name: "", color: "#10b981", icon: "tag" };

/** Create/edit form for a single user-defined category, rendered inside a Modal. */
export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  kind,
  initialCategory,
}: CategoryFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialCategory);

  useEffect(() => {
    if (!isOpen) return;
    if (initialCategory) {
      setForm({
        name: initialCategory.name,
        color: initialCategory.color || emptyForm.color,
        icon: initialCategory.icon || emptyForm.icon,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [isOpen, initialCategory]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Name is required.");

    setIsSubmitting(true);
    try {
      await onSubmit({ name: form.name.trim(), kind, color: form.color, icon: form.icon.trim() || "tag" });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Couldn't save this category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit category" : `Add ${kind} category`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <input
              type="color"
              className="h-[38px] w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1 dark:border-slate-600 dark:bg-slate-900"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Icon <span className="font-normal text-gray-400">(lucide icon name)</span>
            </label>
            <input
              className="input"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="tag"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
