export const fmt = (bytes) => (bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`);

export const ts = () => new Date().toLocaleTimeString();

export const cls = (...args) => args.filter(Boolean).join(' ');
