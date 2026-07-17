import '@testing-library/jest-dom/vitest';

// jsdom defines window.scrollTo but flags it as "not implemented" (noisy stderr).
// Override unconditionally to a no-op.
window.scrollTo = () => {};
