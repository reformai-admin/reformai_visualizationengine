export function StatusBar({ status, timing }) {
  const map = {
    idle:    { color: '#484f58', label: 'Idle' },
    pinging: { color: '#fbbf24', label: 'Checking backend…' },
    loading: { color: '#1a6fe8', label: 'Generating…' },
    success: { color: '#4ade80', label: 'Success' },
    error:   { color: '#f87171', label: 'Error' },
  };
  const s = map[status] || map.idle;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', marginBottom: 12 }}>
      <div style={{ 
        width: 8, height: 8, borderRadius: '50%', background: s.color,
        boxShadow: status === 'loading' ? `0 0 6px ${s.color}` : 'none',
        animation: status === 'loading' ? 'pulse 1.2s ease-in-out infinite' : 'none' 
      }} />
      <span style={{ color: s.color, fontWeight: 600, fontSize: 12 }}>{s.label}</span>
      {timing && <span style={{ color: '#484f58', fontSize: 11 }}>· {timing}</span>}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
