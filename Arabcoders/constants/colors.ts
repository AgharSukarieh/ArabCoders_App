/**
 * جميع الألوان المستخدمة في التطبيق
 * Colors used in the application
 * 
 * نظام الألوان يدعم الوضع الليلي (Dark Mode) بشكل كامل
 * Color system fully supports Dark Mode
 */

// ============================================
// الألوان الأساسية - Light Mode Colors
// ============================================

export const AppColors = {
  // الألوان الأساسية - Primary Colors
  primary: '#085173',           // اللون الأساسي الرئيسي (أزرق داكن)
  primaryDark: '#063D52',       // اللون الأساسي الداكن (للـ gradients)
  primaryLight: '#0A6B9A',      // اللون الأساسي الفاتح
  primaryLighter: '#0C85C1',    // اللون الأساسي الأفتح

  // الألوان الثانوية - Secondary Colors
  secondary: '#4A90E2',         // أزرق فاتح (للأيقونات والعناصر الثانوية)
  accent: '#0E8BA6',            // أزرق متوسط (للعناصر المميزة)

  // ألوان الحالة - Status Colors
  success: '#4CAF50',           // أخضر (نجاح، إيجابي)
  warning: '#FFC107',           // أصفر (تحذير)
  error: '#F44336',             // أحمر (خطأ، خطر)
  info: '#4A90E2',              // أزرق (معلومات)

  // ألوان الصعوبة - Difficulty Colors
  difficultyEasy: '#4CAF50',    // أخضر (سهل)
  difficultyMedium: '#FF9800',  // برتقالي (متوسط)
  difficultyHard: '#F44336',    // أحمر (صعب)

  // ألوان الخلفية - Background Colors
  background: '#FFFFFF',        // أبيض (الخلفية الرئيسية)
  backgroundLight: '#F5F5F5',   // رمادي فاتح جداً (خلفيات ثانوية)
  backgroundGray: '#E5E5E5',    // رمادي فاتح (حدود، خطوط)
  backgroundLighter: '#F8FBFF', // أزرق فاتح جداً (خلفيات كروت)

  // ألوان النص - Text Colors
  textPrimary: '#333333',       // أسود/رمادي داكن (النص الرئيسي)
  textSecondary: '#666666',     // رمادي متوسط (النص الثانوي)
  textTertiary: '#999999',      // رمادي فاتح (النص الثلاثي)
  textLight: '#CCCCCC',         // رمادي فاتح جداً (نص خفيف)
  textWhite: '#FFFFFF',         // أبيض (نص على خلفيات داكنة)

  // ألوان الحدود - Border Colors
  border: '#E5E5E5',            // رمادي فاتح (حدود عامة)
  borderLight: '#E0E0E0',      // رمادي فاتح جداً (حدود خفيفة)
  borderLighter: '#DADADA',     // رمادي فاتح (حدود أفتح)
  borderDark: '#D9D9D9',       // رمادي (حدود داكنة)

  // ألوان الكروت - Card Colors
  cardBackground: '#FFFFFF',    // أبيض (خلفية الكروت)
  cardBackgroundLight: '#F8FBFF', // أزرق فاتح جداً (خلفية كروت فاتحة)
  cardShadow: '#000000',        // أسود (للظلال)

  // ألوان التدرجات - Gradient Colors
  gradientPrimary: ['#085173', '#063D52'],        // التدرج الأساسي
  gradientCard: ['#FFFFFF', '#F8FBFF'],           // تدرج الكروت
  gradientImagePlaceholder: ['#E8F4FD', '#D4E9FA'], // تدرج placeholder الصور
  gradientRefresh: ['#085173', '#0A6B9A', '#0C85C1'], // تدرج pull-to-refresh
  gradientYouTube: ['#FF0000', '#CC0000'],        // تدرج YouTube

  // ألوان الحالات الخاصة - Special State Colors
  active: '#085173',            // نشط
  inactive: '#CCCCCC',          // غير نشط
  disabled: '#E0E0E0',          // معطل
  selected: '#085173',          // محدد
  unselected: '#F5F5F5',        // غير محدد

  // ألوان الإشعارات - Notification Colors
  notificationBadge: '#FF3B30', // أحمر (badge الإشعارات)
  notificationBackground: '#E3F2FD', // أزرق فاتح (خلفية الإشعارات)

  // ألوان الإحصائيات - Statistics Colors
  statBlue: '#4A90E2',          // أزرق (للإحصائيات)
  statGreen: '#4CAF50',         // أخضر (للإحصائيات)
  statYellow: '#FFC107',        // أصفر (للإحصائيات)
  statOrange: '#FF9800',        // برتقالي (للإحصائيات)
  statRed: '#F44336',           // أحمر (للإحصائيات)

  // ألوان الخلفيات المخصصة - Custom Background Colors
  backgroundBlue: '#E3F2FD',    // أزرق فاتح (خلفيات زرقاء)
  backgroundGreen: '#E8F5E9',   // أخضر فاتح (خلفيات خضراء)
  backgroundYellow: '#FFF9C4',  // أصفر فاتح (خلفيات صفراء)
  backgroundOrange: '#FFF3E0',  // برتقالي فاتح (خلفيات برتقالية)
  backgroundPink: '#FFE0E6',    // وردي فاتح (خلفيات وردية)
  backgroundLightBlue: '#E8F6FA', // أزرق فاتح جداً
  backgroundLightGreen: '#EAF7EB', // أخضر فاتح جداً
  backgroundLightYellow: '#FEF6DA', // أصفر فاتح جداً
  backgroundLightOrange: '#F7E9DF', // برتقالي فاتح جداً

  // ألوان النصوص المخصصة - Custom Text Colors
  textBlue: '#4A90E2',          // أزرق (نص)
  textGreen: '#4CAF50',         // أخضر (نص)
  textRed: '#F44336',           // أحمر (نص)
  textPink: '#C2185B',         // وردي (نص)
  textDark: '#1F2A44',         // رمادي داكن جداً (نص)
  textGray: '#4A4A4A',         // رمادي (نص)

  // ألوان أخرى - Other Colors
  transparent: 'transparent',   // شفاف
  black: '#000000',             // أسود
  white: '#FFFFFF',             // أبيض
  youtubeRed: '#FF0000',        // أحمر YouTube
  youtubeDarkRed: '#CC0000',    // أحمر YouTube داكن
  brown: '#8B7355',             // بني (للأيقونات)
  purple: '#9C27B0',           // بنفسجي (إن وجد)
};

// ============================================
// الألوان الليلية - Dark Mode Colors
// ============================================

export const DarkAppColors = {
  // الألوان الأساسية - Primary Colors
  // الحفاظ على الهوية البصرية مع تفتيح طفيف للوضوح
  primary: '#0A7A9E',           // أزرق فاتح قليلاً من الأساسي (للتباين على الخلفية الداكنة)
  primaryDark: '#085173',       // نفس اللون الأساسي (يعمل كداكن في الوضع الليلي)
  primaryLight: '#1A9BC7',      // أزرق فاتح (للتباين)
  primaryLighter: '#2BB3E0',     // أزرق فاتح جداً (للتباين)

  // الألوان الثانوية - Secondary Colors
  secondary: '#5BA3F0',         // أزرق فاتح (أفتح قليلاً للوضوح)
  accent: '#1EB8D4',            // أزرق متوسط فاتح (للعناصر المميزة)

  // ألوان الحالة - Status Colors
  // الحفاظ على الألوان مع تعديل طفيف للوضوح على الخلفية الداكنة
  success: '#66BB6A',           // أخضر فاتح (للتباين الجيد)
  warning: '#FFCA28',           // أصفر فاتح (للتباين)
  error: '#EF5350',             // أحمر فاتح (للتباين)
  info: '#5BA3F0',              // أزرق فاتح (معلومات)

  // ألوان الصعوبة - Difficulty Colors
  difficultyEasy: '#66BB6A',    // أخضر فاتح (سهل)
  difficultyMedium: '#FFB74D',  // برتقالي فاتح (متوسط)
  difficultyHard: '#EF5350',    // أحمر فاتح (صعب)

  // ألوان الخلفية - Background Colors
  // استخدام خلفيات داكنة ناعمة (ليست سوداء تماماً) للراحة البصرية
  background: '#121212',        // رمادي داكن جداً (الخلفية الرئيسية - Material Design Dark)
  backgroundLight: '#1E1E1E',   // رمادي داكن (خلفيات ثانوية)
  backgroundGray: '#2C2C2C',    // رمادي متوسط (حدود، خطوط)
  backgroundLighter: '#1A2332', // أزرق داكن فاتح (خلفيات كروت)

  // ألوان النص - Text Colors
  // استخدام نصوص فاتحة ناعمة (ليست بيضاء قاسية) للراحة
  textPrimary: '#E0E0E0',       // رمادي فاتح جداً (النص الرئيسي - WCAG AAA)
  textSecondary: '#B0B0B0',    // رمادي فاتح (النص الثانوي - WCAG AA)
  textTertiary: '#808080',     // رمادي متوسط (النص الثلاثي)
  textLight: '#606060',        // رمادي داكن (نص خفيف)
  textWhite: '#FFFFFF',        // أبيض (نص على خلفيات داكنة جداً)

  // ألوان الحدود - Border Colors
  // حدود داكنة ولكن مرئية بوضوح
  border: '#333333',            // رمادي داكن (حدود عامة)
  borderLight: '#2A2A2A',      // رمادي داكن جداً (حدود خفيفة)
  borderLighter: '#404040',     // رمادي متوسط (حدود أفتح)
  borderDark: '#1A1A1A',       // رمادي داكن جداً (حدود داكنة)

  // ألوان الكروت - Card Colors
  // كروت داكنة مع تباين جيد
  cardBackground: '#1E1E1E',    // رمادي داكن (خلفية الكروت)
  cardBackgroundLight: '#252A35', // أزرق داكن فاتح (خلفية كروت فاتحة)
  cardShadow: '#000000',        // أسود (للظلال)

  // ألوان التدرجات - Gradient Colors
  // تدرجات تعمل بشكل جيد على الخلفيات الداكنة
  gradientPrimary: ['#0A7A9E', '#085173'],        // التدرج الأساسي (معدل)
  gradientCard: ['#1E1E1E', '#252A35'],           // تدرج الكروت (داكن)
  gradientImagePlaceholder: ['#1A2332', '#0F1621'], // تدرج placeholder الصور (داكن)
  gradientRefresh: ['#0A7A9E', '#1A9BC7', '#2BB3E0'], // تدرج pull-to-refresh (معدل)
  gradientYouTube: ['#FF4444', '#CC0000'],        // تدرج YouTube (معدل قليلاً)

  // ألوان الحالات الخاصة - Special State Colors
  active: '#0A7A9E',            // نشط (أزرق فاتح)
  inactive: '#555555',          // غير نشط (رمادي متوسط)
  disabled: '#2A2A2A',          // معطل (رمادي داكن)
  selected: '#0A7A9E',          // محدد (أزرق فاتح)
  unselected: '#2C2C2C',        // غير محدد (رمادي داكن)

  // ألوان الإشعارات - Notification Colors
  notificationBadge: '#FF5252', // أحمر فاتح (badge الإشعارات - للتباين)
  notificationBackground: '#1A2A3A', // أزرق داكن (خلفية الإشعارات)

  // ألوان الإحصائيات - Statistics Colors
  // ألوان فاتحة قليلاً للوضوح على الخلفية الداكنة
  statBlue: '#5BA3F0',          // أزرق فاتح (للإحصائيات)
  statGreen: '#66BB6A',         // أخضر فاتح (للإحصائيات)
  statYellow: '#FFCA28',        // أصفر فاتح (للإحصائيات)
  statOrange: '#FFB74D',        // برتقالي فاتح (للإحصائيات)
  statRed: '#EF5350',           // أحمر فاتح (للإحصائيات)

  // ألوان الخلفيات المخصصة - Custom Background Colors
  // خلفيات داكنة مع صبغة من الألوان الأصلية
  backgroundBlue: '#1A2A3A',    // أزرق داكن (خلفيات زرقاء)
  backgroundGreen: '#1A2E1F',   // أخضر داكن (خلفيات خضراء)
  backgroundYellow: '#2E2A1A',  // أصفر داكن (خلفيات صفراء)
  backgroundOrange: '#2E241A',  // برتقالي داكن (خلفيات برتقالية)
  backgroundPink: '#2E1A1F',    // وردي داكن (خلفيات وردية)
  backgroundLightBlue: '#1E2A35', // أزرق داكن فاتح
  backgroundLightGreen: '#1E2E22', // أخضر داكن فاتح
  backgroundLightYellow: '#2E2A1E', // أصفر داكن فاتح
  backgroundLightOrange: '#2E241E', // برتقالي داكن فاتح

  // ألوان النصوص المخصصة - Custom Text Colors
  // نصوص فاتحة للوضوح على الخلفية الداكنة
  textBlue: '#5BA3F0',          // أزرق فاتح (نص)
  textGreen: '#66BB6A',         // أخضر فاتح (نص)
  textRed: '#EF5350',           // أحمر فاتح (نص)
  textPink: '#E91E63',         // وردي فاتح (نص)
  textDark: '#B0B0B0',         // رمادي فاتح (نص - بدلاً من داكن)
  textGray: '#808080',         // رمادي متوسط (نص)

  // ألوان أخرى - Other Colors
  transparent: 'transparent',   // شفاف
  black: '#000000',             // أسود
  white: '#FFFFFF',             // أبيض
  youtubeRed: '#FF4444',        // أحمر YouTube (فاتح قليلاً)
  youtubeDarkRed: '#CC0000',    // أحمر YouTube داكن
  brown: '#A68B6B',             // بني فاتح (للأيقونات)
  purple: '#BA68C8',           // بنفسجي فاتح (إن وجد)
};

// ============================================
// دوال الحصول على الألوان حسب الوضع - Theme Functions
// ============================================

/**
 * الحصول على الألوان حسب الوضع (فاتح/داكن)
 * Get colors based on theme (light/dark)
 * 
 * @param isDark - true للوضع الليلي، false للوضع الفاتح
 * @returns كائن الألوان المناسب للوضع
 */
export const getColorsByTheme = (isDark: boolean = false) => {
  return isDark ? DarkAppColors : AppColors;
};

/**
 * نوع الألوان - Color Type
 */
export type ColorTheme = typeof AppColors;

// ============================================
// ألوان حسب الاستخدام - Light Mode
// ============================================

export const ColorsByUsage = {
  // الأزرار - Buttons
  buttonPrimary: AppColors.primary,
  buttonPrimaryDark: AppColors.primaryDark,
  buttonSuccess: AppColors.success,
  buttonError: AppColors.error,
  buttonWarning: AppColors.warning,
  buttonDisabled: AppColors.disabled,

  // الروابط - Links
  link: AppColors.secondary,
  linkActive: AppColors.primary,

  // الحقول - Inputs
  inputBackground: AppColors.background,
  inputBorder: AppColors.border,
  inputBorderFocus: AppColors.primary,
  inputPlaceholder: AppColors.textTertiary,

  // الكروت - Cards
  cardBackground: AppColors.cardBackground,
  cardBorder: AppColors.border,
  cardShadow: AppColors.cardShadow,

  // الحالة - Status
  online: AppColors.success,
  offline: AppColors.textLight,
  pending: AppColors.warning,
  error: AppColors.error,
};

// ============================================
// ألوان حسب الاستخدام - Dark Mode
// ============================================

export const DarkColorsByUsage = {
  // الأزرار - Buttons
  buttonPrimary: DarkAppColors.primary,
  buttonPrimaryDark: DarkAppColors.primaryDark,
  buttonSuccess: DarkAppColors.success,
  buttonError: DarkAppColors.error,
  buttonWarning: DarkAppColors.warning,
  buttonDisabled: DarkAppColors.disabled,

  // الروابط - Links
  link: DarkAppColors.secondary,
  linkActive: DarkAppColors.primary,

  // الحقول - Inputs
  inputBackground: DarkAppColors.background,
  inputBorder: DarkAppColors.border,
  inputBorderFocus: DarkAppColors.primary,
  inputPlaceholder: DarkAppColors.textTertiary,

  // الكروت - Cards
  cardBackground: DarkAppColors.cardBackground,
  cardBorder: DarkAppColors.border,
  cardShadow: DarkAppColors.cardShadow,

  // الحالة - Status
  online: DarkAppColors.success,
  offline: DarkAppColors.textLight,
  pending: DarkAppColors.warning,
  error: DarkAppColors.error,
};

/**
 * الحصول على ألوان الاستخدام حسب الوضع
 * Get usage colors based on theme
 * 
 * @param isDark - true للوضع الليلي، false للوضع الفاتح
 * @returns كائن ألوان الاستخدام المناسب
 */
export const getColorsByUsage = (isDark: boolean = false) => {
  return isDark ? DarkColorsByUsage : ColorsByUsage;
};

// ============================================
// تصدير الألوان بشكل منظم
// ============================================

export default AppColors;

