export function Label({ children, required }) {
  return (
    <label style={{ 
      display: 'block', 
      marginBottom: 5, 
      color: '#8b949e', 
      fontSize: 11, 
      fontWeight: 600, 
      letterSpacing: '0.05em', 
      textTransform: 'uppercase' 
    }}>
      {children} {required && <span style={{ color: '#da3633' }}>*</span>}
    </label>
  );
}
