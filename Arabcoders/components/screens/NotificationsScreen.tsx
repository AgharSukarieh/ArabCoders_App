import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import api from '@/services/api';
import { getStoredUser } from '@/services/storage';
import { SkeletonView } from '@/components/common/SkeletonView';
import { BottomNav } from '@/components/common/BottomNav';
import { useTheme } from '@/contexts/ThemeContext';

export interface NotificationsScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
  onUnreadCountChange?: (count: number) => void;
  unreadCount?: number;
}

export function NotificationsScreen({
  activeTab,
  onTabPress,
  onUnreadCountChange,
  unreadCount = 0,
}: NotificationsScreenProps) {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [showEmailPreferencesModal, setShowEmailPreferencesModal] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [loadingEmailPreferences, setLoadingEmailPreferences] = useState(false);
  const [savingEmailPreferences, setSavingEmailPreferences] = useState(false);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  useEffect(() => {
    if (showEmailPreferencesModal) {
      loadEmailPreferences();
    }
  }, [showEmailPreferencesModal]);

  const loadUserAndNotifications = async () => {
    try {
      const user = await getStoredUser();
      const userIdValue = user?.id || user?.userId || user?.Id;
      if (userIdValue) {
        const numericUserId = parseInt(String(userIdValue), 10);
        if (!isNaN(numericUserId) && numericUserId > 0) {
          setUserId(numericUserId);
          await loadNotifications(numericUserId);
        } else {
          Alert.alert('خطأ', 'معرف المستخدم غير صحيح');
          setLoading(false);
        }
      } else {
        Alert.alert('خطأ', 'لم يتم العثور على بيانات المستخدم');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل بيانات المستخدم');
      setLoading(false);
    }
  };

  const loadNotifications = async (uid: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications/users/${uid}`);
      const notificationsData = Array.isArray(response.data) ? response.data : [];
      setNotifications(notificationsData);

      const unread = notificationsData.filter((n: any) => n.isRead === false).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unread);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في جلب الإشعارات');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (userId) {
      loadNotifications(userId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return 'منذ وقت';
    }
  };

  const stripHtml = (html: string | null | undefined) => {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, '').trim();
  };

  const getNotificationIcon = (notificationType: number | null | undefined) => {
    if (notificationType === null || notificationType === undefined) return 'notifications';
    switch (notificationType) {
      case 1:
        return 'person-add';
      case 2:
        return 'help-circle';
      case 3:
        return 'checkmark-circle';
      case 4:
        return 'people';
      case 5:
        return 'flame';
      case 6:
        return 'settings';
      case 7:
        return 'document-text';
      default:
        return 'notifications';
    }
  };

  const getNotificationIconColor = (notificationType: number | null | undefined) => {
    if (notificationType === null || notificationType === undefined) return '#666';
    switch (notificationType) {
      case 1:
        return '#4CAF50';
      case 2:
        return '#FF9800';
      case 3:
        return '#4CAF50';
      case 4:
        return '#2196F3';
      case 5:
        return '#FF5722';
      case 6:
        return '#9E9E9E';
      case 7:
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const loadEmailPreferences = async () => {
    try {
      setLoadingEmailPreferences(true);
      const response = await api.get('/api/users/me/email-preferences', {
        headers: {
          'accept': 'text/plain',
        },
      });
      setEmailNotificationsEnabled(response.data === true || response.data === 'true');
    } catch (error: any) {
      console.error('Error loading email preferences:', error);
      // إذا كان الخطأ 404، يعني الإعدادات غير موجودة، نستخدم القيمة الافتراضية
      if (error?.response?.status !== 404) {
        Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في جلب إعدادات الإشعارات');
      }
    } finally {
      setLoadingEmailPreferences(false);
    }
  };

  const saveEmailPreferences = async (enabled: boolean) => {
    try {
      setSavingEmailPreferences(true);
      await api.put(`/api/users/me/email-preferences?allowSendEmail=${enabled}`, {}, {
        headers: {
          'accept': 'text/plain',
        },
      });
      setEmailNotificationsEnabled(enabled);
      Alert.alert('نجح', enabled ? 'تم تفعيل الإشعارات عبر البريد الإلكتروني' : 'تم إيقاف الإشعارات عبر البريد الإلكتروني');
    } catch (error: any) {
      console.error('Error saving email preferences:', error);
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في حفظ إعدادات الإشعارات');
    } finally {
      setSavingEmailPreferences(false);
    }
  };

  const handleEmailNotificationToggle = (value: boolean) => {
    saveEmailPreferences(value);
  };

  const dynamicStyles = {
    notificationsContainer: { ...styles.notificationsContainer, backgroundColor: isDark ? '#121212' : '#F5F5F5' },
    notificationsHeader: { ...styles.notificationsHeader, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    notificationsTitle: { ...styles.notificationsTitle, color: isDark ? '#FFFFFF' : '#085173' },
    notificationsEmptyText: { ...styles.notificationsEmptyText, color: isDark ? '#CCCCCC' : '#999' },
    notificationItem: { ...styles.notificationItem, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    notificationItemUnread: { ...styles.notificationItemUnread, backgroundColor: isDark ? '#1A2A3A' : '#F0F8FF', borderLeftColor: '#085173' },
    notificationTitle: { ...styles.notificationTitle, color: isDark ? '#FFFFFF' : '#333' },
    notificationDescription: { ...styles.notificationDescription, color: isDark ? '#CCCCCC' : '#666' },
    notificationTime: { ...styles.notificationTime, color: isDark ? '#AAAAAA' : '#999' },
  };

  return (
    <SafeAreaView style={dynamicStyles.notificationsContainer} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={dynamicStyles.notificationsHeader}>
        <TouchableOpacity 
          style={styles.notificationsMenuButton}
          onPress={() => setShowEmailPreferencesModal(true)}
          activeOpacity={0.7}>
          <Image source={require('@/assets/icons/menu_settings.png')} style={styles.notificationsMenuIcon} contentFit="contain" />
        </TouchableOpacity>
        <View style={styles.notificationsTitleContainer}>
          <Text style={dynamicStyles.notificationsTitle}>الاشعارات</Text>
        </View>
      </View>

      <ScrollView
        style={styles.notificationsScrollView}
        contentContainerStyle={styles.notificationsScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {loading ? (
          <View style={styles.notificationsListContainer}>
            {[1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={styles.notificationItem}>
                <SkeletonView width={48} height={48} borderRadius={24} />
                <View style={styles.notificationContent}>
                  <SkeletonView width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                  <SkeletonView width="90%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonView width="40%" height={12} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.notificationsEmptyContainer}>
            <Text style={dynamicStyles.notificationsEmptyText}>لا توجد إشعارات</Text>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const notificationType = notification.type || 0;
            const isUnread = notification.isRead === false;

            return (
              <View
                key={notification.id || index}
                style={[dynamicStyles.notificationItem, isUnread && dynamicStyles.notificationItemUnread]}>
                <View
                  style={[
                    styles.notificationIconContainer,
                    { backgroundColor: getNotificationIconColor(notificationType) + '20' },
                  ]}>
                  <Ionicons
                    name={getNotificationIcon(notificationType)}
                    size={24}
                    color={getNotificationIconColor(notificationType)}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={dynamicStyles.notificationTitle}>
                    {stripHtml(notification.startMessage || notification.title || notification.message || 'إشعار')}
                  </Text>
                  {notification.endMessage && (
                    <Text style={dynamicStyles.notificationDescription} numberOfLines={2}>
                      {stripHtml(notification.endMessage)}
                    </Text>
                  )}
                  {notification.createdAt && (
                    <Text style={dynamicStyles.notificationTime}>{formatDate(notification.createdAt)}</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} unreadCount={unreadCount} />

      {/* Email Preferences Modal */}
      <Modal
        visible={showEmailPreferencesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailPreferencesModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmailPreferencesModal(false)}>
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333' }]}>إعدادات الإشعارات</Text>
              <TouchableOpacity
                onPress={() => setShowEmailPreferencesModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#333'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {loadingEmailPreferences ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: isDark ? '#CCCCCC' : '#666' }]}>جاري التحميل...</Text>
                </View>
              ) : (
                <View style={styles.switchContainer}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="mail-outline" size={20} color={isDark ? '#FFFFFF' : '#333'} style={styles.switchIcon} />
                      <Text style={[styles.switchLabel, { color: isDark ? '#FFFFFF' : '#333' }]}>الإشعارات عبر البريد الإلكتروني</Text>
                    </View>
                    <Switch
                      value={emailNotificationsEnabled}
                      onValueChange={handleEmailNotificationToggle}
                      disabled={savingEmailPreferences}
                      trackColor={{ false: isDark ? '#444' : '#E0E0E0', true: '#085173' }}
                      thumbColor={emailNotificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                      ios_backgroundColor={isDark ? '#444' : '#E0E0E0'}
                    />
                  </View>
                  {savingEmailPreferences && (
                    <Text style={[styles.savingText, { color: isDark ? '#AAAAAA' : '#999' }]}>جاري الحفظ...</Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notificationsContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  notificationsTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
  },
  notificationsMenuButton: {
    padding: 8,
  },
  notificationsMenuIcon: {
    width: 24,
    height: 24,
  },
  notificationsScrollView: {
    flex: 1,
  },
  notificationsScrollContent: {
    paddingBottom: 20,
  },
  notificationsListContainer: {
    paddingBottom: 20,
  },
  notificationsEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  notificationsEmptyText: {
    fontSize: 16,
    color: '#999',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationItemUnread: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 3,
    borderLeftColor: '#085173',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  switchContainer: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  switchIcon: {
    marginLeft: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  savingText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: '#999',
  },
});

