/**
 * Agent D — Risk & Standing Agent (Gemini 2.5 Flash)
 *
 * On first run: adversarial peer review, finds up to 3 vulnerabilities.
 * On subsequent runs: compares against previous report, acknowledges
 * improvements, only flags genuinely remaining or new issues.
 * Score convergence: if score >= 82 the draft is considered sound.
 */

import { withRetry } from '../retry';
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
    resolved_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['enforceability_score', 'warnings', 'statutory_basis', 'recommendation'],
};

export async function riskNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  const latestDraft = state.draft_versions[state.draft_versions.length - 1];
  if (!latestDraft) throw new Error('Risk node: no draft available to review');

  const isRevision = latestDraft.version > 1;
  const previousReport = isRevision ? state.risk_report : undefined;
  const partiesSummary = state.inputs.parties
    .map((p) => `${p.name} (${p.role})`)
    .join(', ');

  const previousReportSection = previousReport
    ? `
**PREVIOUS RISK REPORT (Version ${latestDraft.version - 1}) — Score: ${previousReport.enforceability_score}/100:**
The following vulnerabilities were identified in the prior draft:
${previousReport.warnings.map((w, i) => `${i + 1}. ${w.title}: ${w.detail} (${w.statutory_basis})`).join('\n')}
Previous recommendation: ${previousReport.recommendation}

You MUST:
- Acknowledge which of the above issues have been resolved in the new draft
- Only flag issues that genuinely remain or are newly introduced
- Reflect improvements in a higher enforceability score
- Do NOT re-flag issues that have been adequately addressed
`
    : '';

  const systemInstruction = isRevision
    ? `You are a senior partner at a Magic Circle law firm conducting a comparative review of a revised contract draft.

You previously identified weaknesses in Version ${latestDraft.version - 1}. Your job now is to:
1. Assess whether those issues have been fixed in Version ${latestDraft.version}
2. Identify any REMAINING material weaknesses (not ones already fixed)
3. Note any NEW issues introduced by the revision
4. Score the enforceability — the score should INCREASE if issues were resolved
5. If fewer than 3 genuine issues remain, report only the real ones (minimum 1)

SCORING GUIDANCE:
- 90–100: Exceptional — recommend approval
- 82–89: Good, minor points only — consider approving
- 70–81: Adequate, notable gaps remain
- 50–69: Significant weaknesses, further revision needed
- Below 50: Do not execute

JURISDICTION: English law only.`
    : `You are a senior partner at a Magic Circle law firm acting as an adversarial peer reviewer.

Find weaknesses, ambiguities, and legally vulnerable provisions that opposing counsel could exploit.

1. Identify up to THREE material legal weaknesses, citing specific UK statute or case law
2. Score overall enforceability 0–100
3. State the primary governing statute
4. Give a single actionable recommendation

SCORING GUIDANCE:
- 90–100: Exceptional draft
- 75–89: Good, minor issues
- 60–74: Notable gaps with litigation risk
- 40–59: Significant weaknesses
- Below 40: Do not execute

JURISDICTION: English law only.`;

  const prompt = `${systemInstruction}
${previousReportSection}
**Transaction:** ${state.inputs.intent}
**Parties:** ${partiesSummary}
**Governing Law:** England & Wales

**Statutory Framework:**
${state.legal_context.statutes.map((s) => `• ${s}`).join('\n')}

**Contract Draft (Version ${latestDraft.version}):**

${latestDraft.content}`;

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RISK_SCHEMA,
      temperature: 0.2,
    },
  }));

  const parsed = JSON.parse(response.text ?? '{}') as RiskReport;

  return {
    status: 'LAWYER_REVIEW',
    risk_report: parsed,
  };
}
