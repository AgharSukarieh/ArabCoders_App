import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface FAQScreenProps {
  onBack: () => void;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    question: 'كيف تسجل في التطبيق؟',
    answer: 'لتسجيل حساب جديد في التطبيق:\n1. افتح التطبيق واضغط على "إنشاء حساب"\n2. أدخل بريدك الإلكتروني واسم المستخدم\n3. اختر كلمة مرور قوية\n4. اختر الدولة والجامعة\n5. ستحصل على رمز تحقق عبر البريد الإلكتروني\n6. أدخل الرمز لإكمال التسجيل',
    category: 'التسجيل',
  },
  {
    id: 2,
    question: 'كيف أسجل دخول؟',
    answer: 'لتسجيل الدخول:\n1. افتح التطبيق\n2. أدخل بريدك الإلكتروني وكلمة المرور\n3. اضغط على "تسجيل الدخول"\n4. إذا نسيت كلمة المرور، اضغط على "نسيت كلمة المرور؟"',
    category: 'التسجيل',
  },
  {
    id: 3,
    question: 'كيف أشارك في المسابقات؟',
    answer: 'للمشاركة في المسابقات:\n1. اذهب إلى قسم "المسابقات"\n2. اختر المسابقة التي تريد المشاركة فيها\n3. اضغط على "المشاركة"\n4. اقرأ التعليمات والشروط\n5. ابدأ بحل المشاكل البرمجية',
    category: 'المسابقات',
  },
  {
    id: 4,
    question: 'كيف أرى التصنيفات؟',
    answer: 'لمشاهدة التصنيفات:\n1. اذهب إلى قسم "التصنيفات" من قائمة "المزيد"\n2. يمكنك التصنيف حسب الدولة أو الجامعة\n3. استخدم شريط البحث للبحث عن مستخدمين محددين\n4. سيتم عرض أفضل المبرمجين حسب عدد المشاكل المحلولة',
    category: 'التصنيفات',
  },
  {
    id: 5,
    question: 'كيف أتابع مستخدم آخر؟',
    answer: 'لمتابعة مستخدم:\n1. اضغط على صورة المستخدم أو اسمه في أي منشور\n2. ستفتح صفحته الشخصية\n3. اضغط على زر "المتابعة +"\n4. يمكنك أيضاً تفعيل الجرس لتلقي إشعارات عند نشره منشورات جديدة',
    category: 'المتابعة',
  },
  {
    id: 6,
    question: 'كيف أنشر منشور؟',
    answer: 'لنشر منشور جديد:\n1. من الصفحة الرئيسية، اضغط على أيقونة "+" أو "إنشاء منشور"\n2. أدخل عنوان المنشور\n3. اكتب محتوى المنشور\n4. يمكنك إضافة صور أو فيديو\n5. اختر التصنيفات المناسبة\n6. اضغط على "نشر"',
    category: 'المنشورات',
  },
  {
    id: 7,
    question: 'كيف أعدل ملفي الشخصي؟',
    answer: 'لتعديل الملف الشخصي:\n1. اذهب إلى "المزيد" ثم "الصفحة الشخصية"\n2. اضغط على أيقونة التعديل في الأعلى\n3. يمكنك تعديل الاسم، البريد الإلكتروني، الصورة، الجامعة، والدولة\n4. إذا غيرت البريد الإلكتروني، ستحتاج إلى رمز تحقق\n5. اضغط على "تعديل" لحفظ التغييرات',
    category: 'الحساب',
  },
  {
    id: 8,
    question: 'كيف أرى الأحداث القادمة؟',
    answer: 'لمشاهدة الأحداث:\n1. اذهب إلى "المزيد" ثم "الأحداث"\n2. ستظهر قائمة بجميع الأحداث المتاحة\n3. اضغط على أي حدث لرؤية التفاصيل الكاملة\n4. يمكنك الضغط على "احجز مكانك" للتسجيل في الحدث',
    category: 'الأحداث',
  },
  {
    id: 9,
    question: 'ما هي السلسلة الحالية؟',
    answer: 'السلسلة الحالية (Streak) هي عدد الأيام المتتالية التي قمت فيها بحل مشكلة برمجية على الأقل. كلما زادت السلسلة، زادت نقاطك وترتيبك في التصنيفات. حاول الحفاظ على السلسلة بحل مشكلة واحدة على الأقل يومياً!',
    category: 'الأداء',
  },
  {
    id: 10,
    question: 'كيف أرى إحصائياتي؟',
    answer: 'لمشاهدة إحصائياتك:\n1. اذهب إلى "المزيد" ثم "الصفحة الشخصية"\n2. ستجد إحصائياتك في قسم "الأداء"\n3. يمكنك رؤية عدد المشاكل المحلولة (سهل، متوسط، صعب)\n4. كما يمكنك رؤية نسبة القبول، عدد الاقتراحات، والمتابعين',
    category: 'الأداء',
  },
];

const CATEGORIES = ['الكل', 'التسجيل', 'المسابقات', 'التصنيفات', 'المتابعة', 'المنشورات', 'الحساب', 'الأحداث', 'الأداء'];

export function FAQScreen({ onBack }: FAQScreenProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const animatedHeights = useRef<{ [key: number]: Animated.Value }>({});

  // Initialize animated values for each FAQ item
  FAQ_DATA.forEach((item) => {
    if (!animatedHeights.current[item.id]) {
      animatedHeights.current[item.id] = new Animated.Value(0);
    }
  });

  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (itemId: number) => {
    const isExpanded = expandedItems.has(itemId);
    const newExpanded = new Set(expandedItems);
    
    if (isExpanded) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    
    setExpandedItems(newExpanded);

    // Animate height
    const animatedValue = animatedHeights.current[itemId];
    if (animatedValue) {
      Animated.timing(animatedValue, {
        toValue: isExpanded ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const getItemHeight = (item: FAQItem) => {
    // Estimate height based on answer length
    const lines = item.answer.split('\n').length;
    return Math.max(lines * 25 + 40, 100);
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    searchContainer: { ...styles.searchContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    searchBar: { ...styles.searchBar, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5' },
    searchInput: { ...styles.searchInput, color: isDark ? '#FFFFFF' : '#333' },
    categoriesContainer: { ...styles.categoriesContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    categoryButton: { ...styles.categoryButton, backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E0E0E0' },
    categoryButtonActive: { ...styles.categoryButtonActive, backgroundColor: isDark ? '#0C85C1' : '#085173', borderColor: isDark ? '#0C85C1' : '#085173' },
    categoryButtonText: { ...styles.categoryButtonText, color: isDark ? '#CCCCCC' : '#666' },
    faqItem: { ...styles.faqItem, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#F0F0F0' },
    faqQuestion: { ...styles.faqQuestion, color: isDark ? '#FFFFFF' : '#333' },
    faqAnswer: { ...styles.faqAnswer, color: isDark ? '#CCCCCC' : '#666' },
    emptyText: { ...styles.emptyText, color: isDark ? '#AAAAAA' : '#999' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';
  const searchIconColor = isDark ? '#AAAAAA' : '#666';
  const chevronColor = isDark ? '#0C85C1' : '#085173';
  const emptyIconColor = isDark ? '#666' : '#CCC';

  return (
    <SafeAreaView style={dynamicStyles.container} >
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <Text style={dynamicStyles.headerTitle}>الاسئلة المتكررة</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={dynamicStyles.searchContainer}>
        <View style={dynamicStyles.searchBar}>
          <Ionicons name="search" size={20} color={searchIconColor} style={styles.searchIcon} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="ابحث عن المنشور ...."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>
      </View>

      {/* Category Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={dynamicStyles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}>
        {[...CATEGORIES].reverse().map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              dynamicStyles.categoryButton,
              selectedCategory === category && dynamicStyles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}>
            <Text
              style={[
                dynamicStyles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {filteredFAQs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={64} color={emptyIconColor} />
            <Text style={dynamicStyles.emptyText}>لا توجد نتائج</Text>
          </View>
        ) : (
          filteredFAQs.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const animatedValue = animatedHeights.current[item.id] || new Animated.Value(0);
            const maxHeight = getItemHeight(item);

            const heightInterpolation = animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, maxHeight],
            });

            const rotateInterpolation = animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            });

            return (
              <View key={item.id} style={dynamicStyles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestionContainer}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}>
                  <Text style={dynamicStyles.faqQuestion}>{item.question}</Text>
                  <Animated.View
                    style={[
                      styles.chevronContainer,
                      { transform: [{ rotate: rotateInterpolation }] },
                    ]}>
                    <Ionicons name="chevron-down" size={20} color={chevronColor} />
                  </Animated.View>
                </TouchableOpacity>
                
                <Animated.View
                  style={[
                    styles.faqAnswerContainer,
                    {
                      maxHeight: heightInterpolation,
                      opacity: animatedValue,
                    },
                  ]}>
                  <Text style={dynamicStyles.faqAnswer}>{item.answer}</Text>
                </Animated.View>
              </View>
            );
          })
        )}
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
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#085173',
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  categoriesContainer: {
    maxHeight: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexDirection: 'row-reverse',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#085173',
    borderColor: '#085173',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    overflow: 'hidden',
  },
  faqQuestionContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    marginRight: 12,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  faqAnswer: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

