# دليل استخدام نظام الوضع الليلي - Dark Mode Guide

## نظرة عامة - Overview

تم إنشاء نظام Dark Mode كامل ومحترف يدعم:
- ✅ الوضع الفاتح (Light Mode)
- ✅ الوضع الليلي (Dark Mode)
- ✅ الوضع التلقائي (Auto - يتبع إعدادات النظام)
- ✅ حفظ التفضيلات
- ✅ تطبيق عالمي بدون تغيير منطق المكونات

---

## 1. الإعداد الأولي - Initial Setup

### أ. لف التطبيق بـ ThemeProvider

في ملف `app/_layout.tsx` أو الملف الرئيسي:

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* باقي التطبيق */}
    </ThemeProvider>
  );
}
```

---

## 2. استخدام الألوان في المكونات - Using Colors in Components

### أ. الطريقة الموصى بها - Recommended Way

استخدم `useAppColors()` hook:

```tsx
import { useAppColors } from '@/hooks/use-app-colors';
import { View, Text, StyleSheet } from 'react-native';

export const MyComponent = () => {
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.textPrimary }]}>
        Hello World
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 16,
  },
});
```

### ب. استخدام ألوان الاستخدام - Using Usage Colors

```tsx
import { useAppColors } from '@/hooks/use-app-colors';

export const MyButton = () => {
  const colors = useAppColors();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.usage.buttonPrimary,
        padding: 12,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: colors.textWhite }}>
        اضغط هنا
      </Text>
    </TouchableOpacity>
  );
};
```

### ج. الطريقة البديلة - Alternative Way

إذا كنت تريد استخدام `useTheme` مباشرة:

```tsx
import { useTheme } from '@/contexts/ThemeContext';
import { getColorsByTheme } from '@/constants/colors';

export const MyComponent = () => {
  const { isDark } = useTheme();
  const colors = getColorsByTheme(isDark);

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>Hello</Text>
    </View>
  );
};
```

---

## 3. زر التبديل - Toggle Button

### أ. استخدام المكون الجاهز - Using Pre-built Component

```tsx
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';

export const SettingsScreen = () => {
  return (
    <View>
      <ThemeToggleButton />
      
      {/* أو مع تخصيص */}
      <ThemeToggleButton 
        size={32}
        showLabel={true}
        label="الوضع الليلي"
      />
    </View>
  );
};
```

### ب. إنشاء زر مخصص - Custom Toggle Button

```tsx
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export const CustomThemeButton = () => {
  const { isDark, toggleTheme } = useTheme();
  const colors = useAppColors();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{ backgroundColor: colors.cardBackground }}
    >
      <Ionicons
        name={isDark ? 'moon' : 'sunny'}
        size={24}
        color={colors.primary}
      />
    </TouchableOpacity>
  );
};
```

---

## 4. التبديل بين الأوضاع - Switching Modes

### أ. التبديل البسيط - Simple Toggle

```tsx
const { toggleTheme } = useTheme();

// التبديل بين فاتح/داكن
toggleTheme();
```

### ب. تعيين وضع محدد - Set Specific Mode

```tsx
const { setThemeMode } = useTheme();

// تعيين الوضع الفاتح
setThemeMode('light');

// تعيين الوضع الليلي
setThemeMode('dark');

// تعيين الوضع التلقائي (يتبع النظام)
setThemeMode('auto');
```

### ج. الحصول على الوضع الحالي - Get Current Theme

```tsx
const { theme, isDark, themeMode } = useTheme();

console.log(theme);      // 'light' أو 'dark'
console.log(isDark);     // true أو false
console.log(themeMode);  // 'light' أو 'dark' أو 'auto'
```

---

## 5. استخدام التدرجات - Using Gradients

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useAppColors } from '@/hooks/use-app-colors';

export const GradientCard = () => {
  const colors = useAppColors();

  return (
    <LinearGradient
      colors={colors.gradientPrimary}
      style={{ padding: 16, borderRadius: 12 }}
    >
      <Text style={{ color: colors.textWhite }}>Card Content</Text>
    </LinearGradient>
  );
};
```

---

## 6. أمثلة متقدمة - Advanced Examples

### أ. مكون مع ألوان ديناميكية - Component with Dynamic Colors

```tsx
import { useAppColors } from '@/hooks/use-app-colors';
import { View, Text, StyleSheet } from 'react-native';

export const StatusCard = ({ type }: { type: 'success' | 'error' | 'warning' }) => {
  const colors = useAppColors();

  const getStatusColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: getStatusColor(),
        },
      ]}
    >
      <Text style={{ color: colors.textPrimary }}>Status Message</Text>
    </View>
  );
};
```

### ب. استخدام ألوان الصعوبة - Using Difficulty Colors

```tsx
import { useAppColors } from '@/hooks/use-app-colors';

export const DifficultyBadge = ({ level }: { level: 1 | 2 | 3 }) => {
  const colors = useAppColors();

  const getDifficultyColor = () => {
    switch (level) {
      case 1:
        return colors.difficultyEasy;
      case 2:
        return colors.difficultyMedium;
      case 3:
        return colors.difficultyHard;
    }
  };

  return (
    <View style={{ backgroundColor: getDifficultyColor() }}>
      <Text>Difficulty: {level}</Text>
    </View>
  );
};
```

---

## 7. أفضل الممارسات - Best Practices

### ✅ افعل - Do

1. **استخدم `useAppColors()` دائماً** - Use `useAppColors()` always
   ```tsx
   const colors = useAppColors();
   ```

2. **استخدم ألوان الاستخدام للعناصر الشائعة** - Use usage colors for common elements
   ```tsx
   colors.usage.buttonPrimary
   colors.usage.cardBackground
   ```

3. **احفظ التفضيلات تلقائياً** - Preferences are saved automatically
   - لا حاجة لحفظ يدوي - No manual saving needed

4. **استخدم التدرجات من colors** - Use gradients from colors
   ```tsx
   colors.gradientPrimary
   ```

### ❌ لا تفعل - Don't

1. **لا تكتب الألوان مباشرة** - Don't hardcode colors
   ```tsx
   // ❌ خطأ
   <View style={{ backgroundColor: '#085173' }} />
   
   // ✅ صحيح
   <View style={{ backgroundColor: colors.primary }} />
   ```

2. **لا تستخدم `AppColors` مباشرة** - Don't use `AppColors` directly
   ```tsx
   // ❌ خطأ
   import { AppColors } from '@/constants/colors';
   
   // ✅ صحيح
   import { useAppColors } from '@/hooks/use-app-colors';
   ```

3. **لا تخلط بين الألوان الفاتحة والداكنة** - Don't mix light and dark colors
   - استخدم دائماً `useAppColors()` للحصول على الألوان الصحيحة

---

## 8. قائمة الألوان المتاحة - Available Colors

### الألوان الأساسية - Primary Colors
- `colors.primary`
- `colors.primaryDark`
- `colors.primaryLight`
- `colors.primaryLighter`

### ألوان الخلفية - Background Colors
- `colors.background`
- `colors.backgroundLight`
- `colors.backgroundGray`
- `colors.backgroundLighter`

### ألوان النص - Text Colors
- `colors.textPrimary`
- `colors.textSecondary`
- `colors.textTertiary`
- `colors.textLight`
- `colors.textWhite`

### ألوان الحالة - Status Colors
- `colors.success`
- `colors.warning`
- `colors.error`
- `colors.info`

### ألوان الكروت - Card Colors
- `colors.cardBackground`
- `colors.cardBackgroundLight`
- `colors.cardShadow`

### التدرجات - Gradients
- `colors.gradientPrimary`
- `colors.gradientCard`
- `colors.gradientRefresh`
- `colors.gradientYouTube`

### ألوان الاستخدام - Usage Colors
- `colors.usage.buttonPrimary`
- `colors.usage.buttonSuccess`
- `colors.usage.cardBackground`
- `colors.usage.inputBackground`
- وغيرها...

---

## 9. استكشاف الأخطاء - Troubleshooting

### المشكلة: الألوان لا تتغير
**الحل**: تأكد من أنك استخدمت `useAppColors()` وليس `AppColors` مباشرة

### المشكلة: الوضع لا يُحفظ
**الحل**: تأكد من أن `ThemeProvider` موجود في أعلى شجرة المكونات

### المشكلة: الوضع التلقائي لا يعمل
**الحل**: تأكد من أن `useColorScheme` يعمل بشكل صحيح في جهازك

---

## 10. الدعم - Support

للمزيد من المعلومات أو المساعدة، راجع:
- ملف `constants/colors.ts` - جميع الألوان
- ملف `contexts/ThemeContext.tsx` - منطق الوضع
- ملف `hooks/use-app-colors.ts` - Hook الاستخدام

---

**تم إنشاء هذا النظام بواسطة AI Assistant**
**Created by AI Assistant**

