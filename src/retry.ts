/**
 * Retry wrapper for Gemini API calls.
 * Parses the retryDelay from 429 responses and waits before retrying.
 * Max 3 attempts.
 */

const MAX_ATTEMPTS = 3;

function parseRetryDelayMs(errorMessage: string): number {
  // Error message contains e.g. "Please retry in 22.3s"
  const match = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000);
  return 5000; // default 5s
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;

      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      const isDaily = msg.includes('PerDay');

      if (!is429 || attempt === MAX_ATTEMPTS) throw lastError;

      // Don't retry daily limits — they won't recover within the request
      if (isDaily) {
        throw new Error(
          `Daily API quota exhausted. Please try again after midnight UTC or check your billing plan.\n${msg}`
        );
      }

      const delayMs = parseRetryDelayMs(msg);
      console.warn(`[retry] 429 on attempt ${attempt}, waiting ${delayMs}ms before retry...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw lastError!;
}
