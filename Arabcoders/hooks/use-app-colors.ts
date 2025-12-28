/**
 * Hook لاستخدام ألوان التطبيق حسب الوضع
 * Hook to use app colors based on theme
 * 
 * هذا الـ hook يجمع بين useTheme و getColorsByTheme
 * This hook combines useTheme and getColorsByTheme
 * 
 * @example
 * const colors = useAppColors();
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.textPrimary }}>Hello</Text>
 * </View>
 */

import { useTheme } from '@/contexts/ThemeContext';
import { getColorsByTheme, getColorsByUsage, ColorTheme } from '@/constants/colors';

/**
 * نوع الألوان مع ألوان الاستخدام
 * Color type with usage colors
 */
export interface AppColorsWithUsage extends ColorTheme {
  usage: ReturnType<typeof getColorsByUsage>;
}

/**
 * Hook لاستخدام الألوان
 * Hook to use colors
 * 
 * @returns كائن الألوان مع ألوان الاستخدام
 */
export const useAppColors = (): AppColorsWithUsage => {
  const { isDark } = useTheme();
  const colors = getColorsByTheme(isDark);
  const usage = getColorsByUsage(isDark);

  return {
    ...colors,
    usage,
  } as AppColorsWithUsage;
};

export default useAppColors;

