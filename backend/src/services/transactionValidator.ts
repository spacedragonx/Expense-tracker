import { z } from "zod";
import type { RawLlmTransaction } from "./llmParser";

export const CATEGORIES = [
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

// Map common merchants to deterministic categories
const DETERMINISTIC_CATEGORIES: Record<string, string> = {
  swiggy: "Food & Dining",
  zomato: "Food & Dining",
  dominos: "Food & Dining",
  blinkit: "Groceries",
  zepto: "Groceries",
  uber: "Transport",
  ola: "Transport",
  rapido: "Transport",
  metro: "Transport"
};

function getDeterministicCategory(description: string, llmCategory: string): string {
  const lowerDesc = description.toLowerCase();
  for (const [key, category] of Object.entries(DETERMINISTIC_CATEGORIES)) {
    if (lowerDesc.includes(key)) {
      return category;
    }
  }
  return (CATEGORIES as readonly string[]).includes(llmCategory) ? llmCategory : "Other";
}

export type ValidationStatus = "high_confidence" | "needs_review" | "invalid";

export interface ValidationReason {
  code: 
    | "balance_mismatch" 
    | "missing_balance" 
    | "invalid_date" 
    | "invalid_amount" 
    | "invalid_direction" 
    | "missing_description" 
    | "duplicate" 
    | "fallback_parsing" 
    | "ambiguous_transaction";
  message: string;
  expectedBalance?: number;
  actualBalance?: number;
  difference?: number;
}

export interface ValidationInfo {
  status: ValidationStatus;
  reasons: ValidationReason[];
}

export interface BalanceState {
  previousBalance: number | null;
  hasReliableBalance: boolean;
}

// Zod schema for the final validated row
const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  description: z.string().min(1, "description is required").max(500),
  amount: z.number().positive("amount must be > 0"),
  type: z.enum(["expense", "income"]),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  validationStatus: z.enum(["high_confidence", "needs_review", "invalid"]).optional(),
  validation: z.object({
    status: z.enum(["high_confidence", "needs_review", "invalid"]),
    reasons: z.array(z.any()) // Using z.any() for simplicity, or we can define it strictly
  }).optional()
});

export type ValidatedTransaction = z.infer<typeof transactionSchema>;

export interface ValidationResult {
  valid: ValidatedTransaction[];
  rejectedCount: number;
  suspiciousCount: number;
  finalBalanceState: BalanceState;
}

/**
 * Split LLM output into valid rows and rejected rows.
 * Performs sequential balance validation per chunk, threading state from previous chunks.
 */
export function validateTransactions(
  raw: RawLlmTransaction[], 
  initialState: BalanceState,
  openingBalance?: number,
  closingBalance?: number
): ValidationResult {
  const valid: ValidatedTransaction[] = [];
  let rejectedCount = 0;
  let suspiciousCount = 0;

  let currentBalance: number | null = null;
  let hasReliableBalance = false;

  // Determine starting balance for this chunk
  if (openingBalance != null) {
    currentBalance = openingBalance;
    hasReliableBalance = true;
  } else if (initialState.hasReliableBalance) {
    currentBalance = initialState.previousBalance;
    hasReliableBalance = true;
  }

  for (const item of raw) {
    // 1. Business Logic Mapping
    const type = item.direction === "credit" ? "income" : "expense";
    const category = getDeterministicCategory(item.description, item.category || "Other");
    
    // 2. Anomaly detection & Balance Math
    let status: ValidationStatus = "high_confidence";
    const reasons: ValidationReason[] = [];

    // Basic validity checks
    if (!item.date || !item.amount || item.amount <= 0 || !item.direction) {
       status = "invalid";
       reasons.push({ code: "invalid_amount", message: "Transaction is missing required fields or has invalid amount." });
    }

    // Mathematical balance check
    if (hasReliableBalance && currentBalance != null) {
      const expectedBalance = item.direction === "credit" ? currentBalance + item.amount : currentBalance - item.amount;
      
      let balanceToCompare: number | null = null;
      if (item.balance != null) {
        balanceToCompare = item.balance;
      }
      
      if (balanceToCompare != null) {
        const diff = Math.abs(expectedBalance - balanceToCompare);
        if (diff > 0.05) {
          status = "needs_review";
          reasons.push({
            code: "balance_mismatch",
            message: "Running balance does not match the transaction amount.",
            expectedBalance: parseFloat(expectedBalance.toFixed(2)),
            actualBalance: balanceToCompare,
            difference: parseFloat(diff.toFixed(2))
          });
          // Update current balance to the statement's claimed balance if we had a mismatch,
          // to prevent cascading failures if only one transaction is slightly off
          currentBalance = balanceToCompare;
        } else {
          currentBalance = expectedBalance;
        }
      } else {
        // Forward propagation if balance is missing on statement but we have reliable continuity
        currentBalance = expectedBalance;
      }
    } else {
      // If we don't have a reliable balance, but the statement row has one, we can seed it here for subsequent rows
      if (item.balance != null) {
        currentBalance = item.balance;
        hasReliableBalance = true;
      }
    }

    const doc = {
      date: item.date,
      description: item.description,
      amount: item.amount,
      type,
      category,
      validationStatus: status,
      validation: {
        status,
        reasons
      }
    };

    const result = transactionSchema.safeParse(doc);
    if (result.success) {
      if (status === "needs_review") suspiciousCount++;
      valid.push(result.data);
    } else {
      rejectedCount++;
      console.warn("[transactionValidator] rejected row:", result.error.flatten().fieldErrors);
    }
  }

  // Check closing balance if provided
  if (closingBalance != null && hasReliableBalance && currentBalance != null) {
    const diff = Math.abs(currentBalance - closingBalance);
    if (diff > 0.05 && valid.length > 0) {
      // Mark the last valid transaction as needing review due to chunk closing balance mismatch
      const lastTx = valid[valid.length - 1];
      if (lastTx.validationStatus !== "invalid") {
        lastTx.validationStatus = "needs_review";
        if (lastTx.validation) {
          lastTx.validation.status = "needs_review";
          lastTx.validation.reasons.push({
            code: "balance_mismatch",
            message: "Chunk closing balance does not match calculated running balance.",
            expectedBalance: parseFloat(currentBalance.toFixed(2)),
            actualBalance: closingBalance,
            difference: parseFloat(diff.toFixed(2))
          });
        }
        if (!lastTx.validation?.reasons.some(r => r.code === "balance_mismatch" && r.expectedBalance !== currentBalance)) {
            // avoid double counting if it was already suspicious
            suspiciousCount++;
        }
      }
      currentBalance = closingBalance; // Resync with statement truth
    }
  }

  const finalBalanceState: BalanceState = {
    previousBalance: currentBalance,
    hasReliableBalance
  };

  return { valid, rejectedCount, suspiciousCount, finalBalanceState };
}
