import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser } from '@/services/storage';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { UserChatScreen } from './UserChatScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface ContactUsScreenProps {
  onBack: () => void;
}

type TabType = 'contact' | 'live';

const CONTACT_REASONS = [
  { id: 'inquiry', label: 'استفسار' },
  { id: 'suggestion', label: 'اقتراحات وتحسينات' },
  { id: 'problem', label: 'ابلاغ عن مشكلة' },
];

// معرف الأدمن الافتراضي - يمكن تغييره حسب الحاجة
const DEFAULT_ADMIN_ID = 2; // معرف الأدمن الفعلي

export function ContactUsScreen({ onBack }: ContactUsScreenProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('contact');
  const [adminId, setAdminId] = useState<number>(DEFAULT_ADMIN_ID);
  
  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('inquiry');
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Animations
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await getStoredUser();
      const userId = user?.responseUserDTO?.id || user?.id || user?.userId || user?.Id;
      if (userId) {
        setCurrentUserId(userId);
        setName(user?.responseUserDTO?.userName || user?.userName || '');
        setEmail(user?.responseUserDTO?.email || user?.email || '');
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };


  const handleSendContactForm = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }

    // فتح تطبيق الإيميل
    const subject = encodeURIComponent(`تواصل معنا - ${CONTACT_REASONS.find(r => r.id === selectedReason)?.label}`);
    const body = encodeURIComponent(
      `الاسم: ${name}\n` +
      `البريد الإلكتروني: ${email}\n` +
      `سبب التواصل: ${CONTACT_REASONS.find(r => r.id === selectedReason)?.label}\n\n` +
      `الرسالة:\n${message}`
    );
    const mailtoUrl = `mailto:support@arabcoders.com?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert('نجح', 'تم فتح تطبيق البريد الإلكتروني');
        // Reset form
        setMessage('');
      } else {
        Alert.alert('خطأ', 'لا يمكن فتح تطبيق البريد الإلكتروني');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('خطأ', 'فشل فتح تطبيق البريد الإلكتروني');
    }
  };


  useEffect(() => {
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'contact' ? 0 : 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const tabIndicatorTranslateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 2],
  });

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    tabText: { ...styles.tabText, color: isDark ? '#CCCCCC' : '#666' },
    tabTextActive: { ...styles.tabTextActive, color: isDark ? '#FFFFFF' : '#085173' },
    inputLabel: { ...styles.inputLabel, color: isDark ? '#CCCCCC' : '#333' },
    input: { ...styles.input, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5', borderColor: isDark ? '#444' : '#E0E0E0', color: isDark ? '#FFFFFF' : '#333' },
    reasonButton: { ...styles.reasonButton, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5', borderColor: isDark ? '#444' : '#E0E0E0' },
    reasonButtonText: { ...styles.reasonButtonText, color: isDark ? '#CCCCCC' : '#666' },
    reasonButtonTextActive: { ...styles.reasonButtonTextActive, color: isDark ? '#FFFFFF' : '#FFFFFF' },
    submitButtonText: { color: isDark ? '#FFFFFF' : '#FFFFFF' },
    userListItemText: { color: isDark ? '#FFFFFF' : '#333' },
    messageText: { color: isDark ? '#FFFFFF' : '#333' },
    messageTime: { color: isDark ? '#AAAAAA' : '#666' },
    chatInput: { ...styles.chatInput, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5', borderColor: isDark ? '#444' : '#E0E0E0', color: isDark ? '#FFFFFF' : '#333' },
    tabsContainer: { ...styles.tabsContainer, backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' },
    tabIndicator: { ...styles.tabIndicator, backgroundColor: isDark ? '#0C85C1' : '#085173' },
    tabActive: { ...styles.tabActive, backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <Text style={dynamicStyles.headerTitle}>تواصل مع فريقنا</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabsContainer}>
        <Animated.View
          style={[
            dynamicStyles.tabIndicator,
            {
              transform: [{ translateX: tabIndicatorTranslateX }],
            },
          ]}
        />
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && dynamicStyles.tabActive]}
          onPress={() => setActiveTab('contact')}
          activeOpacity={0.7}>
          <Text style={[dynamicStyles.tabText, activeTab === 'contact' && dynamicStyles.tabTextActive]}>
            التواصل
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'live' && dynamicStyles.tabActive]}
          onPress={() => setActiveTab('live')}
          activeOpacity={0.7}>
          <Text style={[dynamicStyles.tabText, activeTab === 'live' && dynamicStyles.tabTextActive]}>
            المباشر
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        
        {/* Contact Form */}
        {activeTab === 'contact' && (
          <View style={styles.formContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            
            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>الاسم</Text>
              <TextInput
                style={dynamicStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="أدخل اسمك"
                placeholderTextColor={isDark ? '#666' : '#999'}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>الايميل</Text>
              <TextInput
                style={dynamicStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="أدخل بريدك الإلكتروني"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>سبب التواصل</Text>
              <View style={styles.reasonsContainer}>
                {CONTACT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      dynamicStyles.reasonButton,
                      selectedReason === reason.id && styles.reasonButtonActive,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        dynamicStyles.reasonButtonText,
                        selectedReason === reason.id && dynamicStyles.reasonButtonTextActive,
                      ]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>الرسالة</Text>
              <TextInput
                style={[dynamicStyles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                multiline
                numberOfLines={6}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendContactForm}
              activeOpacity={0.8}>
              <Text style={dynamicStyles.submitButtonText}>ارسال</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        )}

        {/* Live Chat */}
        {activeTab === 'live' && (
          <View style={styles.chatContainer}>
            <UserChatScreen
              adminId={adminId}
              adminName="فريق الدعم"
              onBack={onBack}
            />
          </View>
        )}
      </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
  },
  backButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH / 2,
    height: 3,
    backgroundColor: '#085173',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#085173',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#085173',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#E3F2FD',
    textAlign: 'right',
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  reasonsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  reasonButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#085173',
    backgroundColor: '#FFFFFF',
  },
  reasonButtonActive: {
    backgroundColor: '#085173',
  },
  reasonButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#085173',
  },
  reasonButtonTextActive: {
    color: '#FFFFFF',
  },
  sendButton: {
    backgroundColor: '#085173',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  chatScrollView: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: '#085173',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#E0E0E0',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
    textAlign: 'left',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    padding: 4,
  },
  chatInputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  sendChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#085173',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendChatButtonDisabled: {
    opacity: 0.5,
  },
  userListContainer: {
    flex: 1,
  },
  userListScrollView: {
    flex: 1,
  },
  userListContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  userItemImageContainer: {
    position: 'relative',
    marginLeft: 12,
  },
  userItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#085173',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#085173',
    marginBottom: 4,
  },
  userItemEmail: {
    fontSize: 14,
    color: '#666',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#085173',
    marginLeft: 8,
  },
  chatHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  chatHeaderBackButton: {
    marginLeft: 12,
    padding: 4,
  },
  chatHeaderUserImageContainer: {
    position: 'relative',
    marginLeft: 12,
  },
  chatHeaderUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#085173',
  },
  chatHeaderOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatHeaderUserInfo: {
    flex: 1,
  },
  chatHeaderUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#085173',
    marginBottom: 2,
  },
  chatHeaderUserStatus: {
    fontSize: 12,
    color: '#666',
  },
});

