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

// ── Scraping via Jina AI Reader ───────────────────────────────────────────────

async function jinaFetch(url) {
  const headers = { Accept: "text/plain", "X-Timeout": "15" };
  if (process.env.JINA_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
  }
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers,
    signal: AbortSignal.timeout(18000),
  });
  if (!res.ok) throw new Error(`Jina ${res.status} for ${url}`);
  return (await res.text()).slice(0, 4000);
}

async function scrapePages(website) {
  const urls = [
    `https://${website}`,
    `https://${website}/about`,
    `https://${website}/blog`,
    `https://${website}/product`,
  ];
  const results = [];
  for (const url of urls) {
    try {
      const content = await jinaFetch(url);
      if (content?.length > 100) results.push({ url, content });
    } catch (e) {
      console.warn(`[enrich] skip ${url}: ${e.message}`);
    }
  }
  return results;
}

// ── LLM Providers ─────────────────────────────────────────────────────────────

/**
 * Groq — FREE, no credit card, very fast (llama3 / mixtral)
 * Sign up: https://console.groq.com
 */
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

/**
 * Google Gemini — Free tier (15 req/min, 1M tokens/day)
 * Sign up: https://aistudio.google.com
 */
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

/**
 * Anthropic — Paid but highest quality
 * Sign up: https://console.anthropic.com
 */
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

/**
 * DEMO MODE — no API key needed, returns convincing simulated data.
 * Great for UI testing and showcasing without spending any credits.
 */
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
      { icon: "💼", text: "Enterprise pricing page detected — suggests active upmarket motion" },
      { icon: "🚀", text: `${company.sector} hiring signals: 3+ open engineering roles visible on careers page` },
      { icon: "📝", text: "Blog or changelog updated recently — active content marketing" },
    ],
    sources: sourceUrls,
    scrapedAt: new Date().toISOString(),
    _demoMode: true,
  };
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

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
    {"icon":"🚀","text":"signal inferred from web content"},
    {"icon":"📝","text":"signal inferred from web content"},
    {"icon":"💼","text":"signal inferred from web content"}
  ],
  "sources": ${JSON.stringify(sourceUrls)},
  "scrapedAt": "${new Date().toISOString()}"
}`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  console.log(`[enrich] Provider: ${provider} | Company: ${company.name}`);

  try {
    // ── DEMO MODE ──────────────────────────────────────────────────────────
    if (provider === "demo") {
      console.log("[enrich] Running in DEMO MODE — no API key configured");
      // Small artificial delay so the loading UI is visible
      await new Promise((r) => setTimeout(r, 1800));
      const demoSources = [
        `https://${company.website}`,
        `https://${company.website}/about`,
        `https://${company.website}/blog`,
      ];
      return res.status(200).json(demoEnrich(company, demoSources));
    }

    // ── LIVE MODE: scrape then extract ────────────────────────────────────
    console.log(`[enrich] Scraping ${company.website}…`);
    const pages = await scrapePages(company.website);

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
    const result = JSON.parse(cleaned);
    if (!result.sources?.length) result.sources = sourceUrls;

    console.log(`[enrich] Done — ${provider}`);
    return res.status(200).json(result);

  } catch (err) {
    console.error("[enrich] Error:", err);
    return res.status(500).json({ error: "Enrichment failed", detail: err.message });
  }
}
