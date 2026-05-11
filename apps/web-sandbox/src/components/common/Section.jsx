export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 700, 
        color: '#1a6fe8', 
        textTransform: 'uppercase', 
        letterSpacing: '0.08em', 
        marginBottom: 10, 
        paddingBottom: 5, 
        borderBottom: '1px solid #21262d' 
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
