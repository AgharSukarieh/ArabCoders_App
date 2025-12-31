import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الشروط والأحكام</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo_app.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>الشروط والأحكام</Text>
        
        <Text style={styles.sectionTitle}>1. القبول</Text>
        <Text style={styles.text}>
          من خلال استخدام تطبيق ArabCoders، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام التطبيق.
        </Text>

        <Text style={styles.sectionTitle}>2. استخدام التطبيق</Text>
        <Text style={styles.text}>
          يجب عليك استخدام التطبيق فقط للأغراض القانونية والمسموح بها. لا يجوز لك استخدام التطبيق بأي طريقة قد تضر أو تعطل أو تفرط في تحميل الخوادم أو البنية التحتية.
        </Text>

        <Text style={styles.sectionTitle}>3. الحساب والمعلومات</Text>
        <Text style={styles.text}>
          أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يجب عليك إخطارنا فوراً بأي استخدام غير مصرح به لحسابك.
        </Text>

        <Text style={styles.sectionTitle}>4. المحتوى</Text>
        <Text style={styles.text}>
          أنت تحتفظ بحقوق الملكية الفكرية للمحتوى الذي تنشره على التطبيق. من خلال النشر، تمنحنا ترخيصاً لاستخدام وتوزيع وعرض هذا المحتوى على التطبيق.
        </Text>

        <Text style={styles.sectionTitle}>5. السلوك المحظور</Text>
        <Text style={styles.text}>
          يحظر عليك:
          {'\n'}• نشر محتوى مسيء أو غير قانوني
          {'\n'}• التحرش أو إيذاء المستخدمين الآخرين
          {'\n'}• محاولة الوصول غير المصرح به إلى التطبيق
          {'\n'}• استخدام التطبيق لأغراض تجارية غير مصرح بها
        </Text>

        <Text style={styles.sectionTitle}>6. الخصوصية</Text>
        <Text style={styles.text}>
          نحن نلتزم بحماية خصوصيتك. يرجى مراجعة سياسة الخصوصية الخاصة بنا لفهم كيفية جمع واستخدام معلوماتك.
        </Text>

        <Text style={styles.sectionTitle}>7. التعديلات</Text>
        <Text style={styles.text}>
          نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعارك بأي تغييرات مهمة عبر التطبيق.
        </Text>

        <Text style={styles.sectionTitle}>8. الإنهاء</Text>
        <Text style={styles.text}>
          نحتفظ بالحق في إنهاء أو تعليق حسابك في أي وقت بسبب انتهاك هذه الشروط والأحكام أو لأي سبب آخر نراه مناسباً.
        </Text>

        <Text style={styles.sectionTitle}>9. إخلاء المسؤولية</Text>
        <Text style={styles.text}>
          التطبيق يوفر "كما هو" دون أي ضمانات. نحن لا نضمن أن التطبيق سيكون خالياً من الأخطاء أو متاحاً بشكل مستمر.
        </Text>

        <Text style={styles.sectionTitle}>10. الاتصال</Text>
        <Text style={styles.text}>
          إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا عبر البريد الإلكتروني: support@arabcoders.com
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#085173',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 60,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 15,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

