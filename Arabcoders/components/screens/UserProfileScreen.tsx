import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getUserById, followUser, unfollowUser, getFollowStatus } from '@/services/authService';
import { getStoredUser } from '@/services/storage';
import { Stars } from '@/components/common/Stars';
import { ProgressCircle } from '@/components/common/ProgressCircle';
import api from '@/services/api';
import { FollowingScreen } from './FollowingScreen';
import { FollowersScreen } from './FollowersScreen';
import { useTheme } from '@/contexts/ThemeContext';

export interface UserProfileScreenProps {
  userId: number;
  onBack: () => void;
  onUserPress?: (userId: number) => void;
}

export function UserProfileScreen({ userId, onBack, onUserPress }: UserProfileScreenProps) {
  const { isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(true);
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [bellFollowersCount, setBellFollowersCount] = useState(0);
  const [showBellModal, setShowBellModal] = useState(false);
  const [isActivatedSendEmail, setIsActivatedSendEmail] = useState(false);
  const [isActivatedSendAppNotification, setIsActivatedSendAppNotification] = useState(false);
  const [loadingBellStatus, setLoadingBellStatus] = useState(false);
  const [savingBellStatus, setSavingBellStatus] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [problemTotals, setProblemTotals] = useState<{ total: number; easy: number; medium: number; hard: number }>({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadUser();
    loadUserProblems();
  }, [userId]);

  useEffect(() => {
    if (currentUserId && userId) {
      checkFollowStatus();
    }
  }, [currentUserId, userId]);

  useEffect(() => {
    if (user) {
      loadBellFollowers(userId);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const userData = user;
      const easy = userData.easyProblemsSolvedCount || 0;
      const medium = userData.mediumProblemsSolvedCount || 0;
      const hard = userData.hardProblemsSolvedCount || 0;
      const totalSolved = easy + medium + hard;

      animateNumber(0, easy, 1500, setEasyCount);
      animateNumber(0, medium, 1500, setMediumCount);
      animateNumber(0, hard, 1500, setHardCount);
      animateNumber(0, userData.totalSubmissions || 0, 1500, setSubmissionsCount);
      animateNumber(0, totalSolved, 1500, setSolvedCount);
      animateNumber(0, userData.streakDay || 0, 1500, setStreakCount);
      animateNumber(0, userData.followers || 0, 1500, setFollowersCount);
      animateNumber(0, userData.following || 0, 1500, setFollowingCount);
    }
  }, [user]);

  const loadCurrentUser = async () => {
    try {
      const userData = await getStoredUser();
      if (userData?.responseUserDTO?.id) {
        setCurrentUserId(userData.responseUserDTO.id);
      } else if (userData?.id) {
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getUserById(userId);
      setUser(userData);
    } catch (error: any) {
      console.error('Error loading user:', error);
      Alert.alert('خطأ', error?.message || 'فشل تحميل معلومات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId || !userId || currentUserId === userId) {
      setCheckingFollowStatus(false);
      return;
    }
    try {
      setCheckingFollowStatus(true);
      const status = await getFollowStatus(currentUserId, userId);
      setIsFollowing(status);
    } catch (error) {
      console.error('Error checking follow status:', error);
      setIsFollowing(false);
    } finally {
      setCheckingFollowStatus(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }
    if (currentUserId === userId) {
      Alert.alert('تنبيه', 'لا يمكنك متابعة نفسك');
      return;
    }
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, userId);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        Alert.alert('نجح', 'تم إلغاء المتابعة');
      } else {
        await followUser(currentUserId, userId);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        Alert.alert('نجح', 'تمت المتابعة بنجاح');
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      Alert.alert('خطأ', error?.message || 'فشل العملية');
    }
  };

  const loadUserProblems = async () => {
    try {
      const response = await api.get('/api/general/User');
      const data = response?.data || {};
      setProblemTotals({
        total: Number(data.countProblems) || 0,
        easy: Number(data.contEasyProblems) || 0,
        medium: Number(data.counMidumProblems) || 0,
        hard: Number(data.countHardProblems) || 0,
      });
    } catch (error) {
      console.error('Error loading user problem totals:', error);
    }
  };

  const loadBellFollowers = async (targetUserId: number) => {
    try {
      const response = await api.get(`/api/Users/${targetUserId}/bell-activations`);
      setBellFollowersCount(Number(response?.data) || 0);
    } catch (error) {
      console.error('Error loading bell followers:', error);
      setBellFollowersCount(0);
    }
  };

  const loadBellActivationStatus = async () => {
    if (!currentUserId || !userId || currentUserId === userId) {
      setIsActivatedSendEmail(false);
      setIsActivatedSendAppNotification(false);
      return;
    }
    try {
      setLoadingBellStatus(true);
      console.log('📤 Loading bell activation status:', { followerId: currentUserId, followedId: userId });
      const response = await api.get('/api/bell-activations', {
        params: {
          followerId: Number(currentUserId),
          followedId: Number(userId),
        },
      });
      console.log('✅ Bell activation status loaded:', response.data);
      if (response.data) {
        setIsActivatedSendEmail(response.data.isActivatedSendEmail || false);
        setIsActivatedSendAppNotification(response.data.isActivatedSendAppNotification || false);
      }
    } catch (error: any) {
      // إذا كان الخطأ 404 يعني لا يوجد تفعيل بعد
      if (error.response?.status === 404) {
        console.log('ℹ️ No bell activation found (404), using defaults');
        setIsActivatedSendEmail(false);
        setIsActivatedSendAppNotification(false);
      } else if (error.response?.status === 400) {
        console.log('⚠️ Bad request (400), checking if parameters are valid');
        // إذا كان 400، قد يكون لأن الـ API يتوقع format مختلف
        setIsActivatedSendEmail(false);
        setIsActivatedSendAppNotification(false);
      } else {
        console.error('❌ Error loading bell activation status:', error.response?.data || error.message);
        setIsActivatedSendEmail(false);
        setIsActivatedSendAppNotification(false);
      }
    } finally {
      setLoadingBellStatus(false);
    }
  };

  const saveBellActivation = async () => {
    if (!currentUserId || !userId || currentUserId === userId) {
      Alert.alert('خطأ', 'لا يمكنك تفعيل الجرس لنفسك');
      return;
    }

    // التحقق من أن القيم صحيحة
    if (!currentUserId || !userId || currentUserId === 0 || userId === 0) {
      Alert.alert('خطأ', 'بيانات غير صحيحة');
      return;
    }

    try {
      setSavingBellStatus(true);
      const data = {
        followerId: Number(currentUserId),
        followedId: Number(userId),
        isActivatedSendEmail: Boolean(isActivatedSendEmail),
        isActivatedSendAppNotification: Boolean(isActivatedSendAppNotification),
      };

      console.log('📤 Saving bell activation:', data);

      // محاولة GET أولاً لمعرفة إذا كان موجوداً
      let exists = false;
      try {
        await api.get('/api/bell-activations', {
          params: {
            followerId: Number(currentUserId),
            followedId: Number(userId),
          },
        });
        exists = true;
      } catch (getError: any) {
        // إذا كان 404 يعني غير موجود
        if (getError.response?.status === 404) {
          exists = false;
        } else if (getError.response?.status === 400) {
          // إذا كان 400، جرب POST مباشرة (ربما الـ GET يتطلب format مختلف)
          exists = false;
        } else {
          throw getError;
        }
      }

      if (exists) {
        // إذا موجود، استخدم PUT
        console.log('📝 Updating existing bell activation (PUT)');
        await api.put('/api/bell-activations', data);
      } else {
        // إذا لم يكن موجوداً، استخدم POST
        console.log('➕ Creating new bell activation (POST)');
        await api.post('/api/bell-activations', data);
      }

      console.log('✅ Bell activation saved successfully');
      Alert.alert('نجح', 'تم حفظ الإعدادات بنجاح');
      setShowBellModal(false);
      // تحديث عدد المهتمين
      loadBellFollowers(userId);
    } catch (error: any) {
      console.error('❌ Error saving bell activation:', error.response?.data || error.message);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.title ||
                          error?.message || 
                          'فشل حفظ الإعدادات';
      Alert.alert('خطأ', errorMessage);
    } finally {
      setSavingBellStatus(false);
    }
  };

  const animateNumber = (from: number, to: number, duration: number, setter: (value: number) => void) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + (to - from) * easeOut);
      setter(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setter(to);
      }
    };
    animate();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (showFollowers) {
    // كارت "يتابع" يفتح صفحة المتابعين (followers)
    return (
      <FollowersScreen
        userId={userId}
        onBack={() => setShowFollowers(false)}
        onUserPress={(targetUserId) => {
          setShowFollowers(false);
          if (onUserPress) {
            onUserPress(targetUserId);
          }
        }}
      />
    );
  }

  if (showFollowing) {
    // كارت "المتابعين" يفتح صفحة يتابع (following)
    return (
      <FollowingScreen
        userId={userId}
        onBack={() => setShowFollowing(false)}
        onUserPress={(targetUserId) => {
          setShowFollowing(false);
          if (onUserPress) {
            onUserPress(targetUserId);
          }
        }}
      />
    );
  }

  const dynamicStyles = {
    profileContainer: { ...styles.profileContainer, backgroundColor: isDark ? '#121212' : '#F5F5F5' },
    profileName: { ...styles.profileName, color: isDark ? '#FFFFFF' : '#085173' },
    profileId: { ...styles.profileId, color: isDark ? '#AAAAAA' : '#333' },
    bellButton: { ...styles.bellButton, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E0E0E0' },
    bellButtonText: { ...styles.bellButtonText, color: isDark ? '#FFFFFF' : '#333' },
    followButton: { ...styles.followButton, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E0E0E0' },
    followButtonText: { ...styles.followButtonText, color: isDark ? '#FFFFFF' : '#333' },
    topStatLabel: { ...styles.topStatLabel, color: isDark ? '#AAAAAA' : '#666' },
    topStatValue: { ...styles.topStatValue, color: isDark ? '#FFFFFF' : '#333' },
    infoCard: { ...styles.infoCard, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    infoCardTitle: { ...styles.infoCardTitle, color: isDark ? '#0C85C1' : '#085173' },
    profileInfoLabel: { ...styles.profileInfoLabel, color: isDark ? '#AAAAAA' : '#666' },
    profileInfoValue: { ...styles.profileInfoValue, color: isDark ? '#FFFFFF' : '#333' },
    sectionHeader: { ...styles.sectionHeader, color: isDark ? '#0C85C1' : '#085173' },
    difficultyNumber: { ...styles.difficultyNumber, color: isDark ? '#FFFFFF' : '#333' },
    difficultyLabel: { ...styles.difficultyLabel, color: isDark ? '#AAAAAA' : '#666' },
    difficultyProgress: { ...styles.difficultyProgress, color: isDark ? '#888' : '#999' },
    statCardLabel: { ...styles.statCardLabel, color: isDark ? '#AAAAAA' : '#666' },
    statCardValue: { ...styles.statCardValue, color: isDark ? '#FFFFFF' : '#333' },
    modalOverlay: { ...styles.modalOverlay, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' },
    modalContent: { ...styles.modalContent, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    modalTitle: { ...styles.modalTitle, color: isDark ? '#FFFFFF' : '#333' },
    modalText: { ...styles.modalText, color: isDark ? '#CCCCCC' : '#666' },
    modalLoadingText: { ...styles.modalLoadingText, color: isDark ? '#AAAAAA' : '#666' },
    switchContainer: { ...styles.switchContainer, borderBottomColor: isDark ? '#333' : '#E5E5E5' },
    switchLabel: { ...styles.switchLabel, color: isDark ? '#FFFFFF' : '#333' },
    switchDescription: { ...styles.switchDescription, color: isDark ? '#AAAAAA' : '#666' },
  };

  if (loading || checkingFollowStatus) {
    return (
      <View style={dynamicStyles.profileContainer}>
        <StatusBar style={isDark ? "light" : "light"} />
        <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const userData = user || {};
  const displayName = userData.userName || 'غير محدد';
  const displayEmail = userData.email || 'غير محدد';
  const displayUniversity = userData.universityName || 'غير محدد';
  const displayCity = (userData.country?.nameCountry || '').trim() || 'غير محدد';
  const userDisplayId = `#${userData.id || ''}`;

  const acceptancePercent = Math.min(Math.max(userData.acceptanceRate || 0, 0), 100);
  const easySolvedCount = userData.easyProblemsSolvedCount || 0;
  const mediumSolvedCount = userData.mediumProblemsSolvedCount || 0;
  const hardSolvedCount = userData.hardProblemsSolvedCount || 0;
  const totalSolvedBase = Math.max(
    easySolvedCount + mediumSolvedCount + hardSolvedCount,
    userData.totalProblemsSolved || 0,
    userData.totalSubmissions || 0,
    1,
  );

  const animatedContainerStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: translateAnim }],
  };

  return (
    <View style={dynamicStyles.profileContainer}>
      <StatusBar style={isDark ? "light" : "light"} />

      <Animated.View style={[animatedContainerStyle, styles.profileContentWrapper]}>
        <ScrollView style={styles.profileScrollView} contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <Stars />
            <View style={styles.profileHeaderTop}>
              <View style={styles.profileHeaderIconButton} />
              <Text style={styles.profileHeaderTitle}>الصفحة الشخصية</Text>
              <TouchableOpacity onPress={onBack} style={styles.profileHeaderIconButton}>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileAvatarWrapper}>
            <Image
              source={userData.imageUrl || userData.imageURL ? { uri: userData.imageUrl || userData.imageURL } : require('@/assets/images/icon.png')}
              style={styles.profileMainImage}
              contentFit="cover"
            />
          </View>
          <View style={styles.profileNameContainer}>
            <Text style={dynamicStyles.profileName}>{displayName}</Text>
            <Text style={dynamicStyles.profileId}>{userDisplayId}</Text>
          </View>

          {/* Action Buttons */}
          {currentUserId && currentUserId !== userId && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={dynamicStyles.bellButton}
                onPress={() => {
                  if (!currentUserId || !userId) {
                    Alert.alert('خطأ', 'لا يمكن تحميل الإعدادات');
                    return;
                  }
                  setShowBellModal(true);
                  loadBellActivationStatus();
                }}
                activeOpacity={0.7}>
                <Text style={dynamicStyles.bellButtonText}>تفعيل الجرس</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.followButton, isFollowing && styles.followButtonActive]}
                onPress={handleFollow}
                activeOpacity={0.7}>
                <Text style={[dynamicStyles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                  {isFollowing ? 'إلغاء المتابعة' : 'المتابعه +'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.topStatsRow}>
            <View style={[styles.topStatCard, styles.topStatCardBlue, isDark && { backgroundColor: '#1A3A4A' }]}>
              <Ionicons name="notifications-outline" size={24} color="#4A90E2" />
              <Text style={dynamicStyles.topStatLabel}>مهتمون</Text>
              <Text style={dynamicStyles.topStatValue}>{bellFollowersCount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.topStatCard, styles.topStatCardGreen, isDark && { backgroundColor: '#1A3A2A' }]}
              onPress={() => setShowFollowing(true)}
              activeOpacity={0.7}>
              <Ionicons name="people-outline" size={24} color="#4CAF50" />
              <Text style={dynamicStyles.topStatLabel}>المتابعين</Text>
              <Text style={dynamicStyles.topStatValue}>{followersCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.topStatCard, styles.topStatCardYellow, isDark && { backgroundColor: '#3A3A2A' }]}
              onPress={() => setShowFollowers(true)}
              activeOpacity={0.7}>
              <Ionicons name="person-outline" size={24} color="#FFC107" />
              <Text style={dynamicStyles.topStatLabel}>يتابع</Text>
              <Text style={dynamicStyles.topStatValue}>{followingCount}</Text>
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.infoCard}>
            <Text style={dynamicStyles.infoCardTitle}>المعلومات الحساب</Text>
            <View style={styles.profileInfoRow}>
              <Text style={dynamicStyles.profileInfoLabel}>الإيميل :</Text>
              <Text style={dynamicStyles.profileInfoValue}>{displayEmail}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={dynamicStyles.profileInfoLabel}>الجامعة :</Text>
              <Text style={dynamicStyles.profileInfoValue}>{displayUniversity}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={dynamicStyles.profileInfoLabel}>المدينة :</Text>
              <Text style={dynamicStyles.profileInfoValue}>{displayCity}</Text>
            </View>
          </View>

          <Text style={dynamicStyles.sectionHeader}>الأداء</Text>

          <View style={styles.difficultyCirclesContainer}>
            <ProgressCircle
              value={easyCount}
              total={problemTotals.easy || 0}
              label="سهل"
              color="#10b981"
              size={96}
              animatedValue={easyCount}
            />
            <ProgressCircle
              value={mediumCount}
              total={problemTotals.medium || 0}
              label="متوسط"
              color="#f59e0b"
              size={96}
              animatedValue={mediumCount}
            />
            <ProgressCircle
              value={hardCount}
              total={problemTotals.hard || 0}
              label="صعب"
              color="#ef4444"
              size={96}
              animatedValue={hardCount}
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.acceptanceCard, isDark && { backgroundColor: '#1E1E1E' }]}>
              <View style={styles.donutChartContainer}>
                <View style={[styles.donutChart, { borderWidth: 6, borderColor: isDark ? '#0C85C1' : '#0E8BA6', backgroundColor: isDark ? '#1A3A4A' : '#F1F7F9' }]}>
                  <Text style={[styles.donutText, { color: isDark ? '#0C85C1' : '#085173' }]}>{acceptancePercent}%</Text>
                </View>
                <View style={[styles.donutChartBackground, isDark && { borderColor: '#444' }]} />
              </View>
              <Text style={dynamicStyles.statCardLabel}>نسبة القبول</Text>
            </View>
            <View style={[styles.statCard, styles.suggestionsCard, isDark && { backgroundColor: '#1A3A4A' }]}>
              <Ionicons name="code-slash-outline" size={32} color="#4A90E2" />
              <Text style={dynamicStyles.statCardLabel}>عدد الاقتراحات</Text>
              <Text style={dynamicStyles.statCardValue}>{submissionsCount}</Text>
            </View>
            <View style={[styles.statCard, styles.solvedCard, isDark && { backgroundColor: '#3A3A2A' }]}>
              <Ionicons name="calendar-outline" size={32} color="#4A90E2" />
              <Text style={dynamicStyles.statCardLabel}>السلسلة الحالية</Text>
              <Text style={dynamicStyles.statCardValue}>{streakCount}</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bell Modal */}
      <Modal
        transparent
        visible={showBellModal}
        animationType="slide"
        onRequestClose={() => setShowBellModal(false)}>
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBellModal(false)}>
          <View style={dynamicStyles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>إعدادات الإشعارات</Text>
              <TouchableOpacity onPress={() => setShowBellModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#333'} />
              </TouchableOpacity>
            </View>

            {loadingBellStatus ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
                <Text style={dynamicStyles.modalLoadingText}>جاري التحميل...</Text>
              </View>
            ) : (
              <>
                <Text style={dynamicStyles.modalText}>
                  اختر نوع الإشعارات التي تريد تلقيها من هذا المستخدم
                </Text>

                {/* Email Notification Switch */}
                <View style={dynamicStyles.switchContainer}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="mail-outline" size={24} color={isDark ? '#0C85C1' : '#085173'} style={styles.switchIcon} />
                    <View style={styles.switchTextContainer}>
                      <Text style={dynamicStyles.switchLabel}>إرسال الإيميل</Text>
                      <Text style={dynamicStyles.switchDescription}>تلقي إشعارات عبر البريد الإلكتروني</Text>
                    </View>
                  </View>
                  <Switch
                    value={isActivatedSendEmail}
                    onValueChange={setIsActivatedSendEmail}
                    trackColor={{ false: isDark ? '#444' : '#E0E0E0', true: isDark ? '#0C85C1' : '#085173' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={isDark ? '#444' : '#E0E0E0'}
                  />
                </View>

                {/* App Notification Switch */}
                <View style={dynamicStyles.switchContainer}>
                  <View style={styles.switchLabelContainer}>
                    <Ionicons name="notifications-outline" size={24} color={isDark ? '#0C85C1' : '#085173'} style={styles.switchIcon} />
                    <View style={styles.switchTextContainer}>
                      <Text style={dynamicStyles.switchLabel}>إشعارات التطبيق</Text>
                      <Text style={dynamicStyles.switchDescription}>تلقي إشعارات داخل التطبيق</Text>
                    </View>
                  </View>
                  <Switch
                    value={isActivatedSendAppNotification}
                    onValueChange={setIsActivatedSendAppNotification}
                    trackColor={{ false: isDark ? '#444' : '#E0E0E0', true: isDark ? '#0C85C1' : '#085173' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={isDark ? '#444' : '#E0E0E0'}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, savingBellStatus && styles.modalButtonDisabled]}
                  onPress={saveBellActivation}
                  disabled={savingBellStatus}>
                  {savingBellStatus ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>حفظ</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// استخدام نفس الأنماط من ProfileScreen
const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileHeader: {
    height: 200,
    backgroundColor: '#085173',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    zIndex: 1,
  },
  profileHeaderIconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileAvatarWrapper: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 10,
    zIndex: 2,
  },
  profileMainImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E0E0E0',
  },
  profileContentWrapper: {
    flex: 1,
  },
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    paddingBottom: 30,
  },
  profileNameContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bellButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  bellButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  followButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: '#085173',
    borderColor: '#085173',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  followButtonTextActive: {
    color: '#FFFFFF',
  },
  topStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  topStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topStatCardBlue: {
    backgroundColor: '#E3F2FD',
  },
  topStatCardGreen: {
    backgroundColor: '#E8F5E9',
  },
  topStatCardYellow: {
    backgroundColor: '#FFF9C4',
  },
  topStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  topStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 16,
    textAlign: 'right',
  },
  profileInfoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    textAlign: 'right',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#085173',
    marginHorizontal: 20,
    marginBottom: 16,
    textAlign: 'right',
  },
  difficultyCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  difficultyCircle: {
    alignItems: 'center',
  },
  difficultyRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  difficultyProgress: {
    fontSize: 12,
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  acceptanceCard: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  suggestionsCard: {
    backgroundColor: '#E3F2FD',
  },
  solvedCard: {
    backgroundColor: '#FFF3E0',
  },
  donutChartContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutChart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F7F9',
    position: 'relative',
    zIndex: 2,
  },
  donutChartBackground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#E0E0E0',
    zIndex: 1,
  },
  donutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#085173',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'right',
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#085173',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    marginLeft: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  switchDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
});

