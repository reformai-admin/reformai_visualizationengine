import { useState, useCallback } from 'react';

// Hooks
import { useFilePreview } from './hooks/useFilePreview';

// Components
import { Tag } from './components/common/Tag';
import { Label } from './components/common/Label';
import { Section } from './components/common/Section';
import { DropZone } from './components/common/DropZone';
import { ImagePreview } from './components/common/ImagePreview';
import { StatusBar } from './components/common/StatusBar';
import { RequestSummary } from './components/debug/RequestSummary';
import { MetaPanel } from './components/debug/MetaPanel';
import { CataloguePanel } from './components/catalogue/CataloguePanel';
import { RenovationDebugPanel } from './components/debug/RenovationDebugPanel';

// Utils & Constants
import { ts } from './utils/helpers';
import { 
  ENDPOINT, 
  HEALTH, 
  PRESET_SUGGESTIONS, 
  ROOM_TYPES, 
  PIPELINE_LABELS,
  CATEGORY_ORDER 
} from './utils/constants';

export default function App() {
  // form state
  const [roomType, setRoomType]           = useState('Living Room');
  const [presetName, setPresetName]       = useState('Modern');
  const [textPrompt, setTextPrompt]       = useState('');
  const [isRefinement, setIsRefinement]   = useState(false);

  const roomImg      = useFilePreview();
  const furnitureImg = useFilePreview();
  const prevImg      = useFilePreview();
  const [moodFiles, setMoodFiles]         = useState([]);
  const [moodPreviews, setMoodPreviews]   = useState([]);

  // result state
  const [status, setStatus]       = useState('idle');
  const [timing, setTiming]       = useState(null);
  const [resultImg, setResultImg] = useState(null);
  const [meta, setMeta]           = useState(null);
  const [rawError, setRawError]   = useState(null);
  const [lastReq, setLastReq]     = useState(null);
  const [backendOk, setBackendOk] = useState(null);

  // V6.0: catalogue state
  const [contractorId, setContractorId]           = useState('contractor_demo');
  const [catalogueItems, setCatalogueItems]       = useState([]);
  const [catalogueLoading, setCatalogueLoading]   = useState(false);
  const [catalogueError, setCatalogueError]       = useState(null);
  const [renovationSelections, setRenovationSelections] = useState(
    { flooring: null, walls: null, countertops: null, cabinets: null }
  );

  // comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonTarget, setComparisonTarget] = useState('balanced_v7');
  const [baselineResult, setBaselineResult] = useState(null);
  const [improvedResult, setImprovedResult] = useState(null);
  const [baselineDebug, setBaselineDebug] = useState(null);
  const [improvedDebug, setImprovedDebug] = useState(null);

  const handleMoodChange = (files) => {
    setMoodFiles(files);
    const readers = files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(setMoodPreviews);
  };

  const loadCatalogue = useCallback(async () => {
    if (!contractorId.trim()) return;
    setCatalogueLoading(true);
    setCatalogueError(null);
    setCatalogueItems([]);
    setRenovationSelections({ flooring: null, walls: null, countertops: null, cabinets: null });
    try {
      const res = await fetch('/api/catalogue', {
        headers: { 'X-Contractor-Id': contractorId.trim() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setCatalogueItems(json.items || []);
    } catch (err) {
      setCatalogueError(err.message);
    } finally {
      setCatalogueLoading(false);
    }
  }, [contractorId]);

  const handleCatalogueSelect = useCallback((category, itemId) => {
    setRenovationSelections(prev => ({
      ...prev,
      [category]: prev[category] === itemId ? null : itemId,
    }));
  }, []);

  const handleCatalogueClear = useCallback((category) => {
    setRenovationSelections(prev => ({ ...prev, [category]: null }));
  }, []);

  const pingBackend = useCallback(async () => {
    setStatus('pinging');
    try {
      const r = await fetch(HEALTH);
      setBackendOk(r.ok);
      setStatus('idle');
    } catch {
      setBackendOk(false);
      setStatus('idle');
    }
  }, []);

  const callPipeline = async (fd, mode, extraHeaders = {}) => {
    const t0 = Date.now();
    const effectiveMode = mode === 'balanced_v6' ? 'balanced_v5' : mode;
    const url = `${ENDPOINT}?mode=${effectiveMode}`;
    const res = await fetch(url, { method: 'POST', body: fd, headers: extraHeaders });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2) + 's';
    const json = await res.json();
    if (!res.ok) throw { ...json, httpStatus: res.status, elapsed };
    return { ...json, elapsed };
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!roomImg.file) return;

    const isV6Mode = comparisonTarget === 'balanced_v6';
    const activeRenovationSelections = isV6Mode
      ? Object.fromEntries(
          CATEGORY_ORDER.filter(cat => renovationSelections[cat])
            .map(cat => [cat, renovationSelections[cat]])
        )
      : {};
    const hasRenovationSelections = Object.keys(activeRenovationSelections).length > 0;
    const extraHeaders = contractorId.trim() && hasRenovationSelections
      ? { 'X-Contractor-Id': contractorId.trim() }
      : {};

    const createFormData = () => {
      const fd = new FormData();
      fd.append('roomImage', roomImg.file);
      fd.append('roomType', roomType);
      fd.append('stylePreset', JSON.stringify({ name: presetName }));
      fd.append('styleInfluence', '0');
      fd.append('isRefinement', String(isRefinement));
      if (textPrompt) fd.append('textPrompt', textPrompt);
      moodFiles.forEach(f => fd.append('moodBoardImages', f));
      if (furnitureImg.file) fd.append('furnitureImage', furnitureImg.file);
      if (prevImg.file) fd.append('previousResultImage', prevImg.file);
      if (hasRenovationSelections) {
        fd.append('renovationSelectionIds', JSON.stringify(activeRenovationSelections));
      }
      return fd;
    };

    setLastReq({
      roomType, textPrompt,
      stylePreset: { name: presetName, imageUrl: '' },
      styleInfluence: 0, isRefinement,
      roomImage: roomImg.file.name,
      moodBoardCount: moodFiles.length,
      furnitureImage: furnitureImg.file?.name || null,
      previousResultImage: prevImg.file?.name || null,
      sentAt: ts(),
      contractorId: hasRenovationSelections ? contractorId.trim() : null,
      renovationSelectionIds: hasRenovationSelections ? activeRenovationSelections : null,
    });

    setStatus('loading');
    setResultImg(null);
    setBaselineResult(null);
    setImprovedResult(null);
    setMeta(null);
    setRawError(null);

    try {
      if (compareMode) {
        const [baseline, target] = await Promise.all([
          callPipeline(createFormData(), 'baseline_original', extraHeaders),
          callPipeline(createFormData(), comparisonTarget, extraHeaders)
        ]);

        setBaselineResult(`data:image/png;base64,${baseline.data.image}`);
        setImprovedResult(`data:image/png;base64,${target.data.image}`);
        setBaselineDebug(baseline.data.debug);
        setImprovedDebug(target.data.debug);
        setTiming(`Baseline: ${baseline.elapsed} · ${PIPELINE_LABELS[comparisonTarget] ?? comparisonTarget}: ${target.elapsed}`);
        setStatus('success');
      } else {
        const result = await callPipeline(createFormData(), comparisonTarget, extraHeaders);
        setResultImg(`data:image/png;base64,${result.data.image}`);
        setImprovedDebug(result.data.debug);
        setMeta({ message: result.message, metadata: result.data.metadata, httpStatus: 200, elapsed: result.elapsed });
        setTiming(result.elapsed);
        setStatus('success');
      }
    } catch (err) {
      setRawError(err);
      setStatus('error');
    }
  }, [roomImg, roomType, presetName, isRefinement, textPrompt, moodFiles, furnitureImg, prevImg, compareMode, comparisonTarget, contractorId, renovationSelections]);

  const inputStyle = {
    width: '100%', padding: '7px 10px', background: '#0d1117',
    border: '1px solid #30363d', borderRadius: 5, color: '#e6edf3',
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
  };
  const focus = { onFocus: e => e.target.style.borderColor = '#1a6fe8', onBlur: e => e.target.style.borderColor = '#30363d' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#161b22', borderBottom: '1px solid #21262d', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>Reform-AI</span>
        <span style={{ color: '#30363d' }}>·</span>
        <span style={{ color: '#8b949e', fontSize: 13 }}>Visualization Sandbox</span>
        <Tag color="yellow">DEV ONLY</Tag>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <input type="checkbox" id="compareToggle" checked={compareMode} onChange={e => setCompareMode(e.target.checked)}
                style={{ accentColor: '#1a6fe8' }} />
             <label htmlFor="compareToggle" style={{ fontSize: 13, color: '#e6edf3', cursor: 'pointer', fontWeight: 600 }}>
               Comparison Mode
             </label>
             <span style={{ color: '#484f58', fontSize: 12 }}>{compareMode ? 'Baseline vs' : 'Pipeline'}</span>
             <select
               value={comparisonTarget}
               onChange={e => setComparisonTarget(e.target.value)}
               style={{
                 background: '#161b22', border: '1px solid #30363d', borderRadius: 4,
                 color: '#e6edf3', fontSize: 12, padding: '2px 6px', cursor: 'pointer',
                 outline: 'none',
               }}
             >
               {Object.entries(PIPELINE_LABELS).map(([val, lab]) => (
                 <option key={val} value={val}>{lab}</option>
               ))}
             </select>
          </div>
          <div style={{ width: 1, height: 16, background: '#30363d' }} />
          {backendOk === true && <Tag color="green">backend ok</Tag>}
          {backendOk === false && <Tag color="red">backend unreachable</Tag>}
          <button onClick={pingBackend}
            style={{ fontSize: 11, padding: '3px 10px', background: '#21262d', border: '1px solid #30363d', borderRadius: 5, color: '#8b949e', cursor: 'pointer' }}>
            ping /health
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit} style={{ borderRight: '1px solid #21262d', padding: 20, overflowY: 'auto', height: 'calc(100vh - 45px)' }}>

          <Section title="Room Image (required)">
            <DropZone label="Room Image" accept="image/*" required
              files={roomImg.file} onChange={roomImg.pick} />
            <ImagePreview src={roomImg.preview} label="Preview" height={120} />
          </Section>

          <Section title="Room Config">
            <div style={{ marginBottom: 12 }}>
              <Label required>Room Type</Label>
              <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ ...inputStyle }} {...focus}>
                {ROOM_TYPES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </Section>

          <Section title="Style Preset">
            <div style={{ marginBottom: 10 }}>
              <Label required>Preset Name</Label>
              <input value={presetName} onChange={e => setPresetName(e.target.value)}
                list="presets" placeholder="e.g. Modern" style={inputStyle} {...focus} />
              <datalist id="presets">
                {PRESET_SUGGESTIONS.map(p => <option key={p} value={p} />)}
              </datalist>
              <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PRESET_SUGGESTIONS.map(p => (
                  <button key={p} type="button" onClick={() => setPresetName(p)}
                    style={{ fontSize: 10, padding: '2px 7px', background: presetName === p ? '#1a6fe8' : '#161b22',
                      border: `1px solid ${presetName === p ? '#1a6fe8' : '#30363d'}`, borderRadius: 4,
                      color: presetName === p ? '#fff' : '#8b949e', cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Moodboard Images (optional)">
            <DropZone label="Moodboard Images" accept="image/*" multiple
              files={moodFiles} onChange={handleMoodChange} />
            {moodPreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {moodPreviews.map((p, i) => (
                  <img key={i} src={p} alt={`mood ${i}`} style={{ height: 54, width: 54, objectFit: 'cover', borderRadius: 3, border: '1px solid #21262d' }} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Furniture Image (optional)">
            <DropZone label="Furniture Image" accept="image/*"
              files={furnitureImg.file} onChange={furnitureImg.pick} />
            <ImagePreview src={furnitureImg.preview} label="Furniture preview" height={90} />
          </Section>

          <Section title="Refinement">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <input type="checkbox" id="isRef" checked={isRefinement} onChange={e => setIsRefinement(e.target.checked)}
                style={{ accentColor: '#1a6fe8', width: 15, height: 15 }} />
              <label htmlFor="isRef" style={{ cursor: 'pointer', fontSize: 13, color: '#e6edf3' }}>isRefinement</label>
              {isRefinement && <Tag color="yellow">will send previousResultImage if provided</Tag>}
            </div>
            {isRefinement && (
              <>
                <DropZone label="Previous Result Image" accept="image/*"
                  files={prevImg.file} onChange={prevImg.pick} />
                <ImagePreview src={prevImg.preview} label="Prev result preview" height={90} />
              </>
            )}
          </Section>

          <Section title="User Prompt (optional)">
            <textarea value={textPrompt} onChange={e => setTextPrompt(e.target.value)}
              placeholder="Any specific requests to the model…"
              rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} {...focus} />
          </Section>

          {comparisonTarget === 'balanced_v6' && <Section title="Service Provider Catalogue (V6.0)">
            <CataloguePanel
              contractorId={contractorId}
              setContractorId={setContractorId}
              catalogueItems={catalogueItems}
              catalogueLoading={catalogueLoading}
              catalogueError={catalogueError}
              onLoad={loadCatalogue}
              renovationSelections={renovationSelections}
              onSelect={handleCatalogueSelect}
              onClear={handleCatalogueClear}
            />
          </Section>}

          <button type="submit" disabled={!roomImg.file || status === 'loading'}
            style={{
              width: '100%', padding: '10px 0', fontWeight: 700, fontSize: 14,
              background: (!roomImg.file || status === 'loading') ? '#21262d' : '#238636',
              border: '1px solid #30363d', borderRadius: 6, color: '#fff',
              cursor: (!roomImg.file || status === 'loading') ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {status === 'loading' ? 'Generating...' : 'Run Visualization'}
          </button>
        </form>

        {/* ── Right: Results ── */}
        <div style={{ padding: 20, overflowY: 'auto', background: '#010409', height: 'calc(100vh - 45px)' }}>
          <StatusBar status={status} timing={timing} />
          <RequestSummary req={lastReq} endpoint={ENDPOINT} />
          
          {compareMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <Label>Baseline Original</Label>
                {baselineResult ? (
                   <img src={baselineResult} alt="baseline" style={{ width: '100%', borderRadius: 8, border: '1px solid #30363d' }} />
                ) : (
                   <div style={{ width: '100%', aspectRatio: '4/3', background: '#0d1117', border: '1px dashed #30363d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58' }}>
                     {status === 'loading' ? 'Generating baseline...' : 'No baseline result'}
                   </div>
                )}
                {baselineDebug && <div style={{ marginTop: 12 }}><RenovationDebugPanel debug={baselineDebug} /></div>}
              </div>
              <div>
                <Label>{PIPELINE_LABELS[comparisonTarget] ?? comparisonTarget}</Label>
                {improvedResult ? (
                   <img src={improvedResult} alt="improved" style={{ width: '100%', borderRadius: 8, border: '1px solid #30363d' }} />
                ) : (
                   <div style={{ width: '100%', aspectRatio: '4/3', background: '#0d1117', border: '1px dashed #30363d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58' }}>
                     {status === 'loading' ? 'Generating target...' : 'No target result'}
                   </div>
                )}
                {improvedDebug && <div style={{ marginTop: 12 }}><RenovationDebugPanel debug={improvedDebug} /></div>}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <RenovationDebugPanel debug={improvedDebug} />
              <MetaPanel meta={meta} rawError={rawError} />
              {resultImg && (
                <div style={{ position: 'relative' }}>
                  <img src={resultImg} alt="result" style={{ width: '100%', borderRadius: 12, border: '1px solid #30363d', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                  <a href={resultImg} download={`result-${Date.now()}.png`} 
                     style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(35,134,54,0.9)', color: '#fff', padding: '6px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                    Download Image
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
