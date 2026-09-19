import apiClient from "./axiosClient";

// ── Types ─────────────────────────────────────────────────────────────────────


export interface ValidationReason {
  code: string;
  message: string;
  expectedBalance?: number;
  actualBalance?: number;
  difference?: number;
}

export interface ValidationInfo {
  status: "high_confidence" | "needs_review" | "invalid";
  reasons: ValidationReason[];
}

export interface PreviewTransaction {
  date: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  dedupHash: string;
  isDuplicate: boolean;
  validationStatus?: "high_confidence" | "needs_review" | "invalid";
  validation?: ValidationInfo;
}

export interface ParseResponse {
  success: boolean;
  data: {
    transactions: PreviewTransaction[];
    rejectedCount: number;
    chunkCount: number;
    failedChunks: number;
  };
}

export interface CommitResponse {
  success: boolean;
  data: {
    savedCount: number;
    skippedDuplicates: number;
    rejectedCount: number;
  };
}

// ── API wrappers ──────────────────────────────────────────────────────────────

/**
 * Upload a PDF bank statement and receive a preview of parsed transactions.
 * Does NOT write anything to the database.
 */
export async function parseStatement(file: File): Promise<ParseResponse["data"]> {
  const form = new FormData();
  form.append("statement", file);

  const { data } = await apiClient.post<ParseResponse>("/statements/parse", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

/**
 * Commit user-reviewed transactions to the database.
 * Backend re-validates every row and filters out remaining duplicates.
 */
export async function commitTransactions(
  transactions: PreviewTransaction[]
): Promise<CommitResponse["data"]> {
  const { data } = await apiClient.post<CommitResponse>("/statements/commit", {
    transactions,
  });
  return data.data;
}
