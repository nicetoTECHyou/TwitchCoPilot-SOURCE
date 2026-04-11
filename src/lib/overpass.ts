// Shared Overpass API fetch utility with retry logic and fallback endpoints

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

/**
 * Fetch Overpass API with automatic retry and endpoint fallback.
 * Tries each endpoint up to 2 times before moving to the next.
 * Handles 429 (rate limit) and 5xx (server error) with exponential backoff.
 */
export async function fetchOverpass(query: string, timeoutMs = 30000): Promise<any> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          return await res.json();
        }

        // Server error (502, 504) or rate limit (429) → retry with backoff
        if (res.status === 429 || res.status >= 500) {
          const statusText = await res.text().catch(() => '');
          lastError = new Error(`HTTP ${res.status} from ${endpoint}`);
          console.warn(`[Overpass] ${endpoint} returned ${res.status}, attempt ${attempt + 1}/2, retrying...`);
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }

        // Client error (4xx except 429) → don't retry, likely a query problem
        const errorText = await res.text().catch(() => '');
        lastError = new Error(`HTTP ${res.status}: ${errorText.substring(0, 200)}`);
        break; // Don't retry this endpoint on client errors
      } catch (e: any) {
        clearTimeout(timeoutId);

        // Client error from above — move to next endpoint
        if (e.message?.startsWith('HTTP ')) {
          break;
        }

        lastError = e;

        // AbortError = timeout, NetworkError = offline
        if (e.name === 'AbortError') {
          console.warn(`[Overpass] ${endpoint} timed out after ${timeoutMs}ms, attempt ${attempt + 1}/2`);
        } else {
          console.warn(`[Overpass] ${endpoint} failed: ${e.message}`);
        }

        // Wait before retrying (or moving to next endpoint)
        if (attempt < 1) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        break; // Move to next endpoint
      }
    }
  }

  throw lastError || new Error('All Overpass API endpoints failed');
}
