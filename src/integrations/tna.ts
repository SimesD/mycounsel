/**
 * The National Archives (TNA) "Find Case Law" integration.
 * 
 * ── What is TNA Find Case Law? ──────────────────────────────────────────────
 * 
 * The National Archives (TNA) is the official publisher of court and tribunal 
 * decisions for England, Wales, and the UK-wide courts (Supreme Court). 
 * It took over this role from BAILII for modern judgments in April 2022.
 * 
 * Coverage:
 * - UK Supreme Court: 2003–present
 * - Court of Appeal: 2003–present
 * - High Court: 2003–present
 * - Upper Tribunal (Administrative Appeals, Immigration & Asylum, Tax & Chancery)
 * - Various other tribunals (Employment, etc.)
 * 
 * ── Data Formats ─────────────────────────────────────────────────────────────
 * 
 * TNA provides structured data in LegalDocML (Akoma Ntoso), which allows for
 * more precise parsing than BAILII's HTML-heavy format.
 */

const TNA_BASE_URL = "https://caselaw.nationalarchives.gov.uk";

export interface TnaResult {
    title: string;
    uri: string;
    citation: string;
    date: string;
    court: string;
}

export interface TnaLink {
    citation: string;
    caseName: string;
    url: string;
    isDirectLink: boolean;
    court: string;
}

/**
 * Search the TNA Find Case Law database.
 * 
 * @param query - The search query (e.g., party names or citation)
 * @param limit - Maximum number of results to return
 */
export async function searchTna(query: string, limit: number = 5): Promise<TnaResult[]> {
    const params = new URLSearchParams({
        q: query,
        format: "atom", // Get structured results
    });

    const response = await fetch(`${TNA_BASE_URL}/search?${params.toString()}`);
    
    if (!response.ok) {
        console.error(`TNA search failed: ${response.status} ${response.statusText}`);
        return [];
    }

    const xmlText = await response.text();
    return parseTnaAtomFeed(xmlText).slice(0, limit);
}

/**
 * Simplistic Atom feed parser for TNA search results.
 * In a production environment, use a robust XML parser like fast-xml-parser.
 */
function parseTnaAtomFeed(xml: string): TnaResult[] {
    const results: TnaResult[] = [];
    const entries = xml.split("<entry>");
    
    // Skip the first part which is metadata about the feed
    for (let i = 1; i < entries.length; i++) {
        const entry = entries[i];
        
        const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || "Unknown Title";
        const link = entry.match(/<link[^>]+href="([^"]+)"/)?.[1] || "";
        const citation = entry.match(/<tna:neutralCitation>([^<]+)<\/tna:neutralCitation>/)?.[1] || "";
        const date = entry.match(/<published>([^<]+)<\/published>/)?.[1] || "";
        const court = entry.match(/<tna:court>([^<]+)<\/tna:court>/)?.[1] || "";

        if (link) {
            results.push({
                title: title.trim(),
                uri: link,
                citation: citation.trim(),
                date: date.trim(),
                court: court.trim(),
            });
        }
    }

    return results;
}

/**
 * Parse a neutral citation to a potential TNA URL.
 * Example: [2024] UKSC 1 -> https://caselaw.nationalarchives.gov.uk/uksc/2024/1
 */
export function parseTnaCitation(citation: string): TnaLink | null {
    const caseName = extractCaseName(citation);
    
    // TNA URL structures:
    // UKSC: /uksc/YEAR/NUMBER
    // EWCA Civ: /ewca/civ/YEAR/NUMBER
    // EWHC: /ewhc/DIV/YEAR/NUMBER
    
    const uksc = citation.match(/\[(\d{4})\]\s+UKSC\s+(\d+)/i);
    if (uksc) {
        const year = uksc[1];
        const num = uksc[2];
        return {
            citation,
            caseName,
            url: `${TNA_BASE_URL}/uksc/${year}/${num}`,
            isDirectLink: true,
            court: "UK Supreme Court",
        };
    }

    const ewcaCiv = citation.match(/\[(\d{4})\]\s+EWCA\s+Civ\s*(\d+)/i);
    if (ewcaCiv) {
        return {
            citation,
            caseName,
            url: `${TNA_BASE_URL}/ewca/civ/${ewcaCiv[1]}/${ewcaCiv[2]}`,
            isDirectLink: true,
            court: "Court of Appeal (Civil Division)",
        };
    }

    const ewcaCrim = citation.match(/\[(\d{4})\]\s+EWCA\s+Crim\s*(\d+)/i);
    if (ewcaCrim) {
        return {
            citation,
            caseName,
            url: `${TNA_BASE_URL}/ewca/crim/${ewcaCrim[1]}/${ewcaCrim[2]}`,
            isDirectLink: true,
            court: "Court of Appeal (Criminal Division)",
        };
    }

    const ewhc = citation.match(/\[(\d{4})\]\s+EWHC\s+(\d+)\s*\((Admin|Ch|Comm|Fam|Pat|QB|KB|TCC)\)/i);
    if (ewhc) {
        const div = ewhc[3].toLowerCase();
        return {
            citation,
            caseName,
            url: `${TNA_BASE_URL}/ewhc/${div}/${ewhc[1]}/${ewhc[2]}`,
            isDirectLink: true,
            court: `High Court (${ewhc[3]})`,
        };
    }

    // Fallback to search if we can't construct a direct link
    return null;
}

function extractCaseName(citation: string): string {
    const withoutHolding = citation.split(/\s+[—–]\s+/)[0].trim();
    const nameOnly = withoutHolding.replace(/\[.*$/, "").trim();
    return nameOnly || withoutHolding;
}

/**
 * Format TNA search results for injection into LLM prompts.
 */
export function formatTnaContext(results: TnaResult[]): string {
    if (results.length === 0) return "";
    return results
        .map((r) => `• ${r.title} (${r.citation}) — ${r.uri}`)
        .join("\n");
}
