/**
 * MyCounsel — Cloudflare Worker entry point (Hono.js)
 *
 * Endpoints:
 *   POST /contract/generate          — start a new contract workflow
 *   POST /contract/review            — review and improve an existing contract
 *   GET  /contract/:id               — get contract state
 *   GET  /contract/:id/report        — get Legal Standing Report as Markdown
 *   POST /contract/:id/decision      — submit user decision (ADJUST | APPROVE)
 *   POST /contract/:id/legal-review  — send draft + message to in-house lawyers
 *   POST /webhooks/adobe-sign        — receive AGREEMENT_SIGNED event
 *   GET  /contracts                  — list contracts for user
 */

import { Hono } from "hono";
import { z } from "zod";
import { renderUI } from "./ui";
import { generate, resume, review } from "./pipeline";
import {
    saveContract,
    loadContract,
    listUserContracts,
    nextContractSeq,
    deleteContract,
} from "./db";
import { formatRiskReport, formatClosingReport } from "./report";
import { ContractState } from "./state";
import { searchCompanies, formatAddress } from "./integrations/companies-house";

const app = new Hono<{ Bindings: Env }>();

// ─── Request Schemas ─────────────────────────────────────────────────────────

const PartyInputSchema = z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    email: z.string().email().optional(),
    co_number: z.string().optional(),
    address: z.string().optional(),
});

const GenerateSchema = z.object({
    intent: z
        .string()
        .min(10, "Please describe the agreement in at least 10 characters"),
    name: z.string().optional(),
    user_id: z.string().optional().default("anonymous"),
    parties: z.array(PartyInputSchema).optional().default([]),
});

const DecisionSchema = z.object({
    decision: z.enum(["ADJUST", "APPROVE"]),
    lawyer_notes: z.string().optional(),
    selected_warnings: z.array(z.number()).optional(),
});

const ReviewSchema = z.object({
    original_contract: z
        .string()
        .min(100, "Please paste a contract of at least 100 characters"),
    name: z.string().optional(),
    user_id: z.string().optional().default("anonymous"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
    return crypto.randomUUID();
}

/** Derives a short agreement name from the intent string. */
function autoName(intent: string): string {
    const trimmed = intent.trim();
    // Use up to first sentence or 60 chars, whichever is shorter
    const sentence = trimmed.split(/[.!?]/)[0].trim();
    return sentence.length > 60 ? sentence.slice(0, 57) + "…" : sentence;
}

function jsonError(message: string, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /
 * Serves the demo UI.
 */
app.get("/", (c) => {
    return c.html(renderUI());
});

/**
 * GET /companies-house/search?q=...
 * Proxies Companies House company search so the browser doesn't need the API key.
 */
app.get("/companies-house/search", async (c) => {
    const q = c.req.query("q")?.trim() ?? "";
    if (q.length < 2) return c.json({ items: [] });

    const results = await searchCompanies(q, c.env.COMPANIES_HOUSE_KEY, 6);
    return c.json({
        items: results.map((r) => ({
            company_number: r.company_number,
            title: r.title,
            address: formatAddress(r),
            company_status: r.company_status,
        })),
    });
});

/**
 * POST /contract/generate
 * Kicks off the full intake → research → draft → risk pipeline.
 */
app.post("/contract/generate", async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return jsonError("Invalid JSON body");
    }

    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
        return jsonError(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { intent, name, user_id, parties } = parsed.data;
    const id = generateId();
    const seq = await nextContractSeq(c.env.DB);
    const ref = `MC-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
    const agreementName = name?.trim() || autoName(intent);

    const initialState: ContractState = {
        id,
        ref,
        name: agreementName,
        user_id,
        mode: "DRAFT",
        status: "INTAKE",
        inputs: {
            intent,
            parties: parties as ContractState["inputs"]["parties"],
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

    // Enqueue pipeline job — runs in background with up to 15 min processing time
    await c.env.PIPELINE_QUEUE.send({ type: "generate", contractId: id });

    return c.json({ id, ref, name: agreementName, status: "INTAKE" });
});

/**
 * POST /contract/review
 * Accepts a pasted contract text and runs the review pipeline:
 * intake (classify + extract parties) → research → reviewer → risk
 */
app.post("/contract/review", async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return jsonError("Invalid JSON body");
    }

    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success)
        return jsonError(parsed.error.issues.map((i) => i.message).join("; "));

    const { original_contract, name, user_id } = parsed.data;
    const id = generateId();
    const seq = await nextContractSeq(c.env.DB);
    const ref = `MC-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
    const agreementName = name?.trim() || "Contract Review";

    const initialState: ContractState = {
        id,
        ref,
        name: agreementName,
        user_id,
        mode: "REVIEW",
        status: "INTAKE",
        inputs: {
            intent: "Review and improve submitted contract",
            parties: [],
            commercial_terms: {},
        },
        legal_context: { statutes: [], precedents: [] },
        draft_versions: [],
        original_contract,
    };

    await saveContract(c.env.DB, initialState);

    // Enqueue pipeline job — runs in background with up to 15 min processing time
    await c.env.PIPELINE_QUEUE.send({ type: "review", contractId: id });

    return c.json({ id, ref, name: agreementName, status: "INTAKE" });
});

/**
 * GET /contract/:id
 * Returns the full contract state as JSON.
 */
app.get("/contract/:id", async (c) => {
    const state = await loadContract(c.env.DB, c.req.param("id"));
    if (!state) return jsonError("Contract not found", 404);
    return c.json(state);
});

/**
 * GET /contract/:id/report
 * Returns the Legal Standing Report as formatted Markdown.
 */
app.get("/contract/:id/report", async (c) => {
    const state = await loadContract(c.env.DB, c.req.param("id"));
    if (!state) return jsonError("Contract not found", 404);

    const markdown = formatRiskReport(state);

    return new Response(markdown, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
});

/**
 * GET /contract/:id/closing-report
 * Returns a comprehensive closing report on approval as Markdown:
 * statutory framework, case law, risk history, resolved/deferred issues,
 * revision log and execution details.
 */
app.get("/contract/:id/closing-report", async (c) => {
    const state = await loadContract(c.env.DB, c.req.param("id"));
    if (!state) return jsonError("Contract not found", 404);

    const markdown = await formatClosingReport(state);

    return new Response(markdown, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
});

/**
 * POST /contract/:id/decision
 * Accepts ADJUST or APPROVE from the lawyer/user review step.
 * ADJUST: re-runs drafting + risk nodes.
 * APPROVE: triggers the signing workflow.
 */
app.post("/contract/:id/decision", async (c) => {
    const id = c.req.param("id");
    const state = await loadContract(c.env.DB, id);
    if (!state) return jsonError("Contract not found", 404);

    if (state.status !== "LAWYER_REVIEW") {
        return jsonError(
            `Contract is in status '${state.status}' — decisions only accepted at LAWYER_REVIEW`,
        );
    }

    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return jsonError("Invalid JSON body");
    }

    const parsed = DecisionSchema.safeParse(body);
    if (!parsed.success) {
        return jsonError(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { decision, lawyer_notes, selected_warnings } = parsed.data;

    // APPROVE stays synchronous — it's fast (just triggers signing)
    if (decision === "APPROVE") {
        const approveState: ContractState = {
            ...state,
            user_decision: decision,
            lawyer_notes: lawyer_notes ?? state.lawyer_notes,
        };
        try {
            const finalState = await resume(approveState, c.env);
            await saveContract(c.env.DB, finalState);
            return c.json({
                id,
                status: (finalState as ContractState).status,
                message: "Agreement sent for signature via Adobe Sign.",
                report_url: `/contract/${id}/report`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("Resume graph error:", message);
            return c.json({ id, error: message }, 500);
        }
    }

    // ADJUST: save updated state then enqueue revision job
    const adjustState: ContractState = {
        ...state,
        user_decision: decision,
        lawyer_notes: lawyer_notes ?? state.lawyer_notes,
        selected_warnings: selected_warnings ?? undefined,
        status: "DRAFTING",
    };
    await saveContract(c.env.DB, adjustState);

    // Enqueue pipeline job — runs in background with up to 15 min processing time
    await c.env.PIPELINE_QUEUE.send({ type: "resume", contractId: id });

    return c.json({ id, status: "DRAFTING" });
});

/**
 * POST /contract/:id/legal-review
 * Sends the draft + a user message to in-house lawyers for review.
 * In production: triggers an email via Cloudflare Email Workers / Resend.
 * For demo: saves the request and returns a formatted preview.
 */
app.post("/contract/:id/legal-review", async (c) => {
    const id = c.req.param("id");
    const state = await loadContract(c.env.DB, id);
    if (!state) return jsonError("Contract not found", 404);

    if (state.status !== "LAWYER_REVIEW") {
        return jsonError(
            `Contract is in status '${state.status}' — legal review only available after risk assessment`,
        );
    }

    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return jsonError("Invalid JSON body");
    }

    const parsed = z
        .object({
            message: z
                .string()
                .min(5, "Please include a message for the lawyers"),
            lawyer_email: z.string().email().optional(),
        })
        .safeParse(body);

    if (!parsed.success) {
        return jsonError(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { message, lawyer_email } = parsed.data;
    const latestDraft = state.draft_versions[state.draft_versions.length - 1];
    const sentAt = new Date().toISOString();

    // Persist the review request
    await c.env.DB.prepare(
        `UPDATE contracts SET status = 'SENT_FOR_REVIEW', review_request = ?, review_sent_at = ? WHERE id = ?`,
    )
        .bind(message, sentAt, id)
        .run();

    // Build the formatted email body the lawyer would receive
    const emailPreview = formatLegalReviewEmail({
        contractId: id,
        intent: state.inputs.intent,
        parties: state.inputs.parties
            .map((p) => `${p.name} (${p.role})`)
            .join(", "),
        score: state.risk_report?.enforceability_score,
        warnings: state.risk_report?.warnings ?? [],
        statutes: state.legal_context?.statutes ?? [],
        userMessage: message,
        draftVersion: latestDraft?.version ?? 1,
        draftContent: latestDraft?.content ?? "",
        sentAt,
        reportUrl: `https://mycounsel.simond-516.workers.dev/contract/${id}/closing-report`,
    });

    return c.json({
        id,
        status: "SENT_FOR_REVIEW",
        sent_to: lawyer_email ?? "legal-team@mycounsel.ai (demo)",
        sent_at: sentAt,
        email_preview: emailPreview,
        message:
            "Draft sent for legal review. The lawyers will be in touch shortly.",
    });
});

interface ReviewEmailParams {
    contractId: string;
    intent: string;
    parties: string;
    score?: number;
    warnings: Array<{
        title: string;
        detail: string;
        statutory_basis: string;
        impact?: string;
    }>;
    statutes: string[];
    userMessage: string;
    draftVersion: number;
    draftContent: string;
    sentAt: string;
    reportUrl: string;
}

function formatLegalReviewEmail(p: ReviewEmailParams): string {
    const date = new Date(p.sentAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const IMPACT_LABEL: Record<string, string> = {
        HIGH: "🔴 HIGH",
        MEDIUM: "🟡 MEDIUM",
        LOW: "⚪ LOW",
    };

    const warningsByImpact = [...p.warnings].sort((a, b) => {
        const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (
            (order[a.impact ?? "MEDIUM"] ?? 1) -
            (order[b.impact ?? "MEDIUM"] ?? 1)
        );
    });

    const highCount = p.warnings.filter(
        (w) => (w.impact ?? "MEDIUM") === "HIGH",
    ).length;

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

────────────────────────────────────────────
AI RISK ASSESSMENT (for context only — not legal advice)
────────────────────────────────────────────

Enforceability Score: ${p.score ?? "N/A"}/100${highCount > 0 ? `\n⚠️  ${highCount} HIGH impact issue${highCount > 1 ? "s" : ""} identified — see below` : ""}

IDENTIFIED VULNERABILITIES (sorted by impact):
${warningsByImpact
    .map(
        (w, i) => `
${i + 1}. [${IMPACT_LABEL[w.impact ?? "MEDIUM"]}] ${w.title}
   ${w.detail}
   Statutory basis: ${w.statutory_basis}`,
    )
    .join("\n")}

STATUTORY FRAMEWORK APPLIED:
${p.statutes
    .slice(0, 8)
    .map((s) => `  • ${s}`)
    .join(
        "\n",
    )}${p.statutes.length > 8 ? `\n  … and ${p.statutes.length - 8} further statutes` : ""}

FULL LEGAL ANALYSIS REPORT (statutory framework, verified case citations, confidence assessment):
${p.reportUrl}

────────────────────────────────────────────
CONTRACT DRAFT (Version ${p.draftVersion})
────────────────────────────────────────────

${p.draftContent}

────────────────────────────────────────────

Please review the above and respond directly to the client with your opinion, any required amendments, and clearance to proceed.

IMPORTANT: The AI risk assessment and case citations above are generated automatically and must be independently verified before reliance. The full report (link above) includes live-verified case citations (BAILII/TNA) and a confidence assessment.

This message was generated automatically by MyCounsel. The AI-generated draft and risk assessment are for reference only and do not constitute legal advice.

MyCounsel Platform`;
}

/**
 * POST /webhooks/adobe-sign
 * Receives AGREEMENT_SIGNED events from Adobe Sign.
 */
app.post("/webhooks/adobe-sign", async (c) => {
    // Adobe Sign verification header
    const clientId = c.req.header("x-adobesign-clientid");
    if (clientId !== c.env.ADOBE_SIGN_CLIENT_ID) {
        return new Response("Forbidden", { status: 403 });
    }

    const event = await c.req.json<{
        event: string;
        agreement: { id: string };
    }>();

    if (event.event === "AGREEMENT_SIGNED") {
        const signatureRequestId = event.agreement.id;

        // Find contract by signature_request_id
        const { results } = await c.env.DB.prepare(
            "SELECT id FROM contracts WHERE signature_request_id = ?",
        )
            .bind(signatureRequestId)
            .all<{ id: string }>();

        if (results.length > 0) {
            await c.env.DB.prepare(
                "UPDATE contracts SET status = 'SIGNING' WHERE id = ?",
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
app.get("/contracts", async (c) => {
    const userId = c.req.query("user_id") ?? "anonymous";
    const contracts = await listUserContracts(c.env.DB, userId);
    return c.json({ contracts });
});

/**
 * DELETE /contract/:id
 * Permanently deletes a contract record.
 */
app.delete("/contract/:id", async (c) => {
    const id = c.req.param("id");
    const deleted = await deleteContract(c.env.DB, id);
    if (!deleted) return jsonError("Contract not found", 404);
    return c.json({ ok: true });
});

// ─── PWA Routes ───────────────────────────────────────────────────────────────

app.get("/manifest.json", (_c) => {
    const manifest = {
        name: "MyCounsel",
        short_name: "MyCounsel",
        description: "AI-Powered UK Commercial Contract Platform",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f8f5ef",
        theme_color: "#0f1e35",
        icons: [
            {
                src: "/icons/icon-192.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any maskable",
            },
            {
                src: "/icons/icon-512.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any maskable",
            },
        ],
        categories: ["business", "productivity"],
        lang: "en-GB",
    };
    return new Response(JSON.stringify(manifest), {
        headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=86400",
        },
    });
});

app.get("/icons/icon-192.svg", (_c) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="38" fill="#0f1e35"/>
  <text x="96" y="138" font-family="Georgia,serif" font-size="100" font-weight="700" fill="#c9a84c" text-anchor="middle">M</text>
</svg>`;
    return new Response(svg, {
        headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=604800",
        },
    });
});

app.get("/icons/icon-512.svg", (_c) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#0f1e35"/>
  <text x="256" y="370" font-family="Georgia,serif" font-size="270" font-weight="700" fill="#c9a84c" text-anchor="middle">M</text>
</svg>`;
    return new Response(svg, {
        headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=604800",
        },
    });
});

app.get("/sw.js", (_c) => {
    const sw = `
const CACHE = 'mycounsel-v1';
const SHELL = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept API calls or queue messages
  if (url.pathname.startsWith('/contract') ||
      url.pathname.startsWith('/companies-house') ||
      url.pathname.startsWith('/webhooks')) {
    return;
  }

  // Network-first for navigation (always get fresh HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for CDN assets (Tailwind, fonts, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
`.trim();
    return new Response(sw, {
        headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-cache",
            "Service-Worker-Allowed": "/",
        },
    });
});

// ─── Queue Consumer ───────────────────────────────────────────────────────────

async function handlePipelineMessage(
    message: PipelineMessage,
    env: Env,
): Promise<void> {
    const { type, contractId } = message;
    const state = await loadContract(env.DB, contractId);
    if (!state) {
        console.error(`[queue] contract ${contractId} not found — skipping`);
        return;
    }

    try {
        let finalState: ContractState;
        if (type === "generate") {
            finalState = await generate(state, env);
        } else if (type === "review") {
            finalState = await review(state, env);
        } else {
            finalState = await resume(state, env);
        }
        await saveContract(env.DB, finalState);
        console.log(
            `[queue] ${type} complete for ${contractId} → status: ${finalState.status}`,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[queue] ${type} failed for ${contractId}:`, message);
        await saveContract(env.DB, {
            ...state,
            errors: [...(state.errors ?? []), message],
        });
    }
}

export default {
    fetch: app.fetch,

    async queue(batch: MessageBatch<PipelineMessage>, env: Env): Promise<void> {
        for (const msg of batch.messages) {
            await handlePipelineMessage(msg.body, env);
            msg.ack();
        }
    },
};
