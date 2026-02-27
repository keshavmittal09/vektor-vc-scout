# Vektor — AI Scout for VCs

> Precision AI sourcing platform that turns a fund's thesis into an always-on discovery workflow.

**Live demo:** _[paste your Vercel URL here after deploy]_  
**GitHub:** [github.com/keshavmittal09/vektor-vc-scout](https://github.com/keshavmittal09/vektor-vc-scout)

---

## What This Does

Vektor is a VC intelligence interface built in response to the sourcing problem: teams waste hours on noisy inbound, shallow profiles, duplicates, and filters that don't encode the fund's actual thesis.

The product combines:
1. **A modern intelligence interface** — global search, faceted filters (sector/stage), sortable company table, signal timelines, thesis fit scores with plain-language explanations
2. **Live enrichment** — click Enrich on any company profile to fetch real public website content via Jina AI Reader and extract structured fields (summary, capabilities, keywords, derived signals, sources) via Anthropic — all server-side, no API keys ever exposed to the browser

---

## Architecture

```
Browser (Next.js)
  │
  ├── /companies      Search + filters + sortable table
  ├── /companies/[id] Profile: overview, signals, thesis score, notes, enrichment
  ├── /lists          Named lists with CSV/JSON export
  ├── /saved          Saved search queries, re-runnable
  └── /thesis         Fund thesis config (drives scoring + explanations)
         │
         │  POST /api/enrich  ← server-side only, keys never in browser
         ▼
    pages/api/enrich.js
         │
         ├── Jina AI Reader  (scrapes public pages → clean markdown)
         │     https://r.jina.ai/{url}
         │
         └── Anthropic API   (extracts structured fields from scraped text)
               model: claude-opus-4-6
```

**State persistence:** localStorage (notes, lists, saved searches, enrichment cache, thesis config)  
**Data:** 20 mock companies seeded in `lib/mockData.js`; enrich any company on demand from real public URLs

---

## Enrichment Flow (End-to-End)

```
User clicks "Enrich with AI"
  → Browser POSTs to /api/enrich with { company }
  → Server fetches company homepage, /about, /blog via Jina AI Reader
  → Server sends scraped text to Anthropic for structured extraction
  → Server returns { summary, whatTheyDo, keywords, signals, sources, scrapedAt }
  → Browser displays result + caches in localStorage per company
```

Public pages only. No login bypass or access control evasion.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/vektor-vc-scout.git
cd vektor-vc-scout
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required — get at https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

# Optional — free without key, higher rate limits with one (https://jina.ai/)
JINA_API_KEY=
```

> ⚠️ Never commit `.env.local` — it's in `.gitignore`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Set env vars (or use the Vercel dashboard)
vercel env add ANTHROPIC_API_KEY
vercel env add JINA_API_KEY   # optional

# Redeploy with env vars
vercel --prod
```

Or deploy via the Vercel dashboard:
1. Push to GitHub
2. Import repo at vercel.com/new
3. Add `ANTHROPIC_API_KEY` in Project → Settings → Environment Variables
4. Deploy

---

## Project Structure

```
vektor-vc-scout/
├── pages/
│   ├── _app.js               # App wrapper, imports global CSS
│   ├── index.js              # Root page — wires all views + state
│   └── api/
│       └── enrich.js         # ← SERVER-SIDE ONLY — API keys never leave here
├── components/
│   ├── Sidebar.jsx           # Navigation sidebar
│   ├── CompaniesView.jsx     # Search + filters + sortable table + pagination
│   ├── ProfilePanel.jsx      # Company drawer: overview, signals, score, enrichment, notes
│   ├── ListsView.jsx         # Create/manage lists, export CSV/JSON
│   ├── SavedView.jsx         # Saved searches with re-run
│   ├── ThesisView.jsx        # Fund thesis config (sectors, stages, keywords, min score)
│   └── Icons.jsx             # SVG icon components
├── lib/
│   ├── mockData.js           # 20 seed companies + default thesis
│   └── useLocalStorage.js    # SSR-safe localStorage hook
├── styles/
│   └── globals.css           # All styles (dark theme, Syne + DM Sans fonts)
├── .env.local.example        # Env var template
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Server-side enrichment** (`/api/enrich`) | API keys never exposed to browser; meets security requirement |
| **Jina AI Reader** for scraping | Free, handles JS-rendered pages, no infrastructure required |
| **localStorage** for persistence | No backend needed; notes, lists, searches, cache survive page reloads |
| **20 mock companies** | Realistic seed data covering diverse sectors, stages, and thesis scores |
| **Explainable scores** | Every score shows 4 plain-language reasons (sector fit, AI detection, stage, raise size) |
| **Thesis-first config** | Fund name, statement, target sectors/stages, keywords all drive scoring labels |

---

## What's Implemented vs. Stretch

| Feature | Status |
|---|---|
| App shell: sidebar + global search | ✅ |
| Companies: search + filters + sortable table + pagination | ✅ |
| Company profile: overview, signals, notes, save-to-list | ✅ |
| Live enrichment: summary, bullets, keywords, signals, sources | ✅ |
| Server-side API route (keys never in browser) | ✅ |
| Lists: create, add/remove, export CSV + JSON | ✅ |
| Saved searches: save + re-run | ✅ |
| Fund thesis configuration | ✅ |
| Enrichment caching per company | ✅ |
| Loading + error states | ✅ |
| Export company profile as JSON | ✅ |
| Keyboard shortcut (Enter to create list/save search) | ✅ |
| Queue / rate limiting | ✅ |
| Vector similarity search | ✅ |
| Slack / CRM integrations | ✅ (Slack + Email + Copy) |
| Real-time signal monitoring | Stretch |

---

## Competitors Referenced

- **Harmonic** — workflow inspiration (discover → enrich → action)
- **Cardinal** — thesis-oriented scouting approach
- **PitchBook / Crunchbase / Affinity** — interface patterns and data model references

---

## Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **Styling:** Custom CSS (dark theme, Syne + DM Sans from Google Fonts)
- **AI Extraction:** Groq / Gemini / Anthropic (configurable via env vars)
- **Web Scraping:** Jina AI Reader (`r.jina.ai`) — public pages only, with URL routing + retries
- **Similarity:** TF-IDF vector store with cosine similarity
- **Integrations:** Slack webhook, email (mailto), clipboard
- **State:** React `useState` + localStorage
- **Deploy:** Vercel
