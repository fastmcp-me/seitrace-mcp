const DEBUG =
  process.env.E2E_DEBUG === '1' || (process.env.DEBUG || '').toLowerCase().includes('e2e');
export const dbg = (...args) => {
  if (DEBUG) console.log('[E2E]', ...args);
};
