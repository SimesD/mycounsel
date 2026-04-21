/**
 * Contract pipeline — replaces LangGraph with a simple async pipeline.
 *
 * The workflow is linear enough that a state machine library adds
 * complexity and bundle size without meaningful benefit on Cloudflare Workers.
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

/** Merge a partial update into the current state (immutably). */
function applyUpdate(
  state: ContractState,
  update: Partial<ContractState>
): ContractState {
  return {
    ...state,
    ...update,
    inputs: { ...state.inputs, ...(update.inputs ?? {}) },
    legal_context: { ...state.legal_context, ...(update.legal_context ?? {}) },
    // draft_versions appends rather than replaces
    draft_versions: [
      ...state.draft_versions,
      ...(update.draft_versions ?? []),
    ],
    errors: [...(state.errors ?? []), ...(update.errors ?? [])],
  };
}

/** Run a sequence of steps, threading state through each. */
async function runSteps(
  state: ContractState,
  steps: PipelineStep[],
  env: Env
): Promise<ContractState> {
  let current = state;
  for (const step of steps) {
    const update = await step(current, env);
    current = applyUpdate(current, update);
  }
  return current;
}

/**
 * Full generation pipeline: intake → research → draft → risk assessment.
 * Terminates at LAWYER_REVIEW (persisted to D1 by the caller).
 */
export async function generate(
  state: ContractState,
  env: Env
): Promise<ContractState> {
  return runSteps(state, [intakeNode, researchNode, draftingNode, riskNode], env);
}

/**
 * Resume pipeline after lawyer review.
 * ADJUST → re-draft → risk assessment (loop, status stays LAWYER_REVIEW after)
 * APPROVE → trigger signing
 */
export async function resume(
  state: ContractState,
  env: Env
): Promise<ContractState> {
  if (state.user_decision === 'APPROVE') {
    return runSteps(state, [signingNode], env);
  }
  // ADJUST: re-draft then re-assess risk
  return runSteps(state, [draftingNode, riskNode], env);
}
