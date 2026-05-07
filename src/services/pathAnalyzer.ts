import { ParsedUrl } from '../utils/parser';
import { AUTH_KEYWORDS } from '../constants/authKeywords';
import { BRAND_NAMES } from '../constants/brands';
import { HeuristicResult } from '../types/engine';

export interface PathAnalysisReport {
  detected: boolean;
  authKeywordsFound: string[];
  redirectDetected: boolean;
  encodedContent: boolean;
  suspiciousExtensions: string[];
  pathDepth: number;
  fragmentAbuse: boolean;
  signals: HeuristicResult[];
  totalScore: number;
}

const REDIRECT_PARAMS = ['redirect', 'next', 'url', 'continue', 'target', 'destination', 'redir', 'return'];
const SUSPICIOUS_EXTENSIONS = ['.exe', '.scr', '.apk', '.bat', '.cmd', '.ps1'];
const ENCODING_PATTERNS = /%2F|%3A|%2E|%3D|%3F/i;

export const analyzePath = (parsed: ParsedUrl, originalUrl: string): PathAnalysisReport => {
  const signals: HeuristicResult[] = [];
  let totalScore = 0;

  // Tokenize Path & Query
  const fullPath = `${parsed.path}${parsed.query}`.toLowerCase();
  // Split on /, -, _, =, &, ?
  const tokens = fullPath.split(/[\/\-_\=&?]+/).filter(Boolean);

  // 1. Auth Bait Keywords
  const authKeywordsFound = AUTH_KEYWORDS.filter(kw => tokens.includes(kw));
  if (authKeywordsFound.length > 0) {
    let score = 3;
    if (authKeywordsFound.length >= 4) score = 15;
    else if (authKeywordsFound.length >= 2) score = 8;

    signals.push({
      id: 'auth_bait',
      triggered: true,
      baseScore: score,
      severityTier: authKeywordsFound.length >= 4 ? 'strong' : 'moderate',
      label: 'Authentication Bait',
      explanation: `Path contains authentication-related terms (${authKeywordsFound.join(', ')}). This exploits urgency and trust.`,
    });
    totalScore += score;
  }

  // 2. Redirect Parameter Detection
  const queryParams = new URLSearchParams(parsed.query.toLowerCase());
  let redirectDetected = false;
  let redirectScore = 0;
  let redirectDetails = '';

  for (const param of REDIRECT_PARAMS) {
    if (queryParams.has(param)) {
      redirectDetected = true;
      const val = queryParams.get(param) || '';
      
      if (val.includes('http') || val.includes('%3A%2F%2F')) {
        redirectScore = 10;
        redirectDetails = 'Contains a redirect parameter.';
        
        // Is it encoded?
        if (val.includes('%')) {
          redirectScore = 25;
          redirectDetails = 'Contains an encoded redirect payload, a technique used to bypass filters.';
        } else if (BRAND_NAMES.some(b => val.includes(b))) {
          redirectScore = 20;
          redirectDetails = 'Redirect target contains a trusted brand name, indicating trust inheritance abuse.';
        }
      }
    }
  }

  if (redirectDetected && redirectScore > 0) {
    signals.push({
      id: 'redirect_abuse',
      triggered: true,
      baseScore: redirectScore,
      severityTier: redirectScore >= 20 ? 'critical' : 'strong',
      label: 'Redirect Abuse',
      explanation: redirectDetails,
    });
    totalScore += redirectScore;
  }

  // 3. Encoded URL Detection
  const encodedContent = ENCODING_PATTERNS.test(fullPath);
  if (encodedContent && !redirectDetected) { // Only score if not already caught by redirect
    signals.push({
      id: 'encoded_path',
      triggered: true,
      baseScore: 10,
      severityTier: 'moderate',
      label: 'Encoded Content',
      explanation: 'Path contains excessive URL encoding, often used to obfuscate payloads or bypass filters.',
    });
    totalScore += 10;
  }

  // 4. Suspicious File Extensions
  const suspiciousExtensions = SUSPICIOUS_EXTENSIONS.filter(ext => parsed.path.toLowerCase().endsWith(ext));
  if (suspiciousExtensions.length > 0) {
    signals.push({
      id: 'suspicious_file',
      triggered: true,
      baseScore: 15,
      severityTier: 'strong',
      label: 'Suspicious File Extension',
      explanation: `Path references potentially unsafe executable content (${suspiciousExtensions[0]}).`,
    });
    totalScore += 15;
  }

  // 5. Excessive Path Depth
  const pathSegments = parsed.path.split('/').filter(Boolean);
  const pathDepth = pathSegments.length;
  if (pathDepth > 5) {
    const depthScore = pathDepth > 8 ? 15 : 8;
    signals.push({
      id: 'path_depth',
      triggered: true,
      baseScore: depthScore,
      severityTier: 'moderate',
      label: 'Deep Path Structure',
      explanation: 'Unusually deep path structure, often indicating obfuscation or generated infrastructure.',
    });
    totalScore += depthScore;
  }

  // 6. Fragment Abuse
  const fragmentAbuse = originalUrl.includes('#') && BRAND_NAMES.some(b => originalUrl.split('#')[1]?.toLowerCase().includes(b));
  if (fragmentAbuse) {
    signals.push({
      id: 'fragment_abuse',
      triggered: true,
      baseScore: 5,
      severityTier: 'weak',
      label: 'Fragment Abuse',
      explanation: 'Client-side fragment contains trusted brand names, a visual deception technique.',
    });
    totalScore += 5;
  }

  return {
    detected: signals.length > 0,
    authKeywordsFound,
    redirectDetected,
    encodedContent,
    suspiciousExtensions,
    pathDepth,
    fragmentAbuse,
    signals,
    totalScore,
  };
};
