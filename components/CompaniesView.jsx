import { useState, useEffect } from "react";
import { MOCK_COMPANIES } from "../lib/mockData";
import { IcoSearch, IcoChevD, IcoChevU } from "./Icons";

const scoreColor = (s) => s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--red)';
const scoreBg = (s) => s >= 80 ? 'var(--green-bg)' : s >= 60 ? 'var(--orange-bg)' : 'var(--red-bg)';

const PAGE_SIZE = 12;

export default function CompaniesView({ globalQ, onSelect, thesis }) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("thesisScore");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [q, globalQ, filters]);

  const query = (globalQ || "").toLowerCase() + " " + q.toLowerCase();

  let rows = [...MOCK_COMPANIES].filter(c => {
    const hay = (c.name + c.sector + c.tags.join(",") + c.description).toLowerCase();
    if (!query.trim().split(/\s+/).every(w => hay.includes(w))) return false;
    if (filters.sector && c.sector !== filters.sector) return false;
    if (filters.stage && c.stage !== filters.stage) return false;
    return true;
  });

  rows.sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const total = rows.length;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sectors = [...new Set(MOCK_COMPANIES.map(c => c.sector))].sort();
  const stages = [...new Set(MOCK_COMPANIES.map(c => c.stage))].sort();

  const toggleFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: f[key] === val ? null : val }));
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="co-layout">
      {/* FILTER PANEL */}
      <div className="fp">
        <div>
          <div className="fl">Sector</div>
          {sectors.map(s => (
            <button key={s} className={"fc" + (filters.sector === s ? " on" : "")} onClick={() => toggleFilter("sector", s)}>
              {s}
              <span className="fcnt">{MOCK_COMPANIES.filter(c => c.sector === s).length}</span>
            </button>
          ))}
        </div>
        <div>
          <div className="fl">Stage</div>
          {stages.map(s => (
            <button key={s} className={"fc" + (filters.stage === s ? " on" : "")} onClick={() => toggleFilter("stage", s)}>
              {s}
              <span className="fcnt">{MOCK_COMPANIES.filter(c => c.stage === s).length}</span>
            </button>
          ))}
        </div>
        {activeCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({})}>
            Clear filters
          </button>
        )}
        <div style={{ marginTop: "auto", background: "var(--accent-muted)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "12px 13px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <div style={{ color: "var(--accent-text)", fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{thesis.fundName}</div>
          {thesis.sectors.slice(0, 4).join(" · ")}
          {thesis.sectors.length > 4 && " +" + (thesis.sectors.length - 4)}
        </div>
      </div>

      {/* RESULTS */}
      <div className="res">
        <div className="res-hd">
          <div className="sb" style={{ maxWidth: 300 }}>
            <IcoSearch />
            <input placeholder="Search companies…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="res-count"><b>{total}</b> companies</div>
        </div>

        <div className="tw">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort("name")}>Company {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                <th onClick={() => toggleSort("sector")}>Sector</th>
                <th onClick={() => toggleSort("stage")}>Stage</th>
                <th onClick={() => toggleSort("raised")}>Raised</th>
                <th>Tags</th>
                <th onClick={() => toggleSort("thesisScore")} style={{ textAlign: "right" }}>
                  Fit {sortKey === "thesisScore" ? (sortDir === "asc" ? "↑" : "↓") : ""} ▾
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(c => (
                <tr key={c.id} onClick={() => onSelect(c)}>
                  <td>
                    <div className="cn">{c.name}</div>
                    <div className="cd">{c.website}</div>
                  </td>
                  <td>{c.sector}</td>
                  <td><span className="tag">{c.stage}</span></td>
                  <td>{c.raised}</td>
                  <td>
                    {c.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                    {c.tags.length > 2 && <span className="tag">+{c.tags.length - 2}</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="score" style={{ background: scoreBg(c.thesisScore), color: scoreColor(c.thesisScore) }}>
                      {c.thesisScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={"btn btn-sm " + (page === i + 1 ? "btn-primary" : "btn-ghost")} onClick={() => setPage(i + 1)}>
              {i + 1}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
