/**
 * Agent D — Risk & Standing Agent (Gemini 1.5 Pro)
 *
 * Acts as an adversarial peer reviewer. Identifies weaknesses in the draft,
 * cites the specific UK law that makes those sections vulnerable, and assigns
 * an enforceability score.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ContractState, RiskReport } from '../state';

const RISK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    enforceability_score: { type: Type.NUMBER },
    warnings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          detail: { type: Type.STRING },
          statutory_basis: { type: Type.STRING },
        },
        required: ['title', 'detail', 'statutory_basis'],
      },
    },
    statutory_basis: { type: Type.STRING },
    anchor_case: { type: Type.STRING },
    recommendation: { type: Type.STRING },
  },
  required: ['enforceability_score', 'warnings', 'statutory_basis', 'recommendation'],
};

const SYSTEM_INSTRUCTION = `You are a senior partner at a Magic Circle law firm acting as an adversarial peer reviewer for a junior colleague's contract draft.

Your role is NOT to praise the draft. Find weaknesses, ambiguities, and legally vulnerable provisions that opposing counsel could exploit or that a court might refuse to enforce.

You will:
1. Identify EXACTLY THREE (3) material legal weaknesses or vulnerabilities
2. For each weakness, cite the specific UK statute, statutory instrument, or case law that creates the vulnerability
3. Score overall enforceability 0–100 (100 = bomb-proof, 0 = unenforceable)
4. State the primary governing statute
5. Give a single actionable recommendation

SCORING GUIDANCE:
- 90–100: Exceptional draft, negligible risk
- 75–89: Good draft, minor technical issues
- 60–74: Adequate but notable gaps with meaningful litigation risk
- 40–59: Significant weaknesses — recommend substantial revision before execution
- Below 40: Do not execute — fundamental defects

JURISDICTION: English law only.`;

export async function riskNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  const latestDraft = state.draft_versions[state.draft_versions.length - 1];
  if (!latestDraft) throw new Error('Risk node: no draft available to review');

  const partiesSummary = state.inputs.parties
    .map((p) => `${p.name} (${p.role})`)
    .join(', ');

  const prompt = `${SYSTEM_INSTRUCTION}

Please review this contract draft and produce a Legal Standing Report.

**Transaction:** ${state.inputs.intent}
**Parties:** ${partiesSummary}
**Governing Law:** England & Wales

**Statutory Framework identified by research:**
${state.legal_context.statutes.map((s) => `• ${s}`).join('\n')}

**Contract Draft (Version ${latestDraft.version}):**

${latestDraft.content}

Identify three specific legal vulnerabilities in this draft and provide your enforceability score and recommendation. Return valid JSON only.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RISK_SCHEMA,
      temperature: 0.2,
    },
  });

  const parsed = JSON.parse(response.text ?? '{}') as RiskReport;

  return {
    status: 'LAWYER_REVIEW',
    risk_report: parsed,
  };
}
