import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface RiskGaugeProps {
  score: number;
  color: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RiskGauge = ({ score, color }: RiskGaugeProps) => {
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;

  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayScore(Math.floor(value));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <Svg width={180} height={180}>
        {/* Background Circle */}
        <Circle
          stroke="rgba(255,255,255,0.08)"
          fill="none"
          cx="90"
          cy="90"
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Circle */}
        <AnimatedCircle
          stroke={color}
          fill="none"
          cx="90"
          cy="90"
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin="90,90"
        />
      </Svg>

      {/* Score Text */}
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{displayScore}%</Text>

        <Text style={styles.label}>RISK SCORE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },

  scoreContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },

  score: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
  },

  label: {
    color: "#94a3b8",
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 4,
  },
});
