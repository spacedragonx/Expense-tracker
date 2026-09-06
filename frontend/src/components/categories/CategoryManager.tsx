import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import categoryApi, { CategoryPayload } from "@/api/categoryApi";
import Button from "@/components/common/Button";
import CategoryFormModal from "./CategoryFormModal";
import type { Category, CategoryKind } from "@/types";

const TABS: { value: CategoryKind; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

/**
 * Category CRUD, scoped per-kind. System default categories (`isDefault`)
 * are shown but locked — the backend rejects edits/deletes on them, so we
 * don't even offer the actions.
 */
export default function CategoryManager() {
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await categoryApi.list(kind);
      setCategories(data.data);
    } catch {
      setError("Couldn't load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: CategoryPayload) => {
    if (editingCategory) {
      await categoryApi.update(editingCategory._id, payload);
    } else {
      await categoryApi.create(payload);
    }
    await loadCategories();
  };

  const handleDelete = async (id: string) => {
    setRowActionId(id);
    try {
      await categoryApi.remove(id);
      setConfirmDeleteId(null);
      await loadCategories();
    } catch {
      setError("Couldn't delete that category. It may still be in use.");
    } finally {
      setRowActionId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-gray-200 p-0.5 dark:border-slate-700">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setKind(tab.value)}
              className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                kind === tab.value
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={openCreate} variant="secondary" className="gap-1.5">
          <Plus size={15} />
          Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading categories…</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700">
          {categories.map((category) => (
            <li key={category._id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color || "#10b981" }}
                />
                <span className="text-sm text-gray-900 dark:text-gray-50">{category.name}</span>
              </div>

              {category.isDefault ? (
                <Lock size={14} className="text-gray-300 dark:text-gray-600" aria-label="Default category" />
              ) : confirmDeleteId === category._id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
                  <button
                    onClick={() => handleDelete(category._id)}
                    disabled={rowActionId === category._id}
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
                    onClick={() => openEdit(category)}
                    aria-label="Edit"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(category._id)}
                    aria-label="Delete"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        kind={kind}
        initialCategory={editingCategory}
      />
    </div>
  );
}
