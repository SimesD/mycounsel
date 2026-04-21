/**
 * MyCounsel — Cloudflare Worker entry point (Hono.js)
 *
 * Endpoints:
 *   POST /contract/generate          — start a new contract workflow
 *   GET  /contract/:id               — get contract state
 *   GET  /contract/:id/report        — get Legal Standing Report as Markdown
 *   POST /contract/:id/decision      — submit user decision (ADJUST | APPROVE)
 *   POST /contract/:id/legal-review  — send draft + message to in-house lawyers
 *   POST /webhooks/adobe-sign        — receive AGREEMENT_SIGNED event
 *   GET  /contracts                  — list contracts for user
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { renderUI } from './ui';
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
 * GET /
 * Serves the demo UI.
 */
app.get('/', (c) => {
  return c.html(renderUI());
});

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
 * POST /contract/:id/legal-review
 * Sends the draft + a user message to in-house lawyers for review.
 * In production: triggers an email via Cloudflare Email Workers / Resend.
 * For demo: saves the request and returns a formatted preview.
 */
app.post('/contract/:id/legal-review', async (c) => {
  const id = c.req.param('id');
  const state = await loadContract(c.env.DB, id);
  if (!state) return jsonError('Contract not found', 404);

  if (state.status !== 'LAWYER_REVIEW') {
    return jsonError(
      `Contract is in status '${state.status}' — legal review only available after risk assessment`
    );
  }

  let body: unknown;
  try { body = await c.req.json(); } catch { return jsonError('Invalid JSON body'); }

  const parsed = z.object({
    message: z.string().min(5, 'Please include a message for the lawyers'),
    lawyer_email: z.string().email().optional(),
  }).safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join('; '));
  }

  const { message, lawyer_email } = parsed.data;
  const latestDraft = state.draft_versions[state.draft_versions.length - 1];
  const sentAt = new Date().toISOString();

  // Persist the review request
  await c.env.DB.prepare(
    `UPDATE contracts SET status = 'SENT_FOR_REVIEW', review_request = ?, review_sent_at = ? WHERE id = ?`
  ).bind(message, sentAt, id).run();

  // Build the formatted email body the lawyer would receive
  const emailPreview = formatLegalReviewEmail({
    contractId: id,
    intent: state.inputs.intent,
    parties: state.inputs.parties.map((p) => `${p.name} (${p.role})`).join(', '),
    score: state.risk_report?.enforceability_score,
    warnings: state.risk_report?.warnings ?? [],
    userMessage: message,
    draftVersion: latestDraft?.version ?? 1,
    draftContent: latestDraft?.content ?? '',
    sentAt,
  });

  return c.json({
    id,
    status: 'SENT_FOR_REVIEW',
    sent_to: lawyer_email ?? 'legal-team@mycounsel.ai (demo)',
    sent_at: sentAt,
    email_preview: emailPreview,
    message: 'Draft sent for legal review. The lawyers will be in touch shortly.',
  });
});

interface ReviewEmailParams {
  contractId: string;
  intent: string;
  parties: string;
  score?: number;
  warnings: Array<{ title: string; detail: string; statutory_basis: string }>;
  userMessage: string;
  draftVersion: number;
  draftContent: string;
  sentAt: string;
}

function formatLegalReviewEmail(p: ReviewEmailParams): string {
  const date = new Date(p.sentAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return `TO: Legal Team <legal-team@mycounsel.ai>
FROM: MyCounsel Platform <noreply@mycounsel.ai>
SUBJECT: Legal Review Request — ${p.intent.slice(0, 60)}
DATE: ${date}
REF: MC-${p.contractId.slice(0, 8).toUpperCase()}

────────────────────────────────────────────
LEGAL REVIEW REQUEST
────────────────────────────────────────────

Dear Legal Team,

A client has requested your review and opinion on the following draft agreement before proceeding to signature.

TRANSACTION
${p.intent}

PARTIES
${p.parties}

MESSAGE FROM CLIENT
"${p.userMessage}"

AI RISK ASSESSMENT SUMMARY (for context only — not legal advice)
Enforceability Score: ${p.score ?? 'N/A'}/100
${p.warnings.map((w, i) => `${i + 1}. ${w.title} — ${w.statutory_basis}`).join('\n')}

────────────────────────────────────────────
CONTRACT DRAFT (Version ${p.draftVersion})
────────────────────────────────────────────

${p.draftContent}

────────────────────────────────────────────

Please review the above and respond directly to the client with your opinion, any required amendments, and clearance to proceed.

This message was generated automatically by MyCounsel. The AI-generated draft and risk assessment are for reference only and do not constitute legal advice.

MyCounsel Platform`;
}

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
