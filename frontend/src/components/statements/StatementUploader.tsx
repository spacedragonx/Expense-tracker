import { useRef, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface StatementUploaderProps {
  isLoading: boolean;
  onUploadStart: (file: File) => void;
  error: string | null;
}

/**
 * Minimalist PDF upload panel.
 * Validates client-side that the file is a PDF before calling the backend.
 * The actual file-type enforcement happens server-side too (multer).
 */
export default function StatementUploader({
  isLoading,
  onUploadStart,
  error,
}: StatementUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (file: File | null | undefined) => {
    setLocalError(null);
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setLocalError("Only PDF files are accepted.");
      return;
    }
    onUploadStart(file);
  };

  const displayError = error || localError;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Drop zone */}
      <label
        htmlFor="statement-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex w-full max-w-md cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-colors duration-150 ${
          dragOver
            ? "border-primary-400 bg-primary-50/60 dark:border-primary-500 dark:bg-primary-500/10"
            : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600"
        }`}
      >
        <div className="rounded-full bg-gray-100 p-3 dark:bg-slate-700">
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
          ) : (
            <FileText size={24} className="text-gray-400 dark:text-gray-500" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isLoading ? "Parsing statement…" : "Drop your bank statement PDF here"}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            or click to browse — PDF only, max 20 MB
          </p>
        </div>

        {!isLoading && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300">
            <Upload size={12} />
            Browse file
          </span>
        )}

        <input
          ref={inputRef}
          id="statement-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={isLoading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>

      {displayError && (
        <div className="flex w-full max-w-md items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
