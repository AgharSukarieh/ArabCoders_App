/**
 * Theme Context Provider
 * 
 * يوفر نظام إدارة الوضع الليلي/الفاتح للتطبيق
 * Provides dark/light mode management system for the app
 * 
 * الاستخدام:
 * 1. لف التطبيق بـ <ThemeProvider>
 * 2. استخدم useTheme() hook في أي مكون
 * 3. استخدم toggleTheme() للتبديل بين الوضعين
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// مفتاح التخزين - Storage key
const THEME_STORAGE_KEY = '@app_theme_preference';

// نوع الوضع - Theme type
export type ThemeMode = 'light' | 'dark' | 'auto';

// نوع السياق - Context type
interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// إنشاء السياق - Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props للمزود - Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * يوفر الوضع الليلي/الفاتح لجميع المكونات
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // تحميل الوضع المحفوظ عند التحميل
  useEffect(() => {
    loadThemePreference();
  }, []);

  // تحديث الوضع عند تغيير themeMode أو systemColorScheme
  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  /**
   * تحميل الوضع المحفوظ من التخزين
   * Load saved theme preference from storage
   */
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  /**
   * تحديث الوضع الحالي
   * Update current theme
   */
  const updateTheme = () => {
    if (themeMode === 'auto') {
      // استخدام الوضع التلقائي من النظام
      setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      // استخدام الوضع المحدد يدوياً
      setTheme(themeMode);
    }
  };

  /**
   * حفظ الوضع في التخزين
   * Save theme preference to storage
   */
  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  /**
   * التبديل بين الوضع الفاتح والداكن
   * Toggle between light and dark mode
   */
  const toggleTheme = () => {
    const newMode: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setThemeModeState(newMode);
    saveThemePreference(newMode);
  };

  /**
   * تعيين الوضع مباشرة
   * Set theme mode directly
   */
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemePreference(mode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark: theme === 'dark',
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook لاستخدام الوضع
 * Hook to use theme
 * 
 * @returns ThemeContextType
 * 
 * @example
 * const { theme, isDark, toggleTheme } = useTheme();
 * const colors = getColorsByTheme(isDark);
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

