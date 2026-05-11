import { ItemCard } from './ItemCard';

const CATEGORY_ORDER = ['flooring', 'walls', 'countertops', 'cabinets'];
const CATEGORY_LABELS = { flooring: 'Flooring', walls: 'Walls', countertops: 'Countertops', cabinets: 'Cabinets' };

export function CataloguePanel({
  contractorId, setContractorId,
  catalogueItems, catalogueLoading, catalogueError,
  onLoad,
  renovationSelections, onSelect, onClear,
}) {
  const inputStyle = {
    flex: 1, padding: '6px 9px', background: '#0d1117',
    border: '1px solid #30363d', borderRadius: 5, color: '#e6edf3',
    fontSize: 12, outline: 'none', fontFamily: 'inherit',
  };
  const focus = { onFocus: e => e.target.style.borderColor = '#1a6fe8', onBlur: e => e.target.style.borderColor = '#30363d' };

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = catalogueItems.filter(i => i.category === cat);
    return acc;
  }, {});

  const activeSelections = Object.fromEntries(
    CATEGORY_ORDER.filter(cat => renovationSelections[cat])
      .map(cat => [cat, renovationSelections[cat]])
  );
  const hasSelections = Object.keys(activeSelections).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          value={contractorId}
          onChange={e => setContractorId(e.target.value)}
          placeholder="contractor_demo"
          style={inputStyle}
          {...focus}
        />
        <button
          type="button"
          onClick={onLoad}
          disabled={catalogueLoading || !contractorId.trim()}
          style={{
            padding: '6px 12px', fontSize: 11, fontWeight: 600,
            background: catalogueLoading ? '#161b22' : '#21262d',
            border: '1px solid #30363d', borderRadius: 5,
            color: catalogueLoading ? '#484f58' : '#8b949e',
            cursor: catalogueLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {catalogueLoading ? '⏳ Loading…' : '↓ Load'}
        </button>
      </div>

      {catalogueError && (
        <div style={{ fontSize: 11, color: '#f87171', background: '#2d1515', border: '1px solid #da3633', borderRadius: 5, padding: '5px 9px', marginBottom: 8 }}>
          {catalogueError}
        </div>
      )}

      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat] || [];
        if (items.length === 0) return null;
        const selected = renovationSelections[cat];
        return (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {CATEGORY_LABELS[cat]}
              </span>
              {selected && (
                <button
                  type="button"
                  onClick={() => onClear(cat)}
                  style={{ fontSize: 10, color: '#da3633', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  × clear
                </button>
              )}
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {items.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={selected === item.id}
                  onToggle={() => onSelect(cat, item.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {hasSelections && (
        <div style={{ marginTop: 8, background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Request Preview
          </div>
          <pre style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#4ade80', margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify({
              headers: { 'X-Contractor-Id': contractorId },
              renovationSelectionIds: activeSelections,
            }, null, 2)}
          </pre>
        </div>
      )}

      {catalogueItems.length > 0 && !hasSelections && (
        <div style={{ fontSize: 10, color: '#484f58', textAlign: 'center', padding: '6px 0' }}>
          Click an item to select it
        </div>
      )}
    </div>
  );
}
