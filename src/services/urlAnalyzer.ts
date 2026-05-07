import { normalizeUrl } from '../utils/normalizer';
import { parseUrl } from '../utils/parser';
import { runHeuristics } from './heuristics';
import { runBrandImpersonation, BrandImpersonationReport } from './brandImpersonation';
import { calculateScore, ScoringOutput } from './scoringEngine';
import { runEntropyAnalysis } from './entropyEngine';
import { analyzePath, PathAnalysisReport } from './pathAnalyzer';
import { runSuppressionValidation, SuppressionReport } from './suppressionEngine';
import { HeuristicResult } from '../types/engine';

export interface AnalysisReport {
  url: string;
  normalizedUrl: string;
  score: ScoringOutput;
  findings: HeuristicResult[];          // Triggered structural & entropy heuristics
  impersonation: BrandImpersonationReport; // Brand impersonation analysis
  pathAnalysis: PathAnalysisReport;     // Path & Query semantics
  suppression: SuppressionReport;       // False positive suppression results
  timestamp: number;
}

/**
 * Analysis Orchestrator
 *
 * Full pipeline:
 *   Input → Normalize → Parse → Heuristics/Entropy/Path → Brand Impersonation → Suppression → Score → Report
 */
export const analyzeUrl = (inputUrl: string): AnalysisReport => {
  // Stage 1: Normalization
  const normalizedUrl = normalizeUrl(inputUrl);

  // Stage 2: Structural Parsing
  const parsed = parseUrl(normalizedUrl);

  // Stage 3: Feature Extraction (Detection Layer)
  const heuristics = runHeuristics(parsed, inputUrl);
  const entropy = runEntropyAnalysis(parsed);
  const pathReport = analyzePath(parsed, inputUrl);
  const impersonation = runBrandImpersonation(parsed);

  // Stage 4: Trust Validation Layer (Suppression Engine)
  const suppression = runSuppressionValidation(parsed, pathReport, entropy);

  // Stage 5: Weighted Accumulation Layer (Scoring Engine)
  const score = calculateScore(heuristics, impersonation, entropy, pathReport, suppression);

  // Aggregate findings for the UI (excluding path signals which have their own card, 
  // and impersonation which has its own card).
  const findings = heuristics.filter((h) => h.triggered);
  if (entropy && entropy.triggered) {
    findings.push(entropy);
  }

  return {
    url: inputUrl,
    normalizedUrl,
    score,
    findings,
    impersonation,
    pathAnalysis: pathReport,
    suppression,
    timestamp: Date.now(),
  };
};
