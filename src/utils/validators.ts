/**
 * Basic format validation before expensive analysis.
 */
export const isValidFormat = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Broad check: must have a dot and at least 3 chars after protocol
  // This is a "fail-fast" check, not a full security check.
  const basicRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const withProtocol = trimmed.replace(/^https?:\/\//i, '');
  
  return basicRegex.test(withProtocol);
};
