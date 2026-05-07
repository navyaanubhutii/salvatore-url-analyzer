/**
 * Decomposition of URL into architectural components.
 */
export interface ParsedUrl {
  protocol: string;
  hostname: string;
  subdomains: string[];
  rootDomain: string;
  tld: string;
  path: string;
  query: string;
}

export const parseUrl = (url: string): ParsedUrl => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    
    // Simplistic TLD/Root extraction
    const tld = parts.pop() || '';
    const rootDomain = parts.pop() || '';
    const subdomains = parts;

    return {
      protocol: urlObj.protocol.replace(':', ''),
      hostname,
      subdomains,
      rootDomain,
      tld,
      path: urlObj.pathname,
      query: urlObj.search,
    };
  } catch (e) {
    // Fallback for extremely malformed strings that still passed validator
    return {
      protocol: '',
      hostname: url,
      subdomains: [],
      rootDomain: '',
      tld: '',
      path: '',
      query: '',
    };
  }
};
