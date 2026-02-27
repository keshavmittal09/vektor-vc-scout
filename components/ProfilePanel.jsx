import { useState } from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import { SIGNAL_COLORS } from "../lib/mockData";
import {
  IcoX, IcoDownload, IcoBookmark, IcoTarget, IcoGlobe, IcoExtLink,
  IcoList, IcoZap, IcoCheck,
} from "./Icons";

const scoreColor = (s) => s >= 80 ? "#00d4a0" : s >= 60 ? "#f5a623" : "#f06060";
const scoreBg = (s) => s >= 80 ? "rgba(0,212,160,0.12)" : s >= 60 ? "rgba(245,166,35,0.12)" : "rgba(240,96,96,0.12)";

export default function ProfilePanel({ company, onClose, lists, onAddToList, enrichCache, onEnrich }) {
  const [note, setNote] = useLocalStorage("note_" + company.id, "");
  const [enriching, setEnriching] = useState(false);
  const [enrichErr, setEnrichErr] = useState(null);
  const [listPicker, setListPicker] = useState(false);

  const enrichData = enrichCache[company.id];

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

  /**
   * Calls the server-side /api/enrich endpoint.
   * API key never touches the browser.
   */
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
        throw new Error(err.detail || "Server error " + res.status);
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

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pp">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="ph">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 19, color: "#e0e4f0" }}>{company.name}</h2>
                <span className="score" style={{ background: scoreBg(company.thesisScore), color: scoreColor(company.thesisScore) }}>
                  <IcoTarget />{company.thesisScore} Fit
                </span>
              </div>
              <a href={"https://" + company.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                style={{ color: "#4f7cff", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                <IcoGlobe />{company.website}<IcoExtLink />
              </a>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={exportJSON}><IcoDownload />Export</button>
              <button className="btn btn-primary btn-sm" onClick={() => setListPicker(v => !v)}><IcoBookmark />Save</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: "4px 7px" }} onClick={onClose}><IcoX /></button>
            </div>
          </div>

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
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: scoreColor(company.thesisScore) }}>
                  {company.thesisScore}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#3d4258", marginBottom: 5, fontFamily: "'Syne',sans-serif", fontWeight: 700, letterSpacing: .5 }}>MATCH SCORE</div>
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
                      <div key={i} className="esig"><span>{s.icon}</span><span>{s.text}</span></div>
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
