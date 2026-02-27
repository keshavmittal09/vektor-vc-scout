import { IcoCompany, IcoList, IcoBookmark, IcoTarget, IcoSettings, IcoLogo } from "./Icons";
import { MOCK_COMPANIES } from "../lib/mockData";

export default function Sidebar({ view, setView, lists, saved }) {
  const items = [
    { id: "companies", label: "Companies",     icon: <IcoCompany />, badge: MOCK_COMPANIES.length },
    { id: "lists",     label: "Lists",          icon: <IcoList />,    badge: lists.length },
    { id: "saved",     label: "Saved Searches", icon: <IcoBookmark />,badge: saved.length },
    { id: "thesis",    label: "Fund Thesis",    icon: <IcoTarget /> },
  ];

  return (
    <div className="sidebar">
      <div className="nav-sep">Workspace</div>
      {items.map(n => (
        <div
          key={n.id}
          className={"nav-item" + (view === n.id ? " active" : "")}
          onClick={() => setView(n.id)}
        >
          {n.icon}{n.label}
          {n.badge !== undefined && <span className="nav-badge">{n.badge}</span>}
        </div>
      ))}
      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid #181b25" }}>
        <div
          className={"nav-item" + (view === "thesis" ? " active" : "")}
          onClick={() => setView("thesis")}
        >
          <IcoSettings />Settings
        </div>
      </div>
    </div>
  );
}
