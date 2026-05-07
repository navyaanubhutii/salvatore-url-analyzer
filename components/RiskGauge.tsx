import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface RiskGaugeProps {
  risk: number;
  color: string;
}

export default function RiskGauge({ risk, color }: RiskGaugeProps) {
  const strokeWidth = 14;
  const circumference = Math.PI * 100; // arc for A 100 100

  // ── Animated arc via Reanimated ──────────────
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(risk / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [risk]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // ── Animated number via JS (synced timing) ───
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const totalSteps = 70;
    const stepTime = duration / totalSteps;
    const increment = risk / totalSteps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= risk) {
        current = risk;
        clearInterval(interval);
      }
      setDisplayVal(Math.round(current));
    }, stepTime);

    return () => clearInterval(interval);
  }, [risk]);

  return (
    <View style={styles.container}>
      {/* Glow behind the gauge */}
      <View style={[styles.glow, { shadowColor: color }]} />

      <Svg width={240} height={140} viewBox="0 0 240 140">
        {/* Background arc */}
        <Path
          d="M 20 120 A 100 100 0 0 1 220 120"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <AnimatedPath
          d="M 20 120 A 100 100 0 0 1 220 120"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>

      {/* Percentage text */}
      <View style={styles.textContainer}>
        <Text style={styles.percent}>{displayVal}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 90,
    borderRadius: 90,
    top: 10,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    backgroundColor: 'transparent',
  },
  textContainer: {
    position: 'absolute',
    top: 50,
    alignItems: 'center',
  },
  percent: {
    color: '#f1f5f9',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
});