import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useEffect, useState } from 'react';

export default function RiskGauge({ risk, color }: { risk: number; color: string }) {
  const [animatedRisk, setAnimatedRisk] = useState(0);

  const radius = 90;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;

  // 🎯 Animate from 0 → risk
  useEffect(() => {
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      if (current >= risk) {
        current = risk;
        clearInterval(interval);
      }
      setAnimatedRisk(current);
    }, 15);

    return () => clearInterval(interval);
  }, [risk]);

  const progress = animatedRisk / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={220} height={130} viewBox="0 0 220 130">

        {/* Background Arc */}
        <Path
          d="M 20 110 A 90 90 0 0 1 200 110"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated Arc */}
        <Path
          d="M 20 110 A 90 90 0 0 1 200 110"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />

      </Svg>

      <View style={styles.textContainer}>
        <Text style={styles.percent}>{animatedRisk}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    top: 40,
  },
  percent: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
});