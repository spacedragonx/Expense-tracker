// Shared frontend types, mirroring the backend Mongoose schemas.

export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer" | "wallet" | "other";
export type IncomeSource = "salary" | "freelance" | "investments" | "business" | "other";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type CategoryKind = "expense" | "income";
export type Theme = "light" | "dark" | "system";

export interface Recurrence {
  isRecurring: boolean;
  frequency?: RecurrenceFrequency;
  nextRunDate?: string;
  endDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  theme: Theme;
}

export interface Category {
  _id: string;
  user: string | null;
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export interface Expense {
  _id: string;
  user: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  category: Category | string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
  tags: string[];
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  user: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  source: IncomeSource;
  notes?: string;
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  user: string;
  month: number;
  year: number;
  totalLimit: number;
  categoryLimits: { category: Category | string; limit: number }[];
  alertThresholdPercent: number;
}

export interface Goal {
  _id: string;
  user: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isCompleted: boolean;
  icon?: string;
  progressPercent: number;
}

export interface Notification {
  _id: string;
  type: "budget_exceeded" | "budget_warning" | "goal_milestone" | "monthly_summary" | "upcoming_bill";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  recentTransactions: ((Expense | Income) & { type: "expense" | "income" })[];
}
