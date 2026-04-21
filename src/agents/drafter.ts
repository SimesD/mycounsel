/**
 * Agent C — Drafting Architect (Gemini 1.5 Pro)
 *
 * Produces formal UK contract drafts grounded in the legal research context.
 * Uses UK English spelling and standard English law boilerplate.
 */

import { GoogleGenAI } from '@google/genai';
import { ContractState, DraftVersion } from '../state';

const SYSTEM_INSTRUCTION = `You are a Senior Solicitor and expert draftsperson at a leading City of London commercial law firm.

MANDATORY DRAFTING RULES:
1. Use UK English ONLY: "authorised" (not "authorized"), "recognise" (not "recognize"), "licence" (noun) / "license" (verb), "programme", "favour", "colour", "behaviour", "endeavour"
2. Use "solicitor" not "attorney"; "barrister" not "counsel" (unless referring to King's Counsel); "claimant" not "plaintiff"
3. Every contract MUST include these standard clauses:
   a. Governing Law and Jurisdiction (England & Wales, courts of England and Wales)
   b. Limitation of Liability (with reasonable cap, excluding death/personal injury per UCTA 1977)
   c. Severability (saving clause)
   d. Entire Agreement (merger clause)
   e. Notices (form and deemed delivery)
   f. Force Majeure
   g. Waiver (no implied waiver)
4. Recitals must accurately describe the commercial context
5. Defined terms must appear in Schedule 1 or defined inline at first use in bold
6. Clause numbering: use 1., 1.1, 1.1.1 hierarchy
7. Include execution blocks for each party (signature, name, title, date, witness)

OUTPUT FORMAT:
Return the complete contract as plain text using the structure:
[AGREEMENT TITLE]
Date: [DATE]
PARTIES:
...
RECITALS:
...
OPERATIVE PROVISIONS:
1. DEFINITIONS AND INTERPRETATION
...
[All substantive clauses]
...
SCHEDULE 1 — DEFINITIONS
SCHEDULE 2 — COMMERCIAL TERMS
EXECUTION PAGES`;

export async function draftingNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });

  const currentVersion = state.draft_versions.length + 1;
  const isRevision = state.draft_versions.length > 0;
  const latestDraft = isRevision
    ? state.draft_versions[state.draft_versions.length - 1].content
    : null;

  const statutoryFramework = state.legal_context.statutes
    .map((s) => `  • ${s}`)
    .join('\n');

  const precedents = state.legal_context.precedents
    .map((p) => `  • ${p}`)
    .join('\n');

  const partiesBlock = state.inputs.parties
    .map(
      (p) =>
        `  - ${p.name} (${p.role})${p.co_number ? `, Company No. ${p.co_number}` : ''}, ${p.address}`
    )
    .join('\n');

  const commercialBlock = JSON.stringify(state.inputs.commercial_terms, null, 2);

  const prompt = isRevision
    ? `${SYSTEM_INSTRUCTION}

You are revising a contract draft (Version ${currentVersion - 1} → ${currentVersion}).

ORIGINAL INTENT: ${state.inputs.intent}

LAWYER NOTES FOR REVISION:
${state.lawyer_notes ?? '(No specific revision notes provided — general improvements requested)'}

PREVIOUS DRAFT:
${latestDraft}

GOVERNING STATUTORY FRAMEWORK:
${statutoryFramework}

Produce an improved Version ${currentVersion} addressing all noted concerns. Maintain all mandatory boilerplate. Track substantive changes in the Recitals with "REVISED [date]".`
    : `${SYSTEM_INSTRUCTION}

Draft a formal UK commercial contract for the following transaction:

INTENT: ${state.inputs.intent}

PARTIES:
${partiesBlock}

COMMERCIAL TERMS:
${commercialBlock}

GOVERNING STATUTORY FRAMEWORK (cite these in the relevant clauses):
${statutoryFramework}

RELEVANT CASE LAW (reference in Recitals or specific clauses where material):
${precedents}

ANCHOR CASE SUMMARY:
${state.legal_context.anchor_case_summary ?? 'Not provided'}

SPECIAL DRAFTING REQUIREMENTS FOR THIS AGREEMENT:
${buildSpecialRequirements(state)}

Produce the complete, execution-ready contract. Every clause must be fully drafted — no "[INSERT]" placeholders except for dates and specific figures to be agreed. Include all mandatory boilerplate clauses.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  });

  const draftContent = response.text ?? '';

  const newVersion: DraftVersion = {
    version: currentVersion,
    content: draftContent,
    author: 'Agent C — Drafting Architect (Gemini 1.5 Pro)',
    created_at: new Date().toISOString(),
  };

  return {
    status: 'RISK_ASSESSMENT',
    draft_versions: [newVersion],
  };
}

function buildSpecialRequirements(state: ContractState): string {
  const terms = state.inputs.commercial_terms as Record<string, unknown>;
  const intent = state.inputs.intent.toLowerCase();
  const requirements: string[] = [];

  if (intent.includes('distribut') || intent.includes('supply') || intent.includes('resell')) {
    requirements.push(
      'COMPETITION LAW COMPLIANCE: Include a Competition Law Compliance clause referencing the Vertical Agreements Block Exemption Order 2022 (SI 2022/516). If the Supplier\'s market share exceeds 30%, the VABEO safe harbour does not apply — include a severability mechanism for any non-exempt restrictions.'
    );
    requirements.push(
      'RESALE PRICING: Do NOT impose minimum resale prices (this constitutes Resale Price Maintenance and is a "hardcore restriction" under VABEO 2022 Article 4(a), automatically void and potentially subject to CMA investigation). You MAY set maximum resale prices and suggest recommended retail prices.'
    );

    if (terms['exclusivity'] || intent.includes('exclusiv')) {
      requirements.push(
        'EXCLUSIVITY: Draft exclusivity provisions carefully. Single branding obligations (purchasing ≥80% from one supplier) must not exceed 5 years to remain within VABEO 2022 safe harbour. Territorial exclusivity must not prevent passive sales.'
      );
    }
  }

  if (
    intent.includes('vodka') ||
    intent.includes('spirits') ||
    intent.includes('alcohol') ||
    intent.includes('tofka')
  ) {
    requirements.push(
      'REGULATORY COMPLIANCE: Include clause requiring compliance with the Licensing Act 2003 and Alcohol (Minimum Unit Pricing) provisions. Include representations that parties hold appropriate licences.'
    );
    requirements.push(
      'MARGIN CLAUSE: If a minimum margin of 30% is specified, note in the Competition Law Compliance clause that while minimum resale prices are prohibited, the parties may monitor margin performance as a key performance indicator provided this does not amount to indirect RPM.'
    );
  }

  if (
    intent.includes('brand') ||
    intent.includes('trademark') ||
    intent.includes('licence') ||
    terms['brand_licence']
  ) {
    requirements.push(
      'IP LICENCE: Include a limited, non-exclusive (or exclusive as agreed), royalty-free trade mark licence in the Territory. Include provisions on brand guidelines compliance, quality control, and right to inspect.'
    );
  }

  return requirements.length > 0
    ? requirements.map((r, i) => `${i + 1}. ${r}`).join('\n\n')
    : 'Draft according to standard UK commercial law principles for this agreement type.';
}
