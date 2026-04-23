const EXAMPLES = [
    {
        intent: "Exclusive distribution agreement for Tofka Vodka in England and Wales. Distributor must maintain a minimum 30% margin. 3-year term with auto-renewal.",
        parties: [
            {
                type: "company",
                name: "BABCO INTERNATIONAL LTD",
                role: "Supplier",
                email: "",
            },
            {
                type: "company",
                name: "Matthew Clark Wholesale Limited",
                role: "Distributor",
                email: "",
            },
        ],
    },
    {
        intent: "SaaS subscription for cloud-based inventory software. £24,000/year. 2-year initial term with auto-renewal.",
        parties: [
            {
                type: "company",
                name: "Sage Group PLC",
                role: "Service Provider",
                email: "",
            },
            { type: "company", name: "Tesco PLC", role: "Customer", email: "" },
        ],
    },
    {
        intent: "Commercial office lease for 2,500 sq ft at 1 Canada Square, London E14. 5-year term. £85 per sq ft per annum. Tenant break clause at year 3.",
        parties: [
            {
                type: "company",
                name: "Canary Wharf Group PLC",
                role: "Landlord",
                email: "",
            },
            {
                type: "company",
                name: "Clifford Chance LLP",
                role: "Tenant",
                email: "",
            },
        ],
    },
];

// ── Per-contract-type pipeline step definitions ───────────────────────────────

const STEP_INTAKE = {
    label: "Intake & Entity Resolution",
    sub: "Parsing your instruction · Verifying parties via Companies House",
    sources: "Companies House API · English law jurisdiction check",
};
const STEP_INTAKE_REVIEW = {
    label: "Intake & Classification",
    sub: "Identifying contract type · Extracting parties & terms",
    sources: "Companies House API · English law jurisdiction check",
};
const STEP_RISK = {
    label: "Risk & Standing Assessment",
    sub: "Adversarial peer review — identifying vulnerabilities",
    sources: "Misrepresentation Act 1967 · English law enforceability",
};

const CONTRACT_TYPE_STEPS = {
    DISTRIBUTION_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK competition law & distribution regulations",
            sources: "Competition Act 1998 · VABEO 2022 · CMA guidance",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the distribution agreement under English law",
            sources: "VABEO 2022 · Sale of Goods Act 1979 · UCTA 1977",
        },
        {
            ...STEP_RISK,
            sources: "Competition Act 1998 · VABEO 2022 · CMA guidance",
        },
    ],
    SUPPLY_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK supply chain & goods legislation",
            sources:
                "Sale of Goods Act 1979 · Supply of Goods and Services Act 1982",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the supply agreement under English law",
            sources: "SGA 1979 · SGSA 1982 · UCTA 1977 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources:
                "Sale of Goods Act 1979 · UCTA 1977 · Consumer Rights Act 2015",
        },
    ],
    EMPLOYMENT_CONTRACT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK employment law, rights & obligations",
            sources:
                "Employment Rights Act 1996 · Equality Act 2010 · HMRC guidance",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the employment contract under English law",
            sources:
                "ERA 1996 · National Minimum Wage Act 1998 · Working Time Regulations",
        },
        {
            ...STEP_RISK,
            sources:
                "Employment Rights Act 1996 · Equality Act 2010 · IR35 rules",
        },
    ],
    SAAS_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK data protection, SaaS & software law",
            sources: "UK GDPR · Computer Misuse Act 1990 · ICO guidance",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the SaaS agreement under English law",
            sources:
                "UK GDPR · UCTA 1977 · Consumer Rights Act 2015 · ICO standards",
        },
        {
            ...STEP_RISK,
            sources: "UK GDPR · Computer Misuse Act 1990 · UCTA 1977",
        },
    ],
    SOFTWARE_LICENCE: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK IP, copyright & software licensing law",
            sources: "Copyright, Designs and Patents Act 1988 · UK GDPR",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the software licence under English law",
            sources: "CDPA 1988 · UCTA 1977 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources: "CDPA 1988 · UCTA 1977 · Misrepresentation Act 1967",
        },
    ],
    COMMERCIAL_LEASE: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK landlord & tenant and property law",
            sources:
                "Landlord and Tenant Act 1954 · Land Registration Act 2002",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the commercial lease under English law",
            sources:
                "LTA 1954 · LPA 1925 · RICS Code for Leasing · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources:
                "Landlord and Tenant Act 1954 · LPA 1925 · Limitation Act 1980",
        },
    ],
    IP_LICENCE: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK intellectual property & licensing law",
            sources: "Patents Act 1977 · Trade Marks Act 1994 · CDPA 1988",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the IP licence under English law",
            sources: "Patents Act 1977 · CDPA 1988 · Trade Marks Act 1994",
        },
        {
            ...STEP_RISK,
            sources: "Patents Act 1977 · CDPA 1988 · Competition Act 1998",
        },
    ],
    SERVICES_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK services, supply & consumer law",
            sources:
                "Supply of Goods and Services Act 1982 · Consumer Rights Act 2015",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the services agreement under English law",
            sources: "SGSA 1982 · UCTA 1977 · Consumer Rights Act 2015",
        },
        {
            ...STEP_RISK,
            sources: "SGSA 1982 · UCTA 1977 · Misrepresentation Act 1967",
        },
    ],
    NDA: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK confidentiality & trade secrets law",
            sources:
                "Trade Secrets Regulations 2018 · Coco v AN Clark · UK case law",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the non-disclosure agreement under English law",
            sources:
                "Trade Secrets (Enforcement) Regs 2018 · UCTA 1977 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources:
                "Trade Secrets Regulations 2018 · Misrepresentation Act 1967",
        },
    ],
    SHARE_PURCHASE_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK company, M&A & financial services law",
            sources:
                "Companies Act 2006 · Financial Services and Markets Act 2000",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the share purchase agreement under English law",
            sources: "Companies Act 2006 · FSMA 2000 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources: "Companies Act 2006 · FSMA 2000 · CMA merger guidance",
        },
    ],
    LOAN_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK lending, credit & financial services law",
            sources:
                "Financial Services and Markets Act 2000 · Consumer Credit Act 1974",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the loan agreement under English law",
            sources: "FSMA 2000 · Consumer Credit Act 1974 · LPA 1925",
        },
        {
            ...STEP_RISK,
            sources:
                "FSMA 2000 · Consumer Credit Act 1974 · Limitation Act 1980",
        },
    ],
    FRANCHISE_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK franchise, competition & IP law",
            sources:
                "Competition Act 1998 · BFA Code of Ethics · Trade Marks Act 1994",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the franchise agreement under English law",
            sources: "Competition Act 1998 · UCTA 1977 · BFA standards",
        },
        {
            ...STEP_RISK,
            sources: "Competition Act 1998 · Trade Marks Act 1994 · UCTA 1977",
        },
    ],
    JV_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK joint venture, company & competition law",
            sources:
                "Companies Act 2006 · Competition Act 1998 · Partnership Act 1890",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the joint venture agreement under English law",
            sources: "Companies Act 2006 · Partnership Act 1890 · UCTA 1977",
        },
        {
            ...STEP_RISK,
            sources: "Competition Act 1998 · Companies Act 2006 · CMA guidance",
        },
    ],
    CONSTRUCTION_CONTRACT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK construction, adjudication & payment law",
            sources:
                "Housing Grants, Construction & Regeneration Act 1996 · JCT",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the construction contract under English law",
            sources: "HGCRA 1996 · JCT Standards · Limitation Act 1980",
        },
        {
            ...STEP_RISK,
            sources:
                "HGCRA 1996 · Defective Premises Act 1972 · Limitation Act 1980",
        },
    ],
    AGENCY_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK commercial agents & competition law",
            sources:
                "Commercial Agents Regulations 1993 · Competition Act 1998",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the agency agreement under English law",
            sources:
                "Commercial Agents Regs 1993 · UCTA 1977 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources:
                "Commercial Agents Regulations 1993 · Competition Act 1998",
        },
    ],
    CONSULTANCY_AGREEMENT: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching UK consultancy, IR35 & employment status law",
            sources: "IR35 · Employment Rights Act 1996 · SGSA 1982",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the consultancy agreement under English law",
            sources: "SGSA 1982 · UCTA 1977 · IR35 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources: "IR35 · Employment Rights Act 1996 · UCTA 1977",
        },
    ],
    OTHER: [
        STEP_INTAKE,
        {
            label: "Legal Research",
            sub: "Searching applicable UK statutes and case law",
            sources:
                "legislation.gov.uk · UK case law · English law principles",
        },
        {
            label: "Contract Drafting",
            sub: "Composing the agreement under English law",
            sources:
                "UCTA 1977 · Misrepresentation Act 1967 · UK drafting standards",
        },
        {
            ...STEP_RISK,
            sources:
                "UCTA 1977 · Misrepresentation Act 1967 · English law enforceability",
        },
    ],
};

// Keyword map for client-side contract type detection from intent text
const CONTRACT_TYPE_KEYWORDS = [
    {
        type: "NDA",
        words: [
            "nda",
            "non-disclosure",
            "confidential",
            "confidentiality",
            "secret",
            "proprietary information",
        ],
    },
    {
        type: "EMPLOYMENT_CONTRACT",
        words: [
            "employment",
            "employ",
            "employee",
            "salary",
            "redundancy",
            "dismissal",
            "maternity",
            "paternity",
            "hr",
            "staff",
            "worker",
        ],
    },
    {
        type: "CONSULTANCY_AGREEMENT",
        words: [
            "consultancy",
            "consulting",
            "consultant",
            "freelance",
            "contractor",
            "ir35",
            "self-employed",
        ],
    },
    {
        type: "DISTRIBUTION_AGREEMENT",
        words: [
            "distribution",
            "distributor",
            "reseller",
            "wholesale",
            "exclusive distribution",
            "territory",
        ],
    },
    {
        type: "SUPPLY_AGREEMENT",
        words: [
            "supply",
            "supplier",
            "goods",
            "purchase order",
            "procurement",
            "vendor",
        ],
    },
    {
        type: "SAAS_AGREEMENT",
        words: [
            "saas",
            "software as a service",
            "subscription",
            "cloud",
            "platform",
            "api access",
            "hosted service",
        ],
    },
    {
        type: "SOFTWARE_LICENCE",
        words: [
            "software licence",
            "software license",
            "source code",
            "binary",
            "end user licence",
            "eula",
        ],
    },
    {
        type: "IP_LICENCE",
        words: [
            "ip licence",
            "ip license",
            "intellectual property licence",
            "patent licence",
            "trademark licence",
            "royalt",
        ],
    },
    {
        type: "COMMERCIAL_LEASE",
        words: [
            "lease",
            "leasehold",
            "landlord",
            "tenant",
            "rent",
            "premises",
            "demise",
            "commercial property",
        ],
    },
    {
        type: "SHARE_PURCHASE_AGREEMENT",
        words: [
            "share purchase",
            "acquisition",
            "buyout",
            "shares",
            "equity",
            "m&a",
            "merger",
            "target company",
        ],
    },
    {
        type: "LOAN_AGREEMENT",
        words: [
            "loan",
            "lending",
            "borrow",
            "credit facility",
            "interest rate",
            "repayment",
            "debt",
        ],
    },
    {
        type: "FRANCHISE_AGREEMENT",
        words: ["franchise", "franchisee", "franchisor", "brand licence"],
    },
    {
        type: "JV_AGREEMENT",
        words: [
            "joint venture",
            "jv agreement",
            "jv company",
            "jointly",
            "co-venture",
        ],
    },
    {
        type: "CONSTRUCTION_CONTRACT",
        words: [
            "construction",
            "building contract",
            "contractor",
            "subcontractor",
            "jct",
            "nec",
            "works",
            "site",
        ],
    },
    {
        type: "AGENCY_AGREEMENT",
        words: [
            "agency",
            "agent",
            "commission",
            "principal",
            "commercial agent",
        ],
    },
    {
        type: "SERVICES_AGREEMENT",
        words: [
            "services agreement",
            "service agreement",
            "managed service",
            "outsource",
            "statement of work",
            "sow",
        ],
    },
];

function detectContractType(intent) {
    const lower = (intent || "").toLowerCase();
    for (const { type, words } of CONTRACT_TYPE_KEYWORDS) {
        if (words.some((w) => lower.includes(w))) return type;
    }
    return "OTHER";
}

function getPipelineSteps(intent) {
    const type = detectContractType(intent);
    return CONTRACT_TYPE_STEPS[type] || CONTRACT_TYPE_STEPS["OTHER"];
}

const PIPELINE_STEPS = CONTRACT_TYPE_STEPS["OTHER"];

let currentContractId = null;
let currentState = null;
let stepTimer = null;
let currentMode = "DRAFT";

const PIPELINE_STEPS_REVIEW = [
    STEP_INTAKE_REVIEW,
    {
        label: "Legal Research",
        sub: "Searching applicable UK statutes and case law",
        sources: "legislation.gov.uk · UK case law · English law principles",
    },
    {
        label: "Contract Review",
        sub: "Analysing and improving the submitted contract",
        sources:
            "UCTA 1977 · Misrepresentation Act 1967 · UK drafting standards",
    },
    {
        ...STEP_RISK,
        sources:
            "UCTA 1977 · Misrepresentation Act 1967 · English law enforceability",
    },
];

function setMode(mode) {
    currentMode = mode;
    const isDraft = mode === "DRAFT";

    document
        .getElementById("draft-input-section")
        .classList.toggle("hidden", !isDraft);
    document
        .getElementById("review-input-section")
        .classList.toggle("hidden", isDraft);

    const draftBtn = document.getElementById("mode-btn-draft");
    const reviewBtn = document.getElementById("mode-btn-review");
    draftBtn.style.background = isDraft ? "var(--navy)" : "#fff";
    draftBtn.style.color = isDraft ? "#fff" : "#64748b";
    reviewBtn.style.background = !isDraft ? "var(--navy)" : "#fff";
    reviewBtn.style.color = !isDraft ? "#fff" : "#64748b";

    document.getElementById("btn-generate-label").textContent = isDraft
        ? "Generate Agreement \u2192"
        : "Review Contract \u2192";

    document.getElementById("page-title").textContent = isDraft
        ? "Draft a UK Commercial Agreement"
        : "Review an Existing Contract";

    document.getElementById("page-subtitle").textContent = isDraft
        ? "Add the parties, describe your transaction, and our agents will research UK law, draft the agreement, and produce a Legal Standing Report."
        : "Paste any contract below. Our agents will classify it, research the applicable UK law, improve it, and produce a redlined version with a Legal Standing Report.";

    document.getElementById("form-hint").textContent = isDraft
        ? "Takes ~60 seconds \u00b7 Checks legislation.gov.uk & Companies House \u00b7 English law only"
        : "Takes ~60 seconds \u00b7 Classifies contract type \u00b7 Produces redline under English law";
}

// ── Party form state ──────────────────────────────────────────────────────────

let parties = [
    {
        type: "company",
        name: "",
        role: "",
        email: "",
        co_number: "",
        address: "",
    },
    {
        type: "company",
        name: "",
        role: "",
        email: "",
        co_number: "",
        address: "",
    },
];
let chTimers = {};
let chSearchResults = {};

function addParty() {
    parties.push({
        type: "company",
        name: "",
        role: "",
        email: "",
        co_number: "",
        address: "",
    });
    renderParties();
}

function removeParty(idx) {
    if (parties.length <= 1) return;
    parties.splice(idx, 1);
    renderParties();
}

function setPartyType(idx, type) {
    parties[idx].type = type;
    parties[idx].co_number = "";
    parties[idx].address = "";
    renderParties();
}

function renderParties() {
    const list = document.getElementById("parties-list");
    list.innerHTML = parties
        .map(
            (p, idx) => `
    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3" id="party-row-${idx}">
      <div class="flex items-center justify-between">
        <div class="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
          <button onclick="setPartyType(${idx},'company')"
            class="px-3 py-1.5 transition-colors ${p.type === "company" ? "text-white" : "bg-white text-slate-500"}"
            style="${p.type === "company" ? "background:var(--navy)" : ""}">Company</button>
          <button onclick="setPartyType(${idx},'individual')"
            class="px-3 py-1.5 transition-colors ${p.type === "individual" ? "text-white" : "bg-white text-slate-500"}"
            style="${p.type === "individual" ? "background:var(--navy)" : ""}">Individual</button>
        </div>
        ${parties.length > 1 ? `<button onclick="removeParty(${idx})" class="text-slate-300 hover:text-red-400 text-lg leading-none px-1">&times;</button>` : ""}
      </div>

      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            type="text"
            value="${p.name}"
            placeholder="${p.type === "company" ? "Company name" : "Full name"}"
            oninput="onPartyNameInput(${idx}, this.value)"
            onfocus="onPartyNameFocus(${idx}, this.value)"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1"
            style="focus-ring-color:var(--gold)"
            autocomplete="off"
          />
          <div id="ch-dropdown-${idx}" class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 hidden overflow-hidden"></div>
        </div>
        <input
          type="text"
          value="${p.role}"
          placeholder="Role (e.g. Supplier)"
          oninput="parties[${idx}].role=this.value"
          class="w-36 rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1"
        />
      </div>

      <input
        type="email"
        value="${p.email}"
        placeholder="Email address (optional)"
        oninput="parties[${idx}].email=this.value"
        class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1"
      />

      ${
          p.co_number
              ? `
        <div class="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3)">
          <span style="color:var(--gold)" class="mt-0.5">&#10003;</span>
          <div>
            <div class="font-semibold text-slate-700">${p.name}</div>
            <div class="text-slate-500">Companies House: ${p.co_number} &middot; ${p.address}</div>
          </div>
        </div>
      `
              : ""
      }
      ${
          p.type === "company" && p.name.trim() && !p.co_number
              ? `
        <div class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2)">
          <span style="color:#ef4444">&#9888;</span>
          <div class="text-slate-500">Not verified with Companies House — select from the dropdown to confirm the correct entity, or continue if this is an individual or overseas company.</div>
        </div>
      `
              : ""
      }
    </div>
  `,
        )
        .join("");
}

function onPartyNameInput(idx, value) {
    parties[idx].name = value;
    parties[idx].co_number = "";
    parties[idx].address = "";

    if (parties[idx].type !== "company") return;
    clearTimeout(chTimers[idx]);
    const dropdown = document.getElementById(`ch-dropdown-${idx}`);
    if (value.length < 2) {
        dropdown.classList.add("hidden");
        return;
    }

    chTimers[idx] = setTimeout(() => runCHSearch(idx, value), 380);
}

async function runCHSearch(idx, value) {
    const dropdown = document.getElementById(`ch-dropdown-${idx}`);
    if (!dropdown) return;
    if (!value || value.length < 2) {
        dropdown.classList.add("hidden");
        return;
    }
    try {
        const res = await fetch(
            `/companies-house/search?q=${encodeURIComponent(value)}`,
        );
        const data = await res.json();
        chSearchResults[idx] = data.items;

        if (!data.items?.length) {
            dropdown.innerHTML = `<div class="px-4 py-3 text-xs text-slate-400">No companies found for "${value}"</div>`;
            dropdown.classList.remove("hidden");
            return;
        }
        dropdown.innerHTML = data.items
            .map(
                (item, i) => `
      <button
        onclick="selectCHResult(${idx}, ${i})"
        class="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 transition-colors ${i > 0 ? "border-t border-slate-100" : ""}"
      >
        <div class="font-semibold text-slate-800">${item.title}</div>
        <div class="text-slate-400 mt-0.5">${item.company_number} &middot; ${item.company_status} &middot; ${item.address}</div>
      </button>
    `,
            )
            .join("");
        dropdown.classList.remove("hidden");
    } catch (e) {
        console.error("CH search error:", e);
    }
}

function onPartyNameFocus(idx, value) {
    if (parties[idx].type !== "company") return;
    if (parties[idx].co_number) return; // already verified
    if (value && value.length >= 2) runCHSearch(idx, value);
}

function selectCHResult(idx, itemIdx) {
    const item = chSearchResults[idx][itemIdx];
    parties[idx].name = item.title;
    parties[idx].co_number = item.company_number;
    parties[idx].address = item.address;
    document.getElementById(`ch-dropdown-${idx}`).classList.add("hidden");
    renderParties();
}

// Close CH dropdowns when clicking outside
document.addEventListener("click", (e) => {
    document.querySelectorAll('[id^="ch-dropdown-"]').forEach((d) => {
        if (!d.parentElement?.contains(e.target)) d.classList.add("hidden");
    });
});

async function setExample(i) {
    const ex = EXAMPLES[i];
    document.getElementById("intent-input").value = ex.intent;
    parties = ex.parties.map((p) => ({ ...p, co_number: "", address: "" }));
    renderParties();

    // Auto-verify company parties in the background
    await Promise.all(
        parties.map(async (p, idx) => {
            if (p.type !== "company" || !p.name.trim()) return;
            try {
                const res = await fetch(
                    `/companies-house/search?q=${encodeURIComponent(p.name)}`,
                );
                const data = await res.json();
                if (!data.items?.length) return;
                // Pick the result whose title matches exactly, or fall back to first result
                const match =
                    data.items.find(
                        (r) => r.title.toLowerCase() === p.name.toLowerCase(),
                    ) ?? data.items[0];
                parties[idx].name = match.title;
                parties[idx].co_number = match.company_number;
                parties[idx].address = match.address;
            } catch {}
        }),
    );

    renderParties();
}

function show(id) {
    [
        "step-input",
        "step-loading",
        "step-result",
        "step-reviewed",
        "step-signed",
        "step-history",
    ].forEach((s) => {
        document.getElementById(s).classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
    document.getElementById(id).classList.add("fade-in");
}

async function showHistory() {
    show("step-history");
    const list = document.getElementById("history-list");
    try {
        const res = await fetch("/contracts?user_id=demo");
        const data = await res.json();
        if (!data.contracts?.length) {
            list.innerHTML =
                '<p class="text-sm text-slate-400 text-center py-8">No agreements yet. Draft your first one above.</p>';
            return;
        }
        const STATUS_LABEL = {
            INTAKE: "Intake",
            RESEARCH: "Researching",
            DRAFTING: "Drafting",
            RISK_ASSESSMENT: "Risk Review",
            LAWYER_REVIEW: "Ready for Review",
            SENT_FOR_REVIEW: "Sent for Review",
            SIGNING: "Signed",
        };
        const STATUS_COLOR = {
            INTAKE: "#94a3b8",
            RESEARCH: "#f59e0b",
            DRAFTING: "#f59e0b",
            RISK_ASSESSMENT: "#f59e0b",
            LAWYER_REVIEW: "#16a34a",
            SENT_FOR_REVIEW: "#c9a84c",
            SIGNING: "#16a34a",
        };
        list.innerHTML = data.contracts
            .map(
                (c) => `
      <div class="flex items-center gap-2">
        <button onclick="openContract('${c.id}')" class="flex-1 min-w-0 text-left bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-4 hover:border-yellow-300 transition-colors">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-800 truncate">${c.name || "(Untitled)"}</div>
              <div class="text-xs text-slate-400 mt-0.5">${c.ref || "—"} &middot; ${new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style="background:${STATUS_COLOR[c.status] ?? "#94a3b8"}20;color:${STATUS_COLOR[c.status] ?? "#94a3b8"}">
              ${STATUS_LABEL[c.status] ?? c.status}
            </span>
          </div>
        </button>
        <button
          onclick="deleteContract('${c.id}')"
          title="Delete"
          class="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-300 hover:text-red-400 hover:border-red-200 transition-colors shadow-sm"
        >&#128465;</button>
      </div>
    `,
            )
            .join("");
    } catch {
        list.innerHTML =
            '<p class="text-sm text-red-400 text-center py-8">Failed to load agreements.</p>';
    }
}

async function deleteContract(id) {
    if (!confirm("Delete this agreement? This cannot be undone.")) return;
    try {
        const res = await fetch(`/contract/${id}`, { method: "DELETE" });
        if (!res.ok) {
            alert("Failed to delete.");
            return;
        }
        showHistory();
    } catch {
        alert("Network error — could not delete.");
    }
}

async function openContract(id) {
    currentContractId = id;
    show("step-loading");
    startStepAnimation();
    await loadResult(id);
    stopStepAnimation();
    show("step-result");
}

function showPanel(id) {
    ["adjust-panel", "review-panel"].forEach((p) => {
        const el = document.getElementById(p);
        if (p === id) {
            el.classList.toggle("hidden");
        } else {
            el.classList.add("hidden");
        }
    });
    if (id === "adjust-panel") updateAdjustPanel();
}

function setError(msg) {
    const el = document.getElementById("error-bar");
    if (msg) {
        el.textContent = msg;
        el.classList.remove("hidden");
    } else {
        el.classList.add("hidden");
    }
}

// ── Pipeline loading animation ──────────────────────────────────────────────

function renderPipelineSteps(activeIdx, steps) {
    steps = steps || PIPELINE_STEPS;
    const container = document.getElementById("pipeline-steps");
    container.innerHTML = steps
        .map((step, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
            const pending = i > activeIdx;

            const icon = done
                ? `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style="background:#16a34a">✓</div>`
                : active
                  ? `<div class="w-8 h-8 rounded-full flex items-center justify-center pulse-dot" style="background:var(--gold)"><span class="w-3 h-3 bg-white rounded-full inline-block"></span></div>`
                  : `<div class="w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-200 text-slate-300 text-sm">${i + 1}</div>`;

            return `
      <div class="flex items-start gap-4">
        ${icon}
        <div class="flex-1 pt-1">
          <div class="text-sm font-semibold ${pending ? "text-slate-300" : "text-slate-800"}">${step.label}</div>
          <div class="text-xs ${pending ? "text-slate-300" : "text-slate-400"} mt-0.5">${step.sub}</div>
          <div class="text-xs mt-0.5 ${done ? "text-green-600" : active ? "" : "text-slate-300"}" style="${active ? "color:var(--gold)" : ""}">${step.sources}</div>
        </div>
      </div>
    `;
        })
        .join("");
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
        return { error: text.slice(0, 200) || `Server error ${res.status}` };
    }
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// Map server-side ContractStatus to an active step index relative to the
// steps array being displayed.  Works for both the full 4-step pipeline and
// the 2-step revision pipeline.
//
// Full pipeline (4 steps):
//   INTAKE        → step 0 active  (intake running)
//   RESEARCH      → step 1 active  (intake done, research running)
//   DRAFTING      → step 2 active  (research done, drafting running)
//   RISK_ASSESSMENT → step 3 active (drafting done, risk running)
//   LAWYER_REVIEW → 999            (all done)
//
// Revision pipeline (2 steps: drafting + risk):
//   DRAFTING        → step 0 active
//   RISK_ASSESSMENT → step 1 active
//   LAWYER_REVIEW   → 999
//
// Review pipeline (4 steps: same as full pipeline)
function statusToStepIndex(status, steps) {
    const n = (steps || PIPELINE_STEPS).length;
    if (n === 2) {
        // Revision: only drafting + risk
        if (status === "DRAFTING") return 0;
        if (status === "RISK_ASSESSMENT") return 1;
        if (
            status === "LAWYER_REVIEW" ||
            status === "SIGNING" ||
            status === "SENT_FOR_REVIEW"
        )
            return 999;
        return 0; // INTAKE / RESEARCH shouldn't appear but default to 0
    }
    // Full / review pipeline (4 steps)
    const map = { INTAKE: 0, RESEARCH: 1, DRAFTING: 2, RISK_ASSESSMENT: 3 };
    if (status in map) return map[status];
    return 999; // LAWYER_REVIEW / terminal
}

async function pollUntilComplete(id, steps) {
    const TERMINAL = ["LAWYER_REVIEW", "SIGNING", "SENT_FOR_REVIEW"];
    let attempts = 0;
    let lastStep = -1;

    while (attempts < 160) {
        await sleep(3000);
        attempts++;
        try {
            const res = await fetch("/contract/" + id);
            if (!res.ok) continue;
            const state = await res.json();

            if (state.errors && state.errors.length > 0) {
                stopStepAnimation();
                show("step-input");
                setError(state.errors[state.errors.length - 1]);
                return false;
            }

            // Drive the step animation from actual server status
            const activeSteps = steps || PIPELINE_STEPS;
            const stepIdx = statusToStepIndex(state.status, activeSteps);
            if (stepIdx !== lastStep) {
                lastStep = stepIdx;
                if (stepTimer) clearTimeout(stepTimer);
                renderPipelineSteps(stepIdx, activeSteps);
            }

            if (TERMINAL.includes(state.status)) {
                return true;
            }
        } catch (e) {
            /* retry */
        }
    }
    stopStepAnimation();
    show("step-input");
    setError(
        "Timed out waiting for pipeline to complete. The AI model may be under load — please try again in a moment.",
    );
    return false;
}

// ── Generate ─────────────────────────────────────────────────────────────────

async function generateReview() {
    const original_contract = document
        .getElementById("review-contract-text")
        .value.trim();
    const name = document.getElementById("review-name").value.trim();
    if (original_contract.length < 100) {
        setError("Please paste a contract of at least 100 characters.");
        return;
    }
    setError("");

    document.getElementById("processing-subtitle").textContent =
        "Four specialist agents are reviewing and improving your contract";
    show("step-loading");
    startStepAnimation(PIPELINE_STEPS_REVIEW);

    try {
        const res = await fetch("/contract/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                original_contract,
                name: name || undefined,
                user_id: "demo",
            }),
        });
        const data = await safeJson(res);

        if (!res.ok || data.error) {
            stopStepAnimation();
            show("step-input");
            setError(data.error || "Review failed. Please try again.");
            return;
        }

        currentContractId = data.id;
        const complete = await pollUntilComplete(
            currentContractId,
            PIPELINE_STEPS_REVIEW,
        );
        if (complete) {
            stopStepAnimation();
            await loadResult(currentContractId);
            show("step-result");
        }
    } catch (err) {
        stopStepAnimation();
        show("step-input");
        setError("Network error: " + err.message);
    }
}

async function startGeneration() {
    const intent = document.getElementById("intent-input").value.trim();
    const name = document.getElementById("name-input").value.trim();
    if (!intent) {
        setError("Please describe the agreement you need.");
        return;
    }
    setError("");

    const unverified = parties.filter(
        (p) =>
            p.type === "company" &&
            p.name.trim() &&
            p.role.trim() &&
            !p.co_number,
    );
    if (unverified.length > 0) {
        const names = unverified.map((p) => p.name).join(", ");
        const proceed = confirm(
            `The following ${unverified.length === 1 ? "company has" : "companies have"} not been verified with Companies House:\n\n${names}\n\nThe agreement will be drafted without registered address details. Continue anyway?`,
        );
        if (!proceed) return;
    }

    document.getElementById("processing-subtitle").textContent =
        "Four specialist agents are researching and drafting your agreement";
    show("step-loading");
    startStepAnimation(getPipelineSteps(intent));

    // Collect only parties that have at least a name and role
    const validParties = parties
        .filter((p) => p.name.trim() && p.role.trim())
        .map((p) => ({
            name: p.name.trim(),
            role: p.role.trim(),
            ...(p.email ? { email: p.email.trim() } : {}),
            ...(p.co_number ? { co_number: p.co_number } : {}),
            ...(p.address ? { address: p.address } : {}),
        }));

    try {
        const res = await fetch("/contract/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                intent,
                name: name || undefined,
                user_id: "demo",
                parties: validParties,
            }),
        });

        const data = await safeJson(res);

        if (!res.ok || data.error) {
            stopStepAnimation();
            show("step-input");
            setError(data.error || "Something went wrong. Please try again.");
            return;
        }

        currentContractId = data.id;
        const complete = await pollUntilComplete(
            currentContractId,
            getPipelineSteps(intent),
        );
        if (complete) {
            stopStepAnimation();
            await loadResult(currentContractId);
            show("step-result");
        }
    } catch (err) {
        stopStepAnimation();
        show("step-input");
        setError("Network error: " + err.message);
    }
}

// ── Load & render result ──────────────────────────────────────────────────────

async function loadResult(id) {
    const res = await fetch(`/contract/${id}`);
    const state = await res.json();
    currentState = state;
    const report = state.risk_report;
    const draft = state.draft_versions?.[state.draft_versions.length - 1];

    // Title, ref & parties
    document.getElementById("result-ref").textContent = state.ref || "";
    document.getElementById("result-title").textContent =
        state.name || state.inputs.intent.slice(0, 60);
    document.getElementById("result-parties").textContent = state.inputs.parties
        .map((p) => `${p.name} (${p.role})`)
        .join(" · ");

    // Score
    if (report) {
        const score = report.enforceability_score;
        const pct = score;
        const color = scoreColor(score);
        document.getElementById("score-circle").style.background =
            `conic-gradient(${color} ${pct}%, #e2e8f0 0%)`;
        document.getElementById("score-number").textContent = score;
        document.getElementById("score-number").style.color = color;
        document.getElementById("score-label").textContent = scoreLabel(score);
        document
            .getElementById("score-star")
            .classList.toggle("hidden", score < 90);

        const advice = document.getElementById("score-advice");
        if (score >= 90) {
            advice.innerHTML = `<span style="color:#c9a84c">&#11088; Score ${score}/100 — exceptional draft. You may approve with confidence.</span>`;
        } else if (score >= 82) {
            // Show/hide diminishing returns banner and soften revision button
            const banner = document.getElementById(
                "diminishing-returns-banner",
            );
            const revBtn = document.getElementById("btn-request-revision");
            if (score >= 90) {
                if (banner) banner.classList.remove("hidden");
                if (revBtn) {
                    revBtn.style.borderColor = "#94a3b8";
                    revBtn.style.color = "#94a3b8";
                    revBtn.title =
                        "Score is 90+ — further revision has diminishing returns";
                }
            } else {
                if (banner) banner.classList.add("hidden");
                if (revBtn) {
                    revBtn.style.borderColor = "var(--navy)";
                    revBtn.style.color = "var(--navy)";
                    revBtn.title = "";
                }
            }

            if (score >= 90) {
                advice.innerHTML = `<span style="color:#16a34a">&#10003; Score ${score}/100 — exceptional draft. Approve or send for legal review.</span>`;
            } else if (score >= 75) {
                advice.innerHTML = `<span style="color:#16a34a">&#10003; Score ${score}/100 — the draft is considered sound. You may approve or request further refinement.</span>`;
            } else if (score >= 60) {
                advice.innerHTML = `<span style="color:#b45309">&#9888; Score ${score}/100 — consider requesting a revision to address the vulnerabilities above before approving.</span>`;
            } else if (score >= 40) {
                advice.innerHTML = `<span style="color:#ea580c">&#9888; Score ${score}/100 — significant weaknesses remain. Request a revision before approving.</span>`;
            } else {
                advice.innerHTML = `<span style="color:#dc2626">&#10007; Score ${score}/100 — do not execute. Fundamental defects require a full revision.</span>`;
            }
        }

        // Warnings — sorted HIGH first, with impact badge and checkbox
        const IMPACT_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        const IMPACT_STYLE = {
            HIGH: {
                bg: "bg-red-50",
                border: "border-l-red-500",
                badge: "background:#fee2e2;color:#991b1b",
                label: "HIGH",
            },
            MEDIUM: {
                bg: "bg-amber-50",
                border: "border-l-amber-400",
                badge: "background:#fef3c7;color:#92400e",
                label: "MEDIUM",
            },
            LOW: {
                bg: "bg-slate-50",
                border: "border-l-slate-300",
                badge: "background:#f1f5f9;color:#475569",
                label: "LOW",
            },
        };
        const sorted = (report.warnings || [])
            .map((w, i) => ({ ...w, _idx: i }))
            .sort(
                (a, b) =>
                    (IMPACT_ORDER[a.impact] ?? 1) -
                    (IMPACT_ORDER[b.impact] ?? 1),
            );

        const container = document.getElementById("warnings-container");
        container.innerHTML = sorted
            .map((w) => {
                const s = IMPACT_STYLE[w.impact] || IMPACT_STYLE.MEDIUM;
                const checked = w.impact !== "LOW" ? "checked" : "";
                return `
      <div class="warning-card rounded-lg p-4 ${s.bg} border-l-4 ${s.border}">
        <div class="flex items-start gap-3">
          <input type="checkbox" id="warn-${w._idx}" data-warn-idx="${w._idx}" ${checked}
            class="mt-0.5 h-4 w-4 rounded border-slate-300 flex-shrink-0 cursor-pointer"
            style="accent-color: var(--navy)"
            onchange="updateAdjustPanel()" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-xs font-bold px-2 py-0.5 rounded" style="${s.badge}">${s.label}</span>
              <span class="text-sm font-semibold text-slate-800">${w.title}</span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">${w.detail}</p>
            <div class="mt-2 text-xs font-mono rounded px-2 py-1 inline-block" style="background:#f1f5f9;color:#475569">${w.statutory_basis}</div>
          </div>
        </div>
      </div>
      `;
            })
            .join("");

        if (report.recommendation) {
            document.getElementById("recommendation-text").textContent =
                report.recommendation;
            document
                .getElementById("recommendation-block")
                .classList.remove("hidden");
        }
    }

    // Contract type badge
    const typeEl = document.getElementById("result-contract-type");
    if (state.contract_type && state.contract_type !== "OTHER") {
        typeEl.textContent = state.contract_type.replace(/_/g, " ");
        typeEl.classList.remove("hidden");
    } else {
        typeEl.classList.add("hidden");
    }

    // Draft
    if (draft) {
        document.getElementById("draft-content").textContent = draft.content;
        document.getElementById("draft-version-badge").textContent =
            "Version " +
            draft.version +
            "  \u00b7  " +
            new Date(draft.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }) +
            "  \u00b7  " +
            draft.author;
    }

    // Redline (review mode only)
    const redlineWrapper = document.getElementById("redline-panel-wrapper");
    if (state.mode === "REVIEW" && state.original_contract && draft) {
        redlineWrapper.classList.remove("hidden");
        renderRedline(state.original_contract, draft.content);
    } else {
        redlineWrapper.classList.add("hidden");
    }
}

function scoreColor(s) {
    if (s >= 90) return "#c9a84c"; // gold — exceptional (star territory)
    if (s >= 82) return "#16a34a"; // strong green — sound
    if (s >= 75) return "#22c55e"; // green — good
    if (s >= 60) return "#f59e0b"; // amber — notable gaps
    if (s >= 40) return "#f97316"; // orange — significant weaknesses
    return "#ef4444"; // red — do not execute
}

function scoreLabel(s) {
    if (s >= 95) return "Outstanding";
    if (s >= 90) return "Exceptional";
    if (s >= 75) return "Good";
    if (s >= 60) return "Notable Gaps";
    if (s >= 40) return "Significant Weaknesses";
    return "Do Not Execute";
}

// ── Draft toggle ──────────────────────────────────────────────────────────────

// ── PDF Export ───────────────────────────────────────────────────────────────

function exportDraftPdf() {
    if (!currentState) return;
    var draft =
        currentState.draft_versions &&
        currentState.draft_versions[currentState.draft_versions.length - 1];
    if (!draft) return;
    openPrintWindow({
        title: currentState.name || "Contract Draft",
        ref: currentState.ref,
        version: draft.version,
        parties: currentState.inputs.parties
            .map(function (p) {
                return p.name + " (" + p.role + ")";
            })
            .join(" \u00b7 "),
        content: draft.content,
        isRedline: false,
    });
}

function exportRedlinePdf() {
    if (!currentState) return;
    var draft =
        currentState.draft_versions &&
        currentState.draft_versions[currentState.draft_versions.length - 1];
    openPrintWindow({
        title: (currentState.name || "Contract") + " \u2014 Redline",
        ref: currentState.ref,
        version: draft ? draft.version : 1,
        parties: currentState.inputs.parties
            .map(function (p) {
                return p.name + " (" + p.role + ")";
            })
            .join(" \u00b7 "),
        content: null,
        isRedline: true,
    });
}

function openPrintWindow(opts) {
    var w = window.open("", "_blank");
    if (!w) {
        alert("Please allow pop-ups to export PDF.");
        return;
    }

    var ver = "Version " + opts.version;
    var dateStr = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    var metaLine =
        (opts.ref
            ? "Ref: " + opts.ref + "&nbsp;&nbsp;&middot;&nbsp;&nbsp;"
            : "") +
        ver +
        "&nbsp;&nbsp;&middot;&nbsp;&nbsp;" +
        (opts.parties || "") +
        (opts.isRedline
            ? "&nbsp;&nbsp;&middot;&nbsp;&nbsp;Track Changes"
            : "") +
        "&nbsp;&nbsp;&middot;&nbsp;&nbsp;" +
        dateStr;

    var bodyContent;
    if (opts.isRedline) {
        var el = document.getElementById("redline-content");
        bodyContent = el ? el.innerHTML : "";
    } else {
        bodyContent = (opts.content || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    var footerLeft = "MyCounsel  \u00b7  " + ver;
    var footerRight = opts.isRedline ? "Track Changes" : "Confidential Draft";

    var parts = [
        "<!DOCTYPE html><html><head>",
        '<meta charset="UTF-8">',
        "<title>" + opts.title + "</title>",
        "<style>",
        '@import url("https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500&display=swap");',
        'body{font-family:"EB Garamond",Georgia,serif;font-size:11pt;line-height:1.8;color:#1a1a1a;background:#fff;margin:0;padding:0;}',
        ".page{max-width:170mm;margin:0 auto;padding:15mm 0 10mm;}",
        ".doc-title{font-size:15pt;font-weight:600;color:#0f1e35;padding-bottom:8pt;border-bottom:2px solid #0f1e35;margin-bottom:6pt;}",
        '.doc-meta{font-size:8.5pt;color:#64748b;font-family:"Inter",sans-serif;margin-bottom:22pt;}',
        ".content{white-space:pre-wrap;}",
        ".diff-del{background:#fee2e2;color:#991b1b;text-decoration:line-through;border-radius:2px;padding:0 2px;}",
        ".diff-add{background:#dcfce7;color:#166534;border-radius:2px;padding:0 2px;}",
        "@page{size:A4;margin:20mm 20mm 28mm 20mm;}",
        '@page{@bottom-left{content:"' +
            footerLeft +
            '";font-size:7pt;color:#94a3b8;font-family:"Inter",sans-serif;}}',
        '@page{@bottom-center{content:"Page " counter(page);font-size:7pt;color:#94a3b8;font-family:"Inter",sans-serif;}}',
        '@page{@bottom-right{content:"' +
            footerRight +
            '";font-size:7pt;color:#94a3b8;font-family:"Inter",sans-serif;}}',
        "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}",
        "</style></head><body>",
        '<div class="page">',
        '<div class="doc-title">' + opts.title + "</div>",
        '<div class="doc-meta">' + metaLine + "</div>",
        '<div class="content">' + bodyContent + "</div>",
        "</div>",
        "<script>window.onload=function(){window.print();}</" + "script>",
        "</body></html>",
    ];

    w.document.write(parts.join(""));
    w.document.close();
}

function toggleDraft() {
    const panel = document.getElementById("draft-panel");
    const chevron = document.getElementById("draft-chevron");
    if (panel.classList.contains("hidden")) {
        panel.classList.remove("hidden");
        chevron.innerHTML = "&#8963;";
    } else {
        panel.classList.add("hidden");
        chevron.innerHTML = "&#8964;";
    }
}

// ── File upload (PDF / DOCX) ─────────────────────────────────────────────────

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

async function handleFileUpload(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const statusEl = document.getElementById("file-status");
    const statusIcon = document.getElementById("file-status-icon");
    const statusText = document.getElementById("file-status-text");

    statusEl.className =
        "text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-amber-50 text-amber-700";
    statusIcon.textContent = "⏳";
    statusText.textContent = `Extracting text from ${file.name}…`;
    statusEl.classList.remove("hidden");

    try {
        let text = "";
        if (ext === "pdf") {
            text = await extractPDF(file);
        } else if (ext === "docx" || ext === "doc") {
            text = await extractDOCX(file);
        } else {
            throw new Error(
                "Unsupported file type. Please upload a .pdf, .doc, or .docx file.",
            );
        }

        if (!text || text.trim().length < 50) {
            throw new Error(
                "Could not extract readable text from this file. Try copying and pasting the text directly.",
            );
        }

        document.getElementById("review-contract-text").value = text.trim();

        statusEl.className =
            "text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-green-50 text-green-700";
        statusIcon.textContent = "✓";
        statusText.textContent = `Extracted from ${file.name} — ${text.trim().length.toLocaleString()} characters. Review below before submitting.`;
    } catch (err) {
        statusEl.className =
            "text-xs rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-red-50 text-red-700";
        statusIcon.textContent = "✗";
        statusText.textContent = err.message || "Extraction failed.";
    }
}

async function extractPDF(file) {
    await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    );
    if (!window.pdfjsLib)
        throw new Error(
            "PDF library failed to load. Please refresh and try again.",
        );
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const lineMap = new Map();
        for (const item of content.items) {
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) lineMap.set(y, []);
            lineMap.get(y).push(item.str);
        }
        const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
        const pageLines = sortedYs
            .map((y) => lineMap.get(y).join(" ").trim())
            .filter(Boolean);
        pages.push(pageLines.join("\n"));
    }
    return pages.join("\n\n");
}

async function extractDOCX(file) {
    await loadScript(
        "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
    );
    if (!window.mammoth)
        throw new Error(
            "Word library failed to load. Please refresh and try again.",
        );
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.messages?.length) {
        console.warn("[mammoth] warnings:", result.messages);
    }
    return result.value;
}

function toggleRedline() {
    const panel = document.getElementById("redline-panel");
    const chevron = document.getElementById("redline-chevron");
    if (panel.classList.contains("hidden")) {
        panel.classList.remove("hidden");
        chevron.innerHTML = "&#8963;";
    } else {
        panel.classList.add("hidden");
        chevron.innerHTML = "&#8964;";
    }
}

function renderRedline(original, improved) {
    const container = document.getElementById("redline-content");
    if (!container || !window.Diff) {
        container.textContent = improved;
        return;
    }
    const diff = Diff.diffWords(original, improved);
    const html = diff
        .map((part) => {
            const escaped = part.value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            if (part.removed) return `<span class="diff-del">${escaped}</span>`;
            if (part.added) return `<span class="diff-add">${escaped}</span>`;
            return escaped;
        })
        .join("");
    container.innerHTML = html;
}

// ── Decision ──────────────────────────────────────────────────────────────────

async function submitLegalReview() {
    const message = document.getElementById("review-message").value.trim();
    const email = document.getElementById("lawyer-email").value.trim();
    if (!message) {
        setError("Please add a message for the lawyers.");
        return;
    }
    setError("");

    try {
        const res = await fetch(`/contract/${currentContractId}/legal-review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, lawyer_email: email || undefined }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
            setError(data.error || "Failed to send.");
            return;
        }

        document.getElementById("email-preview").textContent =
            data.email_preview ?? "";
        show("step-reviewed");
    } catch (err) {
        setError("Network error: " + err.message);
    }
}

function getRevisionSteps() {
    const type = (currentState && currentState.contract_type) || "OTHER";
    const full = CONTRACT_TYPE_STEPS[type] || CONTRACT_TYPE_STEPS["OTHER"];
    // Steps 3 & 4 from the full set, with drafting relabelled as revision
    return [
        {
            ...full[2],
            label: "Contract Revision",
            sub: "Redrafting the agreement based on your revision notes",
        },
        full[3],
    ];
}

// ── Case Law Citation Parser (TNA & BAILII) ──────────────────────────────────
function parseBailiiUrl(citation) {
    var caseName = citation
        .replace(new RegExp("\\[.*"), "")
        .replace(/[—–].*/, "")
        .trim();

    // ── TNA (The National Archives) 2003+ ──
    var tnaBase = "https://caselaw.nationalarchives.gov.uk";
    
    var uksc = citation.match(new RegExp("\\[(\\d{4})\\]\\s+UKSC\\s+(\\d+)", "i"));
    if (uksc) return {
        url: tnaBase + "/uksc/" + uksc[1] + "/" + uksc[2],
        isDirect: true,
        court: "UK Supreme Court",
        source: "TNA"
    };

    var ewcaCiv = citation.match(new RegExp("\\[(\\d{4})\\]\\s+EWCA\\s+Civ\\s+(\\d+)", "i"));
    if (ewcaCiv) return {
        url: tnaBase + "/ewca/civ/" + ewcaCiv[1] + "/" + ewcaCiv[2],
        isDirect: true,
        court: "Court of Appeal (Civil)",
        source: "TNA"
    };

    var ewhcDiv = citation.match(new RegExp("\\[(\\d{4})\\]\\s+EWHC\\s+(\\d+)\\s+\\(([^)]+)\\)", "i"));
    if (ewhcDiv) {
        var divMap = {
            Comm: "Comm", QB: "QB", KB: "KB", Ch: "Ch", Pat: "Pat", Admin: "Admin", TCC: "TCC", Fam: "Fam", Admlty: "Admlty", IPEC: "IPEC"
        };
        var div = divMap[ewhcDiv[3].trim()] || ewhcDiv[3].trim();
        return {
            url: tnaBase + "/ewhc/" + div.toLowerCase() + "/" + ewhcDiv[1] + "/" + ewhcDiv[2],
            isDirect: true,
            court: "High Court (" + ewhcDiv[3] + ")",
            source: "TNA"
        };
    }

    // ── BAILII (Historical & Fallback) ──
    var bailiiBase = "https://www.bailii.org";
    var search = bailiiBase + "/cgi-bin/find.pl?query=" + encodeURIComponent(caseName) + "&method=boolean";

    var ukhl = citation.match(new RegExp("\\[(\\d{4})\\]\\s+UKHL\\s+(\\d+)", "i"));
    if (ukhl) return {
        url: bailiiBase + "/uk/cases/UKHL/" + ukhl[1] + "/" + ukhl[2] + ".html",
        isDirect: true,
        court: "House of Lords",
        source: "BAILII"
    };

    var ukpc = citation.match(new RegExp("\\[(\\d{4})\\]\\s+UKPC\\s+(\\d+)", "i"));
    if (ukpc) return {
        url: bailiiBase + "/uk/cases/UKPC/" + ukpc[1] + "/" + ukpc[2] + ".html",
        isDirect: true,
        court: "Privy Council",
        source: "BAILII"
    };

    var ukut = citation.match(new RegExp("\\[(\\d{4})\\]\\s+UKUT\\s+(\\d+)\\s*\\(([^)]+)\\)", "i"));
    if (ukut) return {
        url: bailiiBase + "/uk/cases/UKUT/" + ukut[3].trim() + "/" + ukut[1] + "/" + ukut[2] + ".html",
        isDirect: true,
        court: "Upper Tribunal (" + ukut[3] + ")",
        source: "BAILII"
    };

    return {
        url: search,
        isDirect: false,
        court: null,
        source: "BAILII"
    };
}

function updateAdjustPanel() {
    const checkboxes = document.querySelectorAll("[data-warn-idx]");
    const selected = [];
    const list = document.getElementById("adjust-selected-list");
    const items = [];
    checkboxes.forEach((cb) => {
        if (cb.checked) {
            selected.push(Number(cb.dataset.warnIdx));
            const warn =
                currentState?.risk_report?.warnings?.[
                    Number(cb.dataset.warnIdx)
                ];
            if (warn) {
                const IMPACT_COLOURS = {
                    HIGH: "#991b1b",
                    MEDIUM: "#92400e",
                    LOW: "#475569",
                };
                items.push(
                    `<div class="flex items-center gap-2"><span class="font-bold" style="color:${IMPACT_COLOURS[warn.impact] || "#92400e"}">${warn.impact || "MEDIUM"}</span><span>${warn.title}</span></div>`,
                );
            }
        }
    });
    if (list)
        list.innerHTML = items.length
            ? items.join("")
            : "<span>No issues selected — all warnings will be addressed.</span>";
}

async function submitAdjust() {
    const notes = document.getElementById("lawyer-notes").value.trim();

    // Collect selected warning indices
    const checkboxes = document.querySelectorAll("[data-warn-idx]");
    const selectedWarnings = [];
    checkboxes.forEach((cb) => {
        if (cb.checked) selectedWarnings.push(Number(cb.dataset.warnIdx));
    });

    if (selectedWarnings.length === 0 && !notes) {
        setError(
            "Please select at least one issue to address, or add revision notes.",
        );
        return;
    }
    setError("");

    show("step-loading");
    document.getElementById("processing-subtitle").textContent =
        "Two specialist agents are revising your agreement";
    startStepAnimation(getRevisionSteps());

    try {
        const res = await fetch(`/contract/${currentContractId}/decision`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                decision: "ADJUST",
                lawyer_notes: notes || undefined,
                selected_warnings:
                    selectedWarnings.length > 0 ? selectedWarnings : undefined,
            }),
        });
        const data = await safeJson(res);

        if (!res.ok || data.error) {
            stopStepAnimation();
            show("step-result");
            setError(data.error || "Revision failed.");
            return;
        }

        const complete = await pollUntilComplete(
            currentContractId,
            getRevisionSteps(),
        );
        if (complete) {
            stopStepAnimation();
            await loadResult(currentContractId);
            document.getElementById("adjust-panel").classList.add("hidden");
            document.getElementById("lawyer-notes").value = "";
            updateAdjustPanel();
            show("step-result");
        }
    } catch (err) {
        stopStepAnimation();
        show("step-result");
        setError("Network error: " + err.message);
    }
}

async function approve() {
    // Check for outstanding HIGH impact issues
    const warnings = currentState?.risk_report?.warnings ?? [];
    const highWarnings = warnings.filter(
        (w) => (w.impact || "MEDIUM") === "HIGH",
    );

    if (highWarnings.length > 0) {
        // Populate and show the modal
        const list = document.getElementById("high-risk-list");
        if (list) {
            list.innerHTML = highWarnings
                .map(
                    (w) => `
                <div class="rounded-lg p-3" style="background:#fafafa;border:1px solid #fecaca">
                    <div class="text-xs font-semibold text-red-800 mb-1">${w.title}</div>
                    <p class="text-xs text-slate-600 leading-relaxed">${w.detail}</p>
                    <div class="mt-1.5 text-xs font-mono text-red-700 bg-red-50 rounded px-2 py-0.5 inline-block">${w.statutory_basis}</div>
                </div>`,
                )
                .join("");
        }
        document.getElementById("high-risk-modal").classList.remove("hidden");
        return; // Wait for user to choose from the modal
    }

    await doApprove();
}

async function confirmApproveWithHighRisks() {
    document.getElementById("high-risk-modal").classList.add("hidden");
    await doApprove();
}

async function doApprove() {
    try {
        await fetch(`/contract/${currentContractId}/decision`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE" }),
        });
        show("step-signed");
        await loadClosingReport(currentContractId);
    } catch (err) {
        setError("Error: " + err.message);
    }
}

async function loadClosingReport(id) {
    const loadingEl = document.getElementById("closing-report-loading");
    const contentEl = document.getElementById("closing-report-content");
    try {
        const res = await fetch(`/contract/${id}`);
        const state = await res.json();
        const report = state.risk_report;

        // Summary cards
        const score = report?.enforceability_score ?? "N/A";
        const scoreLabel = !report
            ? "N/A"
            : score >= 90
              ? "Exceptional"
              : score >= 75
                ? "Good"
                : score >= 60
                  ? "Adequate"
                  : "Weaknesses Present";
        const scoreColour =
            score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";

        document.getElementById("closing-summary-cards").innerHTML = `
      <div class="rounded-xl p-4 text-center" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2)">
        <div class="text-2xl font-bold serif" style="color:var(--navy)">${state.ref}</div>
        <div class="text-xs text-slate-500 mt-1">${state.name}</div>
      </div>
      <div class="rounded-xl p-4 text-center" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2)">
        <div class="text-2xl font-bold serif" style="color:${scoreColour}">${score}<span class="text-sm font-normal text-slate-400">/100</span></div>
        <div class="text-xs text-slate-500 mt-1">${scoreLabel}</div>
      </div>
    `;

        // Statutory framework
        const statutes = state.legal_context?.statutes ?? [];
        document.getElementById("closing-statutes").innerHTML = statutes.length
            ? statutes
                  .map(
                      (s) =>
                          `<div class="text-xs text-slate-700 flex items-start gap-2"><span style="color:var(--gold)">&#167;</span><span>${s}</span></div>`,
                  )
                  .join("")
            : '<div class="text-xs text-slate-400 italic">No statutes recorded.</div>';

        // Case law — with verification links
        const precedents = state.legal_context?.precedents ?? [];
        const anchorSummary = state.legal_context?.anchor_case_summary ?? "";
        const casesEl = document.getElementById("closing-cases");

        // AI hallucination warning
        const hallucWarn = `<div class="flex items-start gap-2 rounded-lg px-3 py-2 mb-3 text-xs" style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412">
      <span class="flex-shrink-0 font-bold">&#9888;</span>
      <span><strong>Verification required:</strong> These citations were generated by an AI model and may contain errors. Each case <strong>must be independently verified</strong> via the BAILII (historical) or TNA (modern) links below before reliance.</span>
    </div>`;

        if (precedents.length) {
            const caseCards = precedents
                .map((p, i) => {
                    const caseUrlInfo = parseBailiiUrl(p);
                    const holdingMatch = p.match(/[—–]\s*(.+)$/);
                    const holding = holdingMatch ? holdingMatch[1].trim() : "";
                    const caseName = p
                        .replace(/\[.*/, "")
                        .replace(/[—–].*/, "")
                        .trim();
                    const isDirectLink = caseUrlInfo.isDirect;
                    const verifyLabel = isDirectLink
                        ? "&#10003; Verify on " + caseUrlInfo.source
                        : "&#128269; Search " + caseUrlInfo.source;
                    const verifyStyle = isDirectLink
                        ? "background:#dcfce7;color:#166534;border:1px solid #86efac"
                        : "background:#f1f5f9;color:#475569;border:1px solid #cbd5e1";
                    return `<div class="rounded-lg p-3 mb-2" style="background:#fafafa;border:1px solid #e2e8f0">
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div class="flex-1 min-w-0">
              <span class="text-xs font-bold text-slate-400 mr-1">${i + 1}.</span>
              <span class="text-xs font-semibold text-slate-800">${caseName}</span>
              ${caseUrlInfo.court ? `<span class="text-xs text-slate-400 ml-1">(${caseUrlInfo.court})</span>` : ""}
            </div>
            <a href="${caseUrlInfo.url}" target="_blank" rel="noopener"
               class="text-xs font-semibold px-2 py-1 rounded flex-shrink-0"
               style="${verifyStyle}">${verifyLabel} &#8599;</a>
          </div>
          ${holding ? `<p class="text-xs text-slate-500 italic mt-1 ml-4">${holding}</p>` : ""}
        </div>`;
                })
                .join("");
            casesEl.innerHTML = hallucWarn + caseCards;
        } else {
            casesEl.innerHTML =
                '<div class="text-xs text-slate-400 italic">No cases recorded.</div>';
        }

        if (anchorSummary) {
            casesEl.innerHTML += `<div class="mt-3 rounded-lg p-3 text-xs text-slate-600 italic" style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2)">
        <span class="font-semibold not-italic" style="color:var(--navy)">Anchor Case Summary: </span>${anchorSummary}
        <div class="mt-1 not-italic text-slate-400">AI interpretation — verify independently via the link above.</div>
      </div>`;
        }

        // Risk summary
        const IMPACT_STYLE = {
            HIGH: "background:#fee2e2;color:#991b1b",
            MEDIUM: "background:#fef3c7;color:#92400e",
            LOW: "background:#f1f5f9;color:#475569",
        };
        const riskEl = document.getElementById("closing-risk");
        if (report?.warnings?.length) {
            const resolvedHtml = (report.resolved_issues || []).length
                ? `<div class="mt-3"><div class="text-xs font-semibold text-green-700 mb-1">&#10003; Resolved during revision</div>${report.resolved_issues.map((r) => `<div class="text-xs text-slate-600 flex gap-2"><span style="color:#16a34a">&#10003;</span><span>${r}</span></div>`).join("")}</div>`
                : "";
            riskEl.innerHTML =
                report.warnings
                    .map((w) => {
                        const st =
                            IMPACT_STYLE[w.impact] || IMPACT_STYLE.MEDIUM;
                        return `<div class="flex items-start gap-2 rounded-lg px-3 py-2 mb-2" style="background:#fafafa;border:1px solid #e2e8f0">
          <span class="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style="${st}">${w.impact || "MEDIUM"}</span>
          <div><div class="text-xs font-semibold text-slate-800">${w.title}</div><div class="text-xs text-slate-500">${w.statutory_basis}</div></div>
        </div>`;
                    })
                    .join("") + resolvedHtml;
        } else {
            riskEl.innerHTML =
                '<div class="text-xs text-slate-400 italic">No outstanding issues.</div>';
        }

        // Revision history
        const versions = state.draft_versions ?? [];
        if (versions.length > 1) {
            document
                .getElementById("closing-revisions-section")
                .classList.remove("hidden");
            document.getElementById("closing-revisions").innerHTML = versions
                .map((v) => {
                    const d = new Date(v.created_at).toLocaleDateString(
                        "en-GB",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        },
                    );
                    return `<div class="flex items-center gap-3 text-xs text-slate-600 py-1.5 border-b border-slate-50">
          <span class="font-bold text-slate-400 w-6">v${v.version}</span>
          <span class="text-slate-400">${d}</span>
          <span class="text-slate-500">${v.author}</span>
        </div>`;
                })
                .join("");
        }

        loadingEl.classList.add("hidden");
        contentEl.classList.remove("hidden");
    } catch (err) {
        loadingEl.textContent = "Failed to load closing report.";
    }
}

async function downloadClosingReport() {
    try {
        const res = await fetch(
            `/contract/${currentContractId}/closing-report`,
        );
        const markdown = await res.text();
        const html = window.marked
            ? marked.parse(markdown)
            : markdown.replace(/\n/g, "<br>");
        const ref = currentState?.ref ?? "closing-report";
        const name = currentState?.name ?? "Closing Report";
        const dateStr = new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        const parties = (currentState?.inputs?.parties ?? [])
            .map((p) => p.name + " (" + p.role + ")")
            .join(" · ");

        openReportPrintWindow({
            title: "Closing Legal Report — " + name,
            subtitle: ref + " · " + parties + " · " + dateStr,
            footerLeft: "MyCounsel · " + ref,
            footerRight: "Closing Report",
            bodyHtml: html,
        });
    } catch (err) {
        setError("Failed to generate closing report: " + err.message);
    }
}

async function exportLegalStandingPdf() {
    try {
        const res = await fetch(`/contract/${currentContractId}/report`);
        const markdown = await res.text();
        const html = window.marked
            ? marked.parse(markdown)
            : markdown.replace(/\n/g, "<br>");
        const ref = currentState?.ref ?? "";
        const name = currentState?.name ?? "Legal Standing Report";
        const dateStr = new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        const parties = (currentState?.inputs?.parties ?? [])
            .map((p) => p.name + " (" + p.role + ")")
            .join(" · ");

        openReportPrintWindow({
            title: "Legal Standing Report — " + name,
            subtitle: ref + " · " + parties + " · " + dateStr,
            footerLeft: "MyCounsel · " + ref,
            footerRight: "Legal Standing Report",
            bodyHtml: html,
        });
    } catch (err) {
        setError(
            "Failed to generate Legal Standing Report PDF: " + err.message,
        );
    }
}

function openReportPrintWindow(opts) {
    var w = window.open("", "_blank");
    if (!w) {
        alert("Please allow pop-ups to export PDF.");
        return;
    }

    var parts = [
        "<!DOCTYPE html><html><head>",
        '<meta charset="UTF-8">',
        "<title>" + opts.title + "</title>",
        '@import url("https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap");',
        "<style>",
        'body { font-family: "EB Garamond", Georgia, serif; font-size: 11pt; line-height: 1.8; color: #1a1a1a; background: #fff; margin: 0; padding: 0; }',
        ".page { max-width: 170mm; margin: 0 auto; padding: 15mm 0 10mm; }",
        ".doc-title { font-size: 15pt; font-weight: 600; color: #0f1e35; padding-bottom: 8pt; border-bottom: 2px solid #c9a84c; margin-bottom: 4pt; }",
        '.doc-meta { font-size: 8.5pt; color: #64748b; font-family: "Inter", sans-serif; margin-bottom: 22pt; }',
        "h1 { font-size: 14pt; color: #0f1e35; margin-top: 1.8em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; }",
        "h2 { font-size: 12pt; color: #0f1e35; margin-top: 1.6em; }",
        "h3 { font-size: 11pt; color: #1a2f4a; margin-top: 1.2em; }",
        'table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 9pt; font-family: "Inter", sans-serif; }',
        "th, td { border: 1px solid #e2e8f0; padding: 6pt 9pt; text-align: left; vertical-align: top; }",
        "th { background: #f8f5ef; font-weight: 600; color: #0f1e35; }",
        "blockquote { border-left: 3px solid #c9a84c; margin: 1em 0; padding: 4pt 0 4pt 12pt; color: #475569; font-style: italic; }",
        'code { background: #f1f5f9; padding: 1pt 4pt; border-radius: 2px; font-size: 9pt; font-family: "Courier New", monospace; }',
        "a { color: #0f1e35; text-decoration: underline; }",
        "ul, ol { padding-left: 1.4em; }",
        "li { margin-bottom: 0.3em; }",
        "strong { font-weight: 600; }",
        "em { font-style: italic; }",
        "@page { size: A4; margin: 20mm 20mm 28mm 20mm; }",
        '@page { @bottom-left { content: "' +
            opts.footerLeft +
            '"; font-size: 7pt; color: #94a3b8; font-family: "Inter", sans-serif; } }',
        '@page { @bottom-center { content: "Page " counter(page); font-size: 7pt; color: #94a3b8; font-family: "Inter", sans-serif; } }',
        '@page { @bottom-right { content: "' +
            opts.footerRight +
            '"; font-size: 7pt; color: #94a3b8; font-family: "Inter", sans-serif; } }',
        "@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } a { color: #0f1e35; } }",
        "</style></head><body>",
        '<div class="page">',
        '<div class="doc-title">' + opts.title + "</div>",
        '<div class="doc-meta">' + opts.subtitle + "</div>",
        opts.bodyHtml,
        "</div>",
        "<script>window.onload = function() { window.print(); }</" + "script>",
        "</body></html>",
    ];

    w.document.write(parts.join("\n"));
    w.document.close();
}

function reset() {
    currentContractId = null;
    currentState = null;
    document.getElementById("intent-input").value = "";
    document.getElementById("name-input").value = "";
    document.getElementById("review-contract-text").value = "";
    document.getElementById("review-name").value = "";
    document.getElementById("file-input").value = "";
    document.getElementById("file-status").classList.add("hidden");
    document.getElementById("adjust-panel").classList.add("hidden");
    document.getElementById("review-panel").classList.add("hidden");
    document.getElementById("draft-panel").classList.add("hidden");
    document.getElementById("redline-panel").classList.add("hidden");
    document.getElementById("redline-panel-wrapper").classList.add("hidden");
    document.getElementById("lawyer-notes").value = "";
    document.getElementById("review-message").value = "";
    document.getElementById("lawyer-email").value = "";
    parties = [
        {
            type: "company",
            name: "",
            role: "",
            email: "",
            co_number: "",
            address: "",
        },
        {
            type: "company",
            name: "",
            role: "",
            email: "",
            co_number: "",
            address: "",
        },
    ];
    renderParties();
    setError("");
    setMode("DRAFT");
    show("step-input");
}

// Initialise party form and mode on load
renderParties();
setMode("DRAFT");

// ── Service Worker Registration ───────────────────────────────────────────────
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
            console.warn("SW registration failed:", err);
        });
    });
}

// ── PWA Install Prompt ────────────────────────────────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const banner = document.getElementById("pwa-install-banner");
    if (banner) banner.classList.remove("hidden");
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    const banner = document.getElementById("pwa-install-banner");
    if (banner) banner.classList.add("hidden");
});

function installPWA() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => {
        deferredInstallPrompt = null;
        const banner = document.getElementById("pwa-install-banner");
        if (banner) banner.classList.add("hidden");
    });
}
