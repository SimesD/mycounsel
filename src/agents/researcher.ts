/**
 * Agent B — Legal Researcher (Gemini 2.5 Flash)
 *
 * Identifies relevant UK statutes, case law, and regulatory guidance
 * using the model's built-in legal knowledge with structured JSON output.
 *
 * Note: googleSearch grounding is intentionally omitted — it is mutually
 * exclusive with JSON mode and produces unreliable output for structured data.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ContractState } from '../state';

interface ResearchResult {
  statutes: string[];
  precedents: string[];
  anchor_case_summary: string;
  regulatory_notes: string[];
}

const RESEARCH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    statutes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    precedents: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    anchor_case_summary: { type: Type.STRING },
    regulatory_notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['statutes', 'precedents', 'anchor_case_summary', 'regulatory_notes'],
};

const SYSTEM_INSTRUCTION = `You are a specialist UK legal researcher at a top-tier City of London law firm.
Identify the precise statutory framework, case law, and regulatory guidance governing the agreement.

Key sources to consider:
- Companies Act 2006
- Sale of Goods Act 1979 / Consumer Rights Act 2015
- Supply of Goods and Services Act 1982
- Competition Act 1998
- Vertical Agreements Block Exemption Order 2022 (SI 2022/516) — Article 4 hardcore restrictions, 30% market share threshold
- Contract Law principles under English common law
- Late Payment of Commercial Debts (Interest) Act 1998
- Misrepresentation Act 1967
- Unfair Contract Terms Act 1977

For distribution/supply agreements:
- CMA Vertical Agreements and Vertical Restraints guidance (CMA123)
- Minimum resale price maintenance is a hardcore restriction under VABEO 2022 Article 4(a)

Use precise statutory references (e.g. "Companies Act 2006 s.172(1)").`;

export async function researchNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  const commercialTermsSummary = JSON.stringify(state.inputs.commercial_terms, null, 2);
  const partiesSummary = state.inputs.parties
    .map((p) => `${p.name} (${p.role})`)
    .join(', ');

  const prompt = `${SYSTEM_INSTRUCTION}

Research the UK legal framework for this agreement:

Intent: ${state.inputs.intent}
Parties: ${partiesSummary}
Commercial Terms: ${commercialTermsSummary}

Requirements:
1. Identify all relevant UK statutes with specific section numbers
2. Find the leading anchor case for this agreement type under English law
3. For distribution/supply agreements with pricing terms, cite VABEO 2022 and the 30% safe harbour
4. Note applicable CMA guidance on vertical restraints
5. Flag any potential hardcore restrictions (RPM, territory restrictions)
6. Cite cases on enforceability of exclusivity clauses`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESEARCH_SCHEMA,
      temperature: 0.2,
    },
  });

  const parsed = JSON.parse(response.text ?? '{}') as ResearchResult;

  return {
    status: 'DRAFTING',
    legal_context: {
      statutes: parsed.statutes ?? [],
      precedents: parsed.precedents ?? [],
      anchor_case_summary: parsed.anchor_case_summary ?? '',
    },
  };
}
