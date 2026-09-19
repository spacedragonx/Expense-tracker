import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import StatementUploader from "@/components/statements/StatementUploader";
import TransactionReviewTable from "@/components/statements/TransactionReviewTable";
import { parseStatement } from "@/api/statementApi";
import type { PreviewTransaction } from "@/api/statementApi";

type Phase = "upload" | "review";

interface ParsedData {
  transactions: PreviewTransaction[];
  rejectedCount: number;
  chunkCount: number;
  failedChunks: number;
}

/**
 * Parent page orchestrating the two-phase statement import flow:
 *   1. Upload → parse (preview, no DB write)
 *   2. Review → commit (bulk insert)
 *
 * On successful commit the page resets so the user can import another statement.
 */
export default function StatementImport() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const handleUploadStart = async (file: File) => {
    setIsLoading(true);
    setUploadError(null);
    try {
      const data = await parseStatement(file);
      setParsedData(data);
      setPhase("review");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setUploadError(
        e?.response?.data?.message ?? "Failed to parse the statement. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitSuccess = () => {
    // Brief delay so the success state in TransactionReviewTable is visible,
    // then reset to upload phase for the next statement.
    setTimeout(() => {
      setPhase("upload");
      setParsedData(null);
      setUploadError(null);
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Import Bank Statement
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
            Upload a PDF bank statement — we'll parse transactions and let you review before saving.
          </p>
        </div>

        {phase === "review" && (
          <button
            type="button"
            onClick={() => {
              setPhase("upload");
              setParsedData(null);
              setUploadError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={14} />
            Upload another
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
            phase === "upload"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-400 dark:bg-slate-800"
          }`}
        >
          1
        </span>
        <span className={phase === "upload" ? "font-medium text-gray-700 dark:text-gray-300" : ""}>
          Upload
        </span>
        <span className="mx-1 text-gray-200 dark:text-slate-700">›</span>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
            phase === "review"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-400 dark:bg-slate-800"
          }`}
        >
          2
        </span>
        <span className={phase === "review" ? "font-medium text-gray-700 dark:text-gray-300" : ""}>
          Review &amp; confirm
        </span>
      </div>

      {/* Phase content */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {phase === "upload" && (
          <StatementUploader
            isLoading={isLoading}
            onUploadStart={handleUploadStart}
            error={uploadError}
          />
        )}

        {phase === "review" && parsedData && (
          <TransactionReviewTable
            transactions={parsedData.transactions}
            rejectedCount={parsedData.rejectedCount}
            onCommitSuccess={handleCommitSuccess}
          />
        )}
      </div>
    </div>
  );
}
