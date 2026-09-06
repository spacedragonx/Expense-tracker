import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import authApi from "@/api/authApi";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import CategoryManager from "@/components/categories/CategoryManager";
import type { Theme } from "@/types";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

type SupportedCurrency = "INR" | "EUR" | "USD";

const CURRENCY_OPTIONS: { value: SupportedCurrency; label: string; symbol: string }[] = [
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "USD", label: "US Dollar", symbol: "$" },
];

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const currentCurrency = (user?.currency as SupportedCurrency) || "INR";
  const [pendingCurrency, setPendingCurrency] = useState<SupportedCurrency | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<{
    from: string;
    to: string;
    rate: number;
    counts?: { expenses: number; income: number; budgets: number; goals: number };
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      await authApi.updateProfile({ name });
      await refreshProfile();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const handleSelectCurrency = (value: SupportedCurrency) => {
    if (value === currentCurrency) return;
    setConversionError(null);
    setConversionResult(null);
    setPendingCurrency(value);
  };

  const confirmCurrencyChange = async () => {
    if (!pendingCurrency) return;
    setIsConverting(true);
    setConversionError(null);
    try {
      const { data } = await authApi.changeCurrency(pendingCurrency);
      await refreshProfile();
      setConversionResult({ from: data.from, to: data.to, rate: data.rate, counts: data.counts });
      setPendingCurrency(null);
    } catch (err: any) {
      setConversionError(err?.response?.data?.message || "Couldn't convert your currency. Try again.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile and preferences.</p>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {status === "saved" && <p className="text-sm text-emerald-600 dark:text-emerald-500">Saved.</p>}
          {status === "error" && <p className="text-sm text-danger">Couldn't save changes.</p>}

          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">Currency</h2>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Switching converts every expense, income entry, budget, and goal you already have using the current
          exchange rate — it's not just a label change.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {CURRENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectCurrency(opt.value)}
              disabled={isConverting}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                currentCurrency === opt.value
                  ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-500/10"
                  : "border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <span className="block font-semibold text-gray-900 dark:text-gray-50">
                {opt.symbol} {opt.value}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.label}</span>
            </button>
          ))}
        </div>

        {pendingCurrency && (
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3">
            <p className="text-sm text-gray-800 dark:text-gray-100">
              Convert everything from <strong>{currentCurrency}</strong> to <strong>{pendingCurrency}</strong> at
              today's exchange rate? This updates every stored amount and can't be undone automatically.
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={confirmCurrencyChange} disabled={isConverting}>
                {isConverting ? "Converting…" : `Yes, convert to ${pendingCurrency}`}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPendingCurrency(null)} disabled={isConverting}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {conversionError && <p className="mt-3 text-sm text-danger">{conversionError}</p>}

        {conversionResult && (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-500">
            Converted from {conversionResult.from} to {conversionResult.to} at a rate of{" "}
            {conversionResult.rate.toFixed(4)}
            {conversionResult.counts && (
              <>
                {" "}
                — {conversionResult.counts.expenses} expenses, {conversionResult.counts.income} income entries,{" "}
                {conversionResult.counts.budgets} budgets, {conversionResult.counts.goals} goals updated.
              </>
            )}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">Appearance</h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={
                theme === opt.value
                  ? "btn-primary"
                  : "btn-secondary"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">Categories</h2>
        <CategoryManager />
      </Card>
    </div>
  );
}
