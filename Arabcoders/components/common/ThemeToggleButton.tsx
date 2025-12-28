/**
 * Theme Toggle Button Component
 * 
 * زر للتبديل بين الوضع الليلي والفاتح
 * Button to toggle between dark and light mode
 * 
 * @example
 * <ThemeToggleButton />
 * 
 * أو مع تخصيص:
 * <ThemeToggleButton 
 *   size={32}
 *   showLabel={true}
 *   style={{ marginRight: 16 }}
 * />
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppColors } from '@/hooks/use-app-colors';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue 
} from 'react-native-reanimated';

interface ThemeToggleButtonProps {
  /**
   * حجم الأيقونة
   * Icon size
   */
  size?: number;
  
  /**
   * إظهار النص بجانب الأيقونة
   * Show label next to icon
   */
  showLabel?: boolean;
  
  /**
   * النص المخصص
   * Custom label text
   */
  label?: string;
  
  /**
   * تخصيص الأنماط
   * Custom styles
   */
  style?: ViewStyle;
  iconStyle?: TextStyle;
  labelStyle?: TextStyle;
}

/**
 * Theme Toggle Button
 */
export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  size = 24,
  showLabel = false,
  label,
  style,
  iconStyle,
  labelStyle,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const colors = useAppColors();
  
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(isDark ? 180 : 0);

  // Update rotation when theme changes
  React.useEffect(() => {
    rotation.value = withSpring(isDark ? 180 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isDark]);

  // Animated styles
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  /**
   * معالج الضغط
   * Press handler
   */
  const handlePress = () => {
    // Animation
    scale.value = withSpring(0.8, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    
    // Toggle theme (rotation will update automatically via useEffect)
    toggleTheme();
  };

  // Get icon name
  const iconName = isDark ? 'moon' : 'sunny';

  // Get label text
  const labelText = label || (isDark ? 'الوضع الفاتح' : 'الوضع الليلي');

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name={iconName}
          size={size}
          color={colors.primary}
          style={iconStyle}
        />
      </Animated.View>
      
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: colors.textPrimary },
            labelStyle,
          ]}
        >
          {labelText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ThemeToggleButton;

