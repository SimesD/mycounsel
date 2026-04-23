/**
 * Agent B — Legal Researcher (Gemini 2.5 Flash + legislation.gov.uk)
 *
 * Two-phase research:
 *   1. Fetch real statute references from legislation.gov.uk (via govuk-mcp pattern)
 *   2. Gemini identifies case law, anchor case, and regulatory context
 *      with the real legislation results injected into its prompt.
 */

import { withRetry } from "../retry";
import { GoogleGenAI, Type } from "@google/genai";
import { ContractState } from "../state";
import {
    searchLegislation,
    buildLegislationQueries,
    formatLegislationContext,
} from "../integrations/legislation";
import {
    searchTna,
    formatTnaContext,
} from "../integrations/tna";

interface ResearchResult {
    statutes: string[];
    precedents: string[];
    anchor_case_summary: string;
    regulatory_notes: string[];
}

const RESEARCH_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        statutes: { type: Type.ARRAY, items: { type: Type.STRING } },
        precedents: { type: Type.ARRAY, items: { type: Type.STRING } },
        anchor_case_summary: { type: Type.STRING },
        regulatory_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
        "statutes",
        "precedents",
        "anchor_case_summary",
        "regulatory_notes",
    ],
};

const CONTRACT_TYPE_GUIDANCE: Partial<Record<string, string>> = {
    DISTRIBUTION_AGREEMENT:
        "For DISTRIBUTION_AGREEMENT: focus on VABEO 2022 Article 4 hardcore restrictions and 30% market share safe harbour.",
    EMPLOYMENT_CONTRACT:
        "For EMPLOYMENT_CONTRACT: focus on unfair dismissal thresholds, TUPE implications, restrictive covenants (restraint of trade doctrine).",
    SAAS_AGREEMENT:
        "For SAAS_AGREEMENT: focus on GDPR/UK GDPR data processing obligations, uptime SLA enforceability, limitation of liability under CRA 2015.",
    COMMERCIAL_LEASE:
        "For COMMERCIAL_LEASE: focus on security of tenure under LTA 1954, authorised guarantee agreements, break clause conditions.",
    NDA: "For NDA: focus on restraint of trade, reasonable duration and scope, Trade Secrets Regulations 2018.",
    SHARE_PURCHASE_AGREEMENT:
        "For SHARE_PURCHASE_AGREEMENT: focus on warranty and indemnity claims, limitation periods, Material Adverse Change clauses.",
};

export async function researchNode(
    state: ContractState,
    env: Env,
): Promise<Partial<ContractState>> {
    // ── Phase 1: fetch real references from legislation.gov.uk and TNA ──────────
    const legQueries = buildLegislationQueries(
        state.inputs.intent,
        state.contract_type,
    );

    // Simple search queries for TNA based on contract type
    const tnaQueries = [
        state.contract_type?.toLowerCase().replace(/_/g, " "),
        state.inputs.intent.split(" ").slice(0, 3).join(" "),
    ].filter(Boolean) as string[];

    const [legislationResults, tnaResults] = await Promise.all([
        Promise.all(legQueries.map((q) => searchLegislation(q, 4))),
        Promise.all(tnaQueries.map((q) => searchTna(q, 3))),
    ]);

    const allLegItems = legislationResults.flat();
    const legislationContext = formatLegislationContext(allLegItems);

    const allTnaItems = tnaResults.flat();
    const tnaContext = formatTnaContext(allTnaItems);

    console.log(
        `[researcher] legislation: ${allLegItems.length} items, TNA: ${allTnaItems.length} items`,
    );

    // ── Phase 2: Gemini enriches with case law and regulatory analysis ──────────
    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

    const partiesSummary = state.inputs.parties
        .map((p) => `${p.name} (${p.role})`)
        .join(", ");

    const contractTypeGuidance =
        state.contract_type && CONTRACT_TYPE_GUIDANCE[state.contract_type]
            ? `\n${CONTRACT_TYPE_GUIDANCE[state.contract_type]}`
            : "";

    const prompt = `You are a specialist UK legal researcher at a top-tier City of London law firm.

The following Acts and Statutory Instruments have been retrieved directly from legislation.gov.uk:

${legislationContext || "(No legislation.gov.uk results — rely on your training knowledge)"}

The following modern judgments have been retrieved from The National Archives (TNA) "Find Case Law" database:

${tnaContext || "(No TNA results — rely on your training knowledge and BAILII historical coverage)"}

Using these confirmed sources as your foundation, produce a legal research report for this agreement:

Contract Type: ${state.contract_type ?? "UNKNOWN"}
Intent: ${state.inputs.intent}
Parties: ${partiesSummary}
Commercial Terms: ${JSON.stringify(state.inputs.commercial_terms, null, 2)}

Return a JSON object with:
- "statutes": array of specific sections from the confirmed Acts above (e.g. "Sale of Goods Act 1979 s.12 — implied title condition").
- "precedents": array of real UK case citations with one-line holdings. Prefer the TNA cases above if relevant, supplemented by your knowledge of historical BAILII cases.
- "anchor_case_summary": three sentences on the leading English law case for this type of agreement
- "regulatory_notes": applicable CMA/FCA/HMRC guidance notes

For distribution agreements: cite VABEO 2022 (SI 2022/516) Article 4 hardcore restrictions and the 30% market share safe harbour.
For alcohol/spirits: cite Licensing Act 2003 requirements.${contractTypeGuidance}`;

    const response = await withRetry(() =>
        ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: RESEARCH_SCHEMA,
                temperature: 0.2,
            },
        }),
    );

    const parsed = JSON.parse(response.text ?? "{}") as ResearchResult;

    // Merge: prepend legislation.gov.uk confirmed titles into statutes list
    const confirmedTitles = allLegItems.map((r) => r.title);
    const mergedStatutes = [
        ...new Set([...confirmedTitles, ...(parsed.statutes ?? [])]),
    ];

    return {
        status: "DRAFTING",
        legal_context: {
            statutes: mergedStatutes,
            precedents: parsed.precedents ?? [],
            anchor_case_summary: parsed.anchor_case_summary ?? "",
        },
    };
}
