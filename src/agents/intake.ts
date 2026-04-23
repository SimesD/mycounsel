/**
 * Agent A — Intake & Entity Agent (Gemini 2.0 Flash)
 *
 * - Parses the user's natural-language intent
 * - Resolves company names via Companies House
 * - Validates UK jurisdiction / vires
 * - Classifies the contract type
 */

import { withRetry } from "../retry";
import { GoogleGenAI, Type } from "@google/genai";
import { ContractState, ContractType, Party } from "../state";
import { searchCompany, formatAddress } from "../integrations/companies-house";

interface IntakeResult {
    intent: string;
    parties: Party[];
    commercial_terms_json: string;
    jurisdiction_ok: boolean;
    jurisdiction_warning?: string;
    contract_type: ContractType;
}

// commercial_terms is returned as a JSON string — Gemini's schema mode
// does not support free-form OBJECT types (no properties defined).
const INTAKE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        intent: { type: Type.STRING },
        parties: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    address: { type: Type.STRING },
                },
                required: ["name", "role", "address"],
            },
        },
        commercial_terms_json: {
            type: Type.STRING,
            description:
                "JSON string of extracted commercial terms (prices, margins, durations, territory, exclusivity, etc.)",
        },
        jurisdiction_ok: { type: Type.BOOLEAN },
        jurisdiction_warning: { type: Type.STRING },
        contract_type: {
            type: Type.STRING,
            description:
                "The specific type of UK commercial contract being drafted or reviewed. Choose the most specific match.",
            enum: [
                "DISTRIBUTION_AGREEMENT",
                "SUPPLY_AGREEMENT",
                "EMPLOYMENT_CONTRACT",
                "SAAS_AGREEMENT",
                "SOFTWARE_LICENCE",
                "COMMERCIAL_LEASE",
                "IP_LICENCE",
                "SERVICES_AGREEMENT",
                "NDA",
                "SHARE_PURCHASE_AGREEMENT",
                "LOAN_AGREEMENT",
                "FRANCHISE_AGREEMENT",
                "JV_AGREEMENT",
                "CONSTRUCTION_CONTRACT",
                "AGENCY_AGREEMENT",
                "CONSULTANCY_AGREEMENT",
                "OTHER",
            ],
        },
    },
    required: [
        "intent",
        "parties",
        "commercial_terms_json",
        "jurisdiction_ok",
        "contract_type",
    ],
};

export async function intakeNode(
    state: ContractState,
    env: Env,
): Promise<Partial<ContractState>> {
    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

    const isReview = state.mode === "REVIEW";

    const baseInstructions = `You are a UK legal intake specialist working for MyCounsel, a UK-regulated legal tech platform.
Your role is to:
1. Parse the instruction into structured data
2. Identify all parties (people, companies, organisations)
3. Extract commercial terms (prices, durations, exclusivity, territory, etc.)
4. Validate the request is within UK jurisdiction and is not ultra vires
5. Flag if the request involves something that would be unlawful under English law
6. Classify the precise type of UK commercial contract

Always use UK legal terminology. Return structured JSON only.`;

    let prompt: string;

    if (isReview && state.original_contract) {
        prompt = `${baseInstructions}

MODE: REVIEW — the user has submitted an existing contract for review and improvement.

Extract ALL structured data directly from the contract text below. Do NOT rely on the intent string for parties or commercial terms — read them from the contract itself.

For contract_type: classify the contract by reading its title, recitals, and operative provisions.
For parties: extract the full legal names, roles, and addresses as stated in the contract.
For commercial_terms_json: extract all pricing, payment, duration, territory, exclusivity, and other commercial provisions from the contract.
For intent: produce a concise one-sentence description of what the contract does.

CONTRACT TEXT:
---
${state.original_contract}
---`;
    } else {
        prompt = `${baseInstructions}

MODE: DRAFT — the user wants to draft a new contract from scratch.

Parse this legal instruction and extract structured data:

"${state.inputs.intent}"

Identify:
- The precise legal intent (what type of agreement is needed)
- All named parties and their roles
- All commercial terms mentioned (prices, percentages, durations, exclusivity, territory)
- Whether this is within UK jurisdiction
- Any ultra vires or unlawfulness concerns
- The most specific contract_type that matches the user's intent

For the "Tofka Vodka" scenario or any distribution agreement, note the commercial terms including margin percentages.`;
    }

    const response = await withRetry(() =>
        ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: INTAKE_SCHEMA,
            },
        }),
    );

    const parsed = JSON.parse(response.text ?? "{}") as IntakeResult;

    let commercial_terms: Record<string, unknown> = {};
    try {
        commercial_terms = JSON.parse(parsed.commercial_terms_json ?? "{}");
    } catch {
        commercial_terms = { raw: parsed.commercial_terms_json };
    }

    // If parties were pre-filled by the user in the intake form, use them
    // and only enrich those that don't already have a CH company number.
    // In REVIEW mode, always use the AI-extracted parties from the contract text.
    const sourceParties: Party[] =
        !isReview && state.inputs.parties.length > 0
            ? state.inputs.parties
            : (parsed.parties ?? []);

    const enrichedParties: Party[] = await Promise.all(
        sourceParties.map(async (party) => {
            if (party.co_number) return party; // already resolved
            if (!party.address || party.address.length < 10) {
                const chResult = await searchCompany(
                    party.name,
                    env.COMPANIES_HOUSE_KEY,
                );
                if (chResult) {
                    return {
                        ...party,
                        co_number: chResult.company_number,
                        address: formatAddress(chResult),
                    };
                }
            }
            return party;
        }),
    );

    const errors: string[] = [];
    if (!parsed.jurisdiction_ok && parsed.jurisdiction_warning) {
        errors.push(`Jurisdiction warning: ${parsed.jurisdiction_warning}`);
    }

    return {
        status: "RESEARCH",
        contract_type: parsed.contract_type as ContractType,
        inputs: {
            intent: parsed.intent,
            parties: enrichedParties,
            commercial_terms,
        },
        errors: errors.length > 0 ? errors : undefined,
    };
}
