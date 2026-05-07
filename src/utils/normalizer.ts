/**
 * Converts messy user input into a predictable format.
 */
export const normalizeUrl = (url: string): string => {
  let normalized = url.trim();

  // 1. Lowercase hostname (Protocol and path can be case sensitive, but host is not)
  // We'll handle this more precisely in the parser, but for basic cleanup:
  normalized = normalized.replace(/^https?:\/\/[^/]+/i, (match) => match.toLowerCase());

  // 2. Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // 3. Ensure protocol
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }

  return normalized;
};
