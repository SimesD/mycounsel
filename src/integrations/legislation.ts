/**
 * legislation.gov.uk API client
 * Mirrors the search_legislation tool from govuk-mcp (github.com/SimesD/govuk-mcp)
 * adapted for Cloudflare Workers (no Node.js Buffer/AbortController polyfill needed).
 */

import { ContractType } from "../state";

const LEGISLATION_BASE = "https://www.legislation.gov.uk";

export interface LegislationItem {
  title: string;
  type: string;
  year: string | number;
  number: string | number;
  url: string;
}

const CONTRACT_TYPE_QUERIES: Partial<Record<ContractType, string[]>> = {
  DISTRIBUTION_AGREEMENT: [
    "Vertical Agreements Block Exemption Order 2022",
    "Sale of Goods Act 1979",
    "Competition Act 1998",
    "Commercial Agents (Council Directive) Regulations 1993",
  ],
  SUPPLY_AGREEMENT: [
    "Sale of Goods Act 1979",
    "Supply of Goods and Services Act 1982",
    "Late Payment of Commercial Debts (Interest) Act 1998",
    "Unfair Contract Terms Act 1977",
  ],
  EMPLOYMENT_CONTRACT: [
    "Employment Rights Act 1996",
    "Equality Act 2010",
    "National Minimum Wage Act 1998",
    "Working Time Regulations 1998",
  ],
  SAAS_AGREEMENT: [
    "Supply of Goods and Services Act 1982",
    "Consumer Rights Act 2015",
    "Data Protection Act 2018",
    "Network and Information Systems (NIS) Regulations 2018",
  ],
  SOFTWARE_LICENCE: [
    "Copyright Designs and Patents Act 1988",
    "Supply of Goods and Services Act 1982",
    "Consumer Rights Act 2015",
  ],
  COMMERCIAL_LEASE: [
    "Landlord and Tenant Act 1954",
    "Law of Property Act 1925",
    "Landlord and Tenant (Covenants) Act 1995",
    "Leasehold Reform Act 1967",
  ],
  IP_LICENCE: [
    "Copyright Designs and Patents Act 1988",
    "Trade Marks Act 1994",
    "Patents Act 1977",
  ],
  SERVICES_AGREEMENT: [
    "Supply of Goods and Services Act 1982",
    "Late Payment of Commercial Debts (Interest) Act 1998",
    "Consumer Rights Act 2015",
  ],
  NDA: [
    "Misrepresentation Act 1967",
    "Trade Secrets (Enforcement etc) Regulations 2018",
    "Employment Rights Act 1996",
  ],
  SHARE_PURCHASE_AGREEMENT: [
    "Companies Act 2006",
    "Financial Services and Markets Act 2000",
    "Misrepresentation Act 1967",
  ],
  LOAN_AGREEMENT: [
    "Financial Services and Markets Act 2000",
    "Consumer Credit Act 1974",
    "Late Payment of Commercial Debts (Interest) Act 1998",
  ],
  FRANCHISE_AGREEMENT: [
    "Competition Act 1998",
    "Vertical Agreements Block Exemption Order 2022",
    "Commercial Agents (Council Directive) Regulations 1993",
  ],
  JV_AGREEMENT: [
    "Companies Act 2006",
    "Competition Act 1998",
    "Partnership Act 1890",
  ],
  CONSTRUCTION_CONTRACT: [
    "Housing Grants Construction and Regeneration Act 1996",
    "Construction (Design and Management) Regulations 2015",
    "Defective Premises Act 1972",
  ],
  AGENCY_AGREEMENT: [
    "Commercial Agents (Council Directive) Regulations 1993",
    "Competition Act 1998",
    "Supply of Goods and Services Act 1982",
  ],
  CONSULTANCY_AGREEMENT: [
    "Supply of Goods and Services Act 1982",
    "Employment Rights Act 1996",
    "IR35 — Income Tax (Earnings and Pensions) Act 2003",
  ],
};

/** Always-appended statutes that apply to virtually every commercial contract. */
const UNIVERSAL_STATUTES = [
  "Unfair Contract Terms Act 1977",
  "Misrepresentation Act 1967",
];

/**
 * Search legislation.gov.uk and return matching acts / statutory instruments.
 */
export async function searchLegislation(
  query: string,
  limit = 8,
): Promise<LegislationItem[]> {
  const url = `${LEGISLATION_BASE}/search?q=${encodeURIComponent(query)}&page=1`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    console.warn(
      `legislation.gov.uk search failed: ${res.status} for "${query}"`,
    );
    return [];
  }

  const data = (await res.json()) as Record<string, unknown>;
  const items =
    (data["results"] as unknown[]) ??
    ((data["feed"] as Record<string, unknown>)?.["entry"] as unknown[]) ??
    [];

  return (items as Record<string, unknown>[])
    .slice(0, limit)
    .map((r) => ({
      title: (r["title"] ?? r["dc:title"] ?? "") as string,
      type: (r["type"] ?? r["ukl:DocumentMainType"] ?? "") as string,
      year: (r["year"] ?? r["ukl:Year"] ?? "") as string,
      number: (r["number"] ?? r["ukl:Number"] ?? "") as string,
      url: (r["url"] ??
        (r["id"] ? `${LEGISLATION_BASE}${r["id"]}` : "")) as string,
    }))
    .filter((r) => r.title);
}

/**
 * Build a set of search queries tailored to the contract type and intent.
 *
 * Priority order:
 *  1. Type-specific queries from CONTRACT_TYPE_QUERIES (when contractType is known)
 *  2. Keyword-based fallback derived from the intent string
 *  3. Universal statutes (UCTA 1977, Misrepresentation Act 1967) always appended
 */
export function buildLegislationQueries(
  intent: string,
  contractType?: ContractType,
): string[] {
  const queries: string[] = [];

  // 1. Type-driven queries
  if (contractType && contractType !== "OTHER") {
    const typeQueries = CONTRACT_TYPE_QUERIES[contractType];
    if (typeQueries) {
      queries.push(...typeQueries);
    }
  } else {
    // 2. Keyword fallback (used for OTHER / undefined types)
    const lower = intent.toLowerCase();

    if (
      lower.includes("distribut") ||
      lower.includes("supply") ||
      lower.includes("resell")
    ) {
      queries.push("Vertical Agreements Block Exemption Order 2022");
      queries.push("Sale of Goods Act 1979");
      queries.push("Competition Act 1998");
    }
    if (
      lower.includes("vodka") ||
      lower.includes("spirits") ||
      lower.includes("alcohol") ||
      lower.includes("tofka")
    ) {
      queries.push("Licensing Act 2003");
    }
    if (
      lower.includes("saas") ||
      lower.includes("software") ||
      lower.includes("service")
    ) {
      queries.push("Supply of Goods and Services Act 1982");
      queries.push("Consumer Rights Act 2015");
    }
    if (
      lower.includes("lease") ||
      lower.includes("rent") ||
      lower.includes("property")
    ) {
      queries.push("Landlord and Tenant Act 1954");
      queries.push("Law of Property Act 1925");
    }
    if (lower.includes("employ") || lower.includes("worker")) {
      queries.push("Employment Rights Act 1996");
      queries.push("National Minimum Wage Act 1998");
    }
  }

  // 3. Always append universal statutes if not already present
  for (const statute of UNIVERSAL_STATUTES) {
    if (!queries.includes(statute)) {
      queries.push(statute);
    }
  }

  return [...new Set(queries)]; // deduplicate
}

/**
 * Format legislation results as a concise string for injection into prompts.
 */
export function formatLegislationContext(items: LegislationItem[]): string {
  if (items.length === 0) return "";
  return items
    .map((r) => `• ${r.title}${r.year ? ` (${r.year})` : ""} — ${r.url}`)
    .join("\n");
}
