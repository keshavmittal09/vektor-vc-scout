import { useState, useEffect } from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import { SIGNAL_COLORS } from "../lib/mockData";
import {
  IcoX, IcoDownload, IcoBookmark, IcoTarget, IcoGlobe, IcoExtLink,
  IcoList, IcoZap, IcoCheck,
} from "./Icons";

const scoreColor = (s) => s >= 80 ? "#00d4a0" : s >= 60 ? "#f5a623" : "#f06060";
const scoreBg = (s) => s >= 80 ? "rgba(0,212,160,0.12)" : s >= 60 ? "rgba(245,166,35,0.12)" : "rgba(240,96,96,0.12)";

const CONF_COLORS = { high: "#00d4a0", medium: "#f5a623", low: "#6b7490" };

export default function ProfilePanel({ company, onClose, lists, onAddToList, enrichCache, onEnrich }) {
  const [note, setNote] = useLocalStorage("note_" + company.id, "");
  const [enriching, setEnriching] = useState(false);
  const [enrichErr, setEnrichErr] = useState(null);
  const [listPicker, setListPicker] = useState(false);
  const [shareDrop, setShareDrop] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [slackStatus, setSlackStatus] = useState(null);

  const enrichData = enrichCache[company.id];

  // Fetch similar companies
  useEffect(() => {
    fetch(`/api/similar?id=${company.id}&limit=4`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSimilar(d); })
      .catch(() => { });
  }, [company.id]);

  const reasons = [
    company.thesisScore >= 80 ? "Strong sector alignment with fund thesis" : "Partial sector match — secondary thesis fit",
    company.tags.some(t => t === "AI" || t === "ML") ? "AI-native product architecture detected" : "Technology-forward approach identified",
    (company.stage === "Seed" || company.stage === "Pre-Seed")
      ? "Ideal entry stage (" + company.stage + ")"
      : "Stage " + company.stage + " — evaluate entry timing",
    parseFloat((company.raised || "0").replace(/[^0-9.]/g, "")) < 10
      ? "Capital-efficient trajectory fits check size"
      : "Significant prior institutional backing",
  ];

  const doEnrich = async () => {
    setEnriching(true);
    setEnrichErr(null);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Server error " + res.status);
      }
      const data = await res.json();
      onEnrich(company.id, data);
    } catch (e) {
      console.error("[ProfilePanel] Enrichment error:", e);
      setEnrichErr(e.message || "Enrichment failed — check console.");
    }
    setEnriching(false);
  };

  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ ...company, note, enrichment: enrichData || null }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = company.name.replace(/\s+/g, "-").toLowerCase() + ".json";
    a.click();
  };

  // ── Share Actions ──────────────────────────────────────────────────────────
  const shareToSlack = async () => {
    setSlackStatus("sending");
    try {
      const res = await fetch("/api/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error);
      }
      setSlackStatus("sent");
      setTimeout(() => setSlackStatus(null), 2500);
    } catch (e) {
      setSlackStatus("error: " + e.message);
      setTimeout(() => setSlackStatus(null), 4000);
    }
    setShareDrop(false);
  };

  const shareViaEmail = () => {
    const sub = encodeURIComponent(`Vektor: ${company.name} — ${company.sector} (Score ${company.thesisScore})`);
    const body = encodeURIComponent(
      `${company.name}\n${company.sector} · ${company.stage} · Raised ${company.raised}\nThesis Fit: ${company.thesisScore}/100\n\n${company.description}\n\nhttps://${company.website}`
    );
    window.open(`mailto:?subject=${sub}&body=${body}`, "_self");
    setShareDrop(false);
  };

  const copyToClipboard = () => {
    const text = `${company.name} — ${company.sector} · ${company.stage}\nThesis Fit: ${company.thesisScore}/100\n${company.description}\nhttps://${company.website}`;
    navigator.clipboard.writeText(text);
    setShareDrop(false);
  };

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pp">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="ph">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                <h2 style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', letterSpacing: '-.02em' }}>{company.name}</h2>
                <span className="score" style={{ background: scoreBg(company.thesisScore), color: scoreColor(company.thesisScore) }}>
                  <IcoTarget />{company.thesisScore} Fit
                </span>
              </div>
              <a href={"https://" + company.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                style={{ color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', transition: 'opacity .15s' }}>
                <IcoGlobe />{company.website}<IcoExtLink />
              </a>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {/* Share dropdown */}
              <div style={{ position: "relative" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShareDrop(v => !v)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  Share
                </button>
                {shareDrop && (
                  <div className="share-drop">
                    <div className="share-opt" onClick={shareToSlack}>
                      <span>💬</span> Send to Slack
                    </div>
                    <div className="share-opt" onClick={shareViaEmail}>
                      <span>📧</span> Email
                    </div>
                    <div className="share-opt" onClick={copyToClipboard}>
                      <span>📋</span> Copy to clipboard
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={exportJSON}><IcoDownload />Export</button>
              <button className="btn btn-primary btn-sm" onClick={() => setListPicker(v => !v)}><IcoBookmark />Save</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: "4px 7px" }} onClick={onClose}><IcoX /></button>
            </div>
          </div>

          {/* Slack status toast */}
          {slackStatus && (
            <div style={{
              marginTop: 6, fontSize: 11, padding: "4px 10px", borderRadius: 6,
              background: slackStatus === "sent" ? "rgba(0,212,160,.12)" : slackStatus === "sending" ? "rgba(79,124,255,.12)" : "rgba(240,96,96,.12)",
              color: slackStatus === "sent" ? "#00d4a0" : slackStatus === "sending" ? "#4f7cff" : "#f06060"
            }}>
              {slackStatus === "sending" ? "Sending to Slack…" : slackStatus === "sent" ? "✓ Sent to Slack" : slackStatus}
            </div>
          )}

          {/* List picker dropdown */}
          {listPicker && (
            <div style={{ marginTop: 10, background: "#0f1018", border: "1px solid #181b25", borderRadius: 7, overflow: "hidden" }}>
              {lists.length === 0
                ? <div style={{ padding: "10px 13px", color: "#3d4258", fontSize: 12 }}>No lists yet. Create one in the Lists view.</div>
                : lists.map(l => (
                  <div key={l.id}
                    style={{ padding: "8px 13px", cursor: "pointer", fontSize: 12.5, color: "#b0b8d0", borderBottom: "1px solid #0f1018", display: "flex", alignItems: "center", gap: 8 }}
                    onClick={() => { onAddToList(l.id, company); setListPicker(false); }}>
                    <IcoList />{l.name}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#3d4258" }}>{l.companies.length} co.</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="pb">
          {/* Overview */}
          <div className="ps">
            <div className="stitle">Overview</div>
            <p style={{ fontSize: 13, color: "#b0b8d0", lineHeight: 1.65 }}>{company.description}</p>
            <div className="mgrid">
              {[
                ["Sector", company.sector], ["Stage", company.stage],
                ["Founded", company.founded], ["Employees", company.employees],
                ["Location", company.location], ["ARR", company.arr || "N/A"],
                ["Raised", company.raised],
              ].map(([k, v]) => (
                <div className="mi" key={k}>
                  <div className="mk">{k}</div>
                  <div className="mv">{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {company.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>

          {/* Thesis Fit */}
          <div className="ps">
            <div className="stitle">Thesis Fit Analysis</div>
            <div className="sbox">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: scoreColor(company.thesisScore), letterSpacing: '-.03em' }}>
                  {company.thesisScore}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#3d4258", marginBottom: 5, fontWeight: 700, letterSpacing: .5 }}>MATCH SCORE</div>
                  <div className="strack">
                    <div className="sfill" style={{ width: company.thesisScore + "%", background: scoreColor(company.thesisScore) }} />
                  </div>
                </div>
              </div>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5, color: "#b0b8d0", padding: "3px 0" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: i < 2 ? "#4f7cff" : i === 2 ? "#00d4a0" : "#6b7490", flexShrink: 0, marginTop: 6 }} />
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Signals */}
          <div className="ps">
            <div className="stitle">Signals Timeline</div>
            {company.signals.map((s, i) => (
              <div key={i} className="sig-row">
                <div className="sig-dot" style={{ background: SIGNAL_COLORS[s.type] || "#3d4258" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                    <span className="sig-type" style={{ color: SIGNAL_COLORS[s.type] || "#3d4258" }}>{s.type}</span>
                    <span className="sig-date">{s.date}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#b0b8d0" }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Enrichment */}
          <div className="ps">
            <div className="stitle" style={{ display: "flex", alignItems: "center", borderBottom: "none", paddingBottom: 0 }}>
              Live Enrichment
              <div style={{ marginLeft: "auto" }}>
                {!enriching && (
                  <button className="btn btn-primary btn-sm" onClick={doEnrich}>
                    <IcoZap />{enrichData ? "Re-enrich" : "Enrich with AI"}
                  </button>
                )}
              </div>
            </div>
            <div className="eb">
              {enriching && (
                <div className="empty-e">
                  <div className="dots"><span /><span /><span /></div>
                  <div style={{ fontSize: 12, color: "#3d4258" }}>Fetching public pages via Jina AI and extracting fields…</div>
                </div>
              )}
              {!enriching && enrichErr && (
                <div style={{ color: "#f06060", fontSize: 12, lineHeight: 1.6 }}>
                  ⚠️ {enrichErr}
                </div>
              )}
              {!enriching && !enrichData && !enrichErr && (
                <div className="empty-e">
                  <div style={{ fontSize: 30 }}>🔍</div>
                  <div style={{ fontSize: 13 }}>Click &quot;Enrich with AI&quot; to pull live data</div>
                  <div style={{ fontSize: 11, color: "#252838" }}>
                    Fetches public pages only · Sources shown · Cached per company
                  </div>
                </div>
              )}
              {enrichData && !enriching && (
                <>
                  <div>
                    <div className="fl" style={{ marginBottom: 5 }}>Summary</div>
                    <p style={{ fontSize: 12.5, color: "#b0b8d0", lineHeight: 1.6 }}>{enrichData.summary}</p>
                  </div>
                  <div>
                    <div className="fl" style={{ marginBottom: 5 }}>What They Do</div>
                    {enrichData.whatTheyDo.map((b, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, fontSize: 12.5, color: "#b0b8d0", padding: "2px 0" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4a0", flexShrink: 0, marginTop: 6 }} />
                        {b}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="fl" style={{ marginBottom: 5 }}>Keywords</div>
                    <div>{enrichData.keywords.map(k => <span key={k} className="ekw">{k}</span>)}</div>
                  </div>
                  <div>
                    <div className="fl" style={{ marginBottom: 5 }}>Derived Signals</div>
                    {enrichData.signals.map((s, i) => (
                      <div key={i} className="esig">
                        <span>{s.icon}</span>
                        <span style={{ flex: 1 }}>{s.text}</span>
                        {s.confidence && (
                          <span className="conf-badge" style={{
                            color: CONF_COLORS[s.confidence] || "#6b7490",
                            borderColor: (CONF_COLORS[s.confidence] || "#6b7490") + "40",
                          }}>
                            {s.confidence}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="fl" style={{ marginBottom: 5 }}>
                      Sources · {new Date(enrichData.scrapedAt).toLocaleString()}
                    </div>
                    {enrichData.sources.map((s, i) => (
                      <div key={i} className="esrc"><IcoExtLink />{s}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Similar Companies (Vector Store) */}
          {similar.length > 0 && (
            <div className="ps">
              <div className="stitle">Similar Companies</div>
              <div className="sim-grid">
                {similar.map(s => (
                  <div key={s.id} className="sim-card">
                    <div style={{ fontWeight: 600, color: "#e0e4f0", fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#3d4258", marginTop: 2 }}>{s.sector} · {s.stage}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <span className="score" style={{ background: scoreBg(s.thesisScore), color: scoreColor(s.thesisScore), fontSize: 11 }}>
                        {s.thesisScore}
                      </span>
                      <span style={{ fontSize: 10, color: "#3d4258" }}>{Math.round(s.similarity * 100)}% match</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Notes */}
          <div className="ps">
            <div className="stitle">Analyst Notes</div>
            <textarea
              className="narea"
              placeholder="Add your analyst notes…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div style={{ fontSize: 11, color: "#252838", textAlign: "right" }}>Auto-saved to localStorage</div>
          </div>
        </div>
      </div>
    </div>
  );
}
