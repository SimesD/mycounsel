/**
 * Signing Node — Adobe Sign integration (placeholder for demo)
 */

import { ContractState } from '../state';

export async function signingNode(
  state: ContractState,
  _env: Env
): Promise<Partial<ContractState>> {
  // Adobe Sign integration is a placeholder in the demo.
  // In production: upload PDF to Adobe Sign and create an agreement.
  console.log(`[signing] Would send contract ${state.id} for signature via Adobe Sign.`);

  return {
    status: 'SIGNING',
    signature_request_id: `demo-placeholder-${state.id}`,
  };
}
