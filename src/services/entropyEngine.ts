import { ParsedUrl } from '../utils/parser';
import { HeuristicResult } from '../types/engine';

/**
 * Entropy Analysis Engine
 * 
 * Analyzes the hostname for machine-generated patterns and high randomness,
 * which are strong indicators of disposable phishing infrastructure.
 */
export const runEntropyAnalysis = (parsed: ParsedUrl): HeuristicResult | null => {
  const host = parsed.hostname;
  const lettersOnly = host.replace(/[^a-z]/gi, '');
  const digitsOnly = host.replace(/[^0-9]/g, '');
  const vowelsOnly = lettersOnly.replace(/[^aeiou]/gi, '');

  const totalLength = host.length;
  if (totalLength < 5) return null; // Too short for meaningful entropy

  const digitRatio = digitsOnly.length / totalLength;
  const vowelRatio = lettersOnly.length > 0 ? vowelsOnly.length / lettersOnly.length : 0;

  // Signal A: High Digit Density
  const highDigitDensity = digitRatio > 0.3;

  // Signal B: Low Vowel Ratio
  const lowVowelRatio = lettersOnly.length > 5 && vowelRatio < 0.2;

  // Signal C: Consecutive Randomness
  const consecutiveRandomness = /[a-z0-9]{8,}/i.test(host) && !/^[a-z]+$/i.test(host) && !/^[0-9]+$/.test(host);

  let score = 0;
  const reasons: string[] = [];

  if (highDigitDensity) {
    score += 8;
    reasons.push('high digit density');
  }
  if (lowVowelRatio) {
    score += 6;
    reasons.push('low vowel ratio');
  }
  if (consecutiveRandomness) {
    score += 10;
    reasons.push('long alphanumeric clusters');
  }

  if (score === 0) return null;

  // Entropy alone is NEVER a critical signal, cap it at moderate weight.
  const cappedScore = Math.min(score, 18);

  return {
    id: 'entropy_analysis',
    triggered: true,
    baseScore: cappedScore,
    severityTier: 'moderate',
    label: 'Machine-Generated Pattern Detected',
    explanation: `The domain contains highly irregular patterns (${reasons.join(', ')}) commonly associated with disposable phishing infrastructure.`,
  };
};
