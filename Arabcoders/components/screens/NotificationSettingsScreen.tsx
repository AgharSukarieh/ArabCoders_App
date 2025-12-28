import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

export interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const { isDark } = useTheme();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [loadingEmailPreferences, setLoadingEmailPreferences] = useState(true);
  const [savingEmailPreferences, setSavingEmailPreferences] = useState(false);

  useEffect(() => {
    loadEmailPreferences();
  }, []);

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
    container: { backgroundColor: isDark ? '#121212' : '#F5F5F5' },
    header: { 
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderBottomColor: isDark ? '#333333' : '#E5E5E5',
    },
    headerTitle: { color: isDark ? '#FFFFFF' : '#085173' },
    content: { backgroundColor: isDark ? '#121212' : '#F5F5F5' },
    section: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    sectionTitle: { color: isDark ? '#FFFFFF' : '#333' },
    sectionDescription: { color: isDark ? '#CCCCCC' : '#666' },
    switchLabel: { color: isDark ? '#FFFFFF' : '#333' },
    loadingText: { color: isDark ? '#CCCCCC' : '#666' },
    savingText: { color: isDark ? '#AAAAAA' : '#999' },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-forward" size={24} color={isDark ? '#FFFFFF' : '#085173'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>إعدادات الإشعارات</Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, dynamicStyles.content]}>
        {loadingEmailPreferences ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
            <Text style={[styles.loadingText, dynamicStyles.loadingText]}>جاري التحميل...</Text>
          </View>
        ) : (
          <View style={styles.settingsContainer}>
            {/* Email Notifications Section */}
            <View style={[styles.section, dynamicStyles.section]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={[styles.sectionIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                    <Ionicons name="mail-outline" size={24} color={isDark ? '#0C85C1' : '#085173'} />
                  </View>
                  <View style={styles.sectionTextContainer}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
                      الإشعارات عبر البريد الإلكتروني
                    </Text>
                    <Text style={[styles.sectionDescription, dynamicStyles.sectionDescription]}>
                      احصل على إشعارات عبر البريد الإلكتروني عند حدوث أنشطة مهمة
                    </Text>
                  </View>
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
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color={isDark ? '#0C85C1' : '#085173'} />
                  <Text style={[styles.savingText, dynamicStyles.savingText]}>جاري الحفظ...</Text>
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={[styles.infoSection, dynamicStyles.section]}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle-outline" size={20} color={isDark ? '#0C85C1' : '#085173'} />
                <Text style={[styles.infoTitle, { color: isDark ? '#FFFFFF' : '#333' }]}>معلومات</Text>
              </View>
              <Text style={[styles.infoText, { color: isDark ? '#CCCCCC' : '#666' }]}>
                يمكنك التحكم في الإشعارات التي تتلقاها عبر البريد الإلكتروني. عند تفعيل هذا الخيار، ستتلقى إشعارات حول الأنشطة المهمة في حسابك.
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  settingsContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  savingContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  savingText: {
    fontSize: 14,
    marginRight: 8,
    textAlign: 'right',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
});

