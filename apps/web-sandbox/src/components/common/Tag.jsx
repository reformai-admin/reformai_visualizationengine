export function Tag({ children, color = 'default' }) {
  const colors = {
    default: { bg: '#1f2937', text: '#9ca3af' },
    blue:    { bg: '#1e3a5f', text: '#60a5fa' },
    green:   { bg: '#14291c', text: '#4ade80' },
    red:     { bg: '#2d1515', text: '#f87171' },
    yellow:  { bg: '#2d2410', text: '#fbbf24' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.text,
    }}>
      {children}
    </span>
  );
}
