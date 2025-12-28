import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Stars } from '@/components/common/Stars';
import { RippleEffectCard } from '@/components/common/RippleEffectCard';
import { BottomNav } from '@/components/common/BottomNav';
import { clearAuthData, getStoredToken, getStoredUser } from '@/services/storage';
import { revokeToken } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppColors } from '@/hooks/use-app-colors';

export interface MoreScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
  onProfilePress?: () => void;
  onRankingPress?: () => void;
  onEventsPress?: () => void;
  onAlgorithmsPress?: () => void;
  onNotificationsSettingsPress?: () => void;
  onFAQPress?: () => void;
  onAboutUsPress?: () => void;
  onContactUsPress?: () => void;
  onTermsPress?: () => void;
}

export function MoreScreen({ activeTab, onTabPress, onProfilePress, onRankingPress, onEventsPress, onAlgorithmsPress, onNotificationsSettingsPress, onFAQPress, onAboutUsPress, onContactUsPress, onTermsPress }: MoreScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();
  const colors = useAppColors();
  const router = useRouter();

  const chevronAnims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const chevronPulse = Animated.stagger(
      200,
      chevronAnims.map((anim) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.delay(500),
          ]),
        ),
      ),
    );

    chevronPulse.start();
    return () => chevronPulse.stop();
  }, [chevronAnims]);

  const chevronStyles = chevronAnims.map((anim) => ({
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.5, 1, 0.5],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.3, 1],
        }),
      },
    ],
  }));

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getStoredUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = () => {
    if (onProfilePress) {
      onProfilePress();
    }
  };

  const handleLogout = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getStoredToken();
            if (token) {
              try {
                await revokeToken(token);
              } catch (revokeError) {
                console.warn('Failed to revoke token on server, continuing logout:', revokeError);
              }
            }

            await clearAuthData();
            await AsyncStorage.multiRemove(['rememberedEmail', 'pendingSignupData', 'passwordResetEmail']);

            await new Promise((resolve) => setTimeout(resolve, 100));

            try {
              router.replace('/');
            } catch (navError) {
              console.error('Navigation error:', navError);
              try {
                router.push('/');
              } catch (pushError) {
                console.error('Push also failed:', pushError);
              }
            }
          } catch (error) {
            console.error('Error logging out:', error);
            try {
              await clearAuthData();
              await AsyncStorage.multiRemove(['rememberedEmail', 'pendingSignupData', 'passwordResetEmail']);
              setTimeout(() => {
                try {
                  router.replace('/');
                } catch (navError) {
                  try {
                    router.push('/');
                  } catch {
                    router.replace('/');
                  }
                }
              }, 300);
            } catch (cleanupError) {
              console.error('Error during cleanup:', cleanupError);
              Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
            }
          }
        },
      },
    ]);
  };

  const dynamicStyles = {
    moreContainer: { backgroundColor: colors.background },
    moreHeader: { 
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.border,
    },
    moreTitle: { color: colors.primary },
    sectionTitle: { color: colors.primary },
    menuItem: { borderBottomColor: colors.border },
    menuItemText: { color: colors.textPrimary },
    toggle: { backgroundColor: colors.disabled },
    toggleActive: { backgroundColor: colors.primary },
    logoutButton: { 
      backgroundColor: colors.cardBackground,
      borderColor: colors.error,
    },
    logoutButtonText: { color: colors.error },
  };

  return (
    <SafeAreaView style={[styles.moreContainer, dynamicStyles.moreContainer]} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.moreHeader, dynamicStyles.moreHeader]}>
        <View style={styles.moreTitleContainer}>
          <Text style={[styles.moreTitle, dynamicStyles.moreTitle]}>المزيد</Text>
        </View>
      </View>

      <ScrollView style={styles.moreScrollView} contentContainerStyle={styles.moreScrollContent}>
        <RippleEffectCard style={styles.userCard} onPress={handleCardPress} rippleColor="#183E9F">
          <BlurView style={styles.blurView} intensity={10} tint="light" />
          <View style={styles.overlay} />
          <Stars />

          <View style={styles.chevronsContainer}>
            <Animated.View style={chevronStyles[2]}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Animated.View>
            <Animated.View style={[chevronStyles[1], { marginRight: -4 }]}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Animated.View>
            <Animated.View style={[chevronStyles[0], { marginRight: -8 }]}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Animated.View>
          </View>

          <Image
            source={
              user?.imageUrl || user?.imageURL || user?.profile_image_url || user?.medicals?.profile_image
                ? { uri: user.imageUrl || user.imageURL || user.profile_image_url || user.medicals.profile_image }
                : require('@/assets/images/icon.png')
            }
            style={styles.profileImage}
            contentFit="cover"
          />

          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoRow}>
              <Text style={styles.userLabel}>الاسم:</Text>
              <Text style={styles.userValue}>{user?.userName || user?.name || user?.username || 'غير محدد'}</Text>
            </View>
            <View style={styles.userInfoRow}>
              <Text style={styles.userLabel}>المستوى:</Text>
              <Text style={styles.userValue}>{user?.level || user?.streakDay || '0'}</Text>
            </View>
          </View>

          <View style={styles.userDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>البريد الالكتروني:</Text>
              <Text style={styles.detailValue}>{user?.email || 'غير محدد'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>المدينة:</Text>
              <Text style={styles.detailValue}>{user?.country?.nameCountry || user?.city || 'غير محدد'}</Text>
            </View>
          </View>
        </RippleEffectCard>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>الاقسام</Text>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]}
            onPress={() => {
              if (onEventsPress) {
                onEventsPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>الاحداث</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]} 
            onPress={() => {
              if (onRankingPress) {
                onRankingPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>التصنيفات</Text>
            <Ionicons name="grid-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]} 
            onPress={() => {
              if (onAlgorithmsPress) {
                onAlgorithmsPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>الخوارزميات</Text>
            <Ionicons name="code-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>الاداء</Text>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]}
            onPress={() => {
              if (onNotificationsSettingsPress) {
                onNotificationsSettingsPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>الاشعارات</Text>
            <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <View style={[styles.menuItem, dynamicStyles.menuItem]}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[
                  styles.toggle, 
                  dynamicStyles.toggle,
                  isDark && dynamicStyles.toggleActive
                ]} 
                onPress={toggleTheme}
              >
                <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>الوضع الليلي</Text>
            <Ionicons name={isDark ? "moon" : "moon-outline"} size={20} color={colors.secondary} />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>المساعدة والدعم</Text>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]}
            onPress={() => {
              if (onFAQPress) {
                onFAQPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>الاسئلة المتكررة</Text>
            <Ionicons name="help-circle-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]}
            onPress={() => {
              if (onContactUsPress) {
                onContactUsPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>تواصل معنا</Text>
            <Ionicons name="mail-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>حول</Text>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]}
            onPress={() => {
              if (onAboutUsPress) {
                onAboutUsPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>من نحن</Text>
            <Ionicons name="information-circle-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, dynamicStyles.menuItem]}
            onPress={() => {
              if (onTermsPress) {
                onTermsPress();
              }
            }}>
            <Ionicons name="chevron-back" size={16} color={colors.textLight} />
            <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>الشروط والاحكام</Text>
            <Ionicons name="document-text-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={[styles.logoutButton, dynamicStyles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutButtonText, dynamicStyles.logoutButtonText]}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  moreContainer: {
    flex: 1,
  },
  moreHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  moreTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  moreTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  moreScrollView: {
    flex: 1,
  },
  moreScrollContent: {
    paddingBottom: 0,
    paddingTop: 8,
  },
  userCard: {
    height: 160,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    position: 'relative',
  },
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 20,
  },
  ripple: {
    position: 'absolute',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 81, 115, 0.85)',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    top: 15,
    right: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  userInfoContainer: {
    position: 'absolute',
    top: 20,
    right: 90,
    flexDirection: 'column',
  },
  userInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  userLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginRight: 5,
  },
  userDetailsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    right: 15,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginRight: 8,
  },
  chevronsContainer: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    textAlign: 'right',
    marginRight: 12,
  },
  toggleContainer: {
    marginRight: 8,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    // سيتم تطبيقه ديناميكياً
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
    marginHorizontal: 6,
    borderWidth: 1,
    marginBottom: 26,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginRight: 8,
    textAlign: 'right',
  },
});

