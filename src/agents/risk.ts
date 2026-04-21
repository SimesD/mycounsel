/**
 * Agent D — Risk & Standing Agent (Claude 3.5 Sonnet)
 *
 * Acts as an adversarial peer reviewer. Identifies weaknesses in the draft,
 * cites the specific UK law that makes those sections vulnerable, and assigns
 * an enforceability score.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ContractState, RiskReport } from '../state';

export async function riskNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const latestDraft = state.draft_versions[state.draft_versions.length - 1];
  if (!latestDraft) {
    throw new Error('Risk node: no draft available to review');
  }

  const partiesSummary = state.inputs.parties
    .map((p) => `${p.name} (${p.role})`)
    .join(', ');

  const systemPrompt = `You are a senior partner at a Magic Circle law firm acting as an adversarial peer reviewer — sometimes called "Devil's Advocate" — for a junior colleague's contract draft.

Your role is NOT to praise the draft. Your role is to find weaknesses, ambiguities, and legally vulnerable provisions that opposing counsel could exploit, or that a court might refuse to enforce.

You will:
1. Identify EXACTLY THREE (3) material legal weaknesses or vulnerabilities
2. For each weakness, cite the specific UK statute, statutory instrument, or case law that creates the vulnerability
3. Score the overall enforceability from 0–100 (where 100 = bomb-proof, 0 = unenforceable)
4. State the primary governing statute
5. Give a single actionable recommendation

SCORING GUIDANCE:
- 90–100: Exceptional draft, negligible risk
- 75–89: Good draft, minor technical issues
- 60–74: Adequate but notable gaps that create meaningful litigation risk
- 40–59: Significant weaknesses — recommend substantial revision before execution
- Below 40: Do not execute — fundamental defects

JURISDICTION: English law only. Do not cite non-UK authorities unless they have been adopted into English law.

Return your analysis as valid JSON matching this exact schema:
{
  "enforceability_score": <number 0-100>,
  "warnings": [
    {
      "title": "<short title for this weakness>",
      "detail": "<full explanation of why this is problematic>",
      "statutory_basis": "<precise statutory reference, e.g. Unfair Contract Terms Act 1977 s.2(2)>"
    },
    ... (exactly 3 warnings)
  ],
  "statutory_basis": "<primary governing statute>",
  "anchor_case": "<leading case citation if applicable>",
  "recommendation": "<single most important action the drafter should take>"
}`;

  const userMessage = `Please review this contract draft and produce a Legal Standing Report.

**Transaction:** ${state.inputs.intent}
**Parties:** ${partiesSummary}
**Governing Law:** England & Wales

**Statutory Framework identified by research:**
${state.legal_context.statutes.map((s) => `• ${s}`).join('\n')}

**Contract Draft (Version ${latestDraft.version}):**

${latestDraft.content}

Identify three specific legal vulnerabilities in this draft and provide your enforceability score and recommendation. Return valid JSON only.`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // Strip markdown code fences if present
  const jsonText = responseText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  const parsed = JSON.parse(jsonText) as RiskReport;

  return {
    status: 'LAWYER_REVIEW',
    risk_report: parsed,
  };
}
