/**
 * Agent A — Intake & Entity Agent (Gemini 2.0 Flash)
 *
 * - Parses the user's natural-language intent
 * - Resolves company names via Companies House
 * - Validates UK jurisdiction / vires
 */

import { withRetry } from '../retry';
import { GoogleGenAI, Type } from '@google/genai';
import { ContractState, Party } from '../state';
import { searchCompany, formatAddress } from '../integrations/companies-house';

interface IntakeResult {
  intent: string;
  parties: Party[];
  commercial_terms_json: string;
  jurisdiction_ok: boolean;
  jurisdiction_warning?: string;
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
        required: ['name', 'role', 'address'],
      },
    },
    commercial_terms_json: {
      type: Type.STRING,
      description: 'JSON string of extracted commercial terms (prices, margins, durations, territory, exclusivity, etc.)',
    },
    jurisdiction_ok: { type: Type.BOOLEAN },
    jurisdiction_warning: { type: Type.STRING },
  },
  required: ['intent', 'parties', 'commercial_terms_json', 'jurisdiction_ok'],
};

export async function intakeNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  const prompt = `You are a UK legal intake specialist working for MyCounsel, a UK-regulated legal tech platform.
Your role is to:
1. Parse the user's intent into structured data
2. Identify all parties (people, companies, organisations)
3. Extract commercial terms (prices, durations, exclusivity, territory, etc.)
4. Validate the request is within UK jurisdiction and is not ultra vires
5. Flag if the request involves something that would be unlawful under English law

Always use UK legal terminology. Return structured JSON only.

Parse this legal instruction and extract structured data:

"${state.inputs.intent}"

Identify:
- The precise legal intent (what type of agreement is needed)
- All named parties and their roles
- All commercial terms mentioned (prices, percentages, durations, exclusivity, territory)
- Whether this is within UK jurisdiction
- Any ultra vires or unlawfulness concerns

For the "Tofka Vodka" scenario or any distribution agreement, note the commercial terms including margin percentages.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: INTAKE_SCHEMA,
    },
  }));

  const parsed = JSON.parse(response.text ?? '{}') as IntakeResult;

  let commercial_terms: Record<string, unknown> = {};
  try {
    commercial_terms = JSON.parse(parsed.commercial_terms_json ?? '{}');
  } catch {
    commercial_terms = { raw: parsed.commercial_terms_json };
  }

  // Enrich each party with Companies House data if they appear to be a UK company
  const enrichedParties: Party[] = await Promise.all(
    (parsed.parties ?? []).map(async (party) => {
      if (!party.address || party.address.length < 10) {
        const chResult = await searchCompany(party.name, env.COMPANIES_HOUSE_KEY);
        if (chResult) {
          return {
            ...party,
            co_number: chResult.company_number,
            address: formatAddress(chResult),
          };
        }
      }
      return party;
    })
  );

  const errors: string[] = [];
  if (!parsed.jurisdiction_ok && parsed.jurisdiction_warning) {
    errors.push(`Jurisdiction warning: ${parsed.jurisdiction_warning}`);
  }

  return {
    status: 'RESEARCH',
    inputs: {
      intent: parsed.intent,
      parties: enrichedParties,
      commercial_terms,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}
