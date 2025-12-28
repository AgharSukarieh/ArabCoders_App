/**
 * مثال على دمج نظام الوضع الليلي في التطبيق
 * Example of integrating Dark Mode system into the app
 * 
 * هذا الملف يوضح كيفية:
 * 1. إضافة ThemeProvider في _layout.tsx
 * 2. استخدام الألوان في المكونات
 * 3. إضافة زر التبديل
 */

// ============================================
// 1. إضافة ThemeProvider في app/_layout.tsx
// ============================================

/*
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
*/

// ============================================
// 2. مثال على استخدام الألوان في مكون
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppColors } from '@/hooks/use-app-colors';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';

export const ExampleScreen = () => {
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          مثال على الوضع الليلي
        </Text>
        <ThemeToggleButton />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Card Example */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            بطاقة مثال
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            هذا مثال على استخدام الألوان في الوضع الليلي
          </Text>
        </View>

        {/* Button Examples */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.usage.buttonPrimary },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.textWhite }]}>
            زر أساسي
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.usage.buttonSuccess },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.textWhite }]}>
            زر نجاح
          </Text>
        </TouchableOpacity>

        {/* Status Colors Example */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.success },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.textWhite }]}>
              نجاح
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.warning },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.textWhite }]}>
              تحذير
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.error },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.textWhite }]}>
              خطأ
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// ============================================
// 3. مثال على استخدام useTheme مباشرة
// ============================================

/*
import { useTheme } from '@/contexts/ThemeContext';
import { getColorsByTheme } from '@/constants/colors';

export const DirectThemeExample = () => {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColorsByTheme(isDark);

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>
        الوضع الحالي: {isDark ? 'ليلي' : 'فاتح'}
      </Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text>تبديل الوضع</Text>
      </TouchableOpacity>
    </View>
  );
};
*/

// ============================================
// 4. مثال على استخدام التدرجات
// ============================================

/*
import { LinearGradient } from 'expo-linear-gradient';
import { useAppColors } from '@/hooks/use-app-colors';

export const GradientExample = () => {
  const colors = useAppColors();

  return (
    <LinearGradient
      colors={colors.gradientPrimary}
      style={{ padding: 20, borderRadius: 12 }}
    >
      <Text style={{ color: colors.textWhite }}>
        محتوى مع تدرج لوني
      </Text>
    </LinearGradient>
  );
};
*/

// ============================================
// 5. مثال على مكون مع ألوان ديناميكية
// ============================================

/*
import { useAppColors } from '@/hooks/use-app-colors';

export const DynamicColorComponent = ({ 
  type 
}: { 
  type: 'primary' | 'success' | 'error' 
}) => {
  const colors = useAppColors();

  const getColor = () => {
    switch (type) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={{ backgroundColor: getColor() }}>
      <Text style={{ color: colors.textWhite }}>محتوى</Text>
    </View>
  );
};
*/

