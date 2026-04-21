/**
 * legislation.gov.uk API client
 * Mirrors the search_legislation tool from govuk-mcp (github.com/SimesD/govuk-mcp)
 * adapted for Cloudflare Workers (no Node.js Buffer/AbortController polyfill needed).
 */

const LEGISLATION_BASE = 'https://www.legislation.gov.uk';

export interface LegislationItem {
  title: string;
  type: string;
  year: string | number;
  number: string | number;
  url: string;
}

/**
 * Search legislation.gov.uk and return matching acts / statutory instruments.
 */
export async function searchLegislation(
  query: string,
  limit = 8
): Promise<LegislationItem[]> {
  const url = `${LEGISLATION_BASE}/search?q=${encodeURIComponent(query)}&page=1`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    console.warn(`legislation.gov.uk search failed: ${res.status} for "${query}"`);
    return [];
  }

  const data = (await res.json()) as Record<string, unknown>;
  const items =
    (data['results'] as unknown[]) ??
    ((data['feed'] as Record<string, unknown>)?.['entry'] as unknown[]) ??
    [];

  return (items as Record<string, unknown>[])
    .slice(0, limit)
    .map((r) => ({
      title: (r['title'] ?? r['dc:title'] ?? '') as string,
      type: (r['type'] ?? r['ukl:DocumentMainType'] ?? '') as string,
      year: (r['year'] ?? r['ukl:Year'] ?? '') as string,
      number: (r['number'] ?? r['ukl:Number'] ?? '') as string,
      url: (r['url'] ??
        (r['id'] ? `${LEGISLATION_BASE}${r['id']}` : '')) as string,
    }))
    .filter((r) => r.title);
}

/**
 * Build a set of search queries tailored to the contract intent.
 */
export function buildLegislationQueries(intent: string): string[] {
  const lower = intent.toLowerCase();
  const queries: string[] = [];

  if (lower.includes('distribut') || lower.includes('supply') || lower.includes('resell')) {
    queries.push('Vertical Agreements Block Exemption Order 2022');
    queries.push('Sale of Goods Act 1979');
    queries.push('Competition Act 1998');
  }
  if (lower.includes('vodka') || lower.includes('spirits') || lower.includes('alcohol') || lower.includes('tofka')) {
    queries.push('Licensing Act 2003');
  }
  if (lower.includes('saas') || lower.includes('software') || lower.includes('service')) {
    queries.push('Supply of Goods and Services Act 1982');
    queries.push('Consumer Rights Act 2015');
  }
  if (lower.includes('lease') || lower.includes('rent') || lower.includes('property')) {
    queries.push('Landlord and Tenant Act 1954');
    queries.push('Law of Property Act 1925');
  }
  if (lower.includes('employ') || lower.includes('worker')) {
    queries.push('Employment Rights Act 1996');
    queries.push('National Minimum Wage Act 1998');
  }

  // Always include general contract law
  queries.push('Unfair Contract Terms Act 1977');
  queries.push('Misrepresentation Act 1967');

  return [...new Set(queries)]; // deduplicate
}

/**
 * Format legislation results as a concise string for injection into prompts.
 */
export function formatLegislationContext(items: LegislationItem[]): string {
  if (items.length === 0) return '';
  return items
    .map((r) => `• ${r.title}${r.year ? ` (${r.year})` : ''} — ${r.url}`)
    .join('\n');
}
