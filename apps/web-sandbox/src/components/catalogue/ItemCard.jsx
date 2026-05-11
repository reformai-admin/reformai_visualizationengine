export function ItemCard({ item, selected, onToggle }) {
  const attrs = Object.entries(item.attributes || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);

  return (
    <div
      onClick={onToggle}
      style={{
        border: `1px solid ${selected ? '#1a6fe8' : '#21262d'}`,
        background: selected ? '#0d1f3c' : '#0d1117',
        borderRadius: 6, padding: '8px 10px', marginBottom: 6,
        cursor: 'pointer', transition: 'all 0.12s', position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
        <span style={{ fontWeight: 600, color: selected ? '#60a5fa' : '#e6edf3', fontSize: 12 }}>
          {item.name}
        </span>
        {selected && <span style={{ color: '#1a6fe8', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
      <div style={{ color: '#8b949e', fontSize: 10, fontStyle: 'italic', marginBottom: 5, lineHeight: 1.4 }}>
        "{item.promptDescription}"
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {attrs.map(a => (
          <span key={a} style={{ fontSize: 9, padding: '1px 5px', background: '#161b22', border: '1px solid #21262d', borderRadius: 3, color: '#484f58' }}>
            {a}
          </span>
        ))}
        <span style={{ fontSize: 9, padding: '1px 5px', background: '#161b22', border: '1px solid #21262d', borderRadius: 3, color: '#30363d' }}>
          {item.id}
        </span>
      </div>
    </div>
  );
}
