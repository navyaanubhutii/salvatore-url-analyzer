import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import RiskGauge from '../components/RiskGauge';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function Result() {
  const router = useRouter();
  const { url } = useLocalSearchParams();

  const [expanded, setExpanded] = useState(false);
  const [risk, setRisk] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔄 Simulated scanning
  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      let score = 0;

      if (!url || typeof url !== 'string') {
        score = 80;
      } else if (url.includes('https')) {
        score = Math.floor(Math.random() * 40);
      } else {
        score = 50 + Math.floor(Math.random() * 50);
      }

      setRisk(score);
      setLoading(false);
    }, 2000);
  }, []);

  const getRiskData = () => {
    if (risk < 30)
      return {
        label: 'LOW RISK',
        color: '#22c55e',
        subtitle: 'This link appears safe',
      };
    if (risk < 70)
      return {
        label: 'MID RISK',
        color: '#eab308',
        subtitle: 'Proceed with caution',
      };
    return {
      label: 'HIGH RISK',
      color: '#ef4444',
      subtitle: 'Potentially dangerous link',
    };
  };

  const { label, color, subtitle } = getRiskData();

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // 🔥 COOL LOADING SCREEN
  if (loading) {
    return (
      <LinearGradient
        colors={['#061326', '#0f766e']}
        style={styles.container}
      >
        <ActivityIndicator size="large" color="#7dd3fc" />
        <Text style={styles.loadingText}>Scanning link...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#061326', '#0f766e']}
      style={styles.container}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.heading}>RISK SCORE</Text>

      {/* URL */}
      <Text style={styles.urlText}>
        {url ? url : 'No URL provided'}
      </Text>

      {/* Gauge */}
      <View style={styles.gaugeWrapper}>
        <RiskGauge risk={risk} color={color} />
      </View>

      {/* Label */}
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Expandable */}
      <TouchableOpacity onPress={toggleExpand} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Why this result?</Text>
          <Text style={styles.cardToggle}>
            {expanded ? 'Hide' : 'Know why!'}
          </Text>
        </View>

        {expanded && (
          <View style={styles.cardContent}>
            <Text style={styles.point}>• Domain age is very recent</Text>
            <Text style={styles.point}>• SSL certificate missing or weak</Text>
            <Text style={styles.point}>• URL contains suspicious keywords</Text>
            <Text style={styles.point}>• Not present in trusted databases</Text>
          </View>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 15,
  },

  back: {
    color: '#7dd3fc',
    fontSize: 16,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },

  heading: {
    textAlign: 'center',
    fontSize: 18,
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 5,
  },

  urlText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 15,
  },

  gaugeWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },

  label: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 10,
  },

  subtitle: {
    textAlign: 'center',
    color: '#cbd5f5',
    marginBottom: 30,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  cardToggle: {
    color: '#7dd3fc',
    fontSize: 14,
  },

  cardContent: {
    marginTop: 15,
  },

  point: {
    color: '#e2e8f0',
    marginBottom: 8,
    lineHeight: 20,
  },
});