/**
 * Retry wrapper for Gemini API calls.
 * Parses the retryDelay from 429 responses and waits before retrying.
 * Max 5 attempts.
 *
 * Retryable conditions:
 *   429 / RESOURCE_EXHAUSTED — rate limit, wait for suggested delay
 *   503 / UNAVAILABLE        — model overload, exponential backoff
 *   524                      — Cloudflare upstream timeout (Gemini took too long),
 *                              exponential backoff — the model may succeed on retry
 *                              once the upstream load clears
 */

const MAX_ATTEMPTS = 5;

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

            const is429 =
                msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
            const is503 = msg.includes("503") || msg.includes("UNAVAILABLE");
            // 524 = Cloudflare upstream timeout — Gemini did not respond in time.
            // Worth retrying: the model may succeed once upstream load clears.
            const is524 = msg.includes("524");
            const isRetryable = is429 || is503 || is524;
            const isDaily = msg.includes("PerDay");

            if (!isRetryable || attempt === MAX_ATTEMPTS) throw lastError;

            // Don't retry daily limits — they won't recover within the request
            if (isDaily) {
                throw new Error(
                    `Daily API quota exhausted. Please try again after midnight UTC or check your billing plan.\n${msg}`,
                );
            }

            let delayMs: number;
            if (is524) {
                // Generous backoff for timeouts — the prompt may be large and the model
                // needs time to recover. 15s, 30s, 45s, 60s between attempts.
                delayMs = attempt * 15000;
            } else if (is503) {
                delayMs = attempt * 8000; // 8s, 16s, 24s, 32s
            } else {
                delayMs = parseRetryDelayMs(msg);
            }

            const reason = is524 ? "524 timeout" : is503 ? "503" : "429";
            console.warn(
                `[retry] ${reason} on attempt ${attempt}, waiting ${delayMs}ms before retry...`,
            );
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    throw lastError!;
}
