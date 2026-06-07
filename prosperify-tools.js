/* ============================================================================
   PROSPERIFY — SHARED TOOL REGISTRY & NAV
   ----------------------------------------------------------------------------
   This is the SINGLE SOURCE OF TRUTH for every tool on the site.

   To ADD A NEW TOOL later: add one object to the PROSPERIFY_TOOLS array below.
   It will automatically appear in:
     • the "Tools ▾" dropdown on every tool page
     • the tools grid on the homepage (if you call renderToolsGrid)

   Fields:
     id       unique slug (used for nothing critical, but keep it unique)
     name     display name
     icon     emoji shown on cards / dropdown
     url      the file the card/dropdown links to (or null if not built yet)
     desc     one-line description for the homepage grid
     badge    "live" | "free" | "soon"   (controls the coloured pill)
     tier     "free" | "pro"              (shown on the tool page header)
     cta      link text on the homepage card
     gated    true  = free tool that should show the email-capture gate
              false = no gate (paid tools, or coming-soon)
   ============================================================================ */

const PROSPERIFY_TOOLS = [
  {
    id: "cfo-in-a-box",
    name: "CFO in a Box",
    icon: "🧾",
    url: "prosperify-homepage.html#cfo",   // opens the trial modal on the homepage
    desc: "Upload your P&L, balance sheet, or bank statement and get a full CFO-style report in plain English — health score, red flags, strengths, and prioritised action items.",
    badge: "live",
    tier: "pro",
    cta: "Explore tool →",
    gated: false,
    special: "trial"   // special hook: opens the trial modal instead of navigating
  },
  {
    id: "employee-cost",
    name: "True Employee Cost Calculator",
    icon: "👥",
    url: "prosperify-employee-cost.html",
    desc: "See the true all-in cost of a hire — CPP, CPP2, EI, vacation, stat holidays, WCB, and provincial payroll levies. All 13 provinces & territories, 2026 rates.",
    badge: "free",
    tier: "free",
    cta: "Calculate now →",
    gated: true
  },
  {
    id: "lease-vs-buy",
    name: "Lease vs. Buy Calculator",
    icon: "🚚",
    url: "prosperify-lease-vs-buy.html",
    desc: "Find out which option saves your business more after tax — for equipment and vehicles. Uses CCA declining-balance rates and the Class 10 / 10.1 vehicle rules.",
    badge: "live",
    tier: "pro",
    cta: "Compare now →",
    gated: false
  },
  {
    id: "dividend-salary",
    name: "Dividend vs. Salary Calculator",
    icon: "🍁",
    url: "prosperify-dividend-salary.html",
    desc: "Should you pay yourself salary, dividends, or a mix? See the after-tax result across all 10 provinces, with an AI recommendation built on real CCPC planning.",
    badge: "live",
    tier: "pro",
    cta: "Calculate now →",
    gated: false
  },
  {
    id: "exit-readiness",
    name: "Exit Readiness Tool",
    icon: "🚪",
    url: null,                         // not finished yet
    desc: "Thinking about selling one day? Get an Exit Readiness Score across financials, operations, and structure — plus the gaps a buyer will look for.",
    badge: "soon",
    tier: "pro",
    cta: "Join waitlist →",
    gated: false
  },
  {
    id: "health-score",
    name: "Health Score Quiz",
    icon: "💯",
    url: null,
    desc: "A 5-minute diagnostic that grades your business across cash flow, margins, debt, and growth. Get your instant score — no document upload needed.",
    badge: "free",
    tier: "free",
    cta: "Take the quiz →",
    gated: true
  },
  {
    id: "break-even",
    name: "Break-Even Calculator",
    icon: "📐",
    url: null,
    desc: "Enter your fixed costs, variable costs, and price — and instantly see exactly how many units you need to sell to break even.",
    badge: "free",
    tier: "free",
    cta: "Calculate now →",
    gated: true
  },
  {
    id: "cash-flow",
    name: "Cash Flow Forecaster",
    icon: "💸",
    url: null,
    desc: "Stop guessing if you'll make payroll. A 13-week rolling forecast with best, worst, and expected scenarios — all in plain English.",
    badge: "soon",
    tier: "pro",
    cta: "Join waitlist →",
    gated: false
  },
  {
    id: "budget-builder",
    name: "Budget Builder",
    icon: "📋",
    url: null,
    desc: "Set spending limits, track actuals against your plan, and get alerted before surprises become problems — for business and personal finances.",
    badge: "soon",
    tier: "pro",
    cta: "Join waitlist →",
    gated: false
  }
];

/* ----------------------------------------------------------------------------
   BADGE TEXT
   ---------------------------------------------------------------------------- */
const BADGE_TEXT = { live: "Live now", free: "Free tool", soon: "Coming soon" };

/* ----------------------------------------------------------------------------
   SHARED NAV  — call renderProsperifyNav() with the current tool's id (or null)
   Builds: logo + "Tools ▾" dropdown + theme toggle.
   The dropdown is driven entirely by PROSPERIFY_TOOLS.
   ---------------------------------------------------------------------------- */
function renderProsperifyNav(currentId) {
  const nav = document.getElementById("prosperify-nav");
  if (!nav) return;

  const liveTools = PROSPERIFY_TOOLS.filter(t => t.url || t.special);
  const soonTools = PROSPERIFY_TOOLS.filter(t => !t.url && !t.special);

  const item = t => {
    const isCurrent = t.id === currentId;
    const href = t.special === "trial"
      ? "prosperify-homepage.html#cfo"
      : (t.url || "#");
    const badge = t.badge === "soon"
      ? `<span class="pd-soon">Soon</span>`
      : (t.badge === "free" ? `<span class="pd-free">Free</span>` : "");
    return `<a href="${href}" class="pd-item${isCurrent ? " current" : ""}"${!t.url && !t.special ? ' aria-disabled="true"' : ""}>
      <span class="pd-ico">${t.icon}</span>
      <span class="pd-name">${t.name}</span>
      ${badge}
    </a>`;
  };

  nav.innerHTML = `
    <a href="prosperify-homepage.html" class="nav-logo">Prosperify</a>
    <div class="nav-right">
      <div class="tools-dd" id="toolsDd">
        <button class="tools-dd-btn" id="toolsDdBtn" aria-haspopup="true" aria-expanded="false">
          Tools <span class="dd-caret">▾</span>
        </button>
        <div class="tools-dd-menu" id="toolsDdMenu" role="menu">
          <div class="pd-group-label">Available now</div>
          ${liveTools.map(item).join("")}
          ${soonTools.length ? `<div class="pd-divider"></div><div class="pd-group-label">Coming soon</div>${soonTools.map(item).join("")}` : ""}
          <div class="pd-divider"></div>
          <a href="prosperify-homepage.html#tools" class="pd-item pd-all">⊞ <span class="pd-name">See all tools</span></a>
        </div>
      </div>
      <button class="theme-btn" id="themeToggle" aria-label="Toggle dark mode">☀ / ☾</button>
    </div>
  `;

  // Dropdown open/close
  const btn  = document.getElementById("toolsDdBtn");
  const menu = document.getElementById("toolsDdMenu");
  const dd   = document.getElementById("toolsDd");
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const open = dd.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", e => {
    if (!dd.contains(e.target)) { dd.classList.remove("open"); btn.setAttribute("aria-expanded","false"); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") dd.classList.remove("open"); });

  initProsperifyTheme();
}

/* ----------------------------------------------------------------------------
   SHARED THEME TOGGLE  (persists choice in localStorage)
   ---------------------------------------------------------------------------- */
function initProsperifyTheme() {
  const saved = localStorage.getItem("prosperify_theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  const toggle = document.getElementById("themeToggle");
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", () => {
      const d = document.documentElement;
      const next = d.getAttribute("data-theme") === "dark" ? "light" : "dark";
      d.setAttribute("data-theme", next);
      localStorage.setItem("prosperify_theme", next);
    });
  }
}

/* ----------------------------------------------------------------------------
   HOMEPAGE TOOLS GRID  — call renderToolsGrid("toolsGrid")
   Renders every tool as a card, driven by the registry.
   ---------------------------------------------------------------------------- */
function renderToolsGrid(mountId) {
  const grid = document.getElementById(mountId);
  if (!grid) return;

  const card = t => {
    const href = t.special === "trial" ? "#" : (t.url || "#");
    const onclick = t.special === "trial" ? ` onclick="openTrial(event)"` : "";
    const dimmed = (!t.url && !t.special) ? " dimmed" : "";
    const linkColor = (!t.url && !t.special) ? ' style="color:var(--ink-soft)"' : "";
    const badgeClass = t.badge;
    const badgeInner = t.badge === "live"
      ? `<span class="badge-dot"></span>${BADGE_TEXT[t.badge]}`
      : BADGE_TEXT[t.badge];
    return `
      <a href="${href}"${onclick} class="tool-card${dimmed}">
        <div class="tc-top">
          <div class="tc-icon">${t.icon}</div>
          <span class="badge ${badgeClass}">${badgeInner}</span>
        </div>
        <div class="tc-name">${t.name}</div>
        <p class="tc-desc">${t.desc}</p>
        <span class="tc-link"${linkColor}>${t.cta}</span>
      </a>`;
  };

  grid.innerHTML =
    PROSPERIFY_TOOLS.map(card).join("") +
    `<div class="tool-card coming-placeholder">
       <div class="placeholder-plus">+</div>
       <div class="placeholder-label">More tools on the way</div>
     </div>`;
}

/* ----------------------------------------------------------------------------
   FILTER TABS on the homepage  (All / Live / Coming soon)
   ---------------------------------------------------------------------------- */
function filterTools(mode, btn) {
  document.querySelectorAll(".tool-tab").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.querySelectorAll(".tools-grid .tool-card").forEach(card => {
    if (card.classList.contains("coming-placeholder")) { card.style.display = ""; return; }
    const isSoon = card.querySelector(".badge.soon");
    if (mode === "all") card.style.display = "";
    else if (mode === "live") card.style.display = isSoon ? "none" : "";
    else if (mode === "soon") card.style.display = isSoon ? "" : "none";
  });
}

/* ----------------------------------------------------------------------------
   SHARED EMAIL-CAPTURE GATE  (for free tools)
   ----------------------------------------------------------------------------
   FRONT-END DEMONSTRATION ONLY. This shows the UX and stores the email in
   localStorage so the gate doesn't nag on repeat visits. It does NOT actually
   capture the lead — your BACKEND must receive the email (Kit/ConvertKit) and
   is the real source of truth. A client-side gate is bypassable in seconds.

   Usage on a free tool page:
     1. include <div id="gate"></div> near the top of <body>
     2. call mountGate({ tool:"Employee Cost", onUnlock:()=>{...} })
        - if already unlocked (localStorage), onUnlock fires immediately
   ---------------------------------------------------------------------------- */
function mountGate(opts) {
  const { tool = "this tool", onUnlock } = opts || {};
  const KEY = "prosperify_lead_email";

  // already unlocked? skip the gate.
  if (localStorage.getItem(KEY)) { if (onUnlock) onUnlock(); return; }

  const host = document.getElementById("gate");
  if (!host) { if (onUnlock) onUnlock(); return; }

  host.innerHTML = `
    <div class="gate-overlay open" id="gateOverlay">
      <div class="gate-modal">
        <button class="gate-close" id="gateClose" aria-label="Close">×</button>
        <div class="gate-eyebrow">Free tool</div>
        <div class="gate-title">See your results</div>
        <div class="gate-sub">Enter your email and we'll unlock the ${tool} instantly. We'll also send occasional plain-English money tips for business owners. Unsubscribe anytime.</div>
        <input type="email" class="gate-input" id="gateEmail" placeholder="you@yourbusiness.com" autocomplete="email">
        <div class="gate-error" id="gateError"></div>
        <button class="gate-btn" id="gateSubmit">Unlock the tool →</button>
        <div class="gate-fineprint">No credit card. Your email is only used to send your results and occasional tips.</div>
      </div>
    </div>`;

  const overlay = document.getElementById("gateOverlay");
  const email   = document.getElementById("gateEmail");
  const error   = document.getElementById("gateError");
  const submit  = document.getElementById("gateSubmit");
  const close   = document.getElementById("gateClose");

  setTimeout(() => email.focus(), 150);

  function unlock() {
    const val = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      error.textContent = "Please enter a valid email address.";
      return;
    }
    // DEMO: persist locally. PRODUCTION: POST this to your backend → Kit.
    localStorage.setItem(KEY, val);
    if (typeof captureLeadToBackend === "function") captureLeadToBackend(val, tool);
    overlay.classList.remove("open");
    if (onUnlock) onUnlock();
  }

  submit.addEventListener("click", unlock);
  email.addEventListener("keydown", e => { if (e.key === "Enter") unlock(); });
  // closing the gate without unlocking returns the visitor to the homepage
  close.addEventListener("click", () => { window.location.href = "prosperify-homepage.html"; });
}
