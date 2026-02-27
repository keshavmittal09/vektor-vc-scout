import { useState } from "react";
import { IcoPlus, IcoList, IcoDownload, IcoTrash, IcoX, IcoChevD, IcoChevU } from "./Icons";

const scoreColor = (s) => s >= 80 ? '#30d158' : s >= 60 ? '#ff9f0a' : '#ff453a';
const scoreBg = (s) => s >= 80 ? 'rgba(48,209,88,0.12)' : s >= 60 ? 'rgba(255,159,10,0.12)' : 'rgba(255,69,58,0.12)';

export default function ListsView({ lists, setLists, onSelectCompany }) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState({});
  const [slackStatus, setSlackStatus] = useState(null);

  const shareToSlack = async (list) => {
    setSlackStatus(list.id);
    try {
      const res = await fetch("/api/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error);
      }
      setSlackStatus(list.id + "_ok");
      setTimeout(() => setSlackStatus(null), 2500);
    } catch {
      setSlackStatus(list.id + "_err");
      setTimeout(() => setSlackStatus(null), 3000);
    }
  };

  const create = () => {
    if (!name.trim()) return;
    setLists(p => [...p, { id: "l" + Date.now(), name: name.trim(), companies: [], createdAt: new Date().toISOString() }]);
    setName("");
  };

  const removeCompany = (lid, cid) =>
    setLists(p => p.map(l => l.id !== lid ? l : { ...l, companies: l.companies.filter(c => c.id !== cid) }));

  const deleteList = id => setLists(p => p.filter(l => l.id !== id));

  const exportCSV = list => {
    const rows = [
      ["Name", "Website", "Sector", "Stage", "Raised", "Thesis Score"],
      ...list.companies.map(c => [c.name, c.website, c.sector, c.stage, c.raised, c.thesisScore]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = list.name.replace(/\s+/g, "-").toLowerCase() + ".csv";
    a.click();
  };

  const exportJSON = list => {
    const blob = new Blob([JSON.stringify(list.companies, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = list.name.replace(/\s+/g, "-").toLowerCase() + ".json";
    a.click();
  };

  return (
    <div className="ll">
      {/* Create */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="ifield"
          placeholder="New list name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && create()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={create}><IcoPlus />Create List</button>
      </div>

      {lists.length === 0 && (
        <div className="emp">
          <div style={{ fontSize: 32 }}>📂</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-tertiary)' }}>No lists yet</div>
          <div style={{ fontSize: 13 }}>Create a list and save companies from any company profile.</div>
        </div>
      )}

      {lists.map(list => (
        <div key={list.id} className="lcard">
          <div className="lch" onClick={() => setOpen(o => ({ ...o, [list.id]: !o[list.id] }))}>
            <IcoList />
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-.01em' }}>{list.name}</span>
            <span className="nav-badge">{list.companies.length}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(list)}><IcoDownload />CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportJSON(list)}><IcoDownload />JSON</button>
              <button className="btn btn-ghost btn-sm" onClick={() => shareToSlack(list)} disabled={slackStatus === list.id}>
                {slackStatus === list.id ? "…" : slackStatus === list.id + "_ok" ? "✓" : "💬"}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteList(list.id)}><IcoTrash /></button>
            </div>
            {open[list.id] ? <IcoChevU /> : <IcoChevD />}
          </div>

          {open[list.id] && (
            <div className="lcb">
              {list.companies.length === 0 && (
                <div style={{ padding: "10px 14px", color: "#3d4258", fontSize: 12 }}>
                  No companies saved. Open a profile and click Save.
                </div>
              )}
              {list.companies.map(c => (
                <div key={c.id} className="lcr" onClick={() => onSelectCompany(c)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: "#e0e4f0", fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#3d4258" }}>{c.sector} · {c.stage}</div>
                  </div>
                  <span className="score" style={{ background: scoreBg(c.thesisScore), color: scoreColor(c.thesisScore), fontSize: 11 }}>
                    {c.thesisScore}
                  </span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: "3px 6px" }}
                    onClick={e => { e.stopPropagation(); removeCompany(list.id, c.id); }}>
                    <IcoX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
