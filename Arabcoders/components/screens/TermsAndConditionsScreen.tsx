import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export interface TermsAndConditionsScreenProps {
  onBack: () => void;
}

export function TermsAndConditionsScreen({ onBack }: TermsAndConditionsScreenProps) {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    sectionTitle: { ...styles.sectionTitle, color: isDark ? '#FFFFFF' : '#085173' },
    sectionText: { ...styles.sectionText, color: isDark ? '#CCCCCC' : '#333' },
    listItem: { ...styles.listItem, color: isDark ? '#AAAAAA' : '#555' },
    footerText: { ...styles.footerText, color: isDark ? '#AAAAAA' : '#666' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <Text style={dynamicStyles.headerTitle}>الشروط والأحكام</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <Animated.View style={animatedStyle}>
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>1. القبول والشروط</Text>
            <Text style={dynamicStyles.sectionText}>
              باستخدامك لمنصة عرب كودرز، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>2. استخدام المنصة</Text>
            <Text style={dynamicStyles.sectionText}>
              يجب عليك استخدام المنصة بشكل قانوني وأخلاقي. يحظر عليك:
            </Text>
            <View style={styles.listContainer}>
              <Text style={dynamicStyles.listItem}>• استخدام المنصة لأي غرض غير قانوني أو غير أخلاقي</Text>
              <Text style={dynamicStyles.listItem}>• محاولة اختراق أو إلحاق الضرر بنظام المنصة</Text>
              <Text style={dynamicStyles.listItem}>• نشر محتوى مسيء أو غير لائق</Text>
              <Text style={dynamicStyles.listItem}>• انتهاك حقوق الملكية الفكرية للآخرين</Text>
              <Text style={dynamicStyles.listItem}>• استخدام حسابات متعددة للاحتيال أو التلاعب بالتصنيفات</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>3. الحساب والمعلومات الشخصية</Text>
            <Text style={dynamicStyles.sectionText}>
              أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يجب عليك:
            </Text>
            <View style={styles.listContainer}>
              <Text style={dynamicStyles.listItem}>• توفير معلومات دقيقة وصحيحة عند التسجيل</Text>
              <Text style={dynamicStyles.listItem}>• تحديث معلوماتك الشخصية عند الحاجة</Text>
              <Text style={dynamicStyles.listItem}>• إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك</Text>
              <Text style={dynamicStyles.listItem}>• عدم مشاركة حسابك مع أي شخص آخر</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>4. المسابقات والتصنيفات</Text>
            <Text style={dynamicStyles.sectionText}>
              عند المشاركة في المسابقات والتصنيفات:
            </Text>
            <View style={styles.listContainer}>
              <Text style={dynamicStyles.listItem}>• يجب حل المشاكل البرمجية بشكل فردي دون مساعدة خارجية</Text>
              <Text style={dynamicStyles.listItem}>• يحظر استخدام أدوات أو برامج غير مسموح بها</Text>
              <Text style={dynamicStyles.listItem}>• يحظر نسخ حلول الآخرين أو مشاركة الحلول</Text>
              <Text style={dynamicStyles.listItem}>• نحتفظ بالحق في إلغاء أو تعديل التصنيفات في أي وقت</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>5. المحتوى والمنشورات</Text>
            <Text style={dynamicStyles.sectionText}>
              عند نشر محتوى على المنصة:
            </Text>
            <View style={styles.listContainer}>
              <Text style={dynamicStyles.listItem}>• أنت تمنحنا ترخيصاً لاستخدام ونشر محتواك على المنصة</Text>
              <Text style={dynamicStyles.listItem}>• أنت مسؤول عن محتوى منشوراتك</Text>
              <Text style={dynamicStyles.listItem}>• يحظر نشر محتوى مسيء أو مخالف للقوانين</Text>
              <Text style={dynamicStyles.listItem}>• نحتفظ بالحق في حذف أي محتوى نعتبره غير مناسب</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>6. الملكية الفكرية</Text>
            <Text style={dynamicStyles.sectionText}>
              جميع حقوق الملكية الفكرية للمنصة محفوظة. لا يجوز لك نسخ أو تعديل أو توزيع أي جزء من المنصة دون إذن كتابي منا.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>7. إيقاف الحساب</Text>
            <Text style={dynamicStyles.sectionText}>
              نحتفظ بالحق في إيقاف أو حذف حسابك في أي وقت إذا:
            </Text>
            <View style={styles.listContainer}>
              <Text style={dynamicStyles.listItem}>• انتهكت هذه الشروط والأحكام</Text>
              <Text style={dynamicStyles.listItem}>• استخدمت المنصة بشكل غير قانوني</Text>
              <Text style={dynamicStyles.listItem}>• قمت بأنشطة احتيالية أو مخادعة</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>8. التعديلات على الشروط</Text>
            <Text style={dynamicStyles.sectionText}>
              نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعارك بأي تغييرات جوهرية. استمرار استخدامك للمنصة بعد التعديلات يعني موافقتك على الشروط الجديدة.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>9. إخلاء المسؤولية</Text>
            <Text style={dynamicStyles.sectionText}>
              المنصة مقدمة "كما هي" دون أي ضمانات. لا نتحمل أي مسؤولية عن:
            </Text>
            <View style={styles.listContainer}>
              <Text style={dynamicStyles.listItem}>• أي أضرار قد تنتج عن استخدام المنصة</Text>
              <Text style={dynamicStyles.listItem}>• فقدان البيانات أو المعلومات</Text>
              <Text style={dynamicStyles.listItem}>• انقطاع الخدمة أو الأعطال التقنية</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>10. الاتصال بنا</Text>
            <Text style={dynamicStyles.sectionText}>
              إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا من خلال قسم "تواصل معنا" في التطبيق.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={dynamicStyles.footerText}>
              آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    textAlign: 'right',
    marginBottom: 8,
  },
  listContainer: {
    marginTop: 8,
    paddingRight: 16,
  },
  listItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 8,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});




