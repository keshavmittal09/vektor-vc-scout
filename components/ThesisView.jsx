import { useState } from "react";
import { MOCK_COMPANIES } from "../lib/mockData";
import { IcoSave } from "./Icons";

const scoreColor = (s) => s >= 80 ? '#30d158' : s >= 60 ? '#ff9f0a' : '#ff453a';

export default function ThesisView({ thesis, setThesis, showToast }) {
  const [local, setLocal] = useState(thesis);
  const upd = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const allSectors = [...new Set(MOCK_COMPANIES.map(c => c.sector))].sort();
  const allStages = [...new Set(MOCK_COMPANIES.map(c => c.stage))].sort();
  const togArr = (k, v) => setLocal(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));

  const save = () => { setThesis(local); showToast("Thesis configuration saved"); };

  return (
    <div className="tl">
      <div>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-.02em' }}>Fund Thesis Configuration</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
          Define your investment parameters. These drive scoring and match explanations across the platform.
        </p>
      </div>

      <div className="tc">
        <div className="fl">Fund Name</div>
        <input className="ifield" value={local.fundName} onChange={e => upd("fundName", e.target.value)} placeholder="e.g. Apex Ventures" />
      </div>

      <div className="tc">
        <div className="fl">Thesis Statement</div>
        <textarea className="ifield" value={local.thesis} onChange={e => upd("thesis", e.target.value)} placeholder="Describe your investment thesis in natural language…" />
        <div style={{ fontSize: 11, color: "#252838" }}>Used to generate match explanations on company profiles.</div>
      </div>

      <div className="tc">
        <div className="fl" style={{ marginBottom: 8 }}>Target Sectors</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {allSectors.map(s => (
            <button key={s} className={"fc" + (local.sectors.includes(s) ? " on" : "")}
              style={{ width: "auto", justifyContent: "flex-start" }}
              onClick={() => togArr("sectors", s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="tc">
        <div className="fl" style={{ marginBottom: 8 }}>Target Stages</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {allStages.map(s => (
            <button key={s} className={"fc" + (local.stages.includes(s) ? " on" : "")}
              style={{ width: "auto", justifyContent: "flex-start" }}
              onClick={() => togArr("stages", s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="tc">
        <div className="fl">
          Keywords{" "}
          <span style={{ color: "#252838", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(comma-separated)</span>
        </div>
        <input
          className="ifield"
          value={local.keywords.join(", ")}
          onChange={e => upd("keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
          placeholder="AI, B2B, infrastructure, SaaS…"
        />
      </div>

      <div className="tc">
        <div className="fl">Minimum Fit Score to Surface</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="range" min={0} max={100} value={local.minScore}
            onChange={e => upd("minScore", Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)' }} />
          <span style={{ fontWeight: 800, fontSize: 20, color: scoreColor(local.minScore), minWidth: 32, textAlign: 'right', letterSpacing: '-.03em' }}>
            {local.minScore}
          </span>
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 14 }} onClick={save}>
        <IcoSave />Save Thesis
      </button>

      <div style={{ background: "rgba(79,124,255,.07)", border: "1px solid rgba(79,124,255,.18)", borderRadius: 9, padding: "13px 15px", fontSize: 12, color: "#6b7490", lineHeight: 1.7 }}>
        <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }}>
          How Scoring Works
        </div>
        Scores are computed from sector overlap, stage fit, keyword matches in tags and descriptions, signal quality, and raise alignment to your check size. Every score surfaces plain-language reasons on the company profile — so every recommendation is explainable.
      </div>
    </div>
  );
}
