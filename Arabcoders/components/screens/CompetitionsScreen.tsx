import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import api from '@/services/api';
import { getStoredUser } from '@/services/storage';
import { SkeletonView } from '@/components/common/SkeletonView';
import { BottomNav } from '@/components/common/BottomNav';
import { useTheme } from '@/contexts/ThemeContext';

export interface Contest {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  imageURL: string;
  createdByUserName: string;
  createdById: number;
  universityId: number | null;
  universityName: string | null;
  isPublic: boolean;
  difficultyLevel?: number; // 1 = صعب, 2 = متوسط, 3 = سهل
}

export interface CompetitionsScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
}

export function CompetitionsScreen({ activeTab, onTabPress }: CompetitionsScreenProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [contests, setContests] = useState<Contest[]>([]);
  const [myContests, setMyContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCompetitionTab, setActiveCompetitionTab] = useState<'all' | 'my'>('all');
  const [loadingMyContests, setLoadingMyContests] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  useEffect(() => {
    loadContests();
    loadMyContests();
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/contests');
      setContests(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error loading contests:', error);
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في جلب المسابقات');
      setContests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyContests = async () => {
    try {
      setLoadingMyContests(true);
      const user = await getStoredUser();
      const userIdValue = user?.id || user?.userId || user?.Id || user?.uid;

      if (userIdValue) {
        const numericUserId = parseInt(String(userIdValue), 10);

        if (!isNaN(numericUserId) && numericUserId > 0) {
          const response = await api.get(`/api/contests/by-user/${numericUserId}`);
          setMyContests(Array.isArray(response.data) ? response.data : []);
        } else {
          setMyContests([]);
        }
      } else {
        setMyContests([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading my contests:', error);
      setMyContests([]);
    } finally {
      setLoadingMyContests(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadContests();
    loadMyContests();
  };

  const getTimeRemaining = (startTime: string, endTime: string) => {
    try {
      const now = new Date();
      const end = new Date(endTime);

      if (now > end) {
        return 'انتهت';
      }

      const start = new Date(startTime);
      if (now < start) {
        const diff = start.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `يبدأ بعد: ${days} يوم ${hours} ساعة`;
      }

      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `${days} يوم ${hours} ساعة`;
    } catch {
      return '';
    }
  };

  const isOnline = (startTime: string, endTime: string) => {
    try {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);
      return now >= start && now <= end;
    } catch {
      return false;
    }
  };

  const formatDateRange = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startDay = start.getDate();
      const startMonth = start.getMonth() + 1;
      const startYear = start.getFullYear();
      const endDay = end.getDate();
      const endMonth = end.getMonth() + 1;
      const endYear = end.getFullYear();
      return `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
    } catch {
      return '';
    }
  };

  const getDifficultyLabel = (difficultyLevel?: number): string => {
    if (!difficultyLevel) return 'غير محدد';
    switch (difficultyLevel) {
      case 1:
        return 'مستوى صعب';
      case 2:
        return 'مستوى متوسط';
      case 3:
        return 'مستوى سهل';
      default:
        return 'غير محدد';
    }
  };

  const getDifficultyColor = (difficultyLevel?: number): string => {
    if (!difficultyLevel) return '#999';
    switch (difficultyLevel) {
      case 1:
        return '#F44336'; // أحمر للصعب
      case 2:
        return '#FF9800'; // برتقالي للمتوسط
      case 3:
        return '#4CAF50'; // أخضر للسهل
      default:
        return '#999';
    }
  };

  // Component للدائرة المتوهجة
  const BlinkingDot = ({ color }: { color: string }) => {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
      opacity.value = withRepeat(
        withTiming(0.2, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      scale.value = withRepeat(
        withTiming(1.4, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <View style={styles.dotContainer}>
        <Animated.View
          style={[
            styles.blinkingDot,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
        <View style={[styles.dotCore, { backgroundColor: color, shadowColor: color }]} />
      </View>
    );
  };

  const getUpcomingContests = () => {
    const now = new Date();
    return contests
      .filter((contest) => {
        const end = new Date(contest.endTime);
        return end > now;
      })
      .sort((a, b) => {
        const aStart = new Date(a.startTime).getTime();
        const bStart = new Date(b.startTime).getTime();
        return aStart - bStart;
      })
      .slice(0, 5);
  };

  const upcomingContests = getUpcomingContests();

  useEffect(() => {
    if (upcomingContests.length > 1) {
      carouselTimerRef.current = setInterval(() => {
        setCurrentCarouselIndex((prevIndex: number) => {
          const nextIndex = (prevIndex + 1) % upcomingContests.length;
          carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          return nextIndex;
        });
      }, 3000);

      return () => {
        if (carouselTimerRef.current) {
          clearInterval(carouselTimerRef.current);
        }
      };
    }
  }, [upcomingContests.length]);

  const displayedContests = activeCompetitionTab === 'all' ? contests : myContests;

  const dynamicStyles = {
    competitionsContainer: { ...styles.competitionsContainer, backgroundColor: isDark ? '#121212' : '#F5F5F5' },
    competitionsHeader: { ...styles.competitionsHeader, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    competitionsTitle: { ...styles.competitionsTitle, color: isDark ? '#FFFFFF' : '#085173' },
    competitionsEmptyText: { ...styles.competitionsEmptyText, color: isDark ? '#CCCCCC' : '#999' },
    tabContainer: { ...styles.tabContainer, backgroundColor: isDark ? '#2E2E2E' : '#F0F0F0' },
    tabText: { ...styles.tabText, color: isDark ? '#CCCCCC' : '#999' },
    tabTextActive: { ...styles.tabTextActive, color: isDark ? '#FFFFFF' : '#085173' },
    competitionCard: { ...styles.competitionCard, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    competitionCardTitle: { ...styles.competitionCardTitle, color: isDark ? '#FFFFFF' : '#333' },
    competitionCardLevelText: { ...styles.competitionCardLevelText, color: isDark ? '#CCCCCC' : '#666' },
    competitionSponsor: { ...styles.competitionSponsor, color: isDark ? '#AAAAAA' : '#999' },
    competitionDate: { ...styles.competitionDate, color: isDark ? '#AAAAAA' : '#999' },
  };

  return (
    <SafeAreaView style={dynamicStyles.competitionsContainer} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={dynamicStyles.competitionsHeader}>
        <View style={styles.competitionsTitleContainer}>
          <Text style={dynamicStyles.competitionsTitle}>المسابقات</Text>
        </View>
      </View>

      <ScrollView
        style={styles.competitionsScrollView}
        contentContainerStyle={styles.competitionsScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {loading ? (
          <View style={styles.carouselContainer}>
            <View style={[styles.carouselCard, { width: SCREEN_WIDTH - 15, height: 200 }]}>
              <SkeletonView width="100%" height={200} borderRadius={12} />
            </View>
          </View>
        ) : (
          upcomingContests.length > 0 && (
            <View style={styles.carouselContainer}>
              <FlatList
                ref={carouselRef}
                data={upcomingContests}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                getItemLayout={(data, index) => ({
                  length: SCREEN_WIDTH - 8,
                  offset: (SCREEN_WIDTH - 8) * index,
                  index,
                })}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise((resolve) => setTimeout(resolve, 500));
                  wait.then(() => {
                    carouselRef.current?.scrollToIndex({ index: info.index, animated: true });
                  });
                }}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 16));
                  setCurrentCarouselIndex(index);
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.carouselCard, { width: SCREEN_WIDTH - 15 }]}
                    onPress={() => {
                      if (item.id) {
                        router.push(`/contest/${item.id}` as any);
                      }
                    }}
                    activeOpacity={0.8}>
                    <Image source={{ uri: item.imageURL }} style={styles.carouselImage} contentFit="cover" />
                    <View style={styles.carouselOverlay}>
                      <View style={styles.carouselContent}>
                        <View style={styles.carouselHeader}>
                          <Text style={styles.carouselTitle}>{item.name}</Text>
                          {isOnline(item.startTime, item.endTime) && (
                            <View style={styles.onlineBadge}>
                              <Text style={styles.onlineBadgeText}>أونلاين</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.carouselLevel}>
                          <Text style={styles.carouselLevelText}>{getDifficultyLabel(item.difficultyLevel)}</Text>
                          <BlinkingDot color={getDifficultyColor(item.difficultyLevel)} />
                        </View>
                        <Text style={styles.carouselTime}>الوقت المتبقي: {getTimeRemaining(item.startTime, item.endTime)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )
        )}

        {loading ? (
          <View style={styles.tabContainer}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <SkeletonView width={100} height={40} borderRadius={4} />
              <SkeletonView width={100} height={40} borderRadius={4} />
            </View>
          </View>
        ) : (
          <View style={dynamicStyles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeCompetitionTab === 'all' && styles.tabActive]}
              onPress={() => setActiveCompetitionTab('all')}>
              <Text style={[dynamicStyles.tabText, activeCompetitionTab === 'all' && dynamicStyles.tabTextActive]}>المسابقات</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeCompetitionTab === 'my' && styles.tabActive]}
              onPress={() => {
                setActiveCompetitionTab('my');
                loadMyContests();
              }}>
              <Text style={[dynamicStyles.tabText, activeCompetitionTab === 'my' && dynamicStyles.tabTextActive]}>مسابقاتي</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.competitionsListContainer}>
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.competitionCard}>
                <View style={styles.competitionCardContentWrapper}>
                  <View style={styles.competitionCardTop}>
                    <View style={styles.competitionCardLeft}>
                      <SkeletonView width={32} height={32} borderRadius={16} />
                    </View>
                    <View style={styles.competitionCardRight}>
                      <View style={styles.competitionCardContent}>
                        <SkeletonView width="60%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                        <SkeletonView width="40%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                        <SkeletonView width="50%" height={14} borderRadius={4} />
                      </View>
                      <SkeletonView width={80} height={80} borderRadius={8} />
                    </View>
                  </View>
                  <View style={styles.competitionCardBottom}>
                    <SkeletonView width="40%" height={12} borderRadius={4} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : activeCompetitionTab === 'my' && loadingMyContests ? (
          <View style={styles.competitionsListContainer}>
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.competitionCard}>
                <View style={styles.competitionCardContentWrapper}>
                  <View style={styles.competitionCardTop}>
                    <View style={styles.competitionCardLeft}>
                      <SkeletonView width={32} height={32} borderRadius={16} />
                    </View>
                    <View style={styles.competitionCardRight}>
                      <View style={styles.competitionCardContent}>
                        <SkeletonView width="60%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                        <SkeletonView width="40%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                        <SkeletonView width="50%" height={14} borderRadius={4} />
                      </View>
                      <SkeletonView width={80} height={80} borderRadius={8} />
                    </View>
                  </View>
                  <View style={styles.competitionCardBottom}>
                    <SkeletonView width="40%" height={12} borderRadius={4} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : displayedContests.length === 0 ? (
          <View style={styles.competitionsEmptyContainer}>
            <Text style={dynamicStyles.competitionsEmptyText}>
              {activeCompetitionTab === 'my' ? 'لا توجد مسابقات خاصة بك' : 'لا توجد مسابقات'}
            </Text>
          </View>
        ) : (
          displayedContests.map((contest, index) => (
            <TouchableOpacity
              key={contest.id || index}
              style={dynamicStyles.competitionCard}
              onPress={() => {
                if (contest.id) {
                  router.push(`/contest/${contest.id}` as any);
                }
              }}
              activeOpacity={0.7}>
              <View style={styles.competitionCardContentWrapper}>
                <View style={styles.competitionCardTop}>
                  <View style={styles.competitionCardLeft}>
                    <Ionicons name="chevron-back" size={32} color={isDark ? "#666666" : "#CCCCCC"} style={styles.competitionArrow} />
                  </View>
                  <View style={styles.competitionCardRight}>
                    <View style={styles.competitionCardContent}>
                      <View style={styles.competitionCardHeader}>
                        <Text style={dynamicStyles.competitionCardTitle}>{contest.name}</Text>
                      </View>
                      {isOnline(contest.startTime, contest.endTime) && (
                        <View style={styles.competitionOnlineBadge}>
                          <Text style={styles.competitionOnlineBadgeText}>أونلاين</Text>
                        </View>
                      )}
                      <View style={styles.competitionCardLevel}>
                        <Text style={dynamicStyles.competitionCardLevelText}>{getDifficultyLabel(contest.difficultyLevel)}</Text>
                        <BlinkingDot color={getDifficultyColor(contest.difficultyLevel)} />
                      </View>
                      {contest.universityName && (
                        <Text style={dynamicStyles.competitionSponsor}>برعاية {contest.universityName}</Text>
                      )}
                    </View>
                    <Image source={{ uri: contest.imageURL }} style={styles.competitionThumbnail} contentFit="cover" />
                  </View>
                </View>
                <View style={styles.competitionCardBottom}>
                  <Text style={dynamicStyles.competitionDate}>{formatDateRange(contest.startTime, contest.endTime)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  competitionsContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  competitionsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  competitionsTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  competitionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
  },
  competitionsScrollView: {
    flex: 1,
  },
  competitionsScrollContent: {
    paddingBottom: 20,
  },
  competitionsListContainer: {
    paddingBottom: 20,
  },
  competitionsEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  competitionsEmptyText: {
    fontSize: 16,
    color: '#999',
  },
  carouselContainer: {
    marginVertical: 16,
    height: 280,
  },
  carouselCard: {
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  carouselContent: {
    alignItems: 'flex-end',
  },
  carouselHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  onlineBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  carouselLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  dotContainer: {
    position: 'relative',
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blinkingDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  carouselLevelText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  carouselTime: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#085173',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#085173',
    fontWeight: '700',
  },
  competitionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  competitionCardContentWrapper: {
    flex: 1,
  },
  competitionCardTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  competitionCardLeft: {
    alignItems: 'center',
    marginRight: 16,
    justifyContent: 'center',
  },
  competitionArrow: {
    marginBottom: 0,
  },
  competitionDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
  },
  competitionCardRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  competitionCardBottom: {
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  competitionCardContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  competitionCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  competitionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
    marginBottom: 8,
  },
  competitionOnlineBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  competitionOnlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  competitionCardLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  competitionCardLevelText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  competitionSponsor: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  competitionThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 12,
  },
});

