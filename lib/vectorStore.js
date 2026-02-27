/**
 * Lightweight TF-IDF vector store for company similarity search.
 * No external dependencies — pure JS implementation.
 *
 * Pre-computes TF-IDF vectors for all mock companies at module load.
 * Cosine similarity to find most similar companies.
 */

import { MOCK_COMPANIES } from "./mockData";

// ── Tokenizer ──────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "he",
    "in", "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "were", "will",
    "with", "this", "but", "they", "not", "no", "do", "so", "if", "we", "our", "their",
    "who", "what", "which", "when", "where", "how", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "than", "too", "very", "can",
]);

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ── Build corpus ───────────────────────────────────────────────────────────────

function buildDocument(company) {
    // Combine description, tags, sector, and name for richer representation
    const parts = [
        company.name,
        company.description,
        company.sector,
        ...company.tags,
        company.stage,
        company.location || "",
    ];
    return tokenize(parts.join(" "));
}

// ── TF-IDF ─────────────────────────────────────────────────────────────────────

function computeTfIdf(docs) {
    const N = docs.length;

    // Document frequency: how many docs contain each term
    const df = {};
    docs.forEach(tokens => {
        const seen = new Set(tokens);
        seen.forEach(t => { df[t] = (df[t] || 0) + 1; });
    });

    // IDF: log(N / df)
    const idf = {};
    Object.keys(df).forEach(t => {
        idf[t] = Math.log(N / df[t]);
    });

    // Build vocabulary (all unique terms)
    const vocab = Object.keys(idf).sort();
    const vocabIndex = {};
    vocab.forEach((t, i) => { vocabIndex[t] = i; });

    // TF-IDF vectors
    const vectors = docs.map(tokens => {
        const tf = {};
        tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });

        // Normalize TF by doc length
        const len = tokens.length || 1;
        const vec = new Float64Array(vocab.length);
        Object.keys(tf).forEach(t => {
            if (vocabIndex[t] !== undefined) {
                vec[vocabIndex[t]] = (tf[t] / len) * (idf[t] || 0);
            }
        });
        return vec;
    });

    return { vocab, vocabIndex, idf, vectors };
}

// ── Cosine Similarity ──────────────────────────────────────────────────────────

function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

// ── Pre-compute at module load ─────────────────────────────────────────────────

const docs = MOCK_COMPANIES.map(buildDocument);
const { vectors } = computeTfIdf(docs);

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Find companies most similar to the given company ID.
 * @param {string} companyId - ID of the target company
 * @param {number} limit - Number of results to return (default 5)
 * @returns {Array<{id, name, sector, stage, similarity}>}
 */
export function findSimilar(companyId, limit = 5) {
    const idx = MOCK_COMPANIES.findIndex(c => c.id === companyId);
    if (idx === -1) return [];

    const targetVec = vectors[idx];

    const scored = MOCK_COMPANIES
        .map((c, i) => ({
            id: c.id,
            name: c.name,
            sector: c.sector,
            stage: c.stage,
            website: c.website,
            thesisScore: c.thesisScore,
            similarity: i === idx ? -1 : cosineSimilarity(targetVec, vectors[i]),
        }))
        .filter(c => c.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    // Round similarity to 2 decimals
    scored.forEach(c => { c.similarity = Math.round(c.similarity * 100) / 100; });

    return scored;
}
