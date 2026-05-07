import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import RiskGauge from '../components/RiskGauge';
import { analyseUrl, type AnalysisResult } from '../utils/url-analyser';
import { useScanHistory } from '../hooks/use-scan-history';
import { Colors, Spacing, Radii, FontSizes } from '../constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function Result() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url } = useLocalSearchParams<{ url: string }>();
  const { addEntry } = useScanHistory();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  // ── Scanning animation ──────────────────
  const scanPulse = useSharedValue(1);
  const scanRotate = useSharedValue(0);

  useEffect(() => {
    scanPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    scanRotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanPulse.value }],
  }));

  // ── Run analysis ────────────────────────
  useEffect(() => {
    setLoading(true);

    // Simulate a scanning delay for UX feel
    const timer = setTimeout(() => {
      const urlStr = typeof url === 'string' ? url : '';
      const analysisResult = analyseUrl(urlStr);
      setResult(analysisResult);
      setLoading(false);

      // Save to history
      addEntry({
        url: urlStr,
        score: analysisResult.score,
        verdict: analysisResult.verdict,
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [url]);

  // ── Risk data ───────────────────────────
  const getRiskVisuals = () => {
    if (!result) return { label: '', color: Colors.textSecondary, icon: 'shield' as const };
    if (result.verdict === 'safe')
      return { label: 'LOW RISK', color: Colors.safe, icon: 'shield-checkmark' as const };
    if (result.verdict === 'caution')
      return { label: 'MODERATE RISK', color: Colors.caution, icon: 'warning' as const };
    return { label: 'HIGH RISK', color: Colors.danger, icon: 'alert-circle' as const };
  };

  const { label, color, icon } = getRiskVisuals();

  const subtitleText = () => {
    if (!result) return '';
    if (result.verdict === 'safe') return 'This link appears safe to visit';
    if (result.verdict === 'caution') return 'Proceed with caution';
    return 'This link may be dangerous';
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // ── Loading state ───────────────────────
  if (loading) {
    return (
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={styles.gradient}
      >
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <Animated.View style={pulseStyle}>
            <Ionicons name="shield-half" size={80} color={Colors.primaryLight} />
          </Animated.View>
          <Text style={styles.scanningTitle}>Scanning URL</Text>
          <Text style={styles.scanningUrl} numberOfLines={2}>
            {url || 'Unknown'}
          </Text>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <PulsingDot key={i} delay={i * 250} />
            ))}
          </View>

          <Text style={styles.scanningHint}>Checking domain, protocol, patterns…</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Results state ───────────────────────
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.resultContainer,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 },
        ]}
      >
        {/* ── Back button ─────────────── */}
        <Animated.View entering={FadeIn.duration(400)}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryLight} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Heading ─────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.heading}>RISK ANALYSIS</Text>
          <Text style={styles.urlText} numberOfLines={2}>
            {url || 'No URL'}
          </Text>
        </Animated.View>

        {/* ── Gauge ───────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.gaugeWrapper}
        >
          <RiskGauge risk={result?.score ?? 0} color={color} />
        </Animated.View>

        {/* ── Verdict label ───────────── */}
        <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.verdictRow}>
          <Ionicons name={icon} size={28} color={color} />
          <Text style={[styles.verdictLabel, { color }]}>{label}</Text>
        </Animated.View>
        <Animated.Text entering={FadeInUp.duration(400).delay(600)} style={styles.verdictSub}>
          {subtitleText()}
        </Animated.Text>

        {/* ── Reasons card ────────────── */}
        <Animated.View entering={FadeInUp.duration(500).delay(700)}>
          <TouchableOpacity onPress={toggleExpand} style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Analysis Details</Text>
              <View style={styles.cardToggleBtn}>
                <Text style={styles.cardToggle}>{expanded ? 'Hide' : 'View'}</Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.primaryLight}
                />
              </View>
            </View>

            {expanded && result && (
              <View style={styles.cardContent}>
                {result.reasons.map((reason, i) => {
                  const isPositive = reason.includes('✓');
                  return (
                    <View key={i} style={styles.reasonRow}>
                      <Ionicons
                        name={isPositive ? 'checkmark-circle' : 'information-circle'}
                        size={16}
                        color={isPositive ? Colors.safe : Colors.caution}
                      />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ── Action buttons ──────────── */}
        <Animated.View entering={FadeInUp.duration(400).delay(900)} style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="scan-outline" size={20} color={Colors.white} />
            <Text style={styles.actionBtnText}>Scan Another</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Pulsing dot for loading ──────────────────
function PulsingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

// ── Styles ──────────────────────────────────
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  scanningTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    letterSpacing: 1,
  },
  scanningUrl: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
    maxWidth: 280,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryLight,
  },
  scanningHint: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: Spacing.md,
  },

  // Result
  resultContainer: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backText: {
    color: Colors.primaryLight,
    fontSize: FontSizes.md,
    marginLeft: Spacing.xs,
  },

  heading: {
    textAlign: 'center',
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '600',
  },
  urlText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    maxWidth: 300,
  },

  gaugeWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },

  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verdictLabel: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    letterSpacing: 2,
  },
  verdictSub: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },

  // Card
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  cardToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardToggle: {
    color: Colors.primaryLight,
    fontSize: FontSizes.sm,
  },
  cardContent: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reasonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    flex: 1,
    lineHeight: 20,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    gap: 8,
    shadowColor: Colors.primaryGlow,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});