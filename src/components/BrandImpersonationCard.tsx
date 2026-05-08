import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandImpersonationReport } from '../services/brandImpersonation';
import { useRouter } from 'expo-router';

interface Props {
  report: BrandImpersonationReport;
}

/**
 * BrandImpersonationCard
 *
 * Rendered ONLY when brand impersonation signals are detected.
 * Shows a high-visibility warning banner with:
 *  - detected brand name
 *  - actual registered domain
 *  - each detection type and its explanation
 */
export const BrandImpersonationCard = ({ report }: Props) => {
  const router = useRouter();
  if (!report.detected) return null;

  const openInfo = (signalId: string) => {
    router.push({ pathname: '/threat-info', params: { focusId: signalId } });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="warning" size={22} color="#f97316" />
          <Text style={styles.title}>Brand Impersonation Detected</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HIGH RISK</Text>
        </View>
      </View>

      {/* Domain comparison */}
      <View style={styles.domainBox}>
        <View style={styles.domainRow}>
          <Text style={styles.domainLabel}>Submitted Domain</Text>
          <Text style={styles.domainValue}>{report.actualDomain}</Text>
        </View>
        {report.officialDomain && (
          <View style={styles.domainRow}>
            <Text style={styles.domainLabel}>Official Domain</Text>
            <Text style={[styles.domainValue, { color: '#22c55e' }]}>
              {report.officialDomain}
            </Text>
          </View>
        )}
        {report.targetBrand && (
          <View style={styles.domainRow}>
            <Text style={styles.domainLabel}>Impersonating</Text>
            <Text style={[styles.domainValue, { color: '#f97316' }]}>
              {report.targetBrand}
            </Text>
          </View>
        )}
      </View>

      {/* Individual signals */}
      <Text style={styles.signalsTitle}>Detection Techniques</Text>
      {report.signals.map((signal, i) => (
        <View key={i} style={styles.signalRow}>
          <View style={styles.signalBullet} />
          <View style={styles.signalContent}>
            <Text style={styles.signalType}>{signal.label}</Text>
            <Text style={styles.signalDescription}>{signal.explanation}</Text>
          </View>
          <TouchableOpacity
            onPress={() => openInfo(signal.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: 6, marginTop: 2 }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#60a5fa" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(249,115,22,0.4)',
    backgroundColor: 'rgba(249,115,22,0.08)',
    padding: 20,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    color: '#f97316',
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  domainBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  domainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  domainLabel: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  domainValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  signalsTitle: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  signalBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    marginTop: 5,
    flexShrink: 0,
  },
  signalContent: {
    flex: 1,
  },
  signalType: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  signalDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
});
