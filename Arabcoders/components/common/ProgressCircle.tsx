import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

const CIRCLE_RADIUS = 34;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const getDashOffset = (value: number, total: number) => {
  if (!total || total <= 0) return CIRCLE_CIRCUMFERENCE;
  const safeValue = Math.max(0, Math.min(value ?? 0, total));
  return CIRCLE_CIRCUMFERENCE - (safeValue / total) * CIRCLE_CIRCUMFERENCE;
};

interface ProgressCircleProps {
  value: number;
  total: number;
  label: string;
  color: string;
  size?: number;
  animatedValue?: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  total,
  label,
  color,
  size = 96,
  animatedValue,
}) => {
  const { isDark } = useTheme();
  const dashOffsetAnim = useRef(new Animated.Value(CIRCLE_CIRCUMFERENCE)).current;
  const [displayCount, setDisplayCount] = useState(0);
  const [dashOffset, setDashOffset] = useState(CIRCLE_CIRCUMFERENCE);

  const progress = animatedValue !== undefined ? animatedValue : value;

  useEffect(() => {
    const targetOffset = getDashOffset(progress, total);
    
    // Animate dash offset
    const offsetListener = dashOffsetAnim.addListener(({ value }) => {
      setDashOffset(value);
    });
    
    Animated.timing(dashOffsetAnim, {
      toValue: targetOffset,
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // Animate count
    const countAnim = new Animated.Value(0);
    const countListener = countAnim.addListener(({ value }) => {
      setDisplayCount(Math.floor(value));
    });
    
    Animated.timing(countAnim, {
      toValue: progress,
      duration: 2000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(() => {
      setDisplayCount(Math.floor(progress));
      if (countListener) {
        countAnim.removeListener(countListener);
      }
    });

    return () => {
      if (countListener) {
        countAnim.removeListener(countListener);
      }
      if (offsetListener) {
        dashOffsetAnim.removeListener(offsetListener);
      }
    };
  }, [progress, total]);

  const center = size / 2;
  const svgSize = 100;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={styles.svg}
      >
        {/* Background Circle */}
        <Circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={isDark ? '#444' : '#D9D9D9'}
          strokeWidth="6"
        />
        
        {/* Progress Circle */}
        <Circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeLinecap="round"
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
        />
      </Svg>

      {/* Content Overlay */}
      <View style={[styles.content, { width: size, height: size }]}>
        <Text style={[styles.value, { color: isDark ? '#FFFFFF' : '#333' }]}>
          {displayCount}
        </Text>
      </View>

      {/* Label and Progress */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: isDark ? '#AAAAAA' : '#666' }]}>{label}</Text>
        <Text style={[styles.progress, { color: isDark ? '#888' : '#999' }]}>
          {Math.floor(progress)}/{total || 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelContainer: {
    position: 'absolute',
    bottom: -20,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  progress: {
    fontSize: 11,
  },
});

