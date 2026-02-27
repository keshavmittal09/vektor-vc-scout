import { useState } from "react";
import Head from "next/head";
import { useLocalStorage } from "../lib/useLocalStorage";
import { DEFAULT_THESIS } from "../lib/mockData";
import Sidebar from "../components/Sidebar";
import CompaniesView from "../components/CompaniesView";
import ProfilePanel from "../components/ProfilePanel";
import ListsView from "../components/ListsView";
import SavedView from "../components/SavedView";
import ThesisView from "../components/ThesisView";
import { IcoSearch, IcoLogo, IcoSave, IcoCheck, IcoSun, IcoMoon } from "../components/Icons";
import { useEffect } from "react";

/* ── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <IcoCheck />{msg}
    </div>
  );
}

/* ── Save Search Modal ───────────────────────────────────────────────────── */
function SaveModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-center">
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: '-.02em' }}>
          Save Search
        </div>
        <input
          className="ifield"
          placeholder="Name this search…"
          value={name}
          autoFocus
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) onSave(name.trim()); }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Root Page ───────────────────────────────────────────────────────────── */
export default function Home({ theme, toggleTheme }) {
  const [view, setView] = useState("companies");
  const [selected, setSelected] = useState(null);
  const [lists, setLists] = useLocalStorage("vk_lists", []);
  const [saved, setSaved] = useLocalStorage("vk_saved", []);
  const [cache, setCache] = useLocalStorage("vk_enrich", {});
  const [thesis, setThesis] = useLocalStorage("vk_thesis", DEFAULT_THESIS);
  const [toast, setToast] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [globalQ, setGlobalQ] = useState("");

  const showToast = msg => setToast(msg);

  const addToList = (lid, company) => {
    setLists(p => p.map(l => {
      if (l.id !== lid) return l;
      if (l.companies.find(c => c.id === company.id)) return l;
      return { ...l, companies: [...l.companies, company] };
    }));
    showToast("Added to list");
  };

  const handleEnrich = (cid, data) => {
    setCache(p => ({ ...p, [cid]: data }));
    showToast("Enrichment complete");
  };

  const saveSearch = name => {
    setSaved(p => [...p, { id: "s" + Date.now(), name, q: globalQ, savedAt: new Date().toISOString() }]);
    setShowSave(false);
    showToast("Search saved");
  };

  const runSaved = s => {
    setGlobalQ(s.q || "");
    setView("companies");
  };

  return (
    <>
      <Head>
        <title>Vektor — AI Scout for VCs</title>
        <meta name="description" content="Precision AI sourcing for venture capital funds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app">
        {/* ── TOPBAR ───────────────────────────────────────────────────── */}
        <div className="topbar">
          <div className="logo"><IcoLogo />Vektor</div>
          <div className="sb">
            <IcoSearch />
            <input
              placeholder="Search companies, sectors, tags…"
              value={globalQ}
              onChange={e => { setGlobalQ(e.target.value); setView("companies"); }}
            />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSave(true)}>
              <IcoSave />Save Search
            </button>
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <IcoSun /> : <IcoMoon />}
            </button>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--purple, #a855f7))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", flexShrink: 0, letterSpacing: '-.02em' }}>
              A
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <Sidebar view={view} setView={setView} lists={lists} saved={saved} />

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <div className="main-col">
          <div className="content">
            {view === "companies" && (
              <CompaniesView onSelect={setSelected} thesis={thesis} globalQ={globalQ} />
            )}
            {view === "lists" && (
              <ListsView lists={lists} setLists={setLists} onSelectCompany={c => setSelected(c)} />
            )}
            {view === "saved" && (
              <SavedView savedSearches={saved} setSavedSearches={setSaved} onRun={runSaved} />
            )}
            {view === "thesis" && (
              <ThesisView thesis={thesis} setThesis={setThesis} showToast={showToast} />
            )}
          </div>
        </div>

        {/* ── PROFILE PANEL ────────────────────────────────────────────── */}
        {selected && (
          <ProfilePanel
            company={selected}
            onClose={() => setSelected(null)}
            lists={lists}
            onAddToList={addToList}
            enrichCache={cache}
            onEnrich={handleEnrich}
          />
        )}

        {/* ── MODALS / OVERLAYS ─────────────────────────────────────────── */}
        {showSave && <SaveModal onSave={saveSearch} onClose={() => setShowSave(false)} />}
        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </div>
    </>
  );
}
