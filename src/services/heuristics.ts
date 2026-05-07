import { ParsedUrl } from '../utils/parser';
import { SUSPICIOUS_TLDS } from '../constants/suspiciousTlds';
import { URL_SHORTENERS } from '../constants/shorteners';
import { HeuristicResult } from '../types/engine';

/**
 * Structural Heuristic Evaluation Layer
 *
 * Each function has ONE responsibility and returns a deterministic result.
 * Brand impersonation is handled by a dedicated engine (brandImpersonation.ts)
 * and integrated at the orchestrator level (urlAnalyzer.ts).
 */

const checkHttps = (parsed: ParsedUrl): HeuristicResult => ({
  id: 'https_check',
  triggered: parsed.protocol === 'http',
  baseScore: 10,
  label: 'Insecure Protocol (HTTP)',
  explanation: 'Uses HTTP instead of HTTPS, meaning traffic is unencrypted and vulnerable to interception and tampering.',
  severityTier: 'weak',
});

const checkIpAddress = (parsed: ParsedUrl): HeuristicResult => {
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname);
  return {
    id: 'ip_detection',
    triggered: isIp,
    baseScore: 20,
    label: 'Raw IP Address',
    explanation: 'Uses a raw IPv4 address instead of a registered domain name. Legitimate services almost never do this.',
    severityTier: 'critical',
  };
};

const checkSuspiciousTld = (parsed: ParsedUrl): HeuristicResult => ({
  id: 'tld_check',
  triggered: SUSPICIOUS_TLDS.includes(parsed.tld),
  baseScore: 15,
  label: `Suspicious TLD (.${parsed.tld || 'unknown'})`,
  explanation: `The ".${parsed.tld}" extension is statistically over-represented in abuse and phishing campaigns compared to established TLDs.`,
  severityTier: 'strong',
});

const checkDomainLength = (parsed: ParsedUrl): HeuristicResult => {
  const len = parsed.hostname.length;
  return {
    id: 'length_check',
    triggered: len > 30,
    baseScore: len > 50 ? 20 : 10,
    label: 'Abnormal Domain Length',
    explanation: `Hostname is ${len} characters long. Unusually long hostnames are often used to obscure the real destination or embed misleading tokens.`,
    severityTier: len > 50 ? 'moderate' : 'weak',
  };
};

const checkHyphens = (parsed: ParsedUrl): HeuristicResult => {
  const count = (parsed.hostname.match(/-/g) || []).length;
  return {
    id: 'hyphen_check',
    triggered: count > 2,
    baseScore: count > 4 ? 20 : 10,
    label: 'Excessive Hyphens',
    explanation: `${count} hyphens detected. Phishing domains frequently chain brand keywords with hyphens to appear legitimate (e.g., paypal-secure-login-verify.com).`,
    severityTier: count > 4 ? 'strong' : 'moderate',
  };
};

const checkSubdomainDepth = (parsed: ParsedUrl): HeuristicResult => {
  const count = parsed.subdomains.length;
  return {
    id: 'subdomain_depth',
    triggered: count > 3,
    baseScore: count > 5 ? 25 : 15,
    label: 'Excessive Subdomain Depth',
    explanation: `${count} subdomain levels detected. Deep subdomain structures exploit the fact that users read left-to-right and may mistake a subdomain for the real domain.`,
    severityTier: count > 5 ? 'strong' : 'moderate',
  };
};

const checkAtSymbol = (originalUrl: string): HeuristicResult => ({
  id: 'at_symbol',
  triggered: originalUrl.includes('@'),
  baseScore: 30,
  label: 'Credential Trap (@ Symbol)',
  explanation: 'URL contains an "@" symbol. Browsers treat everything before "@" as credentials and everything after as the actual host. This is a known redirection abuse technique.',
  severityTier: 'critical',
});

const checkShortener = (parsed: ParsedUrl): HeuristicResult => ({
  id: 'shortener_check',
  triggered: URL_SHORTENERS.includes(parsed.hostname),
  baseScore: 15,
  label: 'URL Shortener',
  explanation: 'URL shortening services obscure the final destination. The actual target page cannot be assessed without following the redirect.',
  severityTier: 'moderate',
});

// ─── Main runner ─────────────────────────────────────────────────────────────
export const runHeuristics = (parsed: ParsedUrl, originalUrl: string): HeuristicResult[] => [
  checkHttps(parsed),
  checkIpAddress(parsed),
  checkSuspiciousTld(parsed),
  checkDomainLength(parsed),
  checkHyphens(parsed),
  checkSubdomainDepth(parsed),
  checkAtSymbol(originalUrl),
  checkShortener(parsed),
];
