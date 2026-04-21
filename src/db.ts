/**
 * D1 persistence layer for ContractState
 */

import { ContractState, ContractStatus } from './state';

interface ContractRow {
  id: string;
  user_id: string;
  status: ContractStatus;
  inputs_json: string;
  legal_context_json: string;
  draft_versions_json: string;
  risk_report_json: string | null;
  lawyer_notes: string | null;
  review_request: string | null;
  review_sent_at: string | null;
  signature_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function saveContract(
  db: D1Database,
  state: ContractState
): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO contracts (
        id, user_id, status,
        inputs_json, legal_context_json, draft_versions_json,
        risk_report_json, lawyer_notes, review_request, review_sent_at,
        signature_request_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      state.id,
      state.user_id,
      state.status,
      JSON.stringify(state.inputs),
      JSON.stringify(state.legal_context),
      JSON.stringify(state.draft_versions),
      state.risk_report ? JSON.stringify(state.risk_report) : null,
      state.lawyer_notes ?? null,
      state.review_request ?? null,
      state.review_sent_at ?? null,
      state.signature_request_id ?? null
    )
    .run();
}

export async function loadContract(
  db: D1Database,
  id: string
): Promise<ContractState | null> {
  const row = await db
    .prepare('SELECT * FROM contracts WHERE id = ?')
    .bind(id)
    .first<ContractRow>();

  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    status: row.status,
    inputs: JSON.parse(row.inputs_json),
    legal_context: JSON.parse(row.legal_context_json),
    draft_versions: JSON.parse(row.draft_versions_json),
    risk_report: row.risk_report_json ? JSON.parse(row.risk_report_json) : undefined,
    lawyer_notes: row.lawyer_notes ?? undefined,
    review_request: row.review_request ?? undefined,
    review_sent_at: row.review_sent_at ?? undefined,
    signature_request_id: row.signature_request_id ?? undefined,
  };
}

export async function listUserContracts(
  db: D1Database,
  userId: string
): Promise<Array<{ id: string; status: ContractStatus; created_at: string }>> {
  const { results } = await db
    .prepare(
      'SELECT id, status, created_at FROM contracts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    )
    .bind(userId)
    .all<{ id: string; status: ContractStatus; created_at: string }>();

  return results;
}
