/**
 * legislation.gov.uk integration
 *
 * Uses a static lookup table of known statutes with their canonical
 * legislation.gov.uk URLs. This is more reliable than the search API
 * which does not support JSON responses.
 */

import { ContractType } from "../state";

const LEGISLATION_BASE = "https://www.legislation.gov.uk";

/**
 * Exported list of statute name keys in the lookup table (lowercase).
 * Used by the closing report confidence scorer to determine how many of
 * the cited statutes are from our verified legislation.gov.uk table.
 * Populated lazily after STATUTE_LOOKUP is defined — see bottom of file.
 */
export let STATUTE_LOOKUP_KEYS: string[] = [];

export interface LegislationItem {
    title: string;
    type: string;
    year: string | number;
    number: string | number;
    url: string;
}

/**
 * Static lookup table: statute name → legislation.gov.uk canonical URL.
 * Keys are matched case-insensitively against the query string.
 */
const STATUTE_LOOKUP: Record<string, LegislationItem> = {
    "unfair contract terms act 1977": {
        title: "Unfair Contract Terms Act 1977",
        type: "ukpga",
        year: 1977,
        number: 50,
        url: `${LEGISLATION_BASE}/ukpga/1977/50`,
    },
    "misrepresentation act 1967": {
        title: "Misrepresentation Act 1967",
        type: "ukpga",
        year: 1967,
        number: 7,
        url: `${LEGISLATION_BASE}/ukpga/1967/7`,
    },
    "sale of goods act 1979": {
        title: "Sale of Goods Act 1979",
        type: "ukpga",
        year: 1979,
        number: 54,
        url: `${LEGISLATION_BASE}/ukpga/1979/54`,
    },
    "supply of goods and services act 1982": {
        title: "Supply of Goods and Services Act 1982",
        type: "ukpga",
        year: 1982,
        number: 29,
        url: `${LEGISLATION_BASE}/ukpga/1982/29`,
    },
    "competition act 1998": {
        title: "Competition Act 1998",
        type: "ukpga",
        year: 1998,
        number: 41,
        url: `${LEGISLATION_BASE}/ukpga/1998/41`,
    },
    "vertical agreements block exemption order 2022": {
        title: "Vertical Agreements Block Exemption Order 2022",
        type: "uksi",
        year: 2022,
        number: 516,
        url: `${LEGISLATION_BASE}/uksi/2022/516`,
    },
    "commercial agents (council directive) regulations 1993": {
        title: "Commercial Agents (Council Directive) Regulations 1993",
        type: "uksi",
        year: 1993,
        number: 3053,
        url: `${LEGISLATION_BASE}/uksi/1993/3053`,
    },
    "late payment of commercial debts (interest) act 1998": {
        title: "Late Payment of Commercial Debts (Interest) Act 1998",
        type: "ukpga",
        year: 1998,
        number: 20,
        url: `${LEGISLATION_BASE}/ukpga/1998/20`,
    },
    "employment rights act 1996": {
        title: "Employment Rights Act 1996",
        type: "ukpga",
        year: 1996,
        number: 18,
        url: `${LEGISLATION_BASE}/ukpga/1996/18`,
    },
    "equality act 2010": {
        title: "Equality Act 2010",
        type: "ukpga",
        year: 2010,
        number: 15,
        url: `${LEGISLATION_BASE}/ukpga/2010/15`,
    },
    "national minimum wage act 1998": {
        title: "National Minimum Wage Act 1998",
        type: "ukpga",
        year: 1998,
        number: 39,
        url: `${LEGISLATION_BASE}/ukpga/1998/39`,
    },
    "working time regulations 1998": {
        title: "Working Time Regulations 1998",
        type: "uksi",
        year: 1998,
        number: 1833,
        url: `${LEGISLATION_BASE}/uksi/1998/1833`,
    },
    "consumer rights act 2015": {
        title: "Consumer Rights Act 2015",
        type: "ukpga",
        year: 2015,
        number: 15,
        url: `${LEGISLATION_BASE}/ukpga/2015/15`,
    },
    "data protection act 2018": {
        title: "Data Protection Act 2018",
        type: "ukpga",
        year: 2018,
        number: 12,
        url: `${LEGISLATION_BASE}/ukpga/2018/12`,
    },
    "network and information systems (nis) regulations 2018": {
        title: "Network and Information Systems (NIS) Regulations 2018",
        type: "uksi",
        year: 2018,
        number: 506,
        url: `${LEGISLATION_BASE}/uksi/2018/506`,
    },
    "copyright designs and patents act 1988": {
        title: "Copyright, Designs and Patents Act 1988",
        type: "ukpga",
        year: 1988,
        number: 48,
        url: `${LEGISLATION_BASE}/ukpga/1988/48`,
    },
    "trade marks act 1994": {
        title: "Trade Marks Act 1994",
        type: "ukpga",
        year: 1994,
        number: 26,
        url: `${LEGISLATION_BASE}/ukpga/1994/26`,
    },
    "patents act 1977": {
        title: "Patents Act 1977",
        type: "ukpga",
        year: 1977,
        number: 37,
        url: `${LEGISLATION_BASE}/ukpga/1977/37`,
    },
    "landlord and tenant act 1954": {
        title: "Landlord and Tenant Act 1954",
        type: "ukpga",
        year: 1954,
        number: 56,
        url: `${LEGISLATION_BASE}/ukpga/1954/56`,
    },
    "law of property act 1925": {
        title: "Law of Property Act 1925",
        type: "ukpga",
        year: 1925,
        number: 20,
        url: `${LEGISLATION_BASE}/ukpga/1925/20`,
    },
    "landlord and tenant (covenants) act 1995": {
        title: "Landlord and Tenant (Covenants) Act 1995",
        type: "ukpga",
        year: 1995,
        number: 30,
        url: `${LEGISLATION_BASE}/ukpga/1995/30`,
    },
    "leasehold reform act 1967": {
        title: "Leasehold Reform Act 1967",
        type: "ukpga",
        year: 1967,
        number: 88,
        url: `${LEGISLATION_BASE}/ukpga/1967/88`,
    },
    "companies act 2006": {
        title: "Companies Act 2006",
        type: "ukpga",
        year: 2006,
        number: 46,
        url: `${LEGISLATION_BASE}/ukpga/2006/46`,
    },
    "financial services and markets act 2000": {
        title: "Financial Services and Markets Act 2000",
        type: "ukpga",
        year: 2000,
        number: 8,
        url: `${LEGISLATION_BASE}/ukpga/2000/8`,
    },
    "consumer credit act 1974": {
        title: "Consumer Credit Act 1974",
        type: "ukpga",
        year: 1974,
        number: 39,
        url: `${LEGISLATION_BASE}/ukpga/1974/39`,
    },
    "partnership act 1890": {
        title: "Partnership Act 1890",
        type: "ukpga",
        year: 1890,
        number: 39,
        url: `${LEGISLATION_BASE}/ukpga/Vict/53-54/39`,
    },
    "licensing act 2003": {
        title: "Licensing Act 2003",
        type: "ukpga",
        year: 2003,
        number: 17,
        url: `${LEGISLATION_BASE}/ukpga/2003/17`,
    },
    "housing grants construction and regeneration act 1996": {
        title: "Housing Grants, Construction and Regeneration Act 1996",
        type: "ukpga",
        year: 1996,
        number: 53,
        url: `${LEGISLATION_BASE}/ukpga/1996/53`,
    },
    "construction (design and management) regulations 2015": {
        title: "Construction (Design and Management) Regulations 2015",
        type: "uksi",
        year: 2015,
        number: 51,
        url: `${LEGISLATION_BASE}/uksi/2015/51`,
    },
    "defective premises act 1972": {
        title: "Defective Premises Act 1972",
        type: "ukpga",
        year: 1972,
        number: 35,
        url: `${LEGISLATION_BASE}/ukpga/1972/35`,
    },
    "trade secrets (enforcement etc) regulations 2018": {
        title: "Trade Secrets (Enforcement etc.) Regulations 2018",
        type: "uksi",
        year: 2018,
        number: 597,
        url: `${LEGISLATION_BASE}/uksi/2018/597`,
    },
    "ir35 — income tax (earnings and pensions) act 2003": {
        title: "Income Tax (Earnings and Pensions) Act 2003 (IR35)",
        type: "ukpga",
        year: 2003,
        number: 1,
        url: `${LEGISLATION_BASE}/ukpga/2003/1`,
    },
};

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
 * Look up a statute by name using the static lookup table.
 * Performs a case-insensitive match on the full statute name.
 * Falls back to a partial match if no exact match is found.
 */
export async function searchLegislation(
    query: string,
    _limit = 8,
): Promise<LegislationItem[]> {
    const lower = query.toLowerCase().trim();

    // Exact match
    if (STATUTE_LOOKUP[lower]) {
        return [STATUTE_LOOKUP[lower]];
    }

    // Partial match — return all entries whose key contains the query or vice versa
    const partialMatches = Object.entries(STATUTE_LOOKUP)
        .filter(([key]) => key.includes(lower) || lower.includes(key))
        .map(([, item]) => item);

    if (partialMatches.length > 0) {
        return partialMatches.slice(0, _limit);
    }

    console.warn(`legislation: no lookup match for "${query}"`);
    return [];
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
    return items.map((r) => `• ${r.title} — ${r.url}`).join("\n");
}

// Populate STATUTE_LOOKUP_KEYS now that STATUTE_LOOKUP is defined above.
// This gives report.ts a list of known statute names for confidence scoring.
STATUTE_LOOKUP_KEYS = Object.keys(STATUTE_LOOKUP);
