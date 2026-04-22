# MyCounsel — AI-Powered UK Commercial Contract Platform

> **Demo platform — for evaluation purposes only.**
> Nothing produced by this system constitutes legal advice. All AI-generated drafts and risk assessments should be reviewed by a qualified solicitor before execution.

---

## Contents

1. [Overview for Legal Professionals](#overview-for-legal-professionals)
2. [Capabilities](#capabilities)
3. [Draft Mode — Step by Step](#draft-mode--step-by-step)
4. [Review Mode — Step by Step](#review-mode--step-by-step)
5. [The Legal Standing Report](#the-legal-standing-report)
6. [Supported Contract Types](#supported-contract-types)
7. [What This Platform Does Not Do](#what-this-platform-does-not-do)
8. [Technical Documentation](#technical-documentation)

---

## Overview for Legal Professionals

MyCounsel is an AI-assisted contract drafting and review platform built for the English and Welsh jurisdiction. It is designed to sit alongside a qualified legal team — accelerating the production of first drafts, identifying legal vulnerabilities in existing agreements, and providing a structured risk assessment before a document is sent for execution.

The platform operates as a pipeline of five specialist AI agents, each with a defined role modelled on a conventional law firm workflow:

| Agent | Role | Equivalent in a law firm |
|---|---|---|
| **Intake & Classification** | Parses the instruction or submitted contract, identifies the contract type, extracts parties, resolves company details via Companies House | Trainee or paralegal taking initial instructions |
| **Legal Researcher** | Searches legislation.gov.uk for confirmed statute references; enriches with relevant case law, regulatory guidance, and an anchor case summary | Junior associate conducting a research memo |
| **Drafting Architect** | Produces a complete, execution-ready contract under English law with all standard boilerplate clauses | Mid-level associate drafting from a precedent |
| **Contract Reviewer** | In Review mode: analyses a submitted contract against English law, identifies deficiencies, and produces an improved version | Senior associate conducting a mark-up |
| **Risk & Standing Agent** | Conducts an adversarial peer review of the draft or improved contract, scoring enforceability 0–100 and identifying up to three material legal vulnerabilities | Senior partner conducting a sign-off review |

All research is grounded in live data. Statute references are verified against **legislation.gov.uk** before being passed to the drafting or review agents. Party details for UK-registered companies are resolved against **Companies House** and embedded in the contract automatically.

---

## Capabilities

### Draft Mode

Produce a complete first draft of a UK commercial contract from a plain-English description of the transaction. The platform:

- Classifies the agreement type automatically
- Resolves named companies to their registered office address and company number via Companies House
- Fetches confirmed statute references from legislation.gov.uk
- Drafts a full, clause-by-clause contract in UK English using the correct hierarchy (1., 1.1, 1.1.1)
- Includes all mandatory standard boilerplate: governing law and jurisdiction (England & Wales), limitation of liability, severability, entire agreement, notices, force majeure, and waiver
- Appends execution pages with signature blocks for each party
- Produces a Legal Standing Report with an enforceability score and identified vulnerabilities

### Review Mode

Submit any existing contract — whether received from a counterparty or previously drafted — for review and improvement. The platform:

- Automatically classifies the contract type from the submitted text
- Extracts the parties, commercial terms, and governing law from the document itself
- Researches the applicable statutory framework and case law for that contract type
- Produces an improved version correcting: missing clauses, void or unenforceable provisions, ambiguous drafting, incorrect legal terminology, and non-English law boilerplate
- Renders a **redline** (track changes view) showing every word-level addition and deletion between the original and the improved version, displayed in the browser with red strikethrough for deletions and green highlighting for additions
- Produces a Legal Standing Report on the improved version

### Revision Workflow

After reviewing the Legal Standing Report, the user has three options:

- **Request Revision** — submit notes to the Drafting Agent, which will produce a revised version addressing the specific concerns. The Risk Agent then re-evaluates the new draft, acknowledging improvements and only flagging issues that genuinely remain.
- **Send for Legal Review** — generate a formatted email to in-house counsel containing the full draft, the AI risk summary, and the user's message and questions. In the demo, this produces an email preview rather than dispatching a live message.
- **Approve & Sign** — advance the agreement to the signing workflow (Adobe Sign integration; currently a placeholder in the demo).

---

## Draft Mode — Step by Step

1. **Select Draft Agreement** from the mode toggle at the top of the form.
2. **Add the parties.** Enter each party's name and role. For UK-registered companies, type the company name and select from the Companies House autocomplete — the registered address and company number will be filled in automatically and embedded in the contract.
3. **Name the agreement** (optional). If left blank, a name is generated from the transaction description.
4. **Describe the transaction.** Write a plain-English description of what you need. Include commercial terms — price, duration, territory, exclusivity, margins, or any specific requirements. The more detail provided, the more accurate the draft.
5. **Click Generate Agreement.** The four-agent pipeline runs (approximately 60 seconds). Progress is shown for each stage.
6. **Review the Legal Standing Report.** The report shows the enforceability score, identified vulnerabilities with their statutory basis, and a recommendation.
7. **Read the contract draft.** Expand the draft accordion to review the full text.
8. **Make your decision:** revise, send for legal review, or approve.

### Example instructions

> *Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% gross margin. 3-year initial term with automatic annual renewal. Supplier retains right to terminate on 6 months' notice.*

> *SaaS subscription agreement for cloud-based inventory management software. £24,000 per year, invoiced annually in advance. 2-year initial term with auto-renewal. Customer data processed in the UK only. 99.5% uptime SLA.*

> *Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14 5AB. 5-year term commencing 1 January 2026. £85 per sq ft per annum, reviewed every 2 years. Tenant break clause at year 3 on 6 months' notice.*

---

## Review Mode — Step by Step

1. **Select Review Contract** from the mode toggle at the top of the form.
2. **Name the review** (optional).
3. **Paste the full contract text** into the text area. The platform accepts plain text; paste directly from a word processor or document viewer.
4. **Click Review Contract.** The pipeline runs (approximately 60 seconds). The intake agent reads the contract itself to classify it and extract parties and commercial terms.
5. **Review the Legal Standing Report.** This report assesses the *improved* version of the contract, not the original.
6. **Open the Redline.** Expand the *Track Changes* accordion to see a word-level diff of every change made between your original and the improved version.
7. **Review the improved draft.** The full improved text is available in the *View Contract Draft* accordion.
8. **Make your decision:** request a further revision, send for legal review, or approve.

---

## The Legal Standing Report

The Legal Standing Report is produced by the Risk & Standing Agent, which conducts an adversarial peer review of the contract — identifying weaknesses that opposing counsel could exploit.

### Enforceability Score

The score (0–100) reflects the agent's assessment of the overall legal soundness of the agreement under English law.

| Score | Colour | Assessment |
|---|---|---|
| 95–100 | 🟢 Green + ⭐ | Outstanding |
| 90–94 | 🟢 Green | Exceptional |
| 75–89 | 🟢 Green | Good |
| 60–74 | 🟡 Amber | Notable Gaps |
| 40–59 | 🟠 Orange | Significant Weaknesses |
| 0–39 | 🔴 Red | Do Not Execute |

The score is displayed as a ring dial. The score number and ring colour both reflect the band. A gold star (⭐) appears for scores of 95 or above.

### Identified Vulnerabilities

Up to three material legal weaknesses are reported, each with:
- A plain-English title
- A detailed explanation of the risk and how it could be exploited
- The specific statutory or case law basis (e.g. *Unfair Contract Terms Act 1977 s.11 — reasonableness test*)

### Revision Convergence

When a revision is requested, the Risk Agent compares the new draft against the previous report. It explicitly acknowledges which issues have been resolved, raises the score accordingly, and will not re-flag issues that have been adequately addressed. This prevents circular revision loops.

---

## Supported Contract Types

The research pipeline has specialist legislation and case law coverage for the following contract types. The correct type is detected automatically from the transaction description or submitted contract text.

| Contract Type | Key Legislation |
|---|---|
| Distribution Agreement | Vertical Agreements Block Exemption Order 2022, Sale of Goods Act 1979, Competition Act 1998, Commercial Agents Regulations 1993 |
| Supply Agreement | Sale of Goods Act 1979, Supply of Goods and Services Act 1982, Late Payment of Commercial Debts Act 1998 |
| Employment Contract | Employment Rights Act 1996, Equality Act 2010, National Minimum Wage Act 1998, Working Time Regulations 1998 |
| SaaS Agreement | Supply of Goods and Services Act 1982, Consumer Rights Act 2015, Data Protection Act 2018 |
| Software Licence | Copyright Designs and Patents Act 1988, Supply of Goods and Services Act 1982 |
| Commercial Lease | Landlord and Tenant Act 1954, Law of Property Act 1925, Landlord and Tenant (Covenants) Act 1995 |
| IP Licence | Copyright Designs and Patents Act 1988, Trade Marks Act 1994, Patents Act 1977 |
| Services Agreement | Supply of Goods and Services Act 1982, Late Payment of Commercial Debts Act 1998 |
| NDA / Confidentiality Agreement | Trade Secrets (Enforcement etc) Regulations 2018, Misrepresentation Act 1967 |
| Share Purchase Agreement | Companies Act 2006, Financial Services and Markets Act 2000, Misrepresentation Act 1967 |
| Loan Agreement | Financial Services and Markets Act 2000, Consumer Credit Act 1974 |
| Franchise Agreement | Competition Act 1998, Vertical Agreements Block Exemption Order 2022 |
| Joint Venture Agreement | Companies Act 2006, Competition Act 1998, Partnership Act 1890 |
| Construction Contract | Housing Grants Construction and Regeneration Act 1996, Construction (Design and Management) Regulations 2015 |
| Agency Agreement | Commercial Agents (Council Directive) Regulations 1993, Competition Act 1998 |
| Consultancy Agreement | Supply of Goods and Services Act 1982, Employment Rights Act 1996, IR35 (ITEPA 2003) |

All contract types additionally reference the **Unfair Contract Terms Act 1977** and the **Misrepresentation Act 1967**, which apply across virtually all commercial agreements.

---

## What This Platform Does Not Do

The following are current limitations of the demo. They represent production build items rather than fundamental constraints.

| Limitation | Status |
|---|---|
| **Not legal advice** | AI output is a starting point only. A qualified solicitor must review before execution. |
| **Electronic signing** | Adobe Sign integration is present and typed but not active in the demo. The approve workflow records the decision but does not dispatch to signatories. |
| **Lawyer email dispatch** | The legal review workflow produces a correctly formatted email preview but does not send a live email. Production would use Cloudflare Email Workers or a transactional email service. |
| **User authentication** | The demo uses a fixed `demo` user ID. Production would require proper identity management. |
| **Jurisdiction** | English and Welsh law only. Scottish law, Northern Irish law, and other jurisdictions are not supported. |
| **Document upload** | Review mode accepts pasted plain text only. PDF and DOCX upload is a planned enhancement. |
| **Non-standard contract types** | Highly specialised agreements (financial instruments, regulated products, constitutional documents) fall back to general English contract law principles and may require more manual input. |

---

## Technical Documentation

### Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers (edge, serverless) |
| Framework | Hono.js |
| Language | TypeScript |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (declared; reserved for PDF storage) |
| AI | Google Gemini (via `@google/genai`) |
| External APIs | legislation.gov.uk search API, Companies House REST API |
| E-signing | Adobe Sign / Acrobat Sign REST API v6 (placeholder) |

### AI Models

| Agent | Model | Role |
|---|---|---|
| Intake & Classification | `gemini-3.1-flash-lite-preview` | Fast structured extraction |
| Legal Researcher | `gemini-3-flash-preview` | Research + case law enrichment |
| Drafting Architect | `gemini-3-flash-preview` | Full contract generation |
| Contract Reviewer | `gemini-2.5-flash-preview-05-20` | Contract analysis and improvement |
| Risk & Standing | `gemini-3-flash-preview` | Adversarial peer review |

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account with Workers, D1, and R2 enabled
- A Google AI API key (Tier 1 — from [Google AI Studio](https://aistudio.google.com), project with billing enabled)
- A Companies House API key (free — from [Companies House Developer Hub](https://developer.company-information.service.gov.uk/))

### Getting Started (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Create the local D1 database
wrangler d1 create mycounsel-db --local
# Copy the database_id into wrangler.toml → [[d1_databases]]

# 3. Apply the schema
wrangler d1 execute mycounsel-db --local --file=schema.sql

# 4. Create local secrets file
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your API keys

# 5. Start the dev server
wrangler dev
# Open http://localhost:8787
```

### Environment Variables

Set in `.dev.vars` for local development. Set via `wrangler secret put` for production.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_AI_API_KEY` | ✅ | Google AI API key (must be Tier 1 / billing-enabled project) |
| `COMPANIES_HOUSE_KEY` | ✅ | Companies House API key |
| `ADOBE_SIGN_ACCESS_TOKEN` | Demo placeholder | Adobe Sign OAuth access token |
| `ADOBE_SIGN_CLIENT_ID` | Demo placeholder | Adobe Sign client ID (used for webhook verification) |
| `ADOBE_SIGN_CLIENT_SECRET` | Demo placeholder | Adobe Sign client secret |
| `ANTHROPIC_API_KEY` | Not used | Reserved for future use |

### Deploying to Production

```bash
# 1. Create production D1 database
wrangler d1 create mycounsel-db
# Update database_id in wrangler.toml

# 2. Apply schema to production
wrangler d1 execute mycounsel-db --file=schema.sql

# 3. Create R2 bucket
wrangler r2 bucket create mycounsel-contracts

# 4. Set secrets
wrangler secret put GOOGLE_AI_API_KEY
wrangler secret put COMPANIES_HOUSE_KEY

# 5. Deploy
npm run deploy
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Demo UI |
| `POST` | `/contract/generate` | Start a new draft pipeline |
| `POST` | `/contract/review` | Start a new review pipeline |
| `GET` | `/contract/:id` | Retrieve full contract state as JSON |
| `GET` | `/contract/:id/report` | Legal Standing Report as Markdown |
| `POST` | `/contract/:id/decision` | Submit `ADJUST` or `APPROVE` decision |
| `POST` | `/contract/:id/legal-review` | Send draft and message to in-house lawyers |
| `POST` | `/webhooks/adobe-sign` | Receive `AGREEMENT_SIGNED` webhook from Adobe Sign |
| `GET` | `/contracts?user_id=xxx` | List contracts for a user |
| `GET` | `/companies-house/search?q=xxx` | Proxy Companies House company search |

### Project Structure

```
src/
├── index.ts               # Hono router — all HTTP endpoints
├── pipeline.ts            # Agent pipeline orchestration (generate, review, resume)
├── state.ts               # ContractState type, ContractType taxonomy
├── db.ts                  # D1 persistence layer
├── report.ts              # Legal Standing Report formatter
├── retry.ts               # Gemini 429/503 retry wrapper
├── ui.ts                  # Single-file demo UI (HTML/CSS/JS)
│
├── agents/
│   ├── intake.ts          # Agent A — Intake & Classification
│   ├── researcher.ts      # Agent B — Legal Researcher
│   ├── drafter.ts         # Agent C — Drafting Architect
│   ├── reviewer.ts        # Agent E — Contract Reviewer (review mode)
│   ├── risk.ts            # Agent D — Risk & Standing
│   └── signing.ts         # Signing node (Adobe Sign placeholder)
│
└── integrations/
    ├── companies-house.ts # Companies House REST API client
    ├── legislation.ts     # legislation.gov.uk search client
    └── adobe-sign.ts      # Adobe Sign REST API client (placeholder)

schema.sql                 # D1 database schema
wrangler.toml              # Cloudflare Workers configuration
```

### Rate Limiting Notes

All Gemini API calls are wrapped in a retry handler (`src/retry.ts`) that:
- Parses the `retry-in` delay from 429 responses and waits accordingly
- Backs off with increasing delays on 503 (model overload) responses
- Retries up to 5 times before surfacing the error
- Immediately surfaces daily quota exhaustion errors (these will not recover within the request window)

A Tier 1 Google AI API key (billing-enabled project) is required. Free-tier keys have a hard limit of 20 requests per day on some models and will cause pipeline failures on any non-trivial usage.

---

*MyCounsel is a demonstration platform. It is not a regulated legal service and does not provide legal advice. Always consult a qualified solicitor before executing any agreement.*