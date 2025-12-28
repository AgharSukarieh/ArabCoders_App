import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import api from '@/services/api';
import { AlgorithmDetailScreen } from './AlgorithmDetailScreen';
import { useAppColors } from '@/hooks/use-app-colors';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.75; // عرض الكارت للعرض الأفقي

export interface Algorithm {
  id: number;
  title: string;
  tagId: number;
  shortDescription?: string;
  description?: string;
  code?: string;
  explanation?: string;
  complexity?: string;
  examples?: string;
  imageURL?: string;
}

export interface AlgorithmTag {
  id: number;
  tagName: string;
  shortDescription: string;
  description: string;
  imageURL: string;
  explaineTags: Algorithm[];
}

export interface AlgorithmsScreenProps {
  onBack: () => void;
}

export function AlgorithmsScreen({ onBack }: AlgorithmsScreenProps) {
  const [tags, setTags] = useState<AlgorithmTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState<number | null>(null);
  const colors = useAppColors();
  const { isDark } = useTheme();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/explained-tags/with-tags');
      const tagsData = Array.isArray(response.data) ? response.data : [];
      
      // التأكد من أن explaineTags موجودة لكل tag
      const tagsWithAlgorithms = tagsData.map((tag: any) => ({
        ...tag,
        explaineTags: Array.isArray(tag.explaineTags) ? tag.explaineTags : [],
      }));
      
      setTags(tagsWithAlgorithms);
    } catch (error: any) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTags();
    setRefreshing(false);
  };

  const filteredTags = tags.filter(tag => {
    // إذا كان هناك فلتر محدد، اعرض فقط الفئة المحددة
    if (selectedTagId !== null && tag.id !== selectedTagId) {
      return false;
    }

    // إذا كان هناك بحث، ابحث في الفئات والخوارزميات
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTag = 
        tag.tagName.toLowerCase().includes(query) ||
        (tag.shortDescription && tag.shortDescription.toLowerCase().includes(query)) ||
        (tag.description && tag.description.toLowerCase().includes(query));
      
      // البحث في الخوارزميات أيضاً
      const matchesAlgorithms = tag.explaineTags.some(alg =>
        alg.title?.toLowerCase().includes(query) ||
        (alg.shortDescription && alg.shortDescription.toLowerCase().includes(query))
      );
      
      return matchesTag || matchesAlgorithms;
    }

    // إذا لم يكن هناك بحث أو فلتر، اعرض كل الفئات
    return true;
  });

  const filteredAlgorithms = (tag: AlgorithmTag) => {
    const algorithms = tag.explaineTags || [];
    
    // إذا كان هناك بحث، ابحث في الخوارزميات
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return algorithms.filter(alg =>
        alg.title?.toLowerCase().includes(query) ||
        (alg.shortDescription && alg.shortDescription.toLowerCase().includes(query))
      );
    }
    
    return algorithms;
  };

  const AlgorithmCard = ({ algorithm, index, onPress }: { algorithm: Algorithm; index: number; onPress: () => void }) => {
    const buttonScale = useSharedValue(1);
    const buttonOpacity = useSharedValue(1);

    const buttonAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: buttonScale.value }],
        opacity: buttonOpacity.value,
      };
    });

    const handleButtonPress = () => {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      buttonOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
      // فتح صفحة التفاصيل بعد الأنيميشن
      setTimeout(() => {
        onPress();
      }, 200);
    };

    return (
      <AnimatedReanimated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.algorithmCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.algorithmCardContent}>
          <View style={[styles.cardGradient, { backgroundColor: colors.cardBackground }]}>
            {algorithm.imageURL ? (
              <View style={styles.algorithmImageContainer}>
                <Image
                  source={{ uri: algorithm.imageURL }}
                  style={styles.algorithmImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.1)']}
                  style={styles.imageOverlay}
                />
              </View>
            ) : (
              <LinearGradient
                colors={colors.gradientImagePlaceholder as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.algorithmImagePlaceholder}>
                <View style={styles.iconContainer}>
                  <Ionicons name="code-slash" size={40} color={colors.primary} />
                </View>
              </LinearGradient>
            )}
            
          <View style={styles.algorithmInfo}>
            <View style={styles.algorithmTitleContainer}>
              <Text style={[styles.algorithmTitle, dynamicStyles.algorithmTitle]} numberOfLines={2}>
                {algorithm.title || 'خوارزمية'}
              </Text>
              <View style={styles.titleIndicator} />
            </View>
            <Text style={[styles.algorithmDescription, dynamicStyles.algorithmDescription]} numberOfLines={3}>
              {algorithm.shortDescription || algorithm.description || 'لا يوجد وصف متاح'}
            </Text>
              
              <View style={styles.algorithmFooter}>
                <LinearGradient
                  colors={colors.gradientPrimary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.fullExplanationButton}>
                  <AnimatedReanimated.View style={buttonAnimatedStyle}>
                    <TouchableOpacity
                      style={styles.fullExplanationButtonContent}
                      activeOpacity={1}
                      onPress={handleButtonPress}>
                      <Ionicons name="chevron-back" size={16} color={colors.textWhite} />
                      <Text style={styles.fullExplanationText}>الشرح الكامل</Text>
                    </TouchableOpacity>
                  </AnimatedReanimated.View>
                </LinearGradient>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedReanimated.View>
    );
  };

  const renderAlgorithmCard = (algorithm: Algorithm, index: number) => {
    return (
      <AlgorithmCard
        key={algorithm.id}
        algorithm={algorithm}
        index={index}
        onPress={() => setSelectedAlgorithmId(algorithm.id)}
      />
    );
  };

  const renderTagSection = (tag: AlgorithmTag, index: number) => {
    const algorithms = filteredAlgorithms(tag);

    return (
      <AnimatedReanimated.View
        key={tag.id}
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.tagSection}>
        {/* Header Section - Image and Name */}
        <View style={styles.tagHeaderContainer}>
          <View style={styles.tagHeaderContent}>
            {tag.imageURL ? (
              <View style={styles.tagImageContainer}>
                <Image
                  source={{ uri: tag.imageURL }}
                  style={styles.tagImage}
                  contentFit="cover"
                />
                <View style={styles.tagImageBorder} />
              </View>
            ) : (
              <LinearGradient
                colors={colors.gradientImagePlaceholder as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tagImagePlaceholder}>
                <Ionicons name="pricetag" size={32} color={colors.primary} />
              </LinearGradient>
            )}
            
            <View style={styles.tagInfo}>
              <Text style={[styles.tagName, dynamicStyles.tagName]}>{tag.tagName}</Text>
              {tag.shortDescription && (
                <Text style={[styles.tagShortDescription, dynamicStyles.tagShortDescription]} numberOfLines={1}>
                  {tag.shortDescription}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Divider Line */}
        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Algorithms Scroll */}
        {algorithms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="code-slash-outline" size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>لا توجد خوارزميات متاحة</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.algorithmsScrollContent}
            style={styles.algorithmsScrollView}
            directionalLockEnabled={true}>
            {algorithms.map((algorithm, algIndex) =>
              renderAlgorithmCard(algorithm, algIndex)
            )}
          </ScrollView>
        )}
      </AnimatedReanimated.View>
    );
  };

  if (selectedAlgorithmId) {
    return (
      <AlgorithmDetailScreen
        algorithmId={selectedAlgorithmId}
        onBack={() => setSelectedAlgorithmId(null)}
      />
    );
  }

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { 
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.border,
    },
    headerTitle: { color: colors.primary },
    searchBarGradient: { backgroundColor: colors.cardBackground },
    searchInput: { color: colors.textPrimary },
    filterButton: { 
      backgroundColor: colors.backgroundLight,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: { color: colors.textSecondary },
    filterButtonTextActive: { color: colors.textWhite },
    emptyText: { color: colors.textSecondary },
    loadingText: { color: colors.textSecondary },
    tagName: { color: colors.textPrimary },
    tagShortDescription: { color: colors.textSecondary },
    algorithmTitle: { color: colors.textPrimary },
    algorithmDescription: { color: colors.textSecondary },
    divider: { backgroundColor: colors.border },
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={[styles.header, dynamicStyles.header]}>
          <View style={styles.placeholder} />
          <View style={styles.headerTitleContainer}>
            <Ionicons name="code-slash" size={28} color={colors.primary} style={styles.headerIcon} />
            <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>الخوارزميات</Text>
          </View>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, dynamicStyles.loadingText]}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.placeholder} />
        <View style={styles.headerTitleContainer}>
          <Ionicons name="code-slash" size={28} color={colors.primary} style={styles.headerIcon} />
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>الخوارزميات</Text>
        </View>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBarGradient, dynamicStyles.searchBarGradient]}>
          <View style={styles.searchBar}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={22} color={colors.primary} />
            </View>
            <TextInput
              style={[styles.searchInput, dynamicStyles.searchInput]}
              placeholder="ابحث عن خوارزمية..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      {tags.length > 0 && (
        <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                dynamicStyles.filterButton,
                selectedTagId === null && dynamicStyles.filterButtonActive,
              ]}
              onPress={() => setSelectedTagId(null)}>
              <Text
                style={[
                  styles.filterButtonText,
                  dynamicStyles.filterButtonText,
                  selectedTagId === null && dynamicStyles.filterButtonTextActive,
                ]}>
                الكل
              </Text>
            </TouchableOpacity>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.filterButton,
                  dynamicStyles.filterButton,
                  selectedTagId === tag.id && dynamicStyles.filterButtonActive,
                ]}
                onPress={() => {
                  if (selectedTagId === tag.id) {
                    setSelectedTagId(null);
                  } else {
                    setSelectedTagId(tag.id);
                  }
                }}>
                <Text
                  style={[
                    styles.filterButtonText,
                    dynamicStyles.filterButtonText,
                    selectedTagId === tag.id && dynamicStyles.filterButtonTextActive,
                  ]}>
                  {tag.tagName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={colors.gradientRefresh}
            tintColor={colors.primary}
          />
        }>
        {filteredTags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>لا توجد نتائج للبحث</Text>
          </View>
        ) : (
          filteredTags.map((tag, index) => renderTagSection(tag, index))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerIcon: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBarGradient: {
    borderRadius: 16,
    padding: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  searchIconContainer: {
    marginRight: 12,
    padding: 4,
  },
  searchIcon: {
    color: '#085173',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#085173',
    borderColor: '#085173',
    shadowColor: '#085173',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tagSection: {
    marginTop: 24,
    marginHorizontal: 0,
  },
  tagHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tagHeader: {
    padding: 18,
  },
  tagHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagImageContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  tagImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  tagImageBorder: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E8F4FD',
    top: 0,
    left: 0,
  },
  tagImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  tagInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  tagNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  tagName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#085173',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  algorithmCountBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  algorithmCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chevronContainer: {
    padding: 4,
  },
  tagShortDescription: {
    fontSize: 14,
    color: '#666',
  },
  algorithmsScrollView: {
    flexGrow: 0,
    paddingVertical: 16,
  },
  algorithmsScrollContent: {
    paddingRight: 20,
    paddingLeft: 20,
    gap: 16,
  },
  algorithmCard: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  algorithmCardContent: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  algorithmImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  algorithmImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#E8F4FD',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  algorithmImagePlaceholder: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  algorithmInfo: {
    padding: 14,
  },
  algorithmTitleContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  algorithmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#085173',
    textAlign: 'right',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  titleIndicator: {
    position: 'absolute',
    right: 0,
    bottom: -4,
    width: 40,
    height: 3,
    backgroundColor: '#4A90E2',
    borderRadius: 2,
    opacity: 0.3,
  },
  algorithmDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
    textAlign: 'right',
    lineHeight: 20,
    fontWeight: '400',
  },
  algorithmFooter: {
    marginTop: 'auto',
  },
  fullExplanationButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fullExplanationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  fullExplanationText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});

