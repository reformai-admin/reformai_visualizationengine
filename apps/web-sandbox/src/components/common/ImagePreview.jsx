export function ImagePreview({ src, label, height = 140 }) {
  if (!src) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: '#484f58', marginBottom: 3 }}>{label}</div>
      <img src={src} alt={label} style={{
        height, maxWidth: '100%', objectFit: 'cover',
        borderRadius: 4, border: '1px solid #21262d', display: 'block',
      }} />
    </div>
  );
}
