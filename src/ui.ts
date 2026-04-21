export function renderUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyCounsel — UK Legal Drafting</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

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
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      line-height: 1.7;
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
    <span class="text-xs text-slate-400">Governed by English Law · England &amp; Wales Jurisdiction</span>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-10">

    <!-- ── STEP 1: Input ── -->
    <section id="step-input" class="fade-in">
      <div class="text-center mb-8">
        <h1 class="serif text-4xl font-bold mb-3" style="color: var(--navy)">Draft a UK Commercial Agreement</h1>
        <p class="text-slate-500 text-sm max-w-lg mx-auto">Describe your transaction in plain English. Our agents will research applicable UK law, draft the agreement, and produce a Legal Standing Report.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-md p-8 border border-slate-100">
        <label class="block text-sm font-medium text-slate-700 mb-2">Describe the agreement</label>
        <textarea
          id="intent-input"
          rows="4"
          placeholder="e.g. Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% margin. 3-year term."
          class="w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 resize-none"
          style="focus-ring-color: var(--gold)"
        ></textarea>

        <div class="mt-4 flex items-center gap-3">
          <button
            id="btn-generate"
            onclick="startGeneration()"
            class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style="background: var(--navy); color: white;"
            onmouseover="this.style.background='var(--navy-light)'"
            onmouseout="this.style.background='var(--navy)'"
          >
            Generate Agreement &rarr;
          </button>
        </div>

        <p class="text-xs text-slate-400 mt-3 text-center">Takes ~60 seconds &middot; Powered by Gemini 1.5 Pro &middot; No data stored beyond your session</p>
      </div>

      <!-- Example prompts -->
      <div class="mt-6 grid grid-cols-1 gap-2">
        <p class="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Try an example</p>
        <button onclick="setExample(0)" class="text-left text-xs bg-white border border-slate-100 rounded-xl px-4 py-3 text-slate-600 hover:border-yellow-300 transition-colors shadow-sm">
          🥃 Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor maintains a minimum 30% margin. 3-year term.
        </button>
        <button onclick="setExample(1)" class="text-left text-xs bg-white border border-slate-100 rounded-xl px-4 py-3 text-slate-600 hover:border-yellow-300 transition-colors shadow-sm">
          💻 SaaS subscription agreement between TechCorp Ltd and Retail Solutions PLC for cloud-based inventory software. £24,000/year. 2-year initial term with auto-renewal.
        </button>
        <button onclick="setExample(2)" class="text-left text-xs bg-white border border-slate-100 rounded-xl px-4 py-3 text-slate-600 hover:border-yellow-300 transition-colors shadow-sm">
          🏢 Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14. 5-year term. £85 per sq ft per annum. Tenant break clause at year 3.
        </button>
      </div>
    </section>

    <!-- ── STEP 2: Loading ── -->
    <section id="step-loading" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-md p-10 border border-slate-100 text-center">
        <div class="serif text-2xl font-semibold mb-2" style="color: var(--navy)">Agents at work</div>
        <p class="text-sm text-slate-400 mb-10">Four specialist agents are researching and drafting your agreement</p>

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
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Legal Standing Report</div>
            <h2 class="serif text-2xl font-bold" style="color: var(--navy)" id="result-title">Agreement</h2>
            <p class="text-xs text-slate-400 mt-1" id="result-parties"></p>
          </div>
          <div class="flex flex-col items-center">
            <div id="score-circle" class="w-20 h-20 rounded-full flex items-center justify-center relative" style="background: conic-gradient(#c9a84c 0%, #e2e8f0 0%);">
              <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                <span id="score-number" class="serif text-xl font-bold" style="color: var(--navy)">—</span>
              </div>
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
          <div class="bg-slate-50 rounded-xl p-6 overflow-auto max-h-96">
            <pre id="draft-content" class="draft-content text-slate-700"></pre>
          </div>
        </div>
      </div>

      <!-- Decision -->
      <div class="bg-white rounded-2xl shadow-md p-8 border border-slate-100">
        <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Your Decision</div>
        <div class="flex gap-3 flex-wrap">
          <button
            onclick="showAdjust()"
            class="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style="border-color: var(--navy); color: var(--navy);"
          >
            &#8635; Request Revision
          </button>
          <button
            onclick="approve()"
            class="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style="background: var(--navy);"
          >
            &#10003; Approve &amp; Send for Signature
          </button>
        </div>

        <div id="adjust-panel" class="hidden mt-5">
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
      </div>

    </section>

    <!-- ── STEP 4: Signed ── -->
    <section id="step-signed" class="hidden fade-in">
      <div class="bg-white rounded-2xl shadow-md p-12 border border-slate-100 text-center">
        <div class="text-5xl mb-4">&#10003;</div>
        <h2 class="serif text-2xl font-bold mb-2" style="color: var(--navy)">Agreement Approved</h2>
        <p class="text-sm text-slate-500 mb-6">In production this would be dispatched to all parties via Adobe Sign for electronic execution.</p>
        <button onclick="reset()" class="text-sm font-medium" style="color: var(--gold)">&#8592; Draft another agreement</button>
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
  "Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% margin. 3-year term.",
  "SaaS subscription agreement between TechCorp Ltd and Retail Solutions PLC for cloud-based inventory software. £24,000/year. 2-year initial term with auto-renewal.",
  "Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14. 5-year term. £85 per sq ft per annum. Tenant break clause at year 3."
];

const PIPELINE_STEPS = [
  { label: "Intake & Entity Agent", sub: "Parsing instruction, resolving company data via Companies House", model: "Gemini 2.5 Flash" },
  { label: "Legal Researcher",      sub: "Identifying UK statutes, case law, and CMA guidance",           model: "Gemini 2.5 Flash + Search" },
  { label: "Drafting Architect",    sub: "Composing the full agreement under English law",                 model: "Gemini 2.5 Flash" },
  { label: "Risk & Standing Agent", sub: "Adversarial peer review — finding vulnerabilities",              model: "Gemini 2.5 Flash" },
];

let currentContractId = null;
let stepTimer = null;

function setExample(i) {
  document.getElementById('intent-input').value = EXAMPLES[i];
}

function show(id) {
  ['step-input','step-loading','step-result','step-signed'].forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
  document.getElementById(id).classList.add('fade-in');
}

function setError(msg) {
  const el = document.getElementById('error-bar');
  if (msg) { el.textContent = msg; el.classList.remove('hidden'); }
  else { el.classList.add('hidden'); }
}

// ── Pipeline loading animation ──────────────────────────────────────────────

function renderPipelineSteps(activeIdx) {
  const container = document.getElementById('pipeline-steps');
  container.innerHTML = PIPELINE_STEPS.map((step, i) => {
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
          <div class="text-xs mt-0.5 font-mono \${done ? 'text-green-500' : active ? '' : 'text-slate-300'}" style="\${active ? 'color:var(--gold)' : ''}">\${step.model}</div>
        </div>
      </div>
    \`;
  }).join('');
}

function startStepAnimation() {
  let idx = 0;
  renderPipelineSteps(idx);
  // Approximate timings: intake ~5s, research ~15s, draft ~20s, risk ~15s
  const durations = [5000, 15000, 20000, 15000];
  function advance() {
    idx++;
    if (idx < PIPELINE_STEPS.length) {
      renderPipelineSteps(idx);
      stepTimer = setTimeout(advance, durations[idx] || 15000);
    }
  }
  stepTimer = setTimeout(advance, durations[0]);
}

function stopStepAnimation() {
  if (stepTimer) clearTimeout(stepTimer);
  renderPipelineSteps(PIPELINE_STEPS.length); // all done
}

// ── Generate ─────────────────────────────────────────────────────────────────

async function startGeneration() {
  const intent = document.getElementById('intent-input').value.trim();
  if (!intent) { setError('Please describe the agreement you need.'); return; }
  setError('');

  show('step-loading');
  startStepAnimation();

  try {
    const res = await fetch('/contract/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, user_id: 'demo' }),
    });

    const data = await res.json();
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
  const report = state.risk_report;
  const draft  = state.draft_versions?.[state.draft_versions.length - 1];

  // Title & parties
  document.getElementById('result-title').textContent =
    state.inputs.intent.slice(0, 60) + (state.inputs.intent.length > 60 ? '…' : '');
  document.getElementById('result-parties').textContent =
    state.inputs.parties.map(p => \`\${p.name} (\${p.role})\`).join(' · ');

  // Score
  if (report) {
    const score = report.enforceability_score;
    const pct   = score;
    document.getElementById('score-circle').style.background =
      \`conic-gradient(\${score >= 75 ? '#c9a84c' : score >= 50 ? '#f59e0b' : '#ef4444'} \${pct}%, #e2e8f0 0%)\`;
    document.getElementById('score-number').textContent = score;
    document.getElementById('score-label').textContent  = scoreLabel(score);

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

  // Draft
  if (draft) {
    document.getElementById('draft-content').textContent = draft.content;
  }
}

function scoreLabel(s) {
  if (s >= 90) return 'Exceptional';
  if (s >= 75) return 'Good';
  if (s >= 60) return 'Notable Gaps';
  if (s >= 40) return 'Significant Weaknesses';
  return 'Do Not Execute';
}

// ── Draft toggle ──────────────────────────────────────────────────────────────

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

// ── Decision ──────────────────────────────────────────────────────────────────

function showAdjust() {
  document.getElementById('adjust-panel').classList.toggle('hidden');
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
  document.getElementById('intent-input').value = '';
  document.getElementById('adjust-panel').classList.add('hidden');
  document.getElementById('draft-panel').classList.add('hidden');
  setError('');
  show('step-input');
}
</script>
</body>
</html>`;
}
