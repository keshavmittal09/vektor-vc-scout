/**
 * /api/enrich
 *
 * Server-side enrichment endpoint. API keys NEVER leave the server.
 *
 * Set ONE of these in .env.local (priority order):
 *
 *   GROQ_API_KEY      → 100% FREE. No credit card. console.groq.com  ← RECOMMENDED
 *   GEMINI_API_KEY    → Free tier. aistudio.google.com (Google account)
 *   ANTHROPIC_API_KEY → Paid credits. console.anthropic.com
 *
 * If NONE are set → DEMO MODE: returns realistic simulated data, no API call needed.
 *
 * Web scraping: Jina AI Reader — free, no key needed for basic use.
 */

import rateLimit from "../../lib/rateLimit";

// ── Rate Limiter ──────────────────────────────────────────────────────────────

const limiter = rateLimit({ windowMs: 60000, max: 5 });

// ── Simple In-Memory Queue ────────────────────────────────────────────────────

let processing = false;
const queue = [];

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const { fn, resolve, reject } = queue.shift();
  try {
    resolve(await fn());
  } catch (e) {
    reject(e);
  }
  processing = false;
  processQueue();
}

// ── URL Router (smart page selection + retries) ───────────────────────────────

const CANDIDATE_PATHS = [
  "",            // homepage
  "/about",
  "/about-us",
  "/blog",
  "/product",
  "/pricing",
  "/careers",
  "/jobs",
  "/team",
  "/company",
];

const MAX_PAGES = 4;
const MAX_RETRIES = 2;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  const headers = { Accept: "text/plain", "X-Timeout": "15" };
  if (process.env.JINA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers,
        signal: AbortSignal.timeout(18000),
      });
      if (!res.ok) {
        if (attempt < retries && res.status >= 500) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(`Jina ${res.status} for ${url}`);
      }
      return (await res.text()).slice(0, 4000);
    } catch (e) {
      if (attempt < retries && (e.name === "TimeoutError" || e.name === "AbortError")) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw e;
    }
  }
}

async function routeAndScrape(website) {
  const results = [];

  for (const path of CANDIDATE_PATHS) {
    if (results.length >= MAX_PAGES) break;

    const url = `https://${website}${path}`;
    try {
      const content = await fetchWithRetry(url);
      if (content?.length > 100) {
        results.push({ url, content });
        console.log(`[enrich] ✓ Scraped: ${url} (${content.length} chars)`);
      }
    } catch (e) {
      console.warn(`[enrich] ✗ Skip ${url}: ${e.message}`);
    }
  }

  return results;
}

// ── LLM Providers ─────────────────────────────────────────────────────────────

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callAnthropic(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

// ── DEMO MODE ─────────────────────────────────────────────────────────────────

function demoEnrich(company, sourceUrls) {
  const sectorKeywords = {
    "AI/ML": ["machine learning", "neural networks", "LLM", "inference", "training data", "embeddings", "model serving", "fine-tuning"],
    "Developer Tools": ["SDK", "API", "CI/CD", "developer experience", "open source", "CLI", "integration", "documentation"],
    "Cybersecurity": ["threat detection", "zero trust", "SOC", "vulnerability", "compliance", "SIEM", "endpoint protection", "IAM"],
    "Fintech": ["payments", "compliance", "KYC", "ledger", "reconciliation", "embedded finance", "open banking", "treasury"],
    "Health Tech": ["EHR integration", "HIPAA", "clinical workflow", "patient outcomes", "interoperability", "care coordination"],
    "Data & Analytics": ["data pipeline", "ETL", "dashboard", "real-time analytics", "data warehouse", "BI", "metrics", "observability"],
  };

  const keywords = sectorKeywords[company.sector] || ["B2B", "SaaS", "enterprise", "platform", "API", "integration", "automation", "workflow"];

  return {
    summary: `${company.name} is a ${company.stage}-stage ${company.sector} company that ${company.description.toLowerCase().replace(/\.$/, "")}. They serve enterprise customers with a focus on reliability and scalability.`,
    whatTheyDo: [
      `Core platform: ${company.description.split(".")[0]}`,
      `Enterprise-grade security with SOC2 compliance and SSO support`,
      `REST and GraphQL APIs with SDKs for major programming languages`,
      `Dedicated customer success and white-glove onboarding for enterprise accounts`,
    ],
    keywords: keywords.slice(0, 8),
    signals: [
      { icon: "💼", text: "Enterprise pricing page detected — suggests active upmarket motion", confidence: "high" },
      { icon: "🚀", text: `${company.sector} hiring signals: 3+ open engineering roles visible on careers page`, confidence: "medium" },
      { icon: "📝", text: "Blog or changelog updated recently — active content marketing", confidence: "medium" },
      { icon: "🤝", text: "Partner/integration page found — ecosystem strategy in place", confidence: "low" },
    ],
    sources: sourceUrls,
    scrapedAt: new Date().toISOString(),
    _demoMode: true,
  };
}

// ── Enhanced Prompt (Signal Engine) ───────────────────────────────────────────

function buildPrompt(company, scrapedText, sourceUrls) {
  return `You are a VC research analyst. Extract a structured enrichment profile from this public web content.

COMPANY: ${company.name} | ${company.sector} | ${company.stage}
DESCRIPTION: ${company.description}

SCRAPED CONTENT:
${scrapedText}

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "summary": "1-2 sentence summary of what the company does and who it serves",
  "whatTheyDo": ["capability 1","capability 2","capability 3","capability 4"],
  "keywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"],
  "signals": [
    {"icon":"🚀","text":"signal about hiring or growth inferred from careers page or job listings","confidence":"high|medium|low"},
    {"icon":"💰","text":"signal about fundraising or revenue inferred from press or about page","confidence":"high|medium|low"},
    {"icon":"📝","text":"signal about product activity inferred from blog, changelog, or features page","confidence":"high|medium|low"},
    {"icon":"🤝","text":"signal about partnerships or integrations inferred from partner/integration pages","confidence":"high|medium|low"}
  ],
  "sources": ${JSON.stringify(sourceUrls)},
  "scrapedAt": "${new Date().toISOString()}"
}

SIGNAL EXTRACTION RULES:
- Detect HIRING signals: look for careers page, job listings, team growth mentions. Confidence "high" if actual job listings found, "medium" if only careers page exists.
- Detect FUNDRAISING signals: look for press releases, funding announcements, investor mentions. Confidence "high" if specific amounts mentioned.
- Detect PRODUCT signals: look for changelogs, new feature announcements, pricing pages, product launches. Confidence "high" if recent dates.
- Detect PARTNERSHIP signals: look for integration pages, partner logos, ecosystem mentions. Confidence "medium" if generic partner mentions.
- Only include 2-4 signals total, only those you can actually infer from the scraped content.
- Set confidence to "high" when directly supported by scraped text, "medium" for reasonable inferences, "low" for weak signals.`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Rate Limiting ───────────────────────────────────────────────────────────
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.socket?.remoteAddress
    || "unknown";
  const rl = limiter.check(ip);
  if (!rl.ok) {
    return res.status(429).json({
      error: rl.message,
      retryAfter: rl.retryAfter,
    });
  }

  const { company } = req.body;
  if (!company?.website) {
    return res.status(400).json({ error: "company.website is required" });
  }

  // Detect which provider is configured
  const provider = process.env.GROQ_API_KEY
    ? "groq"
    : process.env.GEMINI_API_KEY
      ? "gemini"
      : process.env.ANTHROPIC_API_KEY
        ? "anthropic"
        : "demo";

  console.log(`[enrich] Provider: ${provider} | Company: ${company.name} | IP: ${ip} | Remaining: ${rl.remaining}`);

  try {
    // ── DEMO MODE ──────────────────────────────────────────────────────────
    if (provider === "demo") {
      console.log("[enrich] Running in DEMO MODE — no API key configured");
      await new Promise((r) => setTimeout(r, 1800));
      const demoSources = [
        `https://${company.website}`,
        `https://${company.website}/about`,
        `https://${company.website}/blog`,
      ];
      return res.status(200).json(demoEnrich(company, demoSources));
    }

    // ── LIVE MODE: queued, scrape then extract ────────────────────────────
    const result = await enqueue(async () => {
      console.log(`[enrich] Scraping ${company.website} via URL Router…`);
      const pages = await routeAndScrape(company.website);

      const sourceUrls = pages.length > 0
        ? pages.map((p) => p.url)
        : [`https://${company.website}`];

      const scrapedText = pages.length > 0
        ? pages.map((p) => `SOURCE: ${p.url}\n\n${p.content}`).join("\n\n---\n\n")
        : `No web content fetched. Use company description:\n${company.description}`;

      const prompt = buildPrompt(company, scrapedText, sourceUrls);

      console.log(`[enrich] Calling ${provider}…`);
      let rawText;
      if (provider === "groq") rawText = await callGroq(prompt);
      else if (provider === "gemini") rawText = await callGemini(prompt);
      else rawText = await callAnthropic(prompt);

      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed.sources?.length) parsed.sources = sourceUrls;

      console.log(`[enrich] Done — ${provider}`);
      return parsed;
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error("[enrich] Error:", err);
    return res.status(500).json({ error: "Enrichment failed", detail: err.message });
  }
}
