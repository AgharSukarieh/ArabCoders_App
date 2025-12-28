import React, { useState, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

interface RippleEffectCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  rippleColor?: string;
}

/**
 * Card wrapper with custom ripple animation.
 */
export const RippleEffectCard: React.FC<RippleEffectCardProps> = ({
  children,
  style,
  onPress,
  rippleColor = '#183E9F',
}) => {
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });
  const [ripples, setRipples] = useState<
    Array<{
      key: number;
      style: { left: number; top: number };
      anim: Animated.Value;
      maxDiameter: number;
    }>
  >([]);

  const handlePressIn = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = cardDimensions;
    const maxDiameter = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) * 2;

    const newRipple = {
      key: Date.now(),
      style: { left: locationX, top: locationY },
      anim: new Animated.Value(0),
      maxDiameter,
    };

    setRipples((prev) => [...prev, newRipple]);

    Animated.timing(newRipple.anim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setRipples((prev) => prev.filter((r) => r.key !== newRipple.key));
    });
  };

  return (
    <Pressable
      style={style}
      onPressIn={handlePressIn}
      onPress={onPress}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setCardDimensions({ width, height });
      }}>
      {children}
      <View style={styles.rippleContainer}>
        {ripples.map((ripple) => (
          <Animated.View
            key={ripple.key}
            style={[
              styles.ripple,
              { backgroundColor: rippleColor },
              ripple.style,
              {
                width: ripple.maxDiameter,
                height: ripple.maxDiameter,
                borderRadius: ripple.maxDiameter / 2,
                transform: [
                  { translateX: -ripple.maxDiameter / 2 },
                  { translateY: -ripple.maxDiameter / 2 },
                  { scale: ripple.anim },
                ],
                opacity: ripple.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 20,
  },
  ripple: {
    position: 'absolute',
  },
});

