import { useRef, useState } from 'react';
import { Tag } from './Tag';
import { Label } from './Label';
import { fmt } from '../../utils/helpers';

export function DropZone({ label, accept, multiple, files, onChange, required }) {
  const inputRef = useRef();
  const [over, setOver] = useState(false);

  const handle = (incoming) => {
    const arr = multiple ? Array.from(incoming) : [incoming[0]];
    onChange(multiple ? arr : arr[0] || null);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Label required={required}>{label}</Label>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        style={{
          border: `1px dashed ${over ? '#1a6fe8' : '#30363d'}`,
          borderRadius: 6, padding: '10px 12px', cursor: 'pointer',
          background: over ? '#0d1f3c' : '#0d1117',
          transition: 'all 0.15s',
          minHeight: 44,
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}
      >
        <input ref={inputRef} type="file" accept={accept} multiple={multiple}
          style={{ display: 'none' }}
          onChange={(e) => handle(e.target.files)} />
        {(!files || (Array.isArray(files) && files.length === 0)) ? (
          <span style={{ color: '#484f58', fontSize: 12 }}>Click or drop {multiple ? 'files' : 'a file'}</span>
        ) : (
          (Array.isArray(files) ? files : [files]).map((f, i) => (
            <Tag key={i} color="blue">{f.name} <span style={{ opacity: 0.6 }}>({fmt(f.size)})</span></Tag>
          ))
        )}
      </div>
      {files && !Array.isArray(files) && (
        <button onClick={(e) => { e.stopPropagation(); onChange(null); }}
          style={{ marginTop: 4, fontSize: 11, color: '#da3633', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          × clear
        </button>
      )}
      {Array.isArray(files) && files.length > 0 && (
        <button onClick={() => onChange([])}
          style={{ marginTop: 4, fontSize: 11, color: '#da3633', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          × clear all ({files.length})
        </button>
      )}
    </div>
  );
}
