/**
 * pdfExtractor.ts
 *
 * pdf-parse v2 uses a class-based API (PDFParse), not the v1 callable-function API.
 * The buffer is passed into the constructor via `{ data: buffer }`.
 * getText() returns { text: string, total: number, pages: [...] }.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse") as {
  PDFParse: new (opts: { data: Buffer; verbosity?: number }) => {
    getText(opts?: Record<string, unknown>): Promise<{ text: string; total: number }>;
  };
};

export interface StatementChunk {
  pageStart: number;
  pageEnd: number;
  text: string;
}

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  chunks: StatementChunk[];
}

/**
 * Extract plain text from a PDF buffer using the pdf-parse v2 class API.
 * Throws 422 if:
 *  - the buffer is not a valid PDF (parse error)
 *  - the PDF appears to be scanned (near-empty text output)
 *
 * NOTE: Raw text is never logged anywhere per policy.
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtractResult> {
  let text: string = "";
  let pageCount: number = 0;
  const chunks: StatementChunk[] = [];

  try {
    // pdf-parse allows you to override the pagerender function to capture per-page text
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const result = await parser.getText();
    text = result.text ?? "";
    pageCount = result.total ?? 0;
    
    // As a simple fallback if we can't extract pages directly via getText,
    // we just use the original chunking logic but encapsulated in a single chunk
    // However, if result has a pages array (some versions do), we can use it.
    // Assuming pdf-parse doesn't reliably give per-page text without overriding pagerender,
    // we'll split the combined text by standard page breaks (\n\n\n or form feeds) or just return a chunk.
    
    // Instead of hacking pdf-parse pagerender here which might be flaky, we split by form feed (\x0C)
    // which pdf-parse normally inserts between pages.
    const pageTexts = text.split('\x0C');
    
    // We group pages into reasonable chunks (e.g., max 40000 chars) to avoid breaking transactions
    const CHUNK_SIZE_LIMIT = 40000;
    let currentChunkText = "";
    let currentChunkStartPage = 1;
    
    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i];
      const pageNum = i + 1;
      
      if (currentChunkText.length + pageText.length > CHUNK_SIZE_LIMIT && currentChunkText.length > 0) {
        chunks.push({
          pageStart: currentChunkStartPage,
          pageEnd: pageNum - 1,
          text: currentChunkText
        });
        currentChunkText = pageText;
        currentChunkStartPage = pageNum;
      } else {
        currentChunkText += (currentChunkText ? "\n" : "") + pageText;
      }
    }
    if (currentChunkText.trim()) {
      chunks.push({
        pageStart: currentChunkStartPage,
        pageEnd: pageTexts.length,
        text: currentChunkText
      });
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const e = new Error(`Could not parse PDF: ${msg}`) as Error & { statusCode?: number };
    e.statusCode = 422;
    throw e;
  }

  // Heuristic: fewer than 50 non-whitespace chars in a non-empty PDF = scanned/image-only
  const nonWhitespace = text.replace(/\s/g, "").length;
  if (pageCount > 0 && nonWhitespace < 50) {
    const e = new Error(
      "This appears to be a scanned (image-based) PDF. Please upload a text-based bank statement."
    ) as Error & { statusCode?: number };
    e.statusCode = 422;
    throw e;
  }

  return { text, pageCount, chunks };
}
