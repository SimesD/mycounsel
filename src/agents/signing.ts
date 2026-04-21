/**
 * Signing Node — triggers Adobe Sign when status moves to SIGNING
 */

import { ContractState } from '../state';
import {
  uploadTransientDocument,
  createAgreement,
  textToPdf,
} from '../integrations/adobe-sign';

export async function signingNode(
  state: ContractState,
  env: Env
): Promise<Partial<ContractState>> {
  const latestDraft = state.draft_versions[state.draft_versions.length - 1];
  if (!latestDraft) throw new Error('Signing node: no draft available');

  const pdfBytes = textToPdf(latestDraft.content, `MyCounsel_Agreement_${state.id}.pdf`);

  const transientDocId = await uploadTransientDocument(
    pdfBytes,
    `MyCounsel_Agreement_${state.id}.pdf`,
    env.ADOBE_SIGN_ACCESS_TOKEN
  );

  // Use party email addresses from commercial_terms or generate placeholders
  const terms = state.inputs.commercial_terms as Record<string, unknown>;
  const signers = state.inputs.parties
    .filter((p) => p.role !== 'WITNESS')
    .map((p) => ({
      name: p.name,
      email:
        ((terms[`email_${p.role.toLowerCase()}`] as string) ||
          (terms['signers'] as Record<string, string>)?.[p.name]) ??
        `sign+${p.name.replace(/\s+/g, '.').toLowerCase()}@mycounsel.ai`,
    }));

  const agreement = await createAgreement(
    transientDocId,
    `Agreement: ${state.inputs.intent.slice(0, 100)}`,
    signers,
    env.ADOBE_SIGN_ACCESS_TOKEN
  );

  return {
    status: 'SIGNING',
    signature_request_id: agreement.id,
  };
}
