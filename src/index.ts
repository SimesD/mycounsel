/**
 * MyCounsel — Cloudflare Worker entry point (Hono.js)
 *
 * Endpoints:
 *   POST /contract/generate          — start a new contract workflow
 *   GET  /contract/:id               — get contract state
 *   GET  /contract/:id/report        — get Legal Standing Report as Markdown
 *   POST /contract/:id/decision      — submit user decision (ADJUST | APPROVE)
 *   POST /webhooks/adobe-sign        — receive AGREEMENT_SIGNED event
 *   GET  /contracts                  — list contracts for user
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { generate, resume } from './pipeline';
import { saveContract, loadContract } from './db';
import { formatRiskReport } from './report';
import { ContractState } from './state';

const app = new Hono<{ Bindings: Env }>();

// ─── Request Schemas ─────────────────────────────────────────────────────────

const GenerateSchema = z.object({
  intent: z.string().min(10, 'Please describe the agreement in at least 10 characters'),
  user_id: z.string().optional().default('anonymous'),
});

const DecisionSchema = z.object({
  decision: z.enum(['ADJUST', 'APPROVE']),
  lawyer_notes: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /contract/generate
 * Kicks off the full intake → research → draft → risk pipeline.
 */
app.post('/contract/generate', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join('; '));
  }

  const { intent, user_id } = parsed.data;
  const id = generateId();

  const initialState: ContractState = {
    id,
    user_id,
    status: 'INTAKE',
    inputs: {
      intent,
      parties: [],
      commercial_terms: {},
    },
    legal_context: {
      statutes: [],
      precedents: [],
    },
    draft_versions: [],
  };

  // Persist initial state immediately so the client can poll
  await saveContract(c.env.DB, initialState);

  try {
    const finalState = await generate(initialState, c.env);
    await saveContract(c.env.DB, finalState);

    return c.json({
      id,
      status: (finalState as ContractState).status,
      message:
        'Contract drafted and risk assessment complete. Review the Legal Standing Report then submit your decision.',
      report_url: `/contract/${id}/report`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Graph error:', message);
    return c.json({ id, error: message }, 500);
  }
});

/**
 * GET /contract/:id
 * Returns the full contract state as JSON.
 */
app.get('/contract/:id', async (c) => {
  const state = await loadContract(c.env.DB, c.req.param('id'));
  if (!state) return jsonError('Contract not found', 404);
  return c.json(state);
});

/**
 * GET /contract/:id/report
 * Returns the Legal Standing Report as formatted Markdown.
 */
app.get('/contract/:id/report', async (c) => {
  const state = await loadContract(c.env.DB, c.req.param('id'));
  if (!state) return jsonError('Contract not found', 404);

  const markdown = formatRiskReport(state);

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
});

/**
 * POST /contract/:id/decision
 * Accepts ADJUST or APPROVE from the lawyer/user review step.
 * ADJUST: re-runs drafting + risk nodes.
 * APPROVE: triggers the signing workflow.
 */
app.post('/contract/:id/decision', async (c) => {
  const id = c.req.param('id');
  const state = await loadContract(c.env.DB, id);
  if (!state) return jsonError('Contract not found', 404);

  if (state.status !== 'LAWYER_REVIEW') {
    return jsonError(
      `Contract is in status '${state.status}' — decisions only accepted at LAWYER_REVIEW`
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = DecisionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join('; '));
  }

  const { decision, lawyer_notes } = parsed.data;

  const resumeState: ContractState = {
    ...state,
    user_decision: decision,
    lawyer_notes: lawyer_notes ?? state.lawyer_notes,
  };

  try {
    const finalState = await resume(resumeState, c.env);
    await saveContract(c.env.DB, finalState);

    return c.json({
      id,
      status: (finalState as ContractState).status,
      message:
        decision === 'APPROVE'
          ? 'Agreement sent for signature via Adobe Sign.'
          : 'Draft revised and new risk assessment complete. Review the updated report.',
      report_url: `/contract/${id}/report`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Resume graph error:', message);
    return c.json({ id, error: message }, 500);
  }
});

/**
 * POST /webhooks/adobe-sign
 * Receives AGREEMENT_SIGNED events from Adobe Sign.
 */
app.post('/webhooks/adobe-sign', async (c) => {
  // Adobe Sign verification header
  const clientId = c.req.header('x-adobesign-clientid');
  if (clientId !== c.env.ADOBE_SIGN_CLIENT_ID) {
    return new Response('Forbidden', { status: 403 });
  }

  const event = await c.req.json<{
    event: string;
    agreement: { id: string };
  }>();

  if (event.event === 'AGREEMENT_SIGNED') {
    const signatureRequestId = event.agreement.id;

    // Find contract by signature_request_id
    const { results } = await c.env.DB.prepare(
      'SELECT id FROM contracts WHERE signature_request_id = ?'
    )
      .bind(signatureRequestId)
      .all<{ id: string }>();

    if (results.length > 0) {
      await c.env.DB.prepare(
        "UPDATE contracts SET status = 'SIGNING' WHERE id = ?"
      )
        .bind(results[0].id)
        .run();
    }
  }

  // Adobe Sign requires a 200 with the client ID echoed back
  return c.json({ xAdobeSignClientId: c.env.ADOBE_SIGN_CLIENT_ID });
});

/**
 * GET /contracts?user_id=xxx
 * Lists contracts for a given user.
 */
app.get('/contracts', async (c) => {
  const userId = c.req.query('user_id') ?? 'anonymous';
  const { results } = await c.env.DB.prepare(
    'SELECT id, status, created_at FROM contracts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  )
    .bind(userId)
    .all<{ id: string; status: string; created_at: string }>();

  return c.json({ contracts: results });
});

export default app;
