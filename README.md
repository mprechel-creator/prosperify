# Prosperify — Developer Reference

**CFO in a Box for Canadian SMB owners.**  
Financial tools platform targeting small business owners. Accountant-built, AI-powered, designed to deliver professional-grade financial clarity at accessible price points.

---

## File Structure

```
prosperify/
├── prosperify-homepage.html          # Main marketing site + pricing + CFO trial gate
├── prosperify-theme.css              # ← SHARED: design tokens, nav, dropdown, gate UI
├── prosperify-tools.js               # ← SHARED: tool registry, nav renderer, email gate logic
│
├── prosperify-dividend-salary.html   # Tool page shell (links shared files)
├── prosperify-dividend-salary.js     # Tool logic: tax engine, render, AI call, PDF export
├── prosperify-employee-cost.html     # Tool: True Employee Cost Calculator (self-contained)
├── prosperify-lease-vs-buy.html      # Tool: Lease vs. Buy Calculator (self-contained)
└── prosperify-exit-readiness.html    # Tool: Exit Readiness (incomplete — coming soon)
```

---

## The Two Files That Matter Most

### `prosperify-theme.css`
Shared design system. Every page links this. Contains:
- CSS custom property tokens (colours, shadows, easing)
- The sticky nav + "Tools ▾" dropdown component
- Shared footer, page-header, card styles
- Email-capture gate modal styles

**Touch this to change:** colours, fonts, spacing, nav appearance — updates everywhere.

### `prosperify-tools.js`
Single source of truth for the tool registry. Every page loads this. Contains:
- `PROSPERIFY_TOOLS` array — defines every tool (name, URL, badge, tier, gate flag)
- `renderProsperifyNav(currentId)` — builds the nav + dropdown on any page
- `renderToolsGrid(mountId)` — builds the homepage tool cards from the registry
- `filterTools(mode, btn)` — All / Live / Coming soon filter tabs on homepage
- `mountGate(opts)` — shared email-capture gate for free tools
- `initProsperifyTheme()` — persists dark/light mode in localStorage

**To add a new tool:** add one object to `PROSPERIFY_TOOLS`. It appears in the dropdown and homepage grid automatically.

---

## Adding a New Tool (Checklist)

1. Add entry to `PROSPERIFY_TOOLS` in `prosperify-tools.js`
2. Create `prosperify-[toolname].html` — copy the dividend calculator shell as a template
3. Create `prosperify-[toolname].js` — tool logic goes here
4. If it's a free tool, call `mountGate({ tool: "Tool Name", onUnlock: () => {} })` in the page script
5. Push all files to GitHub — the dropdown and homepage grid update automatically

---

## Tool Registry — Current Status

| Tool | File | Tier | Status |
|------|------|------|--------|
| CFO in a Box | (hosted separately, trial modal on homepage) | Pro | Live |
| True Employee Cost Calculator | prosperify-employee-cost.html | Free | Live |
| Lease vs. Buy Calculator | prosperify-lease-vs-buy.html | Pro | Live |
| Dividend vs. Salary Calculator | prosperify-dividend-salary.html + .js | Pro | Live |
| Exit Readiness Tool | prosperify-exit-readiness.html | Pro | Incomplete |
| Health Score Quiz | — | Free | Not built |
| Break-Even Calculator | — | Free | Not built |
| Cash Flow Forecaster | — | Pro | Not built |
| Budget Builder | — | Pro | Not built |

---

## Design System

| Token | Value |
|-------|-------|
| Background | `#FDFAF4` (cream) |
| Background alt | `#F5F0E8` |
| Ink (text) | `#1C1917` |
| Red (brand) | `#DC321F` |
| Green | `#1E6B3C` |
| Amber | `#A0620A` |
| Heading font | Playfair Display (700, 900) |
| Body font | Instrument Sans (400, 500, 600) |

Dark mode tokens defined in `[data-theme="dark"]`. User preference persisted in `localStorage("prosperify_theme")`.

---

## Pricing Model

| Tier | Price | Access |
|------|-------|--------|
| Free | $0 | Employee Cost, Health Score Quiz, Break-Even, Burn Rate — email gate for results |
| Pro | $49/mo ($39 annual) | CFO in a Box unlimited, all free tools, upcoming Pro tools |
| Business | $149/mo ($119 annual) | Everything + white-label reports, QBR report, accountant seat, team access, courses, AI email support |

Free tools require email to see results (lead capture → Kit/ConvertKit nurture sequence).  
CFO in a Box: one-time free trial for new users, then Pro required.  
All support is AI-driven — no personal support time offered.

---

## AI Usage

- **CFO in a Box**: user uploads PDF → Claude API analyzes → returns structured CFO report
- **Dividend Calculator "What's Best for Me?"**: qualifiers (RRSP, dependants, monthly expenses) → Claude API → personalized compensation recommendation
- **Model**: `claude-sonnet-4-20250514`
- **Current API key handling**: client-side (front-end demo only — must move server-side before charging users)

---

## Known Open Items (Before Charging Users)

1. **API key must move server-side** — client-side key is bypassable, cannot safely gate paid features
2. **Real email capture** — current gate stores email in localStorage only; needs backend → Kit API integration
3. **Report counting** — CFO trial limit is client-side localStorage; needs server enforcement
4. **Auth / user accounts** — no login system yet; required for Pro tier access control
5. **Privacy policy + Terms of Service** — not drafted yet
6. **Exit Readiness tool** — incomplete, marked "Coming Soon" in registry

---

## Backend (Planned — Next Phase)

See `prosperify-cost-and-controls-spec.md` for the full cost and controls specification.

High-level backend requirements:
- User auth (email/password or magic link)
- Report counting per user (enforce free trial limit)
- API key proxy (Claude API calls go server → Claude, never client → Claude)
- Email capture endpoint → Kit/ConvertKit
- Stripe integration for Pro/Business subscriptions
- Session management

Tech stack TBD — will be decided at backend build phase.

---

## Deployment

Hosted on **GitHub Pages** (`main` branch, root folder).  
All 8 files must be in the same directory — shared CSS/JS loads via relative paths.  
`prosperify-theme.css` and `prosperify-tools.js` must be present for any page to render correctly.

Local development: `python3 -m http.server 8000` from the project folder, then open `http://localhost:8000/prosperify-homepage.html`.
