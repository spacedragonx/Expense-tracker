import { GoogleGenAI } from "@google/genai";
import { validateTransactions, CATEGORIES } from "./transactionValidator";
import { StatementChunk } from "./pdfExtractor";

export type LlmCategory = (typeof CATEGORIES)[number];

export interface RawLlmTransaction {
  date: string;
  description: string;
  amount: number;
  direction: "debit" | "credit";
  balance?: number;
  reference?: string;
  category?: string;
}

const GEMINI_PRIMARY_MODEL = process.env.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash-lite";
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

const GEMINI_RPM_LIMIT = Number(process.env.GEMINI_RPM_LIMIT) || 5;
const MIN_CALL_SPACING_MS = Math.ceil(60000 / GEMINI_RPM_LIMIT);

const MAX_RETRIES_503 = 3; 
const RETRY_BASE_MS_503 = 2000;
const MAX_RETRIES_429 = 1; 
const RETRY_WAIT_MS_429 = MIN_CALL_SPACING_MS + 1000;

const SYSTEM_PROMPT = `You are a bank statement parser. Extract financial transactions and chunk balances from the provided text.
Return ONLY a valid JSON object matching this schema — no prose, no markdown fences.
{"transactions": [{"date":"YYYY-MM-DD","description":"string","amount":number,"direction":"debit"|"credit","balance":number,"reference":"string","category":"string"}], "openingBalance": number, "closingBalance": number}

Extraction Rules:
- transactions: Array of actual financial movements.
  - date: Format as YYYY-MM-DD. Infer missing years from context.
  - description: Clean merchant/payee name. Remove transaction references, store IDs, dates, card numbers.
  - amount: Absolute positive value. Never include negative signs.
  - direction: "credit" (money entering: deposit, salary, refund) or "debit" (money leaving: withdrawal, fee, payment).
  - balance: (Optional) Running balance if present on the transaction line.
- openingBalance: (Optional) The starting balance on this page/chunk, if explicitly stated.
- closingBalance: (Optional) The ending balance on this page/chunk, if explicitly stated.

Ignore running balances on lines that are not individual transactions (e.g. page headers). Do NOT output opening/closing balances as transactions. If a line is not a distinct transfer of funds, omit it from the transactions array.`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function is503(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('"code":503') || msg.includes("UNAVAILABLE");
}

function is429(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('"code":429') || msg.includes("RESOURCE_EXHAUSTED");
}

let nextAllowedCallAt = 0;

async function waitForRateLimitWindow(): Promise<void> {
  const now = Date.now();
  const waitMs = nextAllowedCallAt - now;
  nextAllowedCallAt = Math.max(now, nextAllowedCallAt) + MIN_CALL_SPACING_MS;
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

interface ParsedChunkResult {
  transactions: RawLlmTransaction[];
  openingBalance?: number;
  closingBalance?: number;
}

async function parseChunk(
  ai: GoogleGenAI,
  chunkText: string,
  chunkIndex: number,
  modelName: string
): Promise<ParsedChunkResult> {
  let retries503 = 0;
  let retries429 = 0;

  for (;;) {
    await waitForRateLimitWindow();

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: chunkText,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text ?? "";

      try {
        const parsed = JSON.parse(rawText.trim());
        if (!parsed || !Array.isArray(parsed.transactions)) {
          console.error(`[llmParser] chunk ${chunkIndex} with ${modelName}: LLM returned invalid shape`);
          return { transactions: [] };
        }
        return parsed as ParsedChunkResult;
      } catch (parseErr) {
        console.error(
          `[llmParser] chunk ${chunkIndex} with ${modelName}: JSON parse failed —`,
          parseErr instanceof Error ? parseErr.message : parseErr
        );
        return { transactions: [] };
      }
    } catch (err) {
      if (is429(err) && retries429 < MAX_RETRIES_429) {
        retries429++;
        console.warn(`[llmParser] chunk ${chunkIndex} with ${modelName}: 429 rate limited, waiting out one window`);
        await sleep(RETRY_WAIT_MS_429);
        continue;
      }
      if (is503(err) && retries503 < MAX_RETRIES_503) {
        const waitMs = RETRY_BASE_MS_503 * Math.pow(2, retries503);
        retries503++;
        console.warn(`[llmParser] chunk ${chunkIndex} with ${modelName}: 503 overloaded, retry in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
}

export interface LlmParseResult {
  transactions: any[]; // will be validated transactions downstream
  chunkCount: number;
  failedChunks: number;
  rejectedCount: number;
}

export async function parseStatementWithTieredLlm(chunks: StatementChunk[]): Promise<LlmParseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  let failedChunks = 0;
  let totalRejectedCount = 0;
  const allValidTransactions: any[] = [];
  
  // Sort chunks sequentially before processing
  const sortedChunks = [...chunks].sort((a, b) => a.pageStart - b.pageStart);
  
  let balanceState = { previousBalance: null as number | null, hasReliableBalance: false };

  for (let i = 0; i < sortedChunks.length; i++) {
    try {
      const chunkText = sortedChunks[i].text;
      const rawRes = await parseChunk(ai, chunkText, i, GEMINI_PRIMARY_MODEL);
      let validation = validateTransactions(rawRes.transactions, balanceState, rawRes.openingBalance, rawRes.closingBalance);

      // Tiered fallback if chunk has suspicious rows (balance mismatch) or too many rejections
      if (validation.suspiciousCount > 0 || (validation.rejectedCount > 0 && validation.valid.length === 0)) {
         console.log(`[llmParser] chunk ${i}: Suspicious output from ${GEMINI_PRIMARY_MODEL}. Falling back to ${GEMINI_FALLBACK_MODEL}.`);
         const fallbackRawRes = await parseChunk(ai, chunkText, i, GEMINI_FALLBACK_MODEL);
         const fallbackValidation = validateTransactions(fallbackRawRes.transactions, balanceState, fallbackRawRes.openingBalance, fallbackRawRes.closingBalance);
         
         // Keep the fallback output if it's better or at least we tried
         validation = fallbackValidation;
      }

      totalRejectedCount += validation.rejectedCount;
      allValidTransactions.push(...validation.valid);
      
      // Update state for next chunk
      balanceState = validation.finalBalanceState;
    } catch (err) {
      failedChunks++;
      console.error(
        `[llmParser] chunk ${i}: API call failed after retries —`,
        err instanceof Error ? err.message : err
      );
      // On chunk failure, we lose balance continuity
      balanceState = { previousBalance: null, hasReliableBalance: false };
    }
  }

  return {
    transactions: allValidTransactions,
    chunkCount: sortedChunks.length,
    failedChunks,
    rejectedCount: totalRejectedCount
  };
}
