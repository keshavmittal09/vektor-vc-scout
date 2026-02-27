import { IcoBookmark, IcoTrash } from "./Icons";

export default function SavedView({ savedSearches, setSavedSearches, onRun }) {
  return (
    <div className="sv">
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-.02em' }}>Saved Searches</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>Re-run any saved query instantly.</p>
      </div>

      {savedSearches.length === 0 && (
        <div className="emp">
          <div style={{ fontSize: 32 }}>🔖</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-tertiary)' }}>No saved searches</div>
          <div style={{ fontSize: 12 }}>Type in the top search bar and click &ldquo;Save Search&rdquo;.</div>
        </div>
      )}

      {savedSearches.map(s => (
        <div key={s.id} className="scard">
          <IcoBookmark />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, letterSpacing: '-.01em' }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {s.q ? <>&ldquo;{s.q}&rdquo;</> : "All companies"} · {new Date(s.savedAt).toLocaleDateString()}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onRun(s)}>Run</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSavedSearches(p => p.filter(x => x.id !== s.id))}>
            <IcoTrash />
          </button>
        </div>
      ))}
    </div>
  );
}
