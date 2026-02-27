/**
 * POST /api/slack
 *
 * Sends a company or list summary to a Slack webhook.
 * Requires SLACK_WEBHOOK_URL environment variable.
 *
 * Body: { company: {...} } or { list: { name, companies: [...] } }
 */

function buildCompanyBlocks(c) {
    return [
        {
            type: "header",
            text: { type: "plain_text", text: `🔍 ${c.name}`, emoji: true },
        },
        {
            type: "section",
            fields: [
                { type: "mrkdwn", text: `*Sector:* ${c.sector}` },
                { type: "mrkdwn", text: `*Stage:* ${c.stage}` },
                { type: "mrkdwn", text: `*Raised:* ${c.raised || "N/A"}` },
                { type: "mrkdwn", text: `*Thesis Fit:* ${c.thesisScore}/100` },
            ],
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: c.description },
        },
        {
            type: "context",
            elements: [
                { type: "mrkdwn", text: `🌐 <https://${c.website}|${c.website}>  |  Tags: ${c.tags?.join(", ") || "—"}` },
            ],
        },
        { type: "divider" },
    ];
}

function buildListBlocks(list) {
    const header = [
        {
            type: "header",
            text: { type: "plain_text", text: `📋 List: ${list.name}`, emoji: true },
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: `*${list.companies.length} companies* in this list` },
        },
        { type: "divider" },
    ];

    const rows = list.companies.slice(0, 10).map(c => ({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*${c.name}* — ${c.sector} · ${c.stage} · Score ${c.thesisScore}`,
        },
    }));

    if (list.companies.length > 10) {
        rows.push({
            type: "context",
            elements: [{ type: "mrkdwn", text: `_…and ${list.companies.length - 10} more_` }],
        });
    }

    return [...header, ...rows];
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        return res.status(501).json({
            error: "Slack not configured",
            detail: "Set SLACK_WEBHOOK_URL in environment variables.",
        });
    }

    const { company, list } = req.body;
    if (!company && !list) {
        return res.status(400).json({ error: "Provide company or list in request body" });
    }

    const blocks = company ? buildCompanyBlocks(company) : buildListBlocks(list);

    try {
        const slackRes = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocks }),
        });

        if (!slackRes.ok) {
            const err = await slackRes.text();
            throw new Error(`Slack responded ${slackRes.status}: ${err}`);
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("[slack] Error:", err);
        return res.status(500).json({ error: "Failed to send to Slack", detail: err.message });
    }
}
