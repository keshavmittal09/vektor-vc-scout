import { useState, useEffect } from "react";
import { MOCK_COMPANIES } from "../lib/mockData";
import { IcoSearch, IcoChevD, IcoChevU } from "./Icons";

const scoreColor = (s) => s >= 80 ? '#30d158' : s >= 60 ? '#ff9f0a' : '#ff453a';
const scoreBg = (s) => s >= 80 ? 'rgba(48,209,88,0.12)' : s >= 60 ? 'rgba(255,159,10,0.12)' : 'rgba(255,69,58,0.12)';

const PAGE_SIZE = 12;

export default function CompaniesView({ onSelect, thesis, globalQ }) {
  const [q, setQ] = useState(globalQ || "");
  const [sectors, setSectors] = useState([]);
  const [stages, setStages] = useState([]);
  const [sort, setSort] = useState({ col: "thesisScore", dir: "desc" });
  const [page, setPage] = useState(1);

  useEffect(() => { setQ(globalQ || ""); setPage(1); }, [globalQ]);

  const allSectors = [...new Set(MOCK_COMPANIES.map(c => c.sector))].sort();
  const allStages = [...new Set(MOCK_COMPANIES.map(c => c.stage))].sort();

  const tog = (arr, setArr, v) => {
    setArr(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    setPage(1);
  };

  const filtered = MOCK_COMPANIES.filter(c => {
    const ql = q.toLowerCase();
    if (ql && !c.name.toLowerCase().includes(ql) && !c.description.toLowerCase().includes(ql) && !c.tags.some(t => t.toLowerCase().includes(ql))) return false;
    if (sectors.length && !sectors.includes(c.sector)) return false;
    if (stages.length && !stages.includes(c.stage)) return false;
    return true;
  }).sort((a, b) => {
    const [av, bv] = [a[sort.col], b[sort.col]];
    if (typeof av === "number") return sort.dir === "asc" ? av - bv : bv - av;
    return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sortBy = col => setSort(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));
  const SortIco = ({ col }) => sort.col === col ? (sort.dir === "asc" ? <IcoChevU /> : <IcoChevD />) : null;

  const secCnt = Object.fromEntries(allSectors.map(s => [s, MOCK_COMPANIES.filter(c => c.sector === s).length]));
  const stgCnt = Object.fromEntries(allStages.map(s => [s, MOCK_COMPANIES.filter(c => c.stage === s).length]));

  return (
    <div className="co-layout" style={{ flex: 1, overflow: "hidden" }}>
      {/* FILTER SIDEBAR */}
      <div className="fp">
        <div>
          <div className="fl">Sector</div>
          {allSectors.map(s => (
            <button key={s} className={"fc" + (sectors.includes(s) ? " on" : "")} onClick={() => tog(sectors, setSectors, s)}>
              <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
              <span className="fcnt">{secCnt[s]}</span>
            </button>
          ))}
        </div>
        <div>
          <div className="fl">Stage</div>
          {allStages.map(s => (
            <button key={s} className={"fc" + (stages.includes(s) ? " on" : "")} onClick={() => tog(stages, setStages, s)}>
              <span style={{ fontSize: 12 }}>{s}</span>
              <span className="fcnt">{stgCnt[s]}</span>
            </button>
          ))}
        </div>
        {(sectors.length > 0 || stages.length > 0) && (
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}
            onClick={() => { setSectors([]); setStages([]); setPage(1); }}>
            Clear filters
          </button>
        )}
        <div style={{ marginTop: "auto", background: "rgba(41,151,255,.06)", border: "1px solid rgba(41,151,255,.12)", borderRadius: 12, padding: "12px 13px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{thesis.fundName}</div>
          {thesis.sectors.slice(0, 4).join(" · ")}
          {thesis.sectors.length > 4 && " +" + (thesis.sectors.length - 4)}
        </div>
      </div>

      {/* TABLE */}
      <div className="res">
        <div className="res-hd">
          <div className="sb" style={{ maxWidth: 300 }}>
            <IcoSearch />
            <input placeholder="Search companies…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
          <div className="res-count"><b>{filtered.length}</b> companies</div>
          {(sectors.length > 0 || stages.length > 0 || q) && (
            <span style={{ fontSize: 11, color: "#4f7cff", background: "rgba(79,124,255,.1)", padding: "3px 9px", borderRadius: 20, border: "1px solid rgba(79,124,255,.25)" }}>
              Filtered
            </span>
          )}
        </div>

        <div className="tw">
          <table>
            <thead>
              <tr>
                <th onClick={() => sortBy("name")}>Company <SortIco col="name" /></th>
                <th onClick={() => sortBy("sector")}>Sector <SortIco col="sector" /></th>
                <th onClick={() => sortBy("stage")}>Stage <SortIco col="stage" /></th>
                <th onClick={() => sortBy("raised")}>Raised <SortIco col="raised" /></th>
                <th>Tags</th>
                <th onClick={() => sortBy("thesisScore")} style={{ textAlign: "right" }}>Fit <SortIco col="thesisScore" /></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id} onClick={() => onSelect(c)}>
                  <td>
                    <div className="cn">{c.name}</div>
                    <div className="cd">{c.website}</div>
                  </td>
                  <td style={{ color: "#b0b8d0" }}>{c.sector}</td>
                  <td><span className="tag">{c.stage}</span></td>
                  <td style={{ fontVariantNumeric: "tabular-nums", color: "#b0b8d0" }}>{c.raised}</td>
                  <td>
                    {c.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                    {c.tags.length > 2 && <span className="tag">+{c.tags.length - 2}</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="score" style={{ background: scoreBg(c.thesisScore), color: scoreColor(c.thesisScore), marginLeft: "auto" }}>
                      {c.thesisScore}
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#3d4258" }}>
                    No companies match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="pager">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={"btn btn-sm " + (p === page ? "btn-primary" : "btn-ghost")}
                style={{ minWidth: 30, justifyContent: "center" }} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
