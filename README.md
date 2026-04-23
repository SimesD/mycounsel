# MyCounsel — AI-Powered UK Commercial Contract Platform

> **Demo platform — for evaluation purposes only.**
> Nothing produced by this system constitutes legal advice. All AI-generated drafts, reviews, and risk assessments should be reviewed by a qualified solicitor before execution.

---

## Contents

1. [Overview for Legal Professionals](#overview-for-legal-professionals)
2. [Capabilities](#capabilities)
3. [Draft Mode — Step by Step](#draft-mode--step-by-step)
4. [Review Mode — Step by Step](#review-mode--step-by-step)
5. [The Legal Standing Report](#the-legal-standing-report)
6. [Document Export](#document-export)
7. [Supported Contract Types](#supported-contract-types)
8. [What This Platform Does Not Do](#what-this-platform-does-not-do)
9. [Technical Documentation](#technical-documentation)

---

## Overview for Legal Professionals

MyCounsel is a specialized AI-orchestration platform engineered for UK commercial legal practice. It automates the high-friction preparatory phases of contract lifecycle management—statutory research, initial drafting, and adversarial risk assessment—enabling solicitors to focus on strategic judgment and higher-value client advisory.

Unlike general-purpose language models, MyCounsel is architected on a **Verified Grounding** principle. Every draft and report is cross-referenced in real-time against authoritative UK legal sources:
- **legislation.gov.uk**: Live statutory data for confirmed UK Acts and SIs.
- **Companies House**: Real-time corporate entity resolution and registered office verification.
- **The National Archives (TNA) & BAILII**: Live verification of modern and historical case law citations.

### How It Works

The platform operates as a sequential pipeline of five specialist AI agents, each modelled on a specific role within a conventional City of London law firm:

| Agent | What it does | Law firm equivalent |
|---|---|---|
| **Intake & Classification** | Reads the instruction or submitted contract; identifies the contract type from 16 categories; extracts parties and commercial terms; resolves UK company names to registered details via Companies House | Trainee or paralegal taking initial instructions |
| **Legal Researcher** | Queries legislation.gov.uk for confirmed statute references; fetches modern (2003+) case law from The National Archives (TNA) and historical context from BAILII | Junior associate producing a research memo |
| **Drafting Architect** | Drafts a complete, clause-by-clause contract in UK English with all mandatory boilerplate, correctly numbered and ready for execution | Mid-level associate drafting from precedent |
| **Contract Reviewer** | In Review mode: analyses a submitted contract against current English law; identifies missing clauses, void or ambiguous provisions, and non-English law drafting; produces a corrected version | Senior associate conducting a mark-up |
| **Risk & Standing Agent** | Adversarial peer review of the draft or improved contract; scores enforceability 0–100; identifies up to three material vulnerabilities with statutory basis; produces a recommendation | Senior partner sign-off review |

The output of every run is a **Legal Standing Report** — a structured risk assessment with an enforceability score, identified vulnerabilities, and a recommendation — alongside the full contract draft.

---

## Capabilities

### Draft Mode

Produce a comprehensive first draft of a UK commercial contract from a natural-language description. The platform:

- **Automated Entity Resolution**: Verifies UK companies via Companies House, automatically embedding registered office addresses and company numbers into the contract text.
- **Dual-Source Case Verification**: Performs live HTTP verification of all AI-generated citations. Routes modern neutral citations (`[YEAR] UKSC/EWCA/EWHC`) to **The National Archives (TNA)** and historical cases to **BAILII**.
- **Statutory Grounding**: Fetches confirmed references from **legislation.gov.uk** tailored to the specific contract type (e.g., VABEO 2022, UCTA 1977).
- **Adversarial Risk Review**: Generates a **Legal Standing Report** with an enforceability score (0–100) and identifies potential vulnerabilities under English law.
- **Professional Typography**: Drafts in UK English with standard clause hierarchy and classical legal typesetting (EB Garamond).

### Review Mode

Submit any existing contract — received from a counterparty, downloaded from a template library, or previously drafted — for review and improvement. The platform accepts:

- **Plain text** pasted directly into the text area
- **PDF documents** uploaded via the file picker or drag-and-drop
- **Word documents** (.docx / .doc) uploaded via the file picker or drag-and-drop

Text is extracted from uploaded files entirely in the browser before submission. The platform then:

- Automatically classifies the contract type from the document content
- Extracts parties, commercial terms, and governing law from the contract itself — no separate instruction required
- Researches the applicable statutory framework and case law for that contract type
- Produces an improved version correcting: missing boilerplate clauses, void or unenforceable provisions, ambiguous drafting, incorrect legal terminology, and non-English law language
- Renders a **redline** (track changes) view showing every word-level addition and deletion between the original and the improved version — red strikethrough for deletions, green highlight for additions
- Produces a Legal Standing Report assessing the improved version

### Revision Workflow

After reviewing the Legal Standing Report, three options are available:

- **Request Revision** — submit notes to the Drafting Agent specifying what to address. The agent produces a revised version and the Risk Agent re-evaluates it, explicitly acknowledging resolved issues and raising the score accordingly. Issues that have been adequately addressed are not re-flagged.
- **Send for Legal Review** — generates a formatted email to in-house counsel containing the full draft, the AI risk summary, and the user's message and questions. In the demo, this produces an email preview rather than dispatching a live message.
- **Approve & Sign** — advances the agreement to the signing workflow (Adobe Sign integration is implemented but not active in the demo).

### Document Export

Both the contract draft and the redline can be exported as PDF:

- **Export Draft PDF** — opens a print-ready A4 document set in EB Garamond, with a header showing the contract name, reference, version, parties, and date. The PDF footer (rendered via CSS `@page` rules) shows the MyCounsel reference and version on the left, the page number in the centre, and *Confidential Draft* on the right.
- **Export Redline PDF** — the same layout but renders the full redline with the red and green track changes markup preserved. The footer identifies the document as *Track Changes*.

Both exports open in a new browser tab and auto-trigger the browser's print dialog, from which the user can save as PDF.

### Agreement History

All contracts are saved automatically. The **My Agreements** panel lists every draft and review, with status indicator, reference number, and date. Individual agreements can be opened to view the full result, or permanently deleted.

---

## Draft Mode — Step by Step

1. **Select ✍️ Draft Agreement** from the mode toggle at the top of the form.
2. **Add the parties.** Enter each party's name and role. For UK-registered companies, type the name and select from the Companies House autocomplete — registered address and company number are filled in automatically and embedded in the contract.
3. **Name the agreement** (optional). If left blank, a name is generated from the transaction description.
4. **Describe the transaction.** Write a plain-English description. Include commercial terms — price, duration, territory, exclusivity, margins, or specific requirements. The more detail, the more accurate the draft.
5. **Click Generate Agreement.** The four-agent pipeline runs (approximately 60 seconds). Progress is shown for each stage.
6. **Review the Legal Standing Report.** The report shows the enforceability score, identified vulnerabilities with statutory basis, and a recommendation.
7. **Review the contract draft.** Expand the *View Contract Draft* accordion. The version badge shows the version number, date, and authoring agent.
8. **Export or decide.** Export to PDF, request a revision, send for legal review, or approve.

### Example instructions

> *Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% gross margin. 3-year initial term with automatic annual renewal. Supplier retains the right to terminate on 6 months' notice.*

> *SaaS subscription agreement for cloud-based inventory management software. £24,000 per year, invoiced annually in advance. 2-year initial term with auto-renewal. Customer data processed in the UK only. 99.5% uptime SLA.*

> *Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14 5AB. 5-year term commencing 1 January 2026. £85 per sq ft per annum, reviewed every 2 years. Tenant break clause at year 3 on 6 months' notice.*

---

## Review Mode — Step by Step

1. **Select 🔍 Review Contract** from the mode toggle at the top of the form.
2. **Name the review** (optional).
3. **Submit the contract.** Either:
   - Upload a PDF or Word file using the upload zone (drag-and-drop or click to browse). Text is extracted in the browser and shown in the text area for review before submission.
   - Paste the full contract text directly into the text area.
4. **Click Review Contract.** The pipeline runs (approximately 60 seconds). The intake agent reads the contract to classify it and extract all parties and terms — no separate description is required.
5. **Review the Legal Standing Report.** The report assesses the *improved* version of the contract.
6. **Open the Redline.** Expand the *Track Changes* accordion to see every change made between the original and the improved version. Export the redline as PDF for sharing.
7. **Review the improved draft.** The full improved contract is in the *View Contract Draft* accordion. Export as PDF.
8. **Decide.** Request a further revision with specific notes, send to in-house counsel for review, or approve.

---

## The Legal Standing Report

The Legal Standing Report is produced by the Risk & Standing Agent, which conducts an adversarial peer review of the contract — approaching it as opposing counsel seeking weaknesses to exploit.

### Enforceability Score

The score (0–100) reflects the agent's assessment of the overall legal soundness of the agreement under English law. It is displayed as a colour-coded ring dial.

| Score | Colour | Assessment | Action |
|---|---|---|---|
| 95–100 | 🟢 Green + ⭐ | Outstanding | Approve with confidence |
| 90–94 | 🟢 Green | Exceptional | Consider approving |
| 75–89 | 🟢 Green | Good | Minor points only |
| 60–74 | 🟡 Amber | Notable Gaps | Revision recommended |
| 40–59 | 🟠 Orange | Significant Weaknesses | Revision required |
| 0–39 | 🔴 Red | Do Not Execute | Fundamental defects |

The score number and ring colour reflect the same band. A gold star (⭐) appears for scores of 95 or above.

### Identified Vulnerabilities

Up to three material legal weaknesses are reported, each with:
- A plain-English title
- A detailed explanation of the risk and how it could be exploited by opposing counsel
- The specific statutory or case law basis (e.g. *Unfair Contract Terms Act 1977 s.11 — reasonableness test*)

### Revision Convergence

When a revision is requested, the Risk Agent compares the new draft against the previous report. It explicitly acknowledges which issues have been resolved, raises the score accordingly, and will not re-flag issues that have been adequately addressed. This prevents circular revision loops and gives an honest picture of whether the revision actually improved matters.

---

## Document Export

### Draft PDF

Clicking **↓ Export PDF** in the *View Contract Draft* panel opens a formatted A4 print window:

- **Verified Citations**: Includes the live-verified status and source badge (TNA/BAILII) for every cited case.
- **Professional Typography**: Typeset in **EB Garamond** — a classical legal document typeface.
- **Complete Metadata**: Header shows contract name, reference number, version, parties, and date.
- **A4 Layout**: Footer (via CSS `@page`) includes MyCounsel reference, version, and page numbers.
- **Print-Ready**: Auto-triggers the browser print dialog for Save as PDF.

### Redline PDF

Clicking **↓ Export PDF** in the *Track Changes* panel produces the same layout with the redline markup preserved — red strikethrough for deletions, green highlight for additions — suitable for sharing with a counterparty or in-house counsel.

---

## Supported Contract Types

The research pipeline has specialist legislation and case law coverage for 16 contract types. The correct type is detected automatically from the transaction description or submitted contract text.

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
| NDA / Confidentiality Agreement | Trade Secrets (Enforcement etc) Regulations 2018, Misrepresentation Act 1967, Employment Rights Act 1996 |
| Share Purchase Agreement | Companies Act 2006, Financial Services and Markets Act 2000, Misrepresentation Act 1967 |
| Loan Agreement | Financial Services and Markets Act 2000, Consumer Credit Act 1974, Late Payment of Commercial Debts Act 1998 |
| Franchise Agreement | Competition Act 1998, Vertical Agreements Block Exemption Order 2022, Commercial Agents Regulations 1993 |
| Joint Venture Agreement | Companies Act 2006, Competition Act 1998, Partnership Act 1890 |
| Construction Contract | Housing Grants Construction and Regeneration Act 1996, Construction (Design and Management) Regulations 2015, Defective Premises Act 1972 |
| Agency Agreement | Commercial Agents (Council Directive) Regulations 1993, Competition Act 1998, Supply of Goods and Services Act 1982 |
| Consultancy Agreement | Supply of Goods and Services Act 1982, Employment Rights Act 1996, IR35 (ITEPA 2003) |

All contract types additionally reference the **Unfair Contract Terms Act 1977** and the **Misrepresentation Act 1967**, which apply across virtually all commercial agreements under English law.

---

## What This Platform Does Not Do

The following are current limitations of the demo. They represent production build items rather than fundamental constraints of the approach.

| Limitation | Notes |
|---|---|
| **Not legal advice** | AI output is a starting point only. A qualified solicitor must review before execution. |
| **Electronic signing** | Adobe Sign integration is fully implemented in code but not active in the demo. The approve workflow records the decision and reference but does not dispatch documents to signatories. |
| **Lawyer email dispatch** | The legal review workflow produces a correctly formatted email preview but does not send a live message. Production would use Cloudflare Email Workers or a transactional email service such as Resend. |
| **User authentication** | The demo uses a fixed `demo` user ID. Production would require proper identity management. |
| **Jurisdiction** | English and Welsh law only. Scottish law, Northern Irish law, and other jurisdictions are not supported. |
| **Non-standard contract types** | Highly specialised agreements (financial instruments, regulated consumer credit, constitutional documents) fall back to general English contract law principles and may require additional manual input. |
| **PDF page count in footer** | Page numbers appear as *Page N* in the exported PDF. *Page N of M* (total page count) requires a browser that fully supports CSS `@page counter(pages)`, which is not yet universally available. |

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
| External APIs | legislation.gov.uk search, Companies House REST, TNA Find Case Law (Atom/XML) |
| E-signing | Adobe Sign / Acrobat Sign REST API v6 (placeholder) |
| PDF parsing (client) | PDF.js 3.11 (lazy-loaded) |
| DOCX parsing (client) | mammoth.js 1.8 (lazy-loaded) |

### AI Models

| Agent | Model | Role |
|---|---|---|
| Intake & Classification | `gemini-3.1-flash-lite-preview` | Fast structured extraction with JSON schema |
| Legal Researcher | `gemini-3-flash-preview` | Research + case law enrichment |
| Drafting Architect | `gemini-3-flash-preview` | Full contract generation |
| Contract Reviewer | `gemini-3-flash-preview` | Contract analysis and improvement |
| Risk & Standing | `gemini-3-flash-preview` | Adversarial peer review |

All models are accessed via the Google AI (`aistudio.google.com`) API surface. A **Tier 1** key (billing-enabled project) is required — free-tier keys have a hard limit of 20 requests per day and will fail on any non-trivial usage.

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

> **Note:** If you update `schema.sql` after the database already exists locally, wipe and recreate it:
> ```bash
> rm -rf .wrangler/state
> wrangler d1 execute mycounsel-db --local --file=schema.sql
> ```

### Environment Variables

Set in `.dev.vars` for local development. Set via `wrangler secret put` for production.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_AI_API_KEY` | ✅ | Google AI API key — must be Tier 1 (billing-enabled project). The key prefix `AIzaSy...` identifies an AI Studio key; ensure the project has billing enabled and is on Tier 1 in the rate limits dashboard. |
| `COMPANIES_HOUSE_KEY` | ✅ | Companies House API key (free registration) |
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
| `POST` | `/contract/review` | Start a new review pipeline (accepts `original_contract` text) |
| `GET` | `/contract/:id` | Retrieve full contract state as JSON |
| `GET` | `/contract/:id/report` | Legal Standing Report as Markdown |
| `POST` | `/contract/:id/decision` | Submit `ADJUST` or `APPROVE` decision |
| `POST` | `/contract/:id/legal-review` | Send draft and message to in-house lawyers |
| `DELETE` | `/contract/:id` | Permanently delete a contract |
| `POST` | `/webhooks/adobe-sign` | Receive `AGREEMENT_SIGNED` webhook from Adobe Sign |
| `GET` | `/contracts?user_id=xxx` | List contracts for a user |
| `GET` | `/companies-house/search?q=xxx` | Proxy Companies House company search |

### Project Structure

```
src/
├── index.ts               # Hono router — all HTTP endpoints
├── pipeline.ts            # Agent pipeline orchestration (generate, review, resume)
├── state.ts               # ContractState type, ContractType taxonomy (16 types)
├── db.ts                  # D1 persistence layer
├── report.ts              # Legal Standing Report Markdown formatter
├── retry.ts               # Gemini 429/503 retry wrapper with parsed delay
├── ui.ts                  # Single-file demo UI (HTML/CSS/JS)
│
├── agents/
│   ├── intake.ts          # Agent A — Intake & Classification
│   ├── researcher.ts      # Agent B — Legal Researcher (legislation.gov.uk + Gemini)
│   ├── drafter.ts         # Agent C — Drafting Architect
│   ├── reviewer.ts        # Agent E — Contract Reviewer (review mode only)
│   ├── risk.ts            # Agent D — Risk & Standing (adversarial peer review)
│   └── signing.ts         # Signing node (Adobe Sign placeholder)
│
└── integrations/
    ├── companies-house.ts # Companies House REST API client
    ├── legislation.ts     # legislation.gov.uk search client + contract-type query map
    └── adobe-sign.ts      # Adobe Sign REST API v6 client (placeholder)

schema.sql                 # D1 database schema (contracts table + indexes + trigger)
wrangler.toml              # Cloudflare Workers configuration
```

### Key Design Notes

**Template literal escaping.** The entire demo UI is returned as a single TypeScript template literal from `renderUI()`. Any JavaScript embedded in the `<script>` block that itself uses template literals must escape backticks as `` \` `` and interpolations as `\${`. String literals using `\n` will resolve to real newlines (a JS syntax error in the output) — use `\\n` instead. Single-quoted strings with `\'` will lose the backslash — use double quotes for CSS values. The sequence `</script>` must never appear literally in string values — split it as `'</' + 'script>'`.

**Lazy library loading.** PDF.js and mammoth.js are not loaded at page load. They are injected via `loadScript()` only when a file is uploaded. This prevents third-party library initialisation errors from breaking the page's inline script block.

**Schema migrations.** The local D1 database is not migrated automatically when columns are added to `schema.sql`. Wipe `.wrangler/state` and reapply the schema after any schema change.

### Rate Limiting Notes

All Gemini API calls are wrapped in a retry handler (`src/retry.ts`) that:
- Parses the `retry-in` delay from 429 responses and waits the specified duration before retrying
- Backs off with increasing delays on 503 (model overload) responses
- Retries up to 5 times before surfacing the error
- Immediately surfaces daily quota exhaustion errors, which will not recover within the request window

A **Tier 1** Google AI API key is required. The key must belong to a project with billing enabled and Tier 1 confirmed in the [rate limits dashboard](https://aistudio.google.com/ratelimits). Free-tier keys are hard-limited to 20 requests per day on some models and will cause pipeline failures. If commits are being attributed to the wrong GitHub user, ensure `git config --global user.email` matches the noreply address shown in your GitHub Settings → Emails page (`{id}+{username}@users.noreply.github.com`).

---

*MyCounsel is a demonstration platform. It is not a regulated legal service and does not constitute legal advice. Always consult a qualified solicitor before executing any agreement.*