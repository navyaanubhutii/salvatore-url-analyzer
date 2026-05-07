import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PathAnalysisReport } from '../services/pathAnalyzer';

interface Props {
  report: PathAnalysisReport;
}

export const PathAnalysisCard = ({ report }: Props) => {
  if (!report.detected) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="link" size={20} color="#3b82f6" />
          <Text style={styles.title}>Path Semantics</Text>
        </View>
      </View>

      {report.authKeywordsFound.length > 0 && (
        <View style={styles.row}>
          <Ionicons name="key-outline" size={16} color="#fbbf24" style={styles.icon} />
          <View style={styles.content}>
            <Text style={styles.label}>Authentication Bait</Text>
            <Text style={styles.value}>
              Trust-triggering keywords detected: {report.authKeywordsFound.join(', ')}
            </Text>
          </View>
        </View>
      )}

      {report.redirectDetected && (
        <View style={styles.row}>
          <Ionicons name="swap-horizontal" size={16} color="#ef4444" style={styles.icon} />
          <View style={styles.content}>
            <Text style={[styles.label, { color: '#ef4444' }]}>Redirect Parameter Abuse</Text>
            <Text style={styles.value}>
              URL attempts to redirect the user, potentially to obscure the final destination.
            </Text>
          </View>
        </View>
      )}

      {report.encodedContent && (
        <View style={styles.row}>
          <Ionicons name="code-slash" size={16} color="#94a3b8" style={styles.icon} />
          <View style={styles.content}>
            <Text style={styles.label}>Encoded Content</Text>
            <Text style={styles.value}>
              Excessive URL encoding present, a common filter evasion tactic.
            </Text>
          </View>
        </View>
      )}

      {report.suspiciousExtensions.length > 0 && (
        <View style={styles.row}>
          <Ionicons name="document-text" size={16} color="#ef4444" style={styles.icon} />
          <View style={styles.content}>
            <Text style={[styles.label, { color: '#ef4444' }]}>Suspicious File Target</Text>
            <Text style={styles.value}>
              Path targets potentially unsafe extensions: {report.suspiciousExtensions.join(', ')}
            </Text>
          </View>
        </View>
      )}

      {report.pathDepth > 5 && (
        <View style={styles.row}>
          <Ionicons name="folder-open" size={16} color="#94a3b8" style={styles.icon} />
          <View style={styles.content}>
            <Text style={styles.label}>Deep Path Layering</Text>
            <Text style={styles.value}>
              Unusually deep folder structure ({report.pathDepth} levels).
            </Text>
          </View>
        </View>
      )}
      
      {report.fragmentAbuse && (
        <View style={styles.row}>
          <Ionicons name="pricetag" size={16} color="#fbbf24" style={styles.icon} />
          <View style={styles.content}>
            <Text style={styles.label}>Fragment Impersonation</Text>
            <Text style={styles.value}>
              Client-side fragment (#) contains brand names to visually deceive.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#60a5fa',
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    marginTop: 2,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
});
