# دليل تحديث جميع الصفحات للوضع الليلي

## الصفحات المحدثة:
✅ AlgorithmsScreen
✅ MoreScreen
✅ BottomNav

## الصفحات المتبقية:
- [ ] AlgorithmDetailScreen
- [ ] ProfileScreen
- [ ] UserProfileScreen
- [ ] CompetitionsScreen
- [ ] NotificationsScreen
- [ ] EventsScreen
- [ ] EventDetailScreen
- [ ] RankingScreen
- [ ] FAQScreen
- [ ] AboutUsScreen
- [ ] ContactUsScreen
- [ ] TermsAndConditionsScreen
- [ ] FollowersScreen
- [ ] FollowingScreen

## خطوات التحديث لكل صفحة:

1. إضافة الاستيرادات:
```tsx
import { useAppColors } from '@/hooks/use-app-colors';
import { useTheme } from '@/contexts/ThemeContext';
```

2. إضافة في المكون:
```tsx
const colors = useAppColors();
const { isDark } = useTheme();
```

3. إنشاء dynamicStyles:
```tsx
const dynamicStyles = {
  container: { backgroundColor: colors.background },
  header: { backgroundColor: colors.cardBackground },
  text: { color: colors.textPrimary },
  // ... إلخ
};
```

4. تطبيق الأنماط:
```tsx
<View style={[styles.container, dynamicStyles.container]}>
  <Text style={[styles.text, dynamicStyles.text]}>Hello</Text>
</View>
```

5. تحديث StatusBar:
```tsx
<StatusBar style={isDark ? "light" : "dark"} />
```

6. تحديث الألوان في الأيقونات:
```tsx
<Ionicons name="icon" color={colors.primary} />
```

7. تحديث التدرجات:
```tsx
<LinearGradient colors={colors.gradientPrimary as any} />
```

