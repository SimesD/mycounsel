/**
 * Agent B — Legal Researcher (Gemini 1.5 Pro + Grounding)
 *
 * Identifies relevant UK statutes, case law, and regulatory guidance.
 * Uses Google Search grounding to retrieve current, accurate legal references.
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
      description: 'Specific sections of UK Acts relevant to this agreement',
    },
    precedents: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Relevant UK case law citations and brief holdings',
    },
    anchor_case_summary: {
      type: Type.STRING,
      description: 'Three-sentence summary of the leading case for this agreement type',
    },
    regulatory_notes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Additional regulatory guidance (CMA, FCA, HMRC, etc.) if applicable',
    },
  },
  required: ['statutes', 'precedents', 'anchor_case_summary', 'regulatory_notes'],
};

const SYSTEM_INSTRUCTION = `You are a specialist UK legal researcher at a top-tier City of London law firm.
Your role is to identify the precise statutory framework, case law, and regulatory guidance that governs the agreement being drafted.

Key sources you must consider:
- Companies Act 2006 (directors' duties, company formation, share provisions)
- Sale of Goods Act 1979 / Consumer Rights Act 2015 (goods and services)
- Supply of Goods and Services Act 1982
- Competition Act 1998 / Retained EU Law (vertical agreements, market share thresholds)
- The Vertical Agreements Block Exemption Order 2022 (SI 2022/516) — particularly Article 4 (hardcore restrictions) and the 30% market share threshold
- Contract Law principles under English common law (offer, acceptance, consideration, certainty)
- Late Payment of Commercial Debts (Interest) Act 1998
- Misrepresentation Act 1967
- Unfair Contract Terms Act 1977 / Consumer Rights Act 2015 s.62

For distribution/supply agreements specifically:
- The CMA's Vertical Agreements and Vertical Restraints guidance (CMA123)
- Price Maintenance provisions — note that minimum resale price maintenance (RPM) is a hardcore restriction under the VABEO 2022

Return ONLY valid JSON. Use precise statutory references (e.g., "Companies Act 2006 s.172(1)" not just "Companies Act 2006").`;

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

Research the UK legal framework for the following agreement:

**Intent:** ${state.inputs.intent}

**Parties:** ${partiesSummary}

**Commercial Terms:**
${commercialTermsSummary}

Specific research requirements:
1. Identify ALL relevant UK statutes with specific section numbers
2. Find the leading "anchor case" for this type of agreement under English law
3. If this is a distribution/supply agreement with margin or pricing terms, research the Vertical Agreements Block Exemption Order 2022 (SI 2022/516) and the 30% market share safe harbour
4. Note any CMA guidance on vertical restraints applicable to this arrangement
5. Consider whether any terms could constitute hardcore restrictions under the VABEO 2022 (resale price maintenance, territory restrictions, etc.)
6. Identify cases on enforceability of exclusivity clauses under English law`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro-latest',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESEARCH_SCHEMA,
      temperature: 0.2,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? '{}';
  // Strip any markdown code fences that might wrap the JSON
  const jsonText = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(jsonText) as ResearchResult;

  return {
    status: 'DRAFTING',
    legal_context: {
      statutes: parsed.statutes,
      precedents: parsed.precedents,
      anchor_case_summary: parsed.anchor_case_summary,
    },
  };
}
