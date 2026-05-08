import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PathAnalysisReport } from '../services/pathAnalyzer';
import { useRouter } from 'expo-router';

interface Props {
  report: PathAnalysisReport;
}

export const PathAnalysisCard = ({ report }: Props) => {
  const router = useRouter();
  if (!report.detected) return null;

  const openInfo = (signalId: string) => {
    router.push({ pathname: '/threat-info', params: { focusId: signalId } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="link" size={20} color="#3b82f6" />
          <Text style={styles.title}>Path Semantics</Text>
        </View>
      </View>

      {report.signals.map((signal) => (
        <View key={signal.id} style={styles.row}>
          <Ionicons
            name={
              signal.severityTier === 'critical' || signal.severityTier === 'strong'
                ? 'warning-outline'
                : 'alert-circle-outline'
            }
            size={16}
            color={signal.severityTier === 'critical' ? '#ef4444' : signal.severityTier === 'strong' ? '#f97316' : '#eab308'}
            style={styles.icon}
          />
          <View style={styles.content}>
            <Text style={styles.label}>{signal.label}</Text>
            <Text style={styles.value}>{signal.explanation}</Text>
          </View>
          <TouchableOpacity
            onPress={() => openInfo(signal.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.infoBtn}
          >
            <Ionicons name="information-circle-outline" size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      ))}
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
  infoBtn: {
    marginLeft: 8,
    marginTop: 1,
  },
});
