import { useState } from "react";
import { Trash2, CheckCircle, Info } from "lucide-react";
import type { PreviewTransaction } from "@/api/statementApi";
import { commitTransactions } from "@/api/statementApi";

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Shopping",
  "Transport",
  "Fuel",
  "Entertainment",
  "Health & Medical",
  "Utilities",
  "Rent & Housing",
  "Education",
  "Travel",
  "Personal Care",
  "Subscriptions",
  "Insurance",
  "Investments",
  "Salary",
  "Freelance",
  "Other",
] as const;

interface TransactionReviewTableProps {
  transactions: PreviewTransaction[];
  rejectedCount: number;
  onCommitSuccess: () => void;
}

type EditableRow = PreviewTransaction & { removed: boolean };

/**
 * Editable review table shown after the PDF is parsed.
 * Users can edit date/description/amount/type/category, remove rows, and
 * exclude duplicates before committing to the database.
 */
export default function TransactionReviewTable({
  transactions,
  rejectedCount,
  onCommitSuccess,
}: TransactionReviewTableProps) {
  const [rows, setRows] = useState<EditableRow[]>(
    transactions.map((t) => ({ ...t, removed: false }))
  );
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    savedCount: number;
    skippedDuplicates: number;
  } | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  const activeRows = rows.filter((r) => !r.removed && !r.isDuplicate);
  const duplicateRows = rows.filter((r) => r.isDuplicate && !r.removed);

  const updateRow = (index: number, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, removed: true } : r)));
  };

  const handleCommit = async () => {
    setCommitError(null);
    setIsCommitting(true);
    try {
      const toSend = rows.filter((r) => !r.removed && !r.isDuplicate);
      const result = await commitTransactions(toSend);
      setCommitResult(result);
      onCommitSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setCommitError(e?.response?.data?.message ?? "Could not save transactions. Please try again.");
    } finally {
      setIsCommitting(false);
    }
  };

  if (commitResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="rounded-full bg-emerald-50 p-4 dark:bg-emerald-950/40">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {commitResult.savedCount} transaction{commitResult.savedCount !== 1 ? "s" : ""} saved
          </p>
          {commitResult.skippedDuplicates > 0 && (
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {commitResult.skippedDuplicates} duplicate{commitResult.skippedDuplicates !== 1 ? "s" : ""} skipped
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-slate-800">
          {activeRows.length} to import
        </span>
        {duplicateRows.length > 0 && (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            {duplicateRows.length} duplicate{duplicateRows.length !== 1 ? "s" : ""} (excluded)
          </span>
        )}
        {rejectedCount > 0 && (
          <span className="rounded-md bg-red-50 px-2 py-1 text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {rejectedCount} row{rejectedCount !== 1 ? "s" : ""} LLM couldn't parse
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-500">
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Description</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
            {rows.map((row, i) => {
              if (row.removed) return null;

              if (row.isDuplicate) {
                return (
                  <tr
                    key={row.dedupHash}
                    className="bg-gray-50/50 opacity-50 dark:bg-slate-900/30"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">{row.date}</td>
                    <td className="max-w-xs px-3 py-2 text-gray-400">
                      <span className="truncate block">{row.description}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-400">
                      ₹{row.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-gray-400 capitalize">{row.type}</td>
                    <td className="px-3 py-2 text-gray-400">{row.category}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-slate-700 dark:text-gray-400">
                        duplicate
                      </span>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={row.dedupHash + i}
                  className={`bg-white hover:bg-gray-50/50 dark:bg-slate-900 dark:hover:bg-slate-800/40 ${row.validationStatus === 'needs_review' ? 'border-l-4 border-amber-500' : ''}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className="input w-32 py-1 text-xs"
                      value={row.date}
                      onChange={(e) => updateRow(i, { date: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {row.validationStatus === 'needs_review' && (
                        <span 
                          title={row.validation?.reasons.map(r => {
                            if (r.code === 'balance_mismatch') {
                              return `${r.message}\nExpected: ₹${r.expectedBalance}\nStatement: ₹${r.actualBalance}\nDifference: ₹${r.difference}`;
                            }
                            return r.message;
                          }).join('\n\n') || "Review recommended"} 
                          className="flex items-center"
                        >
                          <Info size={14} className="text-amber-500" />
                        </span>
                      )}
                      <input
                        type="text"
                        className="input min-w-[180px] py-1 text-xs"
                        value={row.description}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input w-24 py-1 text-right text-xs"
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(i, { amount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input w-28 py-1 text-xs"
                      value={row.type}
                      onChange={(e) =>
                        updateRow(i, { type: e.target.value as "expense" | "income" })
                      }
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="input w-40 py-1 text-xs"
                      value={row.category}
                      onChange={(e) => updateRow(i, { category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400 dark:text-slate-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      aria-label="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {activeRows.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400 dark:text-gray-500">
            <Info size={15} />
            No non-duplicate transactions to import.
          </div>
        )}
      </div>

      {commitError && (
        <p className="text-sm text-red-500 dark:text-red-400">{commitError}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {activeRows.length} transaction{activeRows.length !== 1 ? "s" : ""} will be imported
        </p>
        <button
          type="button"
          onClick={handleCommit}
          disabled={isCommitting || activeRows.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCommitting ? "Saving…" : `Import ${activeRows.length} transaction${activeRows.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
