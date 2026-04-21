/**
 * Agent B — Legal Researcher (Gemini 2.5 Flash + Grounding)
 *
 * Identifies relevant UK statutes, case law, and regulatory guidance.
 * Uses Google Search grounding to retrieve current, accurate legal references.
 *
 * Note: googleSearch tool and responseMimeType:'application/json' are mutually
 * exclusive in the Gemini API — we use plain text output and extract JSON manually.
 */

import { GoogleGenAI } from '@google/genai';
import { ContractState } from '../state';

interface ResearchResult {
  statutes: string[];
  precedents: string[];
  anchor_case_summary: string;
  regulatory_notes: string[];
}

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

You MUST respond with a JSON object only — no prose, no markdown, no explanation.
Use precise statutory references (e.g., "Companies Act 2006 s.172(1)" not just "Companies Act 2006").

Response format:
{
  "statutes": ["<Act name and section>", ...],
  "precedents": ["<Case name [year] court — one-line holding>", ...],
  "anchor_case_summary": "<Three sentences on the leading case for this agreement type>",
  "regulatory_notes": ["<CMA/FCA/HMRC guidance note>", ...]
}`;

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
6. Identify cases on enforceability of exclusivity clauses under English law

Respond with the JSON object only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? '{}';
  // Strip markdown code fences if the model wraps its output
  const jsonText = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  let parsed: ResearchResult;
  try {
    parsed = JSON.parse(jsonText) as ResearchResult;
  } catch {
    // If the model returned prose instead of JSON, extract what we can
    console.error('Research agent returned non-JSON, using fallback extraction');
    parsed = {
      statutes: extractList(text, 'statutes') ?? ['Contract Act 1999', 'Sale of Goods Act 1979'],
      precedents: extractList(text, 'precedents') ?? [],
      anchor_case_summary: '',
      regulatory_notes: [],
    };
  }

  return {
    status: 'DRAFTING',
    legal_context: {
      statutes: parsed.statutes ?? [],
      precedents: parsed.precedents ?? [],
      anchor_case_summary: parsed.anchor_case_summary ?? '',
    },
  };
}

/** Best-effort extraction of a JSON array from prose output. */
function extractList(text: string, _key: string): string[] | null {
  const match = text.match(/\[([^\]]+)\]/);
  if (!match) return null;
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}
