/**
 * Contract pipeline — simple async pipeline with named steps.
 *
 * Flow:
 *   generate()  → intake → research → draft → risk → persists to D1, returns
 *   resume()    → ADJUST: draft → risk → persists
 *                 APPROVE: signing → persists
 */

import { ContractState } from './state';
import { intakeNode } from './agents/intake';
import { researchNode } from './agents/researcher';
import { draftingNode } from './agents/drafter';
import { riskNode } from './agents/risk';
import { signingNode } from './agents/signing';

type PipelineStep = (
  state: ContractState,
  env: Env
) => Promise<Partial<ContractState>>;

interface NamedStep {
  name: string;
  fn: PipelineStep;
}

function applyUpdate(
  state: ContractState,
  update: Partial<ContractState>
): ContractState {
  return {
    ...state,
    ...update,
    inputs: { ...state.inputs, ...(update.inputs ?? {}) },
    legal_context: { ...state.legal_context, ...(update.legal_context ?? {}) },
    draft_versions: [
      ...state.draft_versions,
      ...(update.draft_versions ?? []),
    ],
    errors: [...(state.errors ?? []), ...(update.errors ?? [])],
  };
}

async function runSteps(
  state: ContractState,
  steps: NamedStep[],
  env: Env
): Promise<ContractState> {
  let current = state;
  for (const { name, fn } of steps) {
    console.log(`[pipeline] starting ${name}`);
    try {
      const update = await fn(current, env);
      current = applyUpdate(current, update);
      console.log(`[pipeline] completed ${name} → status: ${current.status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] FAILED at ${name}: ${message}`);
      throw new Error(`${name} failed: ${message}`);
    }
  }
  return current;
}

export async function generate(
  state: ContractState,
  env: Env
): Promise<ContractState> {
  return runSteps(state, [
    { name: 'intakeNode',   fn: intakeNode },
    { name: 'researchNode', fn: researchNode },
    { name: 'draftingNode', fn: draftingNode },
    { name: 'riskNode',     fn: riskNode },
  ], env);
}

export async function resume(
  state: ContractState,
  env: Env
): Promise<ContractState> {
  if (state.user_decision === 'APPROVE') {
    return runSteps(state, [{ name: 'signingNode', fn: signingNode }], env);
  }
  return runSteps(state, [
    { name: 'draftingNode', fn: draftingNode },
    { name: 'riskNode',     fn: riskNode },
  ], env);
}
