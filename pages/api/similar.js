/**
 * GET /api/similar?id=c1&limit=5
 *
 * Returns the top-N most similar companies using TF-IDF cosine similarity.
 */

import { findSimilar } from "../../lib/vectorStore";

export default function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { id, limit } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Query param 'id' is required" });
    }

    const results = findSimilar(id, Number(limit) || 5);
    return res.status(200).json(results);
}
