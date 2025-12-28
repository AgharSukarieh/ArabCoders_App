import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getCountries } from '@/services/authService';
import api from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface RankingUser {
  id: number;
  name?: string;
  userName?: string;
  points?: number;
  imageUrl?: string;
  imageURL?: string;
  rank: number;
  country?: string;
  totalSolved: number;
}

export interface RankingScreenProps {
  onBack: () => void;
}

// Mock data - سيتم استبدالها بـ API
const mockRankings: RankingUser[] = [
  { id: 1, name: 'sameer mazen', points: 100, imageUrl: 'https://via.placeholder.com/100', rank: 1, totalSolved: 100 },
  { id: 2, name: 'sameer mazen', points: 100, imageUrl: 'https://via.placeholder.com/100', rank: 2, totalSolved: 100 },
  { id: 3, name: 'sameer mazen', points: 100, imageUrl: 'https://via.placeholder.com/100', rank: 3, totalSolved: 100 },
  { id: 4, name: 'sameer mazen', points: 20, imageUrl: 'https://via.placeholder.com/100', rank: 4, totalSolved: 20 },
  { id: 5, name: 'sameer mazen', points: 20, imageUrl: 'https://via.placeholder.com/100', rank: 5, totalSolved: 20 },
  { id: 6, name: 'sameer mazen', points: 20, imageUrl: 'https://via.placeholder.com/100', rank: 6, totalSolved: 20 },
  { id: 7, name: 'sameer mazen', points: 20, imageUrl: 'https://via.placeholder.com/100', rank: 7, totalSolved: 20 },
  { id: 8, name: 'sameer mazen', points: 20, imageUrl: 'https://via.placeholder.com/100', rank: 8, totalSolved: 20 },
];

export function RankingScreen({ onBack }: RankingScreenProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCountryFilter, setShowCountryFilter] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  // States للتصنيف الجديد
  const [rankingType, setRankingType] = useState<'country' | 'university'>('country');
  const [showRankingTypeDropdown, setShowRankingTypeDropdown] = useState(false);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [countries, setCountries] = useState<Array<{ id: number; nameCountry: string; iconUrl: string }>>([]);
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // قائمة الجامعات
  const universities = [
    'الجامعة الأردنية',
    'جامعة العلوم والتكنولوجيا',
    'جامعة مؤتة',
    'جامعة اليرموك',
  ];

  // جلب قائمة الدول
  React.useEffect(() => {
    const loadCountries = async () => {
      try {
        const list = await getCountries();
        if (Array.isArray(list) && list.length > 0) {
          setCountries(list);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      }
    };
    loadCountries();
  }, []);

  // جلب بيانات التصنيف
  React.useEffect(() => {
    loadRankings();
  }, [rankingType, selectedCountry, selectedUniversity, searchQuery]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      let url = '/api/users/top-coders/filter';
      const params: string[] = [];
      
      // إضافة معاملات الفلترة
      if (rankingType === 'country' && selectedCountry) {
        const countryId = countries.find(c => c.nameCountry === selectedCountry)?.id;
        if (countryId) {
          params.push(`CountryId=${countryId}`);
        }
      } else if (rankingType === 'university' && selectedUniversity) {
        // البحث عن universityId من قائمة الجامعات (قد تحتاج إلى API call منفصل)
        // حالياً نستخدم الاسم
        // params.push(`UniversityId=${universityId}`);
      }
      
      // إضافة search query إذا كان موجوداً
      if (searchQuery && searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      console.log('📤 Fetching rankings from:', url);
      const response = await api.get(url, {
        headers: {
          'accept': 'text/plain',
        },
      });
      console.log('✅ Rankings response:', response.data);
      
      let data = Array.isArray(response.data) ? response.data : [];
      
      // البيانات تأتي مرتبة بالفعل من الـ API حسب rank و totalSolved
      // لكن نتأكد من الترتيب حسب totalSolved (تنازلي) ثم rank (تصاعدي)
      data = data.sort((a: RankingUser, b: RankingUser) => {
        const aSolved = a.totalSolved || 0;
        const bSolved = b.totalSolved || 0;
        if (bSolved !== aSolved) {
          return bSolved - aSolved; // ترتيب تنازلي حسب totalSolved
        }
        return (a.rank || 0) - (b.rank || 0); // إذا تساوى totalSolved، ترتيب تصاعدي حسب rank
      });
      
      // تحويل البيانات إلى الشكل المطلوب
      data = data.map((user: RankingUser, index: number) => ({
        ...user,
        rank: user.rank || index + 1,
        name: user.userName || user.name || '',
        imageUrl: user.imageURL || user.imageUrl || 'https://via.placeholder.com/100',
        points: user.totalSolved || user.points || 0,
        totalSolved: user.totalSolved || 0,
      }));
      
      setRankings(data);
    } catch (error: any) {
      console.error('❌ Error loading rankings:', error);
      console.error('❌ Error response:', error?.response?.data);
      console.error('❌ Error status:', error?.response?.status);
      // استخدام mock data في حالة الخطأ
      setRankings(mockRankings);
    } finally {
      setLoading(false);
    }
  };

  // ترتيب أول 3 حسب totalSolved
  const sortedRankings = [...rankings].sort((a, b) => {
    const aSolved = a.totalSolved || a.points || 0;
    const bSolved = b.totalSolved || b.points || 0;
    return bSolved - aSolved;
  });

  // أول 3 مرتبين: [0] = الأول (الوسط), [1] = الثاني (اليسار), [2] = الثالث (اليمين)
  const topThree = sortedRankings.slice(0, 3);
  const otherRankings = sortedRankings.slice(3);

  const getBarHeight = (rank: number) => {
    if (rank === 1) return 180;
    if (rank === 2) return 140;
    if (rank === 3) return 100;
    return 0;
  };

  const getMaxBarHeight = () => {
    return Math.max(getBarHeight(1), getBarHeight(2), getBarHeight(3));
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#F5F5F5' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    searchContainer: { ...styles.searchContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    searchBar: { ...styles.searchBar, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5' },
    searchInput: { ...styles.searchInput, color: isDark ? '#FFFFFF' : '#333' },
    filterSection: { ...styles.filterSection, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    filterDropdownText: { ...styles.filterDropdownText, color: isDark ? '#FFFFFF' : '#085173' },
    resetFilterText: { ...styles.resetFilterText, color: isDark ? '#0C85C1' : '#085173' },
    modalOverlay: { ...styles.modalOverlay, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' },
    modalContent: { ...styles.modalContent, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    modalItemText: { ...styles.modalItemText, color: isDark ? '#FFFFFF' : '#333' },
    rankingItemName: { color: isDark ? '#FFFFFF' : '#333' },
    rankingItemPoints: { color: isDark ? '#AAAAAA' : '#666' },
    topThreeContainer: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    topThreeContent: { backgroundColor: isDark ? '#2E2E2E' : '#F8F9FA' },
    filterDropdownHorizontal: { ...styles.filterDropdownHorizontal, backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E0E0E0' },
    resetFilterButton: { ...styles.resetFilterButton, backgroundColor: isDark ? '#2E2E2E' : '#E0E0E0' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';
  const searchIconColor = isDark ? '#AAAAAA' : '#666';
  const chevronColor = isDark ? '#0C85C1' : '#085173';

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <Text style={dynamicStyles.headerTitle}>التصنيفات</Text>
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
            placeholder="ابحث عن الاشخاص ..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>
      </View>

      {/* Filter Section */}
      <View style={dynamicStyles.filterSection}>
        <View style={styles.filterRowHorizontal}>
          {/* Dropdown للدول/الجامعات */}
          {rankingType === 'country' ? (
      <TouchableOpacity
              style={dynamicStyles.filterDropdownHorizontal}
        onPress={() => setShowCountryFilter(!showCountryFilter)}>
        <Ionicons
          name={showCountryFilter ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={chevronColor}
                style={styles.filterIcon}
              />
              <Text style={[dynamicStyles.filterDropdownText, { textAlign: 'right' }]}>
                {selectedCountry || 'المملكة'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={dynamicStyles.filterDropdownHorizontal}
              onPress={() => setShowUniversityDropdown(!showUniversityDropdown)}>
              <Ionicons
                name={showUniversityDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={chevronColor}
                style={styles.filterIcon}
              />
              <Text style={[dynamicStyles.filterDropdownText, { textAlign: 'right' }]}>
                {selectedUniversity || 'اختر الجامعة'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Dropdown للتصنيف حسب */}
          <TouchableOpacity
            style={dynamicStyles.filterDropdownHorizontal}
            onPress={() => setShowRankingTypeDropdown(!showRankingTypeDropdown)}>
            <Ionicons
              name={showRankingTypeDropdown ? 'chevron-up' : 'chevron-down'}
              size={18}
          color={chevronColor}
              style={styles.filterIcon}
            />
            <Text style={[dynamicStyles.filterDropdownText, { textAlign: 'right' }]}>
              {rankingType === 'country' ? 'التصنيف حسب الدولة' : 'التصنيف حسب الجامعة'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* زر إعادة الفلترة */}
        <TouchableOpacity
          style={dynamicStyles.resetFilterButton}
          onPress={() => {
            setSelectedCountry(null);
            setSelectedUniversity(null);
            setRankingType('country');
            setSearchQuery('');
          }}>
          <Text style={[dynamicStyles.resetFilterText, { color: isDark ? '#FFFFFF' : '#085173' }]}>اعادة الفلترة</Text>
        </TouchableOpacity>
      </View>

      {/* Modal للتصنيف حسب */}
      <Modal
        transparent
        visible={showRankingTypeDropdown}
        animationType="fade"
        onRequestClose={() => setShowRankingTypeDropdown(false)}>
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRankingTypeDropdown(false)}>
          <View style={dynamicStyles.modalContent}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setRankingType('country');
                setShowRankingTypeDropdown(false);
                setSelectedUniversity(null);
              }}>
              <Text style={dynamicStyles.modalItemText}>الدولة</Text>
              {rankingType === 'country' && (
                <Ionicons name="checkmark" size={20} color={chevronColor} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setRankingType('university');
                setShowRankingTypeDropdown(false);
                setSelectedCountry(null);
              }}>
              <Text style={dynamicStyles.modalItemText}>الجامعة</Text>
              {rankingType === 'university' && (
                <Ionicons name="checkmark" size={20} color={chevronColor} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal للجامعات */}
      <Modal
        transparent
        visible={showUniversityDropdown}
        animationType="fade"
        onRequestClose={() => setShowUniversityDropdown(false)}>
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUniversityDropdown(false)}>
          <View style={dynamicStyles.modalContent}>
            <ScrollView style={styles.modalScrollView}>
              {universities.map((university, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedUniversity(university);
                    setShowUniversityDropdown(false);
                  }}>
                  <Text style={dynamicStyles.modalItemText}>{university}</Text>
                  {selectedUniversity === university && (
                    <Ionicons name="checkmark" size={20} color={chevronColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal للدول */}
      <Modal
        transparent
        visible={showCountryFilter}
        animationType="fade"
        onRequestClose={() => setShowCountryFilter(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryFilter(false)}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCountry(country.nameCountry);
                    setShowCountryFilter(false);
                  }}>
                  <View style={styles.modalItemContent}>
                    {country.iconUrl && (
                      <Image
                        source={{ uri: country.iconUrl }}
                        style={styles.countryFlag}
                        contentFit="cover"
                      />
                    )}
                    <Text style={styles.modalItemText}>{country.nameCountry}</Text>
                  </View>
                  {selectedCountry === country.nameCountry && (
                    <Ionicons name="checkmark" size={20} color="#085173" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
      </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
          <Text style={[styles.loadingText, { color: isDark ? '#CCCCCC' : '#666' }]}>جاري التحميل...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Top 3 Rankings */}
          {topThree.length >= 3 && (
        <View style={[styles.topThreeContainer, dynamicStyles.topThreeContainer]}>
          {/* Rank 2 - Left */}
          <View style={styles.topThreeItem}>
                <View style={[styles.topThreeContent, styles.rankTwoContent, dynamicStyles.topThreeContent]}>
              <Image
                source={imageErrors[topThree[1]?.id] || !topThree[1]?.imageUrl || topThree[1].imageUrl.trim() === ''
                  ? require('@/assets/images/icon.png')
                  : { uri: topThree[1].imageUrl }
                }
                style={styles.topThreeImage}
                contentFit="cover"
                onError={() => setImageErrors(prev => ({ ...prev, [topThree[1]?.id]: true }))}
              />
              <Text style={[styles.topThreeRankNumber, { color: isDark ? '#FFFFFF' : '#333' }]}>2</Text>
              <Text style={[styles.topThreeName, { color: isDark ? '#FFFFFF' : '#333' }]}>{topThree[1]?.name || ''}</Text>
                  <Text style={[styles.topThreePoints, { color: isDark ? '#AAAAAA' : '#666' }]}>{topThree[1]?.totalSolved || topThree[1]?.points || 0} حل</Text>
            </View>
          </View>

          {/* Rank 1 - Center */}
          <View style={styles.topThreeItem}>
            <View style={[styles.topThreeContent, dynamicStyles.topThreeContent]}>
              <View style={styles.firstPlaceContainer}>
                    <LottieView
                      source={require('@/assets/animation/f198971c-ebb7-4dfc-93f1-f15d4ac3fa73.json')}
                      autoPlay
                      loop
                      style={styles.lottieAnimation}
                    />
                <Image
                  source={imageErrors[topThree[0]?.id] || !topThree[0]?.imageUrl || topThree[0].imageUrl.trim() === ''
                    ? require('@/assets/images/icon.png')
                    : { uri: topThree[0].imageUrl }
                  }
                  style={styles.topThreeImageFirst}
                  contentFit="cover"
                  onError={() => setImageErrors(prev => ({ ...prev, [topThree[0]?.id]: true }))}
                />
              </View>
              <Text style={[styles.topThreeRankNumberFirst, { color: isDark ? '#FFFFFF' : '#333' }]}>1</Text>
              <Text style={[styles.topThreeName, { color: isDark ? '#FFFFFF' : '#333' }]}>{topThree[0]?.name || ''}</Text>
                  <Text style={[styles.topThreePoints, { color: isDark ? '#AAAAAA' : '#666' }]}>{topThree[0]?.totalSolved || topThree[0]?.points || 0} حل</Text>
            </View>
          </View>

          {/* Rank 3 - Right */}
          <View style={styles.topThreeItem}>
                <View style={[styles.topThreeContent, styles.rankThreeContent, dynamicStyles.topThreeContent]}>
              <Image
                source={imageErrors[topThree[2]?.id] || !topThree[2]?.imageUrl || topThree[2].imageUrl.trim() === ''
                  ? require('@/assets/images/icon.png')
                  : { uri: topThree[2].imageUrl }
                }
                style={styles.topThreeImage}
                contentFit="cover"
                onError={() => setImageErrors(prev => ({ ...prev, [topThree[2]?.id]: true }))}
              />
              <Text style={[styles.topThreeRankNumber, { color: isDark ? '#FFFFFF' : '#333' }]}>3</Text>
              <Text style={[styles.topThreeName, { color: isDark ? '#FFFFFF' : '#333' }]}>{topThree[2]?.name || ''}</Text>
                  <Text style={[styles.topThreePoints, { color: isDark ? '#AAAAAA' : '#666' }]}>{topThree[2]?.totalSolved || topThree[2]?.points || 0} حل</Text>
                </View>
            </View>

              {/* Connected Gradient Bar */}
              <View style={styles.connectedBarContainer}>
                <View style={styles.connectedBar}>
                  <LinearGradient
                    colors={['#0C85C1', '#085173']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.barSegment, { height: getBarHeight(2), borderTopLeftRadius: 8 }]}
                  />
                  <LinearGradient
                    colors={['#0C85C1', '#085173']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.barSegment, { height: getBarHeight(1) }]}
                  />
            <LinearGradient
              colors={['#0C85C1', '#085173']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
                    style={[styles.barSegment, { height: getBarHeight(3), borderTopRightRadius: 8 }]}
            />
          </View>
        </View>
            </View>
          )}

        {/* Other Rankings List */}
        <View style={styles.otherRankingsContainer}>
          {otherRankings.map((user) => (
            <View key={user.id} style={[styles.rankingItem, isDark && { backgroundColor: '#1E1E1E', borderBottomColor: '#333' }]}>
                <Text style={[styles.rankingPoints, { color: isDark ? '#AAAAAA' : '#666' }]}>{user.totalSolved || user.points || 0} حل</Text>
                <Text style={[styles.rankingName, { color: isDark ? '#FFFFFF' : '#333' }]}>{user.name}</Text>
              <Image
                source={imageErrors[user.id] || !user.imageUrl || user.imageUrl.trim() === ''
                  ? require('@/assets/images/icon.png')
                  : { uri: user.imageUrl }
                }
                style={styles.rankingImage}
                contentFit="cover"
                onError={() => setImageErrors(prev => ({ ...prev, [user.id]: true }))}
              />
                <Text style={styles.rankingNumber}>-{user.rank}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      )}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#085173',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 38,
  },
  filterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  filterDropdown: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  filterDropdownText: {
    fontSize: 16,
    color: '#085173',
    fontWeight: '500',
    marginLeft: 8,
  },
  filterRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  filterDropdownHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
  },
  filterIcon: {
    marginRight: 8,
  },
  resetFilterButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: SCREEN_WIDTH * 0.8,
    maxHeight: Dimensions.get('window').height * 0.6,
    overflow: 'hidden',
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  countryFlag: {
    width: 32,
    height: 24,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingBottom: 80,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    position: 'relative',
  },
  topThreeItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topThreeContent: {
    alignItems: 'center',
    marginBottom: 50,
  },
  rankTwoContent: {
    marginTop: 60,
  },
  rankThreeContent: {
    marginTop: 100,
  },
  topThreeImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  topThreeImageFirst: {
    width: 110,
    height: 110,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#FF6B35',
    zIndex: 1,
    position: 'relative',
  },
  firstPlaceContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  lottieAnimation: {
    position: 'absolute',
    width: 180,
    height: 180,
    top: '15%',
    left: '42%',
    transform: [{ translateX: -90 }, { translateY: -90 }],
    zIndex: 0,
  },
  flameIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
    zIndex: 0,
  },
  topThreeRankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  topThreeRankNumberFirst: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  topThreeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  topThreePoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#085173',
  },
  gradientBar: {
    width: '90%',
    maxWidth: 100,
    borderRadius: 8,
    // marginTop: 8,
    alignSelf: 'center',
  },
  connectedBarContainer: {
    position: 'absolute',
    top: 220,
    left: 20,
    right: 20,
  },
  connectedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 200,
  },
  barSegment: {
    flex: 1,
    marginHorizontal: 0,
    borderRadius: 0,
    minHeight: 100,
  },
  otherRankingsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingTop: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rankingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 12,
    minWidth: 30,
  },
  rankingImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  rankingName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
  },
  rankingPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#085173',
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

