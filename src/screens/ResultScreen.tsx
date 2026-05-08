import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnalysisReport } from '../services/urlAnalyzer';
import { RiskCard } from '../components/RiskCard';
import { BreakdownItem } from '../components/BreakdownItem';
import { BrandImpersonationCard } from '../components/BrandImpersonationCard';
import { PathAnalysisCard } from '../components/PathAnalysisCard';

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { report: reportStr } = useLocalSearchParams<{ report: string }>();

  if (!reportStr) return null;
  const report: AnalysisReport = JSON.parse(reportStr);

  const totalFindings =
    report.findings.length +
    (report.impersonation.detected ? 1 : 0) +
    (report.pathAnalysis.detected ? 1 : 0);

  return (
    <LinearGradient colors={['#0f172a', '#064e3b']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ── Back ─────────────────────────── */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#94a3b8" />
          <Text style={styles.backText}>Back to Scanner</Text>
        </TouchableOpacity>

        {/* ── Target URL ───────────────────── */}
        <View style={styles.urlBox}>
          <Text style={styles.urlLabel}>Analysis Target</Text>
          <Text style={styles.urlValue} numberOfLines={3}>
            {report.url}
          </Text>
        </View>

        {/* ── Risk Summary Card ────────────── */}
        <RiskCard
          level={report.score.riskLevel}
          score={report.score.totalScore}
          color={report.score.color}
          confidence={report.score.confidence}
        />

        {/* ── Suppression Context (if applicable) */}
        {report.suppression.explanation && (
          <View style={styles.suppressionBox}>
            <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
            <Text style={styles.suppressionText}>
              {report.suppression.explanation}
            </Text>
          </View>
        )}

        {/* ── Brand Impersonation (if detected) */}
        {report.impersonation.detected && (
          <BrandImpersonationCard report={report.impersonation} />
        )}

        {/* ── Path Semantics (if detected) */}
        {report.pathAnalysis.detected && (
          <PathAnalysisCard report={report.pathAnalysis} />
        )}

        {/* ── Structural & Entropy Findings ──────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Structural Heuristics</Text>
          <Text style={styles.sectionCount}>
            {report.findings.length} triggered
          </Text>
        </View>

        {report.findings.map((finding) => (
          <BreakdownItem key={finding.id} finding={finding} />
        ))}

        {/* ── Safe state ───────────────────── */}
        {totalFindings === 0 && (
          <View style={styles.safeBox}>
            <Ionicons name="checkmark-done-circle" size={56} color="#22c55e" />
            <Text style={styles.safeTitle}>No Indicators Detected</Text>
            <Text style={styles.safeSubtitle}>
              No structural anomalies or impersonation signals were found.
            </Text>
          </View>
        )}

        {/* ── Disclaimer ───────────────────── */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This assessment measures deviation from patterns associated with
            trustworthy URLs. It does not guarantee safety or maliciousness.
            Always verify links through official channels.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 22 },

  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  backText: { color: '#94a3b8', fontSize: 16 },

  urlBox: { marginBottom: 20 },
  urlLabel: {
    color: '#475569',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  urlValue: { color: '#cbd5e1', fontSize: 15, fontWeight: '500', lineHeight: 22 },

  suppressionBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  suppressionText: {
    flex: 1,
    color: '#93c5fd',
    fontSize: 13,
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '700' },
  sectionCount: { color: '#64748b', fontSize: 12 },

  safeBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  safeTitle: { color: '#22c55e', fontSize: 18, fontWeight: '700' },
  safeSubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },

  disclaimer: {
    marginTop: 36,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  disclaimerText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
  },
});
