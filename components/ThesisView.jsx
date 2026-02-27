import { useState } from "react";
import { MOCK_COMPANIES } from "../lib/mockData";
import { IcoSave } from "./Icons";

const scoreColor = (s) => s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--red)';

export default function ThesisView({ thesis, setThesis, showToast }) {
  const [local, setLocal] = useState(thesis);

  const upd = (k, v) => setLocal(p => ({ ...p, [k]: v }));
  const save = () => { setThesis(local); showToast("Thesis saved — scores updated"); };

  const preview = MOCK_COMPANIES.slice(0, 5).map(c => ({ name: c.name, score: c.thesisScore }));

  return (
    <div className="tl">
      <div>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-.02em" }}>Fund Thesis Configuration</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Define your investment parameters. These drive scoring and match explanations across the platform.
        </p>
      </div>

      <div className="tc">
        <div className="fl">Fund Name</div>
        <input className="ifield" value={local.fundName} onChange={e => upd("fundName", e.target.value)} placeholder="e.g. Vektor Ventures" />
      </div>

      <div className="tc">
        <div className="fl">Target Sectors</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {["AI/ML", "Cybersecurity", "Fintech", "Enterprise SaaS", "Dev Tools", "Climate Tech", "Health Tech", "Energy Tech", "Biotech", "EdTech"].map(s => (
            <button key={s}
              className={"tag" + (local.sectors.includes(s) ? "" : "")}
              style={local.sectors.includes(s) ? { background: "var(--accent-muted)", color: "var(--accent-text)", borderColor: "var(--accent)", cursor: "pointer" } : { cursor: "pointer" }}
              onClick={() => upd("sectors", local.sectors.includes(s) ? local.sectors.filter(x => x !== s) : [...local.sectors, s])}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="tc">
        <div className="fl">Target Stages</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {["Pre-Seed", "Seed", "Series A", "Series B"].map(s => (
            <button key={s}
              className="tag"
              style={local.stages.includes(s) ? { background: "var(--accent-muted)", color: "var(--accent-text)", borderColor: "var(--accent)", cursor: "pointer" } : { cursor: "pointer" }}
              onClick={() => upd("stages", local.stages.includes(s) ? local.stages.filter(x => x !== s) : [...local.stages, s])}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="tc">
        <div className="fl">Check Size Range</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input className="ifield" value={local.checkMin} onChange={e => upd("checkMin", e.target.value)} placeholder="Min (e.g. $100K)" />
          <input className="ifield" value={local.checkMax} onChange={e => upd("checkMax", e.target.value)} placeholder="Max (e.g. $2M)" />
        </div>
      </div>

      <div className="tc">
        <div className="fl">Keywords &amp; Themes</div>
        <textarea className="ifield" rows={3} value={local.keywords} onChange={e => upd("keywords", e.target.value)}
          placeholder="Comma-separated: foundation model, autonomous agents, …" />
      </div>

      <div className="tc">
        <div className="fl">Min Score Threshold</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="range" min={0} max={100} value={local.minScore}
            onChange={e => upd("minScore", Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--accent)" }} />
          <span style={{ fontWeight: 800, fontSize: 20, color: scoreColor(local.minScore), minWidth: 32, textAlign: "right", letterSpacing: "-.03em" }}>
            {local.minScore}
          </span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={save}><IcoSave />Save Thesis</button>

      <div style={{ background: "var(--accent-muted)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "14px 16px", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
        <div style={{ color: "var(--accent-text)", fontWeight: 700, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
          How Scoring Works
        </div>
        Scores are computed from sector overlap, stage fit, keyword matches in tags and descriptions, signal quality, and raise alignment to your check size. Every score surfaces plain-language reasons on the company profile — so every recommendation is explainable.
      </div>

      <div className="tc">
        <div className="fl">Top Preview</div>
        {preview.map(c => (
          <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.name}</span>
            <span style={{ fontWeight: 700, color: scoreColor(c.score), letterSpacing: "-.02em" }}>{c.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
