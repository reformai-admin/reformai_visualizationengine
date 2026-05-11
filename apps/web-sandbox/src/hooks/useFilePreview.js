import { useState } from 'react';

export function useFilePreview() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const clear = () => {
    setFile(null);
    setPreview(null);
  };
  
  const pick = (f) => {
    if (!f) {
      clear();
      return;
    }
    setFile(f);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target.result);
    r.readAsDataURL(f);
  };
  
  return { file, preview, pick, clear };
}
