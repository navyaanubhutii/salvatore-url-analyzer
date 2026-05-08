import { HeuristicResult } from '../types/engine';
import { BrandImpersonationReport } from './brandImpersonation';
import { PathAnalysisReport } from './pathAnalyzer';
import { SuppressionReport } from './suppressionEngine';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';

export interface ScoringOutput {
  totalScore: number;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  color: string;
  hexBg: string;
}

const RISK_THRESHOLDS: { min: number; level: RiskLevel; color: string; hexBg: string }[] = [
  { min: 76, level: 'Critical', color: '#ef4444', hexBg: 'rgba(239,68,68,0.12)' },
  { min: 51, level: 'High',     color: '#f97316', hexBg: 'rgba(249,115,22,0.12)' },
  { min: 26, level: 'Moderate', color: '#eab308', hexBg: 'rgba(234,179,8,0.12)'  },
  { min: 0,  level: 'Low',      color: '#22c55e', hexBg: 'rgba(34,197,94,0.12)'  },
];

/**
 * Confidence Engine
 *
 * Score and tier are independent axes.
 * The tier (critical/strong/moderate/weak) on each signal contributes
 * to a separate CONFIDENCE score, not to amplifying the risk score.
 * This prevents tier multipliers from causing score inflation.
 */
const CONFIDENCE_CONTRIBUTIONS: Record<HeuristicResult['severityTier'], number> = {
  critical: 25,
  strong: 12,
  moderate: 6,
  weak: 3,
};

/**
 * Specific high-value heuristics also add extra confidence directly.
 * Matches the Master Risk Metric Table spec exactly.
 */
const HIGH_CONFIDENCE_SIGNALS = new Set([
  'at_symbol',             // @ abuse → +25
  'brand_typosquatting_1', // typosquatting ed1 → +20
  'brand_subdomain_confusion', // subdomain abuse → +25
  'brand_char_substitution',   // char substitution → +20
]);

const mapConfidence = (score: number): ConfidenceLevel => {
  if (score >= 46) return 'High';
  if (score >= 21) return 'Moderate';
  return 'Low';
};

export const calculateScore = (
  structuralHeuristics: HeuristicResult[],
  impersonation: BrandImpersonationReport,
  entropyResult: HeuristicResult | null,
  pathReport: PathAnalysisReport,
  suppression: SuppressionReport
): ScoringOutput => {
  let riskAccumulator = 0;
  let confidenceAccumulator = 0;
  const suppressed = suppression.suppressedSignals;

  const addSignal = (h: HeuristicResult) => {
    if (!h.triggered) return;

    // Suppressed signals have their risk score reduced by 70%
    const suppressionFactor = suppressed.includes(h.id) ? 0.3 : 1.0;
    riskAccumulator += h.baseScore * suppressionFactor;

    // Confidence is contributed by tier + bonus for specific signals
    let confBonus = CONFIDENCE_CONTRIBUTIONS[h.severityTier];
    if (HIGH_CONFIDENCE_SIGNALS.has(h.id)) confBonus += 10;
    confidenceAccumulator += confBonus;
  };

  // 1. Structural heuristics
  structuralHeuristics.forEach(addSignal);

  // 2. Brand impersonation signals
  impersonation.signals.forEach(addSignal);

  // 3. Entropy signals
  if (entropyResult) addSignal(entropyResult);

  // 4. Path analysis signals
  pathReport.signals.forEach(addSignal);

  // 5. Correlation Boost (Impersonation + Suspicious TLD + no trusted root)
  // As per the spec: contextual boosting, never a hard override
  if (
    !suppression.isTrustedRoot &&
    impersonation.detected &&
    structuralHeuristics.some(h => h.id === 'tld_check' && h.triggered)
  ) {
    riskAccumulator += 15; // Modest contextual boost
    confidenceAccumulator += 10;
  }

  // 6. Global Trust Suppression Dampening (affects full accumulated risk score)
  riskAccumulator *= suppression.suppressionMultiplier;

  // 7. Cap scores
  const finalScore = Math.min(Math.round(riskAccumulator), 100);
  const finalConfidence = Math.min(Math.round(confidenceAccumulator), 100);

  const riskMatch = RISK_THRESHOLDS.find(t => finalScore >= t.min) ?? RISK_THRESHOLDS[3];

  return {
    totalScore: finalScore,
    riskLevel: riskMatch.level,
    confidence: mapConfidence(finalConfidence),
    color: riskMatch.color,
    hexBg: riskMatch.hexBg,
  };
};
