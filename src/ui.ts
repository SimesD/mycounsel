export function renderUI(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>MyCounsel — UK Legal Drafting</title>

  <!-- PWA -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0f1e35" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="MyCounsel" />
  <link rel="apple-touch-icon" href="/icons/icon-192.svg" />

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

  <!-- PWA Install Banner -->
  <div id="pwa-install-banner" class="hidden" style="background: var(--navy-light); border-bottom: 1px solid rgba(201,168,76,0.3);">
    <div class="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div style="background: var(--gold); color: var(--navy);" class="w-7 h-7 rounded flex items-center justify-center font-bold text-xs serif flex-shrink-0">M</div>
        <p class="text-xs text-slate-300">Install MyCounsel on your device for quick access — works offline too.</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button onclick="installPWA()" class="text-xs font-semibold px-3 py-1.5 rounded-lg" style="background: var(--gold); color: var(--navy);">Install</button>
        <button onclick="document.getElementById('pwa-install-banner').classList.add('hidden')" class="text-xs text-slate-400 px-2 py-1.5">&times;</button>
      </div>
    </div>
  </div>

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
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal Standing Report</span>
              <span id="result-ref" class="text-xs font-mono px-2 py-0.5 rounded" style="background:rgba(201,168,76,0.12);color:var(--gold)"></span>
              <button onclick="exportLegalStandingPdf()" class="text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ml-auto" style="border-color:var(--navy);color:var(--navy)" onmouseover="this.style.background='var(--navy)';this.style.color='#fff'" onmouseout="this.style.background='';this.style.color='var(--navy)'">&#8595; PDF</button>
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
              <span id="score-star" class="absolute -top-3 -right-2 text-xl hidden" title="Exceptional — 90+">⭐</span>
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

        <!-- Diminishing returns banner — shown when score >= 90 -->
        <div id="diminishing-returns-banner" class="hidden mb-4 rounded-xl px-4 py-3 text-xs flex items-start gap-3" style="background:rgba(22,163,74,0.07);border:1px solid rgba(22,163,74,0.25)">
          <span class="text-lg leading-none flex-shrink-0">⭐</span>
          <div>
            <div class="font-semibold text-green-800 mb-0.5">Exceptional draft — further AI revision has diminishing returns</div>
            <div class="text-green-700">At 90+/100 the contract is considered exceptional under English law. The remaining issues are low-impact drafting points. Further AI revision is unlikely to materially improve it and risks introducing regressions. Consider approving or sending for legal review instead.</div>
          </div>
        </div>

        <div class="flex gap-3 flex-wrap">
          <button
            id="btn-request-revision"
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

        <!-- Full report preview button -->
        <div class="mt-4 pt-4 border-t border-slate-100">
          <button
            onclick="downloadClosingReport()"
            class="w-full py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-2"
            style="border-color:#e2e8f0;color:#64748b"
            onmouseover="this.style.borderColor='var(--navy)';this.style.color='var(--navy)'"
            onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#64748b'"
          >
            &#128196; Preview Full Legal Report — statutory framework, verified case citations &amp; confidence assessment
          </button>
        </div>

        <!-- Revision panel -->
        <div id="adjust-panel" class="hidden mt-5 pt-5 border-t border-slate-100">
          <div class="text-sm font-medium text-slate-700 mb-1">Issues selected for this revision</div>
          <div id="adjust-selected-list" class="mb-4 space-y-1 text-xs text-slate-500 italic">Select issues above to include in the revision.</div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Additional notes for the Drafting Agent <span class="font-normal text-slate-400">(optional)</span></label>
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

    <!-- ── HIGH Risk Approval Modal ── -->
    <div id="high-risk-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5)">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 fade-in">
        <div class="flex items-start gap-4 mb-5">
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl" style="background:#fee2e2">&#9888;</div>
          <div>
            <h2 class="serif text-xl font-bold mb-1" style="color:#991b1b">Outstanding HIGH Risk Issues</h2>
            <p class="text-sm text-slate-500">Review carefully before approving this agreement.</p>
          </div>
        </div>

        <div class="rounded-xl p-4 mb-5 text-xs leading-relaxed" style="background:#fff5f5;border:1px solid #fecaca">
          <p class="font-semibold text-slate-800 mb-1">What does HIGH mean?</p>
          <p class="text-slate-600 mb-3">A HIGH impact issue could <strong>void or render unenforceable</strong> part or all of this agreement, or expose a party to <strong>serious litigation risk</strong>. These are not drafting refinements — they are material legal defects.</p>
          <p class="font-semibold text-slate-800 mb-1">What should you do?</p>
          <p class="text-slate-600">Where the AI can address the issue, use <strong>Request Revision</strong> to fix it first. Where the issue requires human action (e.g. filling in execution dates, obtaining signatures, or completing legal formalities), ensure this is done <strong>before the agreement is executed</strong>.</p>
        </div>

        <div class="mb-5">
          <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Unresolved HIGH Issues</div>
          <div id="high-risk-list" class="space-y-2"></div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-slate-100">
          <button onclick="document.getElementById('high-risk-modal').classList.add('hidden')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold border-2"
            style="border-color:var(--navy);color:var(--navy)">
            &#8592; Go Back &amp; Revise
          </button>
          <button onclick="confirmApproveWithHighRisks()"
            class="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            style="background:#dc2626">
            Approve Anyway &rarr;
          </button>
        </div>
      </div>
    </div>

    <!-- ── STEP 5: Signed ── -->
    <section id="step-signed" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-md p-8 border border-slate-100 mb-4">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl" style="background:rgba(22,163,74,0.1)">&#10003;</div>
          <div>
            <h2 class="serif text-2xl font-bold" style="color: var(--navy)">Agreement Approved</h2>
            <p class="text-sm text-slate-500 mt-0.5">In production this would be dispatched to all parties via Adobe Sign for electronic execution.</p>
          </div>
        </div>

        <!-- Closing report summary -->
        <div id="closing-report-loading" class="text-center py-8 text-sm text-slate-400">
          <div class="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2"></div>
          Generating closing report…
        </div>

        <div id="closing-report-content" class="hidden">
          <!-- Summary cards -->
          <div class="grid grid-cols-2 gap-3 mb-6" id="closing-summary-cards"></div>

          <!-- Statutory framework -->
          <div class="mb-5">
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Statutory Framework Applied</div>
            <div id="closing-statutes" class="space-y-1"></div>
          </div>

          <!-- Case law -->
          <div class="mb-5">
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Case Law &amp; Precedents</div>
            <div id="closing-cases" class="space-y-2"></div>
          </div>

          <!-- Risk summary -->
          <div class="mb-5">
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Risk Assessment Summary</div>
            <div id="closing-risk"></div>
          </div>

          <!-- Revision history -->
          <div id="closing-revisions-section" class="hidden mb-5">
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Revision History</div>
            <div id="closing-revisions"></div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-slate-100">
            <button onclick="downloadClosingReport()" class="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style="background: var(--navy)">
              &#8595; Download Closing Report PDF
            </button>
            <button onclick="reset()" class="flex-1 py-3 rounded-xl text-sm font-semibold border-2" style="border-color:var(--navy);color:var(--navy)">
              &#8592; Draft Another Agreement
            </button>
          </div>
        </div>
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

<script src="/app.js"></script>
</body>
</html>`;
}
