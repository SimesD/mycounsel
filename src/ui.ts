export function renderUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyCounsel — UK Legal Drafting</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/diff@5.2.0/dist/diff.min.js"></script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

    :root {
      --navy: #0f1e35;
      --navy-light: #1a2f4a;
      --gold: #c9a84c;
      --gold-light: #e8c97a;
      --cream: #f8f5ef;
      --text: #2d3748;
    }

    body { font-family: 'Inter', sans-serif; background: var(--cream); color: var(--text); }
    h1, h2, h3, .serif { font-family: 'Playfair Display', serif; }

    .score-ring {
      background: conic-gradient(var(--gold) calc(var(--pct) * 1%), #e2e8f0 0);
      border-radius: 50%;
    }

    .step-line::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 100%;
      width: 2px;
      height: 2rem;
      background: currentColor;
      transform: translateX(-50%);
    }

    .draft-content {
      font-family: 'Lora', Georgia, serif;
      font-size: 0.875rem;
      line-height: 1.85;
      white-space: pre-wrap;
    }

    .pulse-dot {
      animation: pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .fade-in {
      animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .warning-card {
      border-left: 3px solid var(--gold);
    }

    .diff-del {
      background: #fee2e2;
      color: #991b1b;
      text-decoration: line-through;
      border-radius: 2px;
      padding: 0 2px;
    }
    .diff-add {
      background: #dcfce7;
      color: #166534;
      border-radius: 2px;
      padding: 0 2px;
    }
    .redline-content {
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      line-height: 1.8;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body class="min-h-screen">

  <!-- Header -->
  <header style="background: var(--navy);" class="px-6 py-4 flex items-center justify-between shadow-lg">
    <div class="flex items-center gap-3">
      <div style="background: var(--gold); color: var(--navy);" class="w-8 h-8 rounded flex items-center justify-center font-bold text-sm serif">M</div>
      <span class="serif text-white text-xl font-semibold tracking-wide">MyCounsel</span>
      <span class="text-xs px-2 py-0.5 rounded-full ml-1" style="background: rgba(201,168,76,0.2); color: var(--gold-light);">UK Edition</span>
    </div>
    <button onclick="showHistory()" class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style="background:rgba(255,255,255,0.08);color:#94a3b8" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
      &#128196; My Agreements
    </button>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-10">

    <!-- ── STEP 1: Input ── -->
    <section id="step-input" class="fade-in">
      <div class="text-center mb-8">
        <h1 id="page-title" class="serif text-4xl font-bold mb-3" style="color: var(--navy)">Draft a UK Commercial Agreement</h1>
        <p id="page-subtitle" class="text-slate-500 text-sm max-w-lg mx-auto">Add the parties, describe your transaction, and our agents will research UK law, draft the agreement, and produce a Legal Standing Report.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-md p-8 border border-slate-100 space-y-6">

        <!-- Mode toggle -->
        <div class="flex rounded-xl overflow-hidden border border-slate-200 w-fit mx-auto">
          <button id="mode-btn-draft" onclick="setMode('DRAFT')" class="px-6 py-2.5 text-sm font-medium transition-colors" style="background:var(--navy);color:#fff">✍️ Draft Agreement</button>
          <button id="mode-btn-review" onclick="setMode('REVIEW')" class="px-6 py-2.5 text-sm font-medium transition-colors text-slate-500 bg-white">🔍 Review Contract</button>
        </div>

        <!-- Draft mode fields -->
        <div id="draft-input-section">
          <!-- Parties -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-slate-700">Parties to the agreement</label>
              <button onclick="addParty()" class="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors" style="border-color:var(--navy);color:var(--navy)">+ Add party</button>
            </div>
            <div id="parties-list" class="space-y-3"></div>
          </div>

          <div class="border-t border-slate-100 pt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Agreement name <span class="text-slate-400 font-normal">(optional — auto-generated if blank)</span></label>
              <input
                id="name-input"
                type="text"
                placeholder="e.g. Tofka Vodka Distribution Agreement 2026"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Describe the agreement &amp; key commercial terms</label>
              <textarea
                id="intent-input"
                rows="4"
                placeholder="e.g. Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% margin. 3-year term with auto-renewal."
                class="w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Review mode fields -->
        <div id="review-input-section" class="hidden space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Contract name <span class="text-slate-400 font-normal">(optional)</span></label>
            <input
              id="review-name"
              type="text"
              placeholder="e.g. Supplier NDA Review"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Contract document</label>

            <!-- File upload drop zone -->
            <div
              id="file-drop-zone"
              onclick="document.getElementById('file-input').click()"
              ondragover="event.preventDefault();this.style.borderColor='var(--gold)'"
              ondragleave="this.style.borderColor=''"
              ondrop="event.preventDefault();this.style.borderColor='';handleFileUpload(event.dataTransfer.files[0])"
              class="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer transition-colors mb-3 hover:border-yellow-300"
            >
              <div class="text-3xl mb-2">📄</div>
              <div class="text-sm font-medium text-slate-600">Upload PDF or Word document</div>
              <div class="text-xs text-slate-400 mt-1">Drag &amp; drop or click to browse &middot; .pdf, .doc, .docx</div>
              <input id="file-input" type="file" accept=".pdf,.doc,.docx" class="hidden" onchange="handleFileUpload(this.files[0])" />
            </div>

            <!-- Extraction status -->
            <div id="file-status" class="hidden text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2">
              <span id="file-status-icon" class="mt-0.5 shrink-0"></span>
              <span id="file-status-text"></span>
            </div>

            <div class="flex items-center gap-3 mb-3">
              <div class="flex-1 border-t border-slate-200"></div>
              <span class="text-xs text-slate-400">or paste text directly</span>
              <div class="flex-1 border-t border-slate-200"></div>
            </div>

            <textarea
              id="review-contract-text"
              rows="12"
              placeholder="Paste contract text here…"
              class="w-full rounded-xl border border-slate-200 p-4 text-sm font-mono focus:outline-none focus:ring-2 resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            id="btn-generate"
            onclick="currentMode === 'REVIEW' ? generateReview() : startGeneration()"
            class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style="background: var(--navy); color: white;"
            onmouseover="this.style.background='var(--navy-light)'"
            onmouseout="this.style.background='var(--navy)'"
          >
            <span id="btn-generate-label">Generate Agreement &rarr;</span>
          </button>
        </div>

        <p id="form-hint" class="text-xs text-slate-400 text-center">Takes ~60 seconds &middot; Checks legislation.gov.uk &amp; Companies House &middot; English law only</p>
      </div>

      <!-- Example prompts -->
      <div class="mt-6 grid grid-cols-1 gap-2">
        <p class="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Try an example</p>
        <button onclick="setExample(0)" class="text-left text-xs bg-white border border-slate-100 rounded-xl px-4 py-3 text-slate-600 hover:border-yellow-300 transition-colors shadow-sm">
          🥃 Exclusive UK distribution agreement for Tofka Vodka. Minimum 30% margin. 3-year term.
        </button>
        <button onclick="setExample(1)" class="text-left text-xs bg-white border border-slate-100 rounded-xl px-4 py-3 text-slate-600 hover:border-yellow-300 transition-colors shadow-sm">
          💻 SaaS subscription for cloud-based inventory software. £24,000/year. 2-year initial term with auto-renewal.
        </button>
        <button onclick="setExample(2)" class="text-left text-xs bg-white border border-slate-100 rounded-xl px-4 py-3 text-slate-600 hover:border-yellow-300 transition-colors shadow-sm">
          🏢 Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14. 5-year term. £85/sqft/pa. Tenant break at year 3.
        </button>
      </div>
    </section>

    <!-- ── STEP 2: Loading ── -->
    <section id="step-loading" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-md p-10 border border-slate-100 text-center">
        <div class="serif text-2xl font-semibold mb-2" style="color: var(--navy)">Agents at work</div>
        <p id="processing-subtitle" class="text-sm text-slate-400 mb-10">Four specialist agents are researching and drafting your agreement</p>

        <div class="space-y-5 text-left max-w-sm mx-auto" id="pipeline-steps">
          <!-- Injected by JS -->
        </div>
      </div>
    </section>

    <!-- ── STEP 3: Result ── -->
    <section id="step-result" class="hidden fade-in space-y-6">

      <!-- Score card -->
      <div class="bg-white rounded-2xl shadow-md p-8 border border-slate-100">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal Standing Report</span>
              <span id="result-ref" class="text-xs font-mono px-2 py-0.5 rounded" style="background:rgba(201,168,76,0.12);color:var(--gold)"></span>
            </div>
            <h2 class="serif text-2xl font-bold" style="color: var(--navy)" id="result-title">Agreement</h2>
            <p class="text-xs text-slate-400 mt-1" id="result-parties"></p>
            <span id="result-contract-type" class="hidden text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-block" style="background:rgba(15,30,53,0.08);color:var(--navy)"></span>
          </div>
          <div class="flex flex-col items-center">
            <div id="score-circle" class="w-20 h-20 rounded-full flex items-center justify-center relative" style="background: conic-gradient(#c9a84c 0%, #e2e8f0 0%);">
              <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                <span id="score-number" class="serif text-xl font-bold" style="color: var(--navy)">—</span>
              </div>
              <span id="score-star" class="absolute -top-3 -right-2 text-xl hidden" title="Outstanding — 95+">⭐</span>
            </div>
            <span id="score-label" class="text-xs text-slate-500 mt-2 font-medium text-center max-w-[90px]"></span>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-slate-100">
          <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Identified Vulnerabilities</div>
          <div id="warnings-container" class="space-y-4"></div>
        </div>

        <div id="recommendation-block" class="mt-6 pt-6 border-t border-slate-100 hidden">
          <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Recommendation</div>
          <p id="recommendation-text" class="text-sm text-slate-700 leading-relaxed"></p>
        </div>
      </div>

      <!-- Draft accordion -->
      <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <button
          onclick="toggleDraft()"
          class="w-full flex items-center justify-between px-8 py-5 text-left"
          style="color: var(--navy)"
        >
          <span class="serif font-semibold text-lg">View Contract Draft</span>
          <span id="draft-chevron" class="text-slate-400 text-xl">&#8964;</span>
        </button>
        <div id="draft-panel" class="hidden px-8 pb-8">
          <div class="flex items-center justify-between mb-3">
            <span id="draft-version-badge" class="text-xs text-slate-400 font-medium"></span>
            <button onclick="exportDraftPdf()" class="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors" style="border-color:var(--navy);color:var(--navy)" onmouseover="this.style.background='var(--navy)';this.style.color='#fff'" onmouseout="this.style.background='';this.style.color='var(--navy)'">&#8595; Export PDF</button>
          </div>
          <div class="bg-slate-50 rounded-xl p-6 overflow-auto max-h-[32rem]">
            <pre id="draft-content" class="draft-content text-slate-700"></pre>
          </div>
        </div>
      </div>

      <!-- Redline accordion (review mode only) -->
      <div id="redline-panel-wrapper" class="hidden bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <button
          onclick="toggleRedline()"
          class="w-full flex items-center justify-between px-8 py-5 text-left"
          style="color: var(--navy)"
        >
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Track Changes</div>
            <span class="serif font-semibold text-lg">Redline — Original vs Improved</span>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="event.stopPropagation();exportRedlinePdf()" class="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors" style="border-color:var(--navy);color:var(--navy)" onmouseover="this.style.background='var(--navy)';this.style.color='#fff'" onmouseout="this.style.background='';this.style.color='var(--navy)'">&#8595; Export PDF</button>
            <span id="redline-chevron" class="text-slate-400 text-xl">&#8964;</span>
          </div>
        </button>
        <div id="redline-panel" class="hidden">
          <div class="px-8 py-3 bg-slate-50 border-t border-b border-slate-100 flex gap-6 text-xs text-slate-500">
            <span class="flex items-center gap-2">
              <span class="inline-block w-3 h-3 rounded-sm" style="background:#fee2e2;border:1px solid #fca5a5"></span>Deleted
            </span>
            <span class="flex items-center gap-2">
              <span class="inline-block w-3 h-3 rounded-sm" style="background:#dcfce7;border:1px solid #86efac"></span>Added
            </span>
          </div>
          <div class="px-8 pb-8 pt-4 overflow-auto max-h-[600px]">
            <div id="redline-content" class="redline-content text-slate-700"></div>
          </div>
        </div>
      </div>

      <!-- Decision -->
      <div class="bg-white rounded-2xl shadow-md p-8 border border-slate-100">
        <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Your Decision</div>
        <div id="score-advice" class="text-xs mb-4"></div>

        <div class="flex gap-3 flex-wrap">
          <button
            onclick="showPanel('adjust-panel')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style="border-color: var(--navy); color: var(--navy);"
          >
            &#8635; Request Revision
          </button>
          <button
            onclick="showPanel('review-panel')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style="border-color: var(--gold); color: var(--gold);"
          >
            &#9998; Send for Legal Review
          </button>
          <button
            onclick="approve()"
            class="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style="background: var(--navy);"
          >
            &#10003; Approve &amp; Sign
          </button>
        </div>

        <!-- Revision panel -->
        <div id="adjust-panel" class="hidden mt-5 pt-5 border-t border-slate-100">
          <label class="block text-sm font-medium text-slate-700 mb-2">Revision notes for the Drafting Agent</label>
          <textarea
            id="lawyer-notes"
            rows="3"
            placeholder="e.g. Strengthen the exclusivity clause. Add a non-compete provision. Clarify the margin KPI mechanism."
            class="w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 resize-none"
          ></textarea>
          <button
            onclick="submitAdjust()"
            class="mt-3 w-full py-3 rounded-xl text-sm font-semibold text-white"
            style="background: var(--navy);"
          >
            Submit Revision Request &rarr;
          </button>
        </div>

        <!-- Legal review panel -->
        <div id="review-panel" class="hidden mt-5 pt-5 border-t border-slate-100">
          <div class="text-sm font-medium text-slate-700 mb-1">Send to in-house legal team</div>
          <p class="text-xs text-slate-400 mb-3">The full draft and AI risk report will be sent along with your message. Your lawyers can review, advise, and approve before signature.</p>
          <label class="block text-xs font-medium text-slate-600 mb-1">Lawyer email address</label>
          <input
            id="lawyer-email"
            type="email"
            placeholder="lawyer@yourfirm.com"
            class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 mb-3"
          />
          <label class="block text-xs font-medium text-slate-600 mb-1">Your message &amp; questions</label>
          <textarea
            id="review-message"
            rows="4"
            placeholder="e.g. Please review this distribution agreement for Tofka Vodka. I'm particularly concerned about the exclusivity clause and whether the 30% margin KPI creates RPM risk. Can you advise before we send for signature?"
            class="w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 resize-none"
          ></textarea>
          <button
            onclick="submitLegalReview()"
            class="mt-3 w-full py-3 rounded-xl text-sm font-semibold text-white"
            style="background: var(--gold); color: var(--navy);"
          >
            Send for Legal Review &rarr;
          </button>
        </div>
      </div>

    </section>

    <!-- ── STEP 4: Sent for Review ── -->
    <section id="step-reviewed" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-md p-10 border border-slate-100">
        <div class="text-center mb-8">
          <div class="text-4xl mb-3">&#9998;</div>
          <h2 class="serif text-2xl font-bold mb-2" style="color: var(--navy)">Sent for Legal Review</h2>
          <p class="text-sm text-slate-500">The draft and your message have been sent to the legal team. You will hear back shortly.</p>
        </div>

        <div class="bg-slate-50 rounded-xl p-5 mb-6">
          <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Email Preview</div>
          <pre id="email-preview" class="draft-content text-slate-600 text-xs overflow-auto max-h-80"></pre>
        </div>

        <div class="flex gap-3">
          <button onclick="reset()" class="flex-1 py-3 rounded-xl text-sm font-semibold border-2" style="border-color: var(--navy); color: var(--navy);">
            &#8592; Draft another agreement
          </button>
          <button onclick="approve()" class="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style="background: var(--navy);">
            &#10003; Approve &amp; Sign anyway
          </button>
        </div>
      </div>
    </section>

    <!-- ── STEP 5: Signed ── -->
    <section id="step-signed" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-md p-12 border border-slate-100 text-center">
        <div class="text-5xl mb-4">&#10003;</div>
        <h2 class="serif text-2xl font-bold mb-2" style="color: var(--navy)">Agreement Approved</h2>
        <p class="text-sm text-slate-500 mb-6">In production this would be dispatched to all parties via Adobe Sign for electronic execution.</p>
        <button onclick="reset()" class="text-sm font-medium" style="color: var(--gold)">&#8592; Draft another agreement</button>
      </div>
    </section>

    <!-- ── STEP: History ── -->
    <section id="step-history" class="hidden fade-in">
      <div class="flex items-center justify-between mb-6">
        <h2 class="serif text-2xl font-bold" style="color:var(--navy)">My Agreements</h2>
        <button onclick="show('step-input')" class="text-sm font-medium px-4 py-2 rounded-xl border-2 transition-colors" style="border-color:var(--navy);color:var(--navy)">
          + New Agreement
        </button>
      </div>
      <div id="history-list" class="space-y-3">
        <p class="text-sm text-slate-400 text-center py-8">Loading…</p>
      </div>
    </section>

    <!-- Error -->
    <div id="error-bar" class="hidden mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4"></div>

  </main>

  <footer class="text-center text-xs text-slate-400 py-8 border-t border-slate-100 mt-8">
    MyCounsel &middot; For demonstration purposes only &middot; Not legal advice &middot; Consult a qualified solicitor before executing any agreement
  </footer>

<script>
const EXAMPLES = [
  {
    intent: "Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% margin. 3-year term with auto-renewal.",
    parties: [
      { type: 'company', name: 'Tofka Spirits Ltd', role: 'Supplier', email: '' },
      { type: 'company', name: 'Premier Drinks Distribution Ltd', role: 'Distributor', email: '' },
    ]
  },
  {
    intent: "SaaS subscription for cloud-based inventory software. £24,000/year. 2-year initial term with auto-renewal.",
    parties: [
      { type: 'company', name: 'TechCorp Ltd', role: 'Service Provider', email: '' },
      { type: 'company', name: 'Retail Solutions PLC', role: 'Customer', email: '' },
    ]
  },
  {
    intent: "Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14. 5-year term. £85 per sq ft per annum. Tenant break clause at year 3.",
    parties: [
      { type: 'company', name: 'Canary Wharf Group PLC', role: 'Landlord', email: '' },
      { type: 'company', name: '', role: 'Tenant', email: '' },
    ]
  },
];

const PIPELINE_STEPS = [
  { label: "Intake & Entity Resolution", sub: "Parsing your instruction · Verifying parties via Companies House", sources: "Companies House API · English law jurisdiction check" },
  { label: "Legal Research",             sub: "Searching applicable UK statutes and case law",                   sources: "legislation.gov.uk · CMA guidance · UK case law" },
  { label: "Contract Drafting",          sub: "Composing the full agreement under English law",                  sources: "VABEO 2022 · UCTA 1977 · UK drafting standards" },
  { label: "Risk & Standing Assessment", sub: "Adversarial peer review — identifying vulnerabilities",           sources: "Competition Act 1998 · Licensing Act 2003 · CMA guidance" },
];

let currentContractId = null;
let currentState = null;
let stepTimer = null;
let currentMode = 'DRAFT';

const PIPELINE_STEPS_REVIEW = [
  { label: "Intake & Classification", sub: "Identifying contract type · Extracting parties & terms", sources: "Companies House API · English law jurisdiction check" },
  { label: "Legal Research",          sub: "Searching applicable UK statutes and case law",           sources: "legislation.gov.uk · CMA guidance · UK case law" },
  { label: "Contract Review",         sub: "Analysing and improving the submitted contract",          sources: "UCTA 1977 · Misrepresentation Act 1967 · UK drafting standards" },
  { label: "Risk & Standing Assessment", sub: "Adversarial peer review — identifying vulnerabilities", sources: "Competition Act 1998 · English law enforceability" },
];

function setMode(mode) {
  currentMode = mode;
  const isDraft = mode === 'DRAFT';

  document.getElementById('draft-input-section').classList.toggle('hidden', !isDraft);
  document.getElementById('review-input-section').classList.toggle('hidden', isDraft);

  const draftBtn  = document.getElementById('mode-btn-draft');
  const reviewBtn = document.getElementById('mode-btn-review');
  draftBtn.style.background  = isDraft  ? 'var(--navy)' : '#fff';
  draftBtn.style.color       = isDraft  ? '#fff'        : '#64748b';
  reviewBtn.style.background = !isDraft ? 'var(--navy)' : '#fff';
  reviewBtn.style.color      = !isDraft ? '#fff'        : '#64748b';

  document.getElementById('btn-generate-label').textContent = isDraft
    ? 'Generate Agreement \u2192'
    : 'Review Contract \u2192';

  document.getElementById('page-title').textContent = isDraft
    ? 'Draft a UK Commercial Agreement'
    : 'Review an Existing Contract';

  document.getElementById('page-subtitle').textContent = isDraft
    ? 'Add the parties, describe your transaction, and our agents will research UK law, draft the agreement, and produce a Legal Standing Report.'
    : 'Paste any contract below. Our agents will classify it, research the applicable UK law, improve it, and produce a redlined version with a Legal Standing Report.';

  document.getElementById('form-hint').textContent = isDraft
    ? 'Takes ~60 seconds \u00b7 Checks legislation.gov.uk & Companies House \u00b7 English law only'
    : 'Takes ~60 seconds \u00b7 Classifies contract type \u00b7 Produces redline under English law';
}

// ── Party form state ──────────────────────────────────────────────────────────

let parties = [
  { type: 'company', name: '', role: '', email: '', co_number: '', address: '' },
  { type: 'company', name: '', role: '', email: '', co_number: '', address: '' },
];
let chTimers = {};

function addParty() {
  parties.push({ type: 'company', name: '', role: '', email: '', co_number: '', address: '' });
  renderParties();
}

function removeParty(idx) {
  if (parties.length <= 1) return;
  parties.splice(idx, 1);
  renderParties();
}

function setPartyType(idx, type) {
  parties[idx].type = type;
  parties[idx].co_number = '';
  parties[idx].address = '';
  renderParties();
}

function renderParties() {
  const list = document.getElementById('parties-list');
  list.innerHTML = parties.map((p, idx) => \`
    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3" id="party-row-\${idx}">
      <div class="flex items-center justify-between">
        <div class="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
          <button onclick="setPartyType(\${idx},'company')"
            class="px-3 py-1.5 transition-colors \${p.type==='company' ? 'text-white' : 'bg-white text-slate-500'}"
            style="\${p.type==='company' ? 'background:var(--navy)' : ''}">Company</button>
          <button onclick="setPartyType(\${idx},'individual')"
            class="px-3 py-1.5 transition-colors \${p.type==='individual' ? 'text-white' : 'bg-white text-slate-500'}"
            style="\${p.type==='individual' ? 'background:var(--navy)' : ''}">Individual</button>
        </div>
        \${parties.length > 1 ? \`<button onclick="removeParty(\${idx})" class="text-slate-300 hover:text-red-400 text-lg leading-none px-1">&times;</button>\` : ''}
      </div>

      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            type="text"
            value="\${p.name}"
            placeholder="\${p.type==='company' ? 'Company name' : 'Full name'}"
            oninput="onPartyNameInput(\${idx}, this.value)"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1"
            style="focus-ring-color:var(--gold)"
            autocomplete="off"
          />
          <div id="ch-dropdown-\${idx}" class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 hidden overflow-hidden"></div>
        </div>
        <input
          type="text"
          value="\${p.role}"
          placeholder="Role (e.g. Supplier)"
          oninput="parties[\${idx}].role=this.value"
          class="w-36 rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1"
        />
      </div>

      <input
        type="email"
        value="\${p.email}"
        placeholder="Email address (optional)"
        oninput="parties[\${idx}].email=this.value"
        class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1"
      />

      \${p.co_number ? \`
        <div class="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3)">
          <span style="color:var(--gold)" class="mt-0.5">&#10003;</span>
          <div>
            <div class="font-semibold text-slate-700">\${p.name}</div>
            <div class="text-slate-500">Companies House: \${p.co_number} &middot; \${p.address}</div>
          </div>
        </div>
      \` : ''}
    </div>
  \`).join('');
}

function onPartyNameInput(idx, value) {
  parties[idx].name = value;
  parties[idx].co_number = '';
  parties[idx].address = '';

  if (parties[idx].type !== 'company') return;
  clearTimeout(chTimers[idx]);
  const dropdown = document.getElementById(\`ch-dropdown-\${idx}\`);
  if (value.length < 2) { dropdown.classList.add('hidden'); return; }

  chTimers[idx] = setTimeout(async () => {
    try {
      const res = await fetch(\`/companies-house/search?q=\${encodeURIComponent(value)}\`);
      const data = await res.json();
      if (!data.items?.length) { dropdown.classList.add('hidden'); return; }

      dropdown.innerHTML = data.items.map((item, i) => \`
        <button
          onclick="selectCHResult(\${idx}, \${JSON.stringify(JSON.stringify(item))})"
          class="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 transition-colors \${i>0?'border-t border-slate-100':''}"
        >
          <div class="font-semibold text-slate-800">\${item.title}</div>
          <div class="text-slate-400 mt-0.5">\${item.company_number} &middot; \${item.company_status} &middot; \${item.address}</div>
        </button>
      \`).join('');
      dropdown.classList.remove('hidden');
    } catch {}
  }, 380);
}

function selectCHResult(idx, jsonStr) {
  const item = JSON.parse(jsonStr);
  parties[idx].name = item.title;
  parties[idx].co_number = item.company_number;
  parties[idx].address = item.address;
  document.getElementById(\`ch-dropdown-\${idx}\`).classList.add('hidden');
  renderParties();
}

// Close CH dropdowns when clicking outside
document.addEventListener('click', (e) => {
  document.querySelectorAll('[id^="ch-dropdown-"]').forEach(d => {
    if (!d.parentElement?.contains(e.target)) d.classList.add('hidden');
  });
});

function setExample(i) {
  const ex = EXAMPLES[i];
  document.getElementById('intent-input').value = ex.intent;
  parties = ex.parties.map(p => ({ ...p, co_number: '', address: '' }));
  renderParties();
}

function show(id) {
  ['step-input','step-loading','step-result','step-reviewed','step-signed','step-history'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
  document.getElementById(id).classList.add('fade-in');
}

async function showHistory() {
  show('step-history');
  const list = document.getElementById('history-list');
  try {
    const res = await fetch('/contracts?user_id=demo');
    const data = await res.json();
    if (!data.contracts?.length) {
      list.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">No agreements yet. Draft your first one above.</p>';
      return;
    }
    const STATUS_LABEL = {
      INTAKE: 'Intake', RESEARCH: 'Researching', DRAFTING: 'Drafting',
      RISK_ASSESSMENT: 'Risk Review', LAWYER_REVIEW: 'Ready for Review',
      SENT_FOR_REVIEW: 'Sent for Review', SIGNING: 'Signed',
    };
    const STATUS_COLOR = {
      INTAKE: '#94a3b8', RESEARCH: '#f59e0b', DRAFTING: '#f59e0b',
      RISK_ASSESSMENT: '#f59e0b', LAWYER_REVIEW: '#16a34a',
      SENT_FOR_REVIEW: '#c9a84c', SIGNING: '#16a34a',
    };
    list.innerHTML = data.contracts.map(c => \`
      <div class="flex items-center gap-2">
        <button onclick="openContract('\${c.id}')" class="flex-1 min-w-0 text-left bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-4 hover:border-yellow-300 transition-colors">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-800 truncate">\${c.name || '(Untitled)'}</div>
              <div class="text-xs text-slate-400 mt-0.5">\${c.ref || '—'} &middot; \${new Date(c.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</div>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style="background:\${STATUS_COLOR[c.status] ?? '#94a3b8'}20;color:\${STATUS_COLOR[c.status] ?? '#94a3b8'}">
              \${STATUS_LABEL[c.status] ?? c.status}
            </span>
          </div>
        </button>
        <button
          onclick="deleteContract('\${c.id}')"
          title="Delete"
          class="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-300 hover:text-red-400 hover:border-red-200 transition-colors shadow-sm"
        >&#128465;</button>
      </div>
    \`).join('');
  } catch {
    list.innerHTML = '<p class="text-sm text-red-400 text-center py-8">Failed to load agreements.</p>';
  }
}

async function deleteContract(id) {
  if (!confirm('Delete this agreement? This cannot be undone.')) return;
  try {
    const res = await fetch(\`/contract/\${id}\`, { method: 'DELETE' });
    if (!res.ok) { alert('Failed to delete.'); return; }
    showHistory();
  } catch {
    alert('Network error — could not delete.');
  }
}

async function openContract(id) {
  currentContractId = id;
  show('step-loading');
  startStepAnimation();
  await loadResult(id);
  stopStepAnimation();
  show('step-result');
}

function showPanel(id) {
  ['adjust-panel','review-panel'].forEach(p => {
    const el = document.getElementById(p);
    if (p === id) {
      el.classList.toggle('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function setError(msg) {
  const el = document.getElementById('error-bar');
  if (msg) { el.textContent = msg; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}

// ── Pipeline loading animation ──────────────────────────────────────────────

function renderPipelineSteps(activeIdx, steps) {
  steps = steps || PIPELINE_STEPS;
  const container = document.getElementById('pipeline-steps');
  container.innerHTML = steps.map((step, i) => {
    const done    = i < activeIdx;
    const active  = i === activeIdx;
    const pending = i > activeIdx;

    const icon = done
      ? \`<div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style="background:#16a34a">✓</div>\`
      : active
      ? \`<div class="w-8 h-8 rounded-full flex items-center justify-center pulse-dot" style="background:var(--gold)"><span class="w-3 h-3 bg-white rounded-full inline-block"></span></div>\`
      : \`<div class="w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-200 text-slate-300 text-sm">\${i+1}</div>\`;

    return \`
      <div class="flex items-start gap-4">
        \${icon}
        <div class="flex-1 pt-1">
          <div class="text-sm font-semibold \${pending ? 'text-slate-300' : 'text-slate-800'}">\${step.label}</div>
          <div class="text-xs \${pending ? 'text-slate-300' : 'text-slate-400'} mt-0.5">\${step.sub}</div>
          <div class="text-xs mt-0.5 \${done ? 'text-green-600' : active ? '' : 'text-slate-300'}" style="\${active ? 'color:var(--gold)' : ''}">\${step.sources}</div>
        </div>
      </div>
    \`;
  }).join('');
}

function startStepAnimation(steps) {
  steps = steps || PIPELINE_STEPS;
  let idx = 0;
  renderPipelineSteps(idx, steps);
  // Approximate timings: intake ~5s, research ~15s, draft/review ~20s, risk ~15s
  const durations = [5000, 15000, 20000, 15000];
  function advance() {
    idx++;
    if (idx < steps.length) {
      renderPipelineSteps(idx, steps);
      stepTimer = setTimeout(advance, durations[idx] || 15000);
    }
  }
  stepTimer = setTimeout(advance, durations[0]);
}

function stopStepAnimation() {
  if (stepTimer) clearTimeout(stepTimer);
  renderPipelineSteps(999, PIPELINE_STEPS); // all done — pass high idx so all show as complete
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Server returned a non-JSON body (e.g. "Internal Server Error")
    return { error: text.slice(0, 200) || \`Server error \${res.status}\` };
  }
}

// ── Generate ─────────────────────────────────────────────────────────────────

async function generateReview() {
  const original_contract = document.getElementById('review-contract-text').value.trim();
  const name = document.getElementById('review-name').value.trim();
  if (original_contract.length < 100) { setError('Please paste a contract of at least 100 characters.'); return; }
  setError('');

  document.getElementById('processing-subtitle').textContent = 'Four specialist agents are reviewing and improving your contract';
  show('step-loading');
  startStepAnimation(PIPELINE_STEPS_REVIEW);

  try {
    const res = await fetch('/contract/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_contract, name: name || undefined, user_id: 'demo' }),
    });
    const data = await safeJson(res);
    stopStepAnimation();

    if (!res.ok || data.error) {
      show('step-input');
      setError(data.error || 'Review failed. Please try again.');
      return;
    }

    currentContractId = data.id;
    await loadResult(currentContractId);
    show('step-result');

  } catch (err) {
    stopStepAnimation();
    show('step-input');
    setError('Network error: ' + err.message);
  }
}


async function startGeneration() {
  const intent = document.getElementById('intent-input').value.trim();
  const name   = document.getElementById('name-input').value.trim();
  if (!intent) { setError('Please describe the agreement you need.'); return; }
  setError('');

  document.getElementById('processing-subtitle').textContent = 'Four specialist agents are researching and drafting your agreement';
  show('step-loading');
  startStepAnimation(PIPELINE_STEPS);

  // Collect only parties that have at least a name and role
  const validParties = parties
    .filter(p => p.name.trim() && p.role.trim())
    .map(p => ({
      name: p.name.trim(),
      role: p.role.trim(),
      ...(p.email ? { email: p.email.trim() } : {}),
      ...(p.co_number ? { co_number: p.co_number } : {}),
      ...(p.address ? { address: p.address } : {}),
    }));

  try {
    const res = await fetch('/contract/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, name: name || undefined, user_id: 'demo', parties: validParties }),
    });

    const data = await safeJson(res);
    stopStepAnimation();

    if (!res.ok || data.error) {
      show('step-input');
      setError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    currentContractId = data.id;
    await loadResult(currentContractId);
    show('step-result');

  } catch (err) {
    stopStepAnimation();
    show('step-input');
    setError('Network error: ' + err.message);
  }
}

// ── Load & render result ──────────────────────────────────────────────────────

async function loadResult(id) {
  const res  = await fetch(\`/contract/\${id}\`);
  const state = await res.json();
  currentState = state;
  const report = state.risk_report;
  const draft  = state.draft_versions?.[state.draft_versions.length - 1];

  // Title, ref & parties
  document.getElementById('result-ref').textContent = state.ref || '';
  document.getElementById('result-title').textContent = state.name || state.inputs.intent.slice(0, 60);
  document.getElementById('result-parties').textContent =
    state.inputs.parties.map(p => \`\${p.name} (\${p.role})\`).join(' · ');

  // Score
  if (report) {
    const score = report.enforceability_score;
    const pct   = score;
    const color = scoreColor(score);
    document.getElementById('score-circle').style.background =
      \`conic-gradient(\${color} \${pct}%, #e2e8f0 0%)\`;
    document.getElementById('score-number').textContent = score;
    document.getElementById('score-number').style.color = color;
    document.getElementById('score-label').textContent  = scoreLabel(score);
    document.getElementById('score-star').classList.toggle('hidden', score < 95);

    const advice = document.getElementById('score-advice');
    if (score >= 95) {
      advice.innerHTML = \`<span style="color:#c9a84c">&#11088; Score \${score}/100 — outstanding. This draft is exceptional quality. You may approve with confidence.</span>\`;
    } else if (score >= 82) {
      advice.innerHTML = \`<span style="color:#16a34a">&#10003; Score \${score}/100 — the draft is considered sound. You may approve or request further refinement.</span>\`;
    } else if (score >= 60) {
      advice.innerHTML = \`<span style="color:#b45309">&#9888; Score \${score}/100 — consider requesting a revision to address the vulnerabilities above before approving.</span>\`;
    } else if (score >= 40) {
      advice.innerHTML = \`<span style="color:#ea580c">&#9888; Score \${score}/100 — significant weaknesses remain. Request a revision before approving.</span>\`;
    } else {
      advice.innerHTML = \`<span style="color:#dc2626">&#10007; Score \${score}/100 — do not execute. Fundamental defects require a full revision.</span>\`;
    }

    // Warnings
    const container = document.getElementById('warnings-container');
    container.innerHTML = (report.warnings || []).map((w, i) => \`
      <div class="warning-card rounded-lg p-4 bg-amber-50">
        <div class="text-sm font-semibold text-slate-800 mb-1">\${i+1}. \${w.title}</div>
        <p class="text-xs text-slate-600 leading-relaxed">\${w.detail}</p>
        <div class="mt-2 text-xs font-mono text-amber-700 bg-amber-100 rounded px-2 py-1 inline-block">\${w.statutory_basis}</div>
      </div>
    \`).join('');

    if (report.recommendation) {
      document.getElementById('recommendation-text').textContent = report.recommendation;
      document.getElementById('recommendation-block').classList.remove('hidden');
    }
  }

  // Contract type badge
  const typeEl = document.getElementById('result-contract-type');
  if (state.contract_type && state.contract_type !== 'OTHER') {
    typeEl.textContent = state.contract_type.replace(/_/g, ' ');
    typeEl.classList.remove('hidden');
  } else {
    typeEl.classList.add('hidden');
  }

  // Draft
  if (draft) {
    document.getElementById('draft-content').textContent = draft.content;
    document.getElementById('draft-version-badge').textContent =
      'Version ' + draft.version + '  \u00b7  ' + new Date(draft.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}) + '  \u00b7  ' + draft.author;
  }

  // Redline (review mode only)
  const redlineWrapper = document.getElementById('redline-panel-wrapper');
  if (state.mode === 'REVIEW' && state.original_contract && draft) {
    redlineWrapper.classList.remove('hidden');
    renderRedline(state.original_contract, draft.content);
  } else {
    redlineWrapper.classList.add('hidden');
  }
}

function scoreColor(s) {
  if (s >= 95) return '#16a34a'; // strong green — outstanding (gold star handles the gold)
  if (s >= 82) return '#16a34a'; // strong green — exceptional/sound
  if (s >= 75) return '#22c55e'; // green — good
  if (s >= 60) return '#f59e0b'; // amber — notable gaps
  if (s >= 40) return '#f97316'; // orange — significant weaknesses
  return '#ef4444';              // red — do not execute
}

function scoreLabel(s) {
  if (s >= 95) return 'Outstanding';
  if (s >= 90) return 'Exceptional';
  if (s >= 75) return 'Good';
  if (s >= 60) return 'Notable Gaps';
  if (s >= 40) return 'Significant Weaknesses';
  return 'Do Not Execute';
}

// ── Draft toggle ──────────────────────────────────────────────────────────────

// ── PDF Export ───────────────────────────────────────────────────────────────

function exportDraftPdf() {
  if (!currentState) return;
  var draft = currentState.draft_versions && currentState.draft_versions[currentState.draft_versions.length - 1];
  if (!draft) return;
  openPrintWindow({
    title: currentState.name || 'Contract Draft',
    ref: currentState.ref,
    version: draft.version,
    parties: currentState.inputs.parties.map(function(p) { return p.name + ' (' + p.role + ')'; }).join(' \u00b7 '),
    content: draft.content,
    isRedline: false,
  });
}

function exportRedlinePdf() {
  if (!currentState) return;
  var draft = currentState.draft_versions && currentState.draft_versions[currentState.draft_versions.length - 1];
  openPrintWindow({
    title: (currentState.name || 'Contract') + ' \u2014 Redline',
    ref: currentState.ref,
    version: draft ? draft.version : 1,
    parties: currentState.inputs.parties.map(function(p) { return p.name + ' (' + p.role + ')'; }).join(' \u00b7 '),
    content: null,
    isRedline: true,
  });
}

function openPrintWindow(opts) {
  var w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to export PDF.'); return; }

  var ver = 'Version ' + opts.version;
  var dateStr = new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
  var metaLine = (opts.ref ? 'Ref: ' + opts.ref + '&nbsp;&nbsp;&middot;&nbsp;&nbsp;' : '') +
    ver + '&nbsp;&nbsp;&middot;&nbsp;&nbsp;' +
    (opts.parties || '') +
    (opts.isRedline ? '&nbsp;&nbsp;&middot;&nbsp;&nbsp;Track Changes' : '') +
    '&nbsp;&nbsp;&middot;&nbsp;&nbsp;' + dateStr;

  var bodyContent;
  if (opts.isRedline) {
    var el = document.getElementById('redline-content');
    bodyContent = el ? el.innerHTML : '';
  } else {
    bodyContent = (opts.content || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  var footerLeft = 'MyCounsel  \u00b7  ' + ver;
  var footerRight = opts.isRedline ? 'Track Changes' : 'Confidential Draft';

  var parts = [
    '<!DOCTYPE html><html><head>',
    '<meta charset="UTF-8">',
    '<title>' + opts.title + '</title>',
    '<style>',
    '@import url("https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500&display=swap");',
    'body{font-family:"EB Garamond",Georgia,serif;font-size:11pt;line-height:1.8;color:#1a1a1a;background:#fff;margin:0;padding:0;}',
    '.page{max-width:170mm;margin:0 auto;padding:15mm 0 10mm;}',
    '.doc-title{font-size:15pt;font-weight:600;color:#0f1e35;padding-bottom:8pt;border-bottom:2px solid #0f1e35;margin-bottom:6pt;}',
    '.doc-meta{font-size:8.5pt;color:#64748b;font-family:"Inter",sans-serif;margin-bottom:22pt;}',
    '.content{white-space:pre-wrap;}',
    '.diff-del{background:#fee2e2;color:#991b1b;text-decoration:line-through;border-radius:2px;padding:0 2px;}',
    '.diff-add{background:#dcfce7;color:#166534;border-radius:2px;padding:0 2px;}',
    '@page{size:A4;margin:20mm 20mm 28mm 20mm;}',
    '@page{@bottom-left{content:"' + footerLeft + '";font-size:7pt;color:#94a3b8;font-family:"Inter",sans-serif;}}',
    '@page{@bottom-center{content:"Page " counter(page);font-size:7pt;color:#94a3b8;font-family:"Inter",sans-serif;}}',
    '@page{@bottom-right{content:"' + footerRight + '";font-size:7pt;color:#94a3b8;font-family:"Inter",sans-serif;}}',
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}',
    '</style></head><body>',
    '<div class="page">',
    '<div class="doc-title">' + opts.title + '</div>',
    '<div class="doc-meta">' + metaLine + '</div>',
    '<div class="content">' + bodyContent + '</div>',
    '</div>',
    '<script>window.onload=function(){window.print();};<\/script>',
    '</body></html>'
  ];

  w.document.write(parts.join(''));
  w.document.close();
}

function toggleDraft() {
  const panel   = document.getElementById('draft-panel');
  const chevron = document.getElementById('draft-chevron');
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    chevron.innerHTML = '&#8963;';
  } else {
    panel.classList.add('hidden');
    chevron.innerHTML = '&#8964;';
  }
}

// ── File upload (PDF / DOCX) ─────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(\`script[src="\${src}"]\`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(\`Failed to load \${src}\`));
    document.head.appendChild(s);
  });
}

async function handleFileUpload(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  const statusEl   = document.getElementById('file-status');
  const statusIcon = document.getElementById('file-status-icon');
  const statusText = document.getElementById('file-status-text');

  statusEl.className = 'text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-amber-50 text-amber-700';
  statusIcon.textContent = '⏳';
  statusText.textContent = \`Extracting text from \${file.name}…\`;
  statusEl.classList.remove('hidden');

  try {
    let text = '';
    if (ext === 'pdf') {
      text = await extractPDF(file);
    } else if (ext === 'docx' || ext === 'doc') {
      text = await extractDOCX(file);
    } else {
      throw new Error('Unsupported file type. Please upload a .pdf, .doc, or .docx file.');
    }

    if (!text || text.trim().length < 50) {
      throw new Error('Could not extract readable text from this file. Try copying and pasting the text directly.');
    }

    document.getElementById('review-contract-text').value = text.trim();

    statusEl.className = 'text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-green-50 text-green-700';
    statusIcon.textContent = '✓';
    statusText.textContent = \`Extracted from \${file.name} — \${text.trim().length.toLocaleString()} characters. Review below before submitting.\`;

  } catch (err) {
    statusEl.className = 'text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-red-50 text-red-700';
    statusIcon.textContent = '✗';
    statusText.textContent = err.message || 'Extraction failed.';
  }
}

async function extractPDF(file) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  if (!window.pdfjsLib) throw new Error('PDF library failed to load. Please refresh and try again.');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lineMap = new Map();
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push(item.str);
    }
    const sortedYs  = [...lineMap.keys()].sort((a, b) => b - a);
    const pageLines = sortedYs.map(y => lineMap.get(y).join(' ').trim()).filter(Boolean);
    pages.push(pageLines.join('\\n'));
  }
  return pages.join('\\n\\n');
}

async function extractDOCX(file) {
  await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
  if (!window.mammoth) throw new Error('Word library failed to load. Please refresh and try again.');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (result.messages?.length) {
    console.warn('[mammoth] warnings:', result.messages);
  }
  return result.value;
}

function toggleRedline() {
  const panel   = document.getElementById('redline-panel');
  const chevron = document.getElementById('redline-chevron');
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    chevron.innerHTML = '&#8963;';
  } else {
    panel.classList.add('hidden');
    chevron.innerHTML = '&#8964;';
  }
}

function renderRedline(original, improved) {
  const container = document.getElementById('redline-content');
  if (!container || !window.Diff) {
    container.textContent = improved;
    return;
  }
  const diff = Diff.diffWords(original, improved);
  const html = diff.map(part => {
    const escaped = part.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (part.removed) return \`<span class="diff-del">\${escaped}</span>\`;
    if (part.added)   return \`<span class="diff-add">\${escaped}</span>\`;
    return escaped;
  }).join('');
  container.innerHTML = html;
}

// ── Decision ──────────────────────────────────────────────────────────────────

async function submitLegalReview() {
  const message = document.getElementById('review-message').value.trim();
  const email   = document.getElementById('lawyer-email').value.trim();
  if (!message) { setError('Please add a message for the lawyers.'); return; }
  setError('');

  try {
    const res = await fetch(\`/contract/\${currentContractId}/legal-review\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lawyer_email: email || undefined }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error || 'Failed to send.'); return; }

    document.getElementById('email-preview').textContent = data.email_preview ?? '';
    show('step-reviewed');
  } catch (err) {
    setError('Network error: ' + err.message);
  }
}

async function submitAdjust() {
  const notes = document.getElementById('lawyer-notes').value.trim();
  if (!notes) { setError('Please add revision notes before submitting.'); return; }
  setError('');

  show('step-loading');
  startStepAnimation();

  try {
    const res = await fetch(\`/contract/\${currentContractId}/decision\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'ADJUST', lawyer_notes: notes }),
    });
    const data = await res.json();
    stopStepAnimation();

    if (!res.ok || data.error) {
      show('step-result');
      setError(data.error || 'Revision failed.');
      return;
    }

    await loadResult(currentContractId);
    document.getElementById('adjust-panel').classList.add('hidden');
    document.getElementById('lawyer-notes').value = '';
    show('step-result');

  } catch (err) {
    stopStepAnimation();
    show('step-result');
    setError('Network error: ' + err.message);
  }
}

async function approve() {
  try {
    await fetch(\`/contract/\${currentContractId}/decision\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'APPROVE' }),
    });
    show('step-signed');
  } catch (err) {
    setError('Error: ' + err.message);
  }
}

function reset() {
  currentContractId = null;
  currentState = null;
  document.getElementById('intent-input').value = '';
  document.getElementById('name-input').value = '';
  document.getElementById('review-contract-text').value = '';
  document.getElementById('review-name').value = '';
  document.getElementById('file-input').value = '';
  document.getElementById('file-status').classList.add('hidden');
  document.getElementById('adjust-panel').classList.add('hidden');
  document.getElementById('review-panel').classList.add('hidden');
  document.getElementById('draft-panel').classList.add('hidden');
  document.getElementById('redline-panel').classList.add('hidden');
  document.getElementById('redline-panel-wrapper').classList.add('hidden');
  document.getElementById('lawyer-notes').value = '';
  document.getElementById('review-message').value = '';
  document.getElementById('lawyer-email').value = '';
  parties = [
    { type: 'company', name: '', role: '', email: '', co_number: '', address: '' },
    { type: 'company', name: '', role: '', email: '', co_number: '', address: '' },
  ];
  renderParties();
  setError('');
  setMode('DRAFT');
  show('step-input');
}

// Initialise party form and mode on load
renderParties();
setMode('DRAFT');
</script>
</body>
</html>`;
}
