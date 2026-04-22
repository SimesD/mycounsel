/**
 * Agent E — Contract Reviewer (Gemini)
 *
 * Review mode only. Takes an existing (external) contract and:
 * 1. Identifies legal weaknesses, missing clauses, and problematic provisions
 * 2. Produces a clean, improved version of the contract under English law
 * 3. Outputs a structured list of changes made (for the UI to display)
 *
 * The improved contract is stored as draft_versions[0].
 * The browser computes the diff between original_contract and the improved version.
 */

import { withRetry } from '../retry';
import { GoogleGenAI } from '@google/genai';
import { ContractState, DraftVersion } from '../state';

const REVIEWER_SYSTEM = `You are a Senior Solicitor at a leading City of London law firm conducting a thorough review and improvement of a contract submitted by a client.

Your task is to:
1. Review the submitted contract against current English law
2. Identify ALL of the following issues:
   - Missing mandatory clauses (governing law, limitation of liability, severability, entire agreement, notices, force majeure, waiver)
   - Clauses that are void, unenforceable or contrary to statute
   - Ambiguous or one-sided provisions that create litigation risk
   - Incorrect UK legal terminology (e.g. "plaintiff" should be "claimant")
   - Non-UK spelling or terminology
3. Produce a fully improved version of the contract, correcting all identified issues
4. Preserve the overall structure and commercial intent of the original

MANDATORY IMPROVEMENTS:
- Use UK English ONLY throughout
- Add any missing standard boilerplate clauses
- Fix any provisions that contravene UCTA 1977, CRA 2015, or other applicable statutes
- Ensure governing law is England & Wales
- Correct clause numbering to 1., 1.1, 1.1.1 hierarchy if inconsistent

OUTPUT: Return ONLY the complete improved contract as plain text. Do not include commentary or meta-text — just the contract.`;

export async function reviewerNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  if (!state.original_contract) {
    throw new Error('reviewerNode: no original_contract in state');
  }

  const statutoryFramework = state.legal_context.statutes
    .map((s) => `  • ${s}`)
    .join('\n');
  const precedents = state.legal_context.precedents
    .map((p) => `  • ${p}`)
    .join('\n');
  const partiesBlock = state.inputs.parties
    .map(
      (p) =>
        `  - ${p.name} (${p.role})${p.co_number ? `, Co. No. ${p.co_number}` : ''}${p.address ? `, ${p.address}` : ''}`
    )
    .join('\n');

  const prompt = `${REVIEWER_SYSTEM}

CONTRACT TYPE: ${state.contract_type ?? 'UNKNOWN'}
PARTIES (resolved via Companies House):
${partiesBlock || '  (See contract)'}

APPLICABLE STATUTORY FRAMEWORK (confirmed from legislation.gov.uk):
${statutoryFramework}

RELEVANT CASE LAW:
${precedents}

ANCHOR CASE:
${state.legal_context.anchor_case_summary ?? 'Not provided'}

---
ORIGINAL CONTRACT SUBMITTED FOR REVIEW:

${state.original_contract}
---

Produce the complete improved contract below. Make all necessary corrections and additions. Preserve all commercial terms from the original.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: prompt,
      config: { temperature: 0.1 },
    })
  );

  const improvedContent = response.text ?? '';

  const newVersion: DraftVersion = {
    version: 1,
    content: improvedContent,
    author: 'Agent E — Contract Reviewer',
    created_at: new Date().toISOString(),
  };

  return {
    status: 'RISK_ASSESSMENT',
    draft_versions: [newVersion],
  };
}
