import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { getUserMessagesWithAdmin, sendMessage, Message, MessageVideo } from '@/services/messagesService';
import { uploadImage, uploadVideo } from '@/services/uploadService';
import { useTheme } from '@/contexts/ThemeContext';
import { getStoredUser } from '@/services/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_FILES = 3;

export interface UserChatScreenProps {
  adminId: number; // معرف الأدمن
  adminName?: string; // اسم الأدمن (اختياري)
  hubUrl?: string; // رابط SignalR Hub (اختياري)
  onBack: () => void;
}

interface SelectedFile {
  file: {
    uri: string;
    type?: string;
    name?: string;
  };
  kind: 'image' | 'video';
  preview: string;
}

export function UserChatScreen({ adminId, adminName = 'Admin', hubUrl = 'http://arabcodetest.runasp.net/chatHub', onBack }: UserChatScreenProps) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const currentUserIdRef = useRef<number | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Helper: الحصول على timestamp
  const getTimestamp = (m: Message): string => {
    // الـ API يستخدم sentAt
    return m?.sentAt ?? m?.createdAt ?? new Date().toISOString();
  };

  // Helper: تنسيق الوقت
  const formatTime = (iso: string): string => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  // Helper: تجميع الرسائل
  // مع inverted={true}، نحتاج أن نبقي الترتيب الطبيعي (الأقدم أولاً)
  // FlatList ستعرضها معكوسة، فتظهر الأحدث في الأسفل
  const groupMessagesByDay = (msgs: Message[]): Message[] => {
    return msgs; // الترتيب الطبيعي: الأقدم أولاً
  };

  // تنظيف الملفات المحددة
  const clearSelectedFiles = () => {
    selectedFiles.forEach((f) => {
      if (f.preview && f.preview.startsWith('blob:')) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setSelectedFiles([]);
  };

  // جلب الرسائل
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserId = currentUserIdRef.current;
      if (!currentUserId) {
        console.warn('⚠️ No current user ID, cannot fetch messages');
        setLoading(false);
        return;
      }

      // استخدام معرف المستخدم الحالي لجلب الرسائل
      const data = await getUserMessagesWithAdmin(currentUserId);
      console.log('📥 Fetched messages:', data);
      console.log('👤 Current User ID:', currentUserId);
      console.log('👨‍💼 Admin ID:', adminId);

      // تصفية الرسائل لتشمل فقط الرسائل بين المستخدم الحالي والأدمن
      const filtered = (data ?? []).filter((msg) => {
        const senderId = String(msg.senderId ?? '');
        const receiverId = String(msg.receiverId ?? '');
        const matches = (
          (senderId === String(currentUserId) && receiverId === String(adminId)) ||
          (senderId === String(adminId) && receiverId === String(currentUserId))
        );
        if (!matches) {
          console.log('🚫 Filtered out message:', { senderId, receiverId, message: msg.message });
        }
        return matches;
      });

      console.log('✅ Filtered messages count:', filtered.length, 'out of', data?.length || 0);

      // ترتيب الرسائل حسب الوقت (الأقدم أولاً)
      const sorted = filtered.slice().sort((a, b) => {
        const timeA = new Date(getTimestamp(a)).getTime();
        const timeB = new Date(getTimestamp(b)).getTime();
        return timeA - timeB;
      });

      console.log('✅ Filtered and sorted messages:', sorted.length);
      console.log('📋 Setting messages to state...');
      setMessages(sorted);
      console.log('✅ Messages set to state');

      // تحديث lastReadAt
      const now = new Date().toISOString();
      setLastReadAt(now);
      await AsyncStorage.setItem(`chat_last_read_${adminId}`, now);
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to load messages', err);
      Alert.alert('خطأ', err?.message || 'فشل تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  // إعداد SignalR
  useEffect(() => {
    let mounted = true;
    let hub: signalR.HubConnection | null = null;

    const setupSignalR = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.warn('No token found for SignalR');
          return;
        }

        hub = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token,
          })
          .withAutomaticReconnect()
          .build();

        const receiveHandler = (msg: Message) => {
          if (!mounted) return;
          console.log('📨 SignalR received message:', msg);
          const senderId = String(msg.senderId ?? '');
          const receiverId = String(msg.receiverId ?? '');
          const currentUserId = String(currentUserIdRef.current ?? '');

          // التحقق من أن الرسالة متعلقة بهذا الأدمن والمستخدم الحالي
          const isFromAdminToMe = senderId === String(adminId) && receiverId === currentUserId;
          const isFromMeToAdmin = senderId === currentUserId && receiverId === String(adminId);

          if (isFromAdminToMe || isFromMeToAdmin) {
            console.log('✅ Message is for this chat, adding to list');
            
            setMessages((prev) => {
              // التحقق من عدم التكرار
              const exists = prev.some((m) => String(m.id) === String(msg.id));
              if (exists) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }

              // إزالة الرسالة المؤقتة (optimistic) إذا كانت موجودة
              const filtered = prev.filter((m) => {
                if (m._optimistic) {
                  // إذا كانت نفس الرسالة (نفس المحتوى والمرسل والمستقبل)
                  if (m.message === msg.message &&
                      String(m.senderId) === String(msg.senderId) &&
                      String(m.receiverId) === String(msg.receiverId)) {
                    console.log('🗑️ Removing optimistic message:', m.id);
                    return false; // إزالة الرسالة المؤقتة
                  }
                }
                return true;
              });

              // إضافة الرسالة الفعلية وترتيبها (الأقدم أولاً)
              const updated = [...filtered, msg];
              const sorted = updated.sort((a, b) => {
                const timeA = new Date(getTimestamp(a)).getTime();
                const timeB = new Date(getTimestamp(b)).getTime();
                return timeA - timeB;
              });
              
              console.log('✅ Added message to list, total messages:', sorted.length);
              
              return sorted;
            });

            // تحديث lastReadAt
            const now = new Date().toISOString();
            setLastReadAt(now);
            AsyncStorage.setItem(`chat_last_read_${adminId}`, now);
            setUnreadCount(0);
          } else {
            console.log('⚠️ Message not for this chat, ignoring');
          }
        };

        hub.on('ReceiveMessage', receiveHandler);

        await hub.start();
        console.log('✅ SignalR connected');

        if (mounted) {
          setConnection(hub);
        }
      } catch (err) {
        console.error('SignalR connection error:', err);
      }
    };

    setupSignalR();

    return () => {
      mounted = false;
      if (hub) {
        try {
          hub.off('ReceiveMessage');
          hub.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, [adminId, hubUrl]);

  // جلب معرف المستخدم الحالي
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getStoredUser();
        const userId = user?.responseUserDTO?.id || user?.id || user?.userId || user?.Id;
        if (userId) {
          const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
          setCurrentUserId(numericUserId);
          currentUserIdRef.current = numericUserId;
          console.log('✅ Current user ID loaded:', numericUserId);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // جلب الرسائل بعد تحميل معرف المستخدم
  useEffect(() => {
    if (currentUserIdRef.current) {
      fetchMessages();
    }
  }, [currentUserId, fetchMessages]);

  // حساب الرسائل غير المقروءة
  useEffect(() => {
    const calculateUnread = async () => {
      try {
        const currentUserId = currentUserIdRef.current;
        if (!currentUserId) return;

        const unread = messages.filter((m) => {
          // تجاهل الرسائل المرسلة من المستخدم الحالي
          if (String(m.senderId) === String(currentUserId)) return false;

          // تجاهل الرسائل المقروءة
          if (m.isReadUser === true) return false;

          // إذا لم يكن هناك lastReadAt، كل الرسائل غير مقروءة
          if (!lastReadAt) return true;

          // مقارنة الوقت
          const sent = new Date(getTimestamp(m)).getTime();
          return sent > new Date(lastReadAt).getTime();
        }).length;

        setUnreadCount(unread);
      } catch (e) {
        setUnreadCount(0);
      }
    };

    calculateUnread();
  }, [messages, lastReadAt]);

  // التمرير التلقائي للأسفل عند تحميل الرسائل لأول مرة
  useEffect(() => {
    if (listRef.current && messages.length > 0 && !loading) {
      // التمرير فقط إذا كان هذا أول تحميل أو إذا زاد عدد الرسائل
      if (lastMessageCountRef.current === 0 || messages.length > lastMessageCountRef.current) {
        setTimeout(() => {
          if (listRef.current) {
            listRef.current.scrollToEnd({ animated: lastMessageCountRef.current > 0 });
          }
        }, 100);
      }
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length, loading]);

  // اختيار صورة
  const pickImage = async () => {
    if (selectedFiles.length >= MAX_FILES) {
      Alert.alert('تنبيه', `لا يمكنك إضافة أكثر من ${MAX_FILES} ملفات.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const allowed = MAX_FILES - selectedFiles.length;
      const newImages = result.assets.slice(0, allowed).map((asset) => ({
        file: {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image-${Date.now()}.jpg`,
        },
        kind: 'image' as const,
        preview: asset.uri,
      }));

      setSelectedFiles((prev) => [...prev, ...newImages]);
    }
  };

  // اختيار فيديو
  const pickVideo = async () => {
    if (selectedFiles.length >= MAX_FILES) {
      Alert.alert('تنبيه', `لا يمكنك إضافة أكثر من ${MAX_FILES} ملفات.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const allowed = MAX_FILES - selectedFiles.length;
      const newVideos = result.assets.slice(0, allowed).map((asset) => ({
        file: {
          uri: asset.uri,
          type: asset.type || 'video/mp4',
          name: asset.fileName || `video-${Date.now()}.mp4`,
        },
        kind: 'video' as const,
        preview: asset.uri,
      }));

      setSelectedFiles((prev) => [...prev, ...newVideos]);
    }
  };

  // إزالة ملف
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const copy = prev.slice();
      const [removed] = copy.splice(index, 1);
      if (removed && removed.preview && removed.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return copy;
    });
  };

  // إرسال رسالة
  const handleSend = async () => {
    const text = newText.trim();
    if (!text && selectedFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      const currentUserId = currentUserIdRef.current;
      if (!currentUserId) {
        Alert.alert('خطأ', 'لم يتم العثور على معرف المستخدم');
        return;
      }

      // رفع الملفات بشكل متوازي
      const uploadPromises = selectedFiles.map(async (item) => {
        if (item.kind === 'image') {
          const url = await uploadImage(item.file);
          return { kind: 'image' as const, url };
        } else if (item.kind === 'video') {
          const url = await uploadVideo(item.file);
          return { kind: 'video' as const, url };
        }
        return null;
      });

      const uploadResults = await Promise.all(uploadPromises);

      const images = uploadResults.filter((r) => r && r.kind === 'image').map((r) => r!.url);

      const videos: MessageVideo[] = uploadResults
        .filter((r) => r && r.kind === 'video')
        .map((r) => ({
          title: '',
          description: '',
          url: r!.url,
          thumbnailUrl: '',
        }));

      const payload = {
        message: text,
        receiverId: adminId,
        videos,
        images,
      };

      // إضافة رسالة مؤقتة (optimistic update)
      const nowIso = new Date().toISOString();
      const tempMessage: Message = {
        id: -Date.now(), // استخدام رقم سالب مؤقت للرسائل المؤقتة
        message: text,
        senderId: currentUserId,
        receiverId: adminId,
        createdAt: nowIso,
        sentAt: nowIso,
        _optimistic: true,
        images: images.length
          ? images
          : selectedFiles.filter((f) => f.kind === 'image').map((f) => f.preview),
        videos: videos.length
          ? videos
          : selectedFiles
              .filter((f) => f.kind === 'video')
              .map((f) => ({ url: f.preview, title: '', description: '', thumbnailUrl: '' })),
      };

      // إضافة رسالة مؤقتة فوراً (Optimistic Update)
      setMessages((prev) => {
        const updated = [...prev, tempMessage];
        // ترتيب حسب الوقت (الأقدم أولاً)
        const sorted = updated.sort((a, b) => {
          const timeA = new Date(getTimestamp(a)).getTime();
          const timeB = new Date(getTimestamp(b)).getTime();
          return timeA - timeB;
        });
        
        return sorted;
      });
      
      setNewText('');
      clearSelectedFiles();

      // إرسال الرسالة للخادم (في الخلفية)
      const sentMessage = await sendMessage(payload);
      console.log('✅ Message sent successfully:', sentMessage);

      // SignalR سيتولى استبدال الرسالة المؤقتة بالرسالة الفعلية تلقائياً
      if (sentMessage && sentMessage.id) {
        setTimeout(() => {
          setMessages((prev) => {
            // إذا كانت الرسالة المؤقتة لا تزال موجودة بعد 3 ثوانٍ، استبدلها بالرسالة الفعلية
            const hasOptimistic = prev.some(m => m._optimistic && m.message === sentMessage.message);
            if (hasOptimistic) {
              const filtered = prev.filter((m) => {
                if (m._optimistic && m.message === sentMessage.message) {
                  return false; // إزالة المؤقتة
                }
                return true;
              });
              
              const finalMessage: Message = {
                ...sentMessage,
                images: sentMessage.images || images,
                videos: sentMessage.videos || videos,
              };
              
              const updated = [...filtered, finalMessage];
              return updated.sort((a, b) => {
                const timeA = new Date(getTimestamp(a)).getTime();
                const timeB = new Date(getTimestamp(b)).getTime();
                return timeA - timeB;
              });
            }
            return prev;
          });
        }, 3000);
      }
    } catch (err: any) {
      console.error('Upload or send failed', err);
      Alert.alert('خطأ', err?.message || 'فشل رفع الملفات أو إرسال الرسالة. حاول مرة أخرى.');

      // إزالة الرسالة المؤقتة في حالة الخطأ
      setMessages((prev) => prev.filter((m) => !m._optimistic));
    } finally {
      setUploadingFiles(false);
    }
  };

  const displayedMessages = groupMessagesByDay(messages);
  const currentUserIdValue = currentUserIdRef.current;
  
  // Debug logs
  useEffect(() => {
    console.log('📊 Messages state updated:', messages.length);
    console.log('📊 Displayed messages:', displayedMessages.length);
    console.log('👤 Current user ID value:', currentUserIdValue);
    console.log('👨‍💼 Admin ID:', adminId);
  }, [messages, displayedMessages, currentUserIdValue, adminId]);

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    messageBubble: { ...styles.messageBubble, backgroundColor: isDark ? '#2E2E2E' : '#E5E5EA' },
    myMessageBubble: { ...styles.myMessageBubble, backgroundColor: isDark ? '#0C85C1' : '#007AFF' },
    messageText: { ...styles.messageText, color: isDark ? '#FFFFFF' : '#000000' },
    myMessageText: { ...styles.myMessageText, color: '#FFFFFF' },
    messageTime: { ...styles.messageTime, color: isDark ? '#AAAAAA' : '#666' },
    myMessageTime: { ...styles.myMessageTime, color: 'rgba(255,255,255,0.7)' },
    inputContainer: { ...styles.inputContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderTopColor: isDark ? '#333333' : '#E5E5EA' },
    input: { ...styles.input, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5', borderColor: isDark ? '#444' : '#E5E5EA', color: isDark ? '#FFFFFF' : '#000000' },
    selectedFilesContainer: { ...styles.selectedFilesContainer, backgroundColor: isDark ? '#1E1E1E' : '#f5f5f5', borderTopColor: isDark ? '#333333' : '#E5E5EA' },
    emptyText: { ...styles.emptyText, color: isDark ? '#999' : '#999' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerTitleContainer}>
          <Text style={dynamicStyles.headerTitle}>{adminName}</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#AAAAAA' : '#666' }]}>متصل الآن</Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Messages List - مع inverted={true} الرسائل الأحدث تظهر في الأسفل */}
        <FlatList
          ref={listRef}
          data={displayedMessages}
          inverted={true}
          contentContainerStyle={{ flexGrow: 1 }}
          keyExtractor={(item, index) => {
            return item.id?.toString() || `msg-${index}`;
          }}
          renderItem={({ item }) => {
            const msg = item as Message;
            const fromMe = String(msg.senderId) === String(currentUserIdValue);

            return (
              <View
                style={[
                  styles.messageContainer,
                  fromMe ? styles.myMessageContainer : styles.otherMessageContainer,
                ]}>
                <View
                  style={[
                    dynamicStyles.messageBubble,
                    fromMe ? dynamicStyles.myMessageBubble : {},
                    fromMe ? styles.myMessageBubbleStyle : styles.otherMessageBubbleStyle,
                  ]}>
                  {msg.message && (
                    <Text
                      style={[
                        dynamicStyles.messageText,
                        fromMe ? dynamicStyles.myMessageText : {},
                        { marginBottom: (msg.images?.length || msg.videos?.length) ? 8 : 0 },
                      ]}>
                      {msg.message}
                    </Text>
                  )}

                  {/* Images */}
                  {msg.images && msg.images.length > 0 && (
                    <View style={styles.imagesContainer}>
                      {msg.images.map((img, idx) => (
                        <ExpoImage
                          key={idx}
                          source={{ uri: img }}
                          style={styles.messageImage}
                          contentFit="cover"
                        />
                      ))}
                    </View>
                  )}

                  {/* Videos */}
                  {msg.videos && msg.videos.length > 0 && (
                    <View style={styles.videosContainer}>
                      {msg.videos.map((v, idx) => (
                        <View key={idx} style={styles.videoContainer}>
                          {v.thumbnailUrl ? (
                            <ExpoImage source={{ uri: v.thumbnailUrl }} style={styles.videoThumbnail} contentFit="cover" />
                          ) : (
                            <View style={[styles.videoPlaceholder, { backgroundColor: isDark ? '#000' : '#000' }]}>
                              <Ionicons name="play-circle" size={32} color="#FFF" />
                            </View>
                          )}
                          <Text style={[styles.videoTitle, { color: fromMe ? 'rgba(255,255,255,0.8)' : '#666' }]}>
                            {v.title || 'فيديو'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.messageTimeContainer}>
                    <Text style={[dynamicStyles.messageTime, fromMe ? dynamicStyles.myMessageTime : {}]}>
                      {formatTime(getTimestamp(msg))}
                    </Text>
                    {msg._optimistic && (
                      <Text style={[dynamicStyles.messageTime, fromMe ? dynamicStyles.myMessageTime : {}, { marginLeft: 4 }]}>
                        · إرسال...
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          refreshing={loading}
          onRefresh={fetchMessages}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>لا توجد رسائل بعد — ابدأ المحادثة الآن.</Text>
            </View>
          }
        />

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <View style={dynamicStyles.selectedFilesContainer}>
            {selectedFiles.map((file, idx) => (
              <View key={idx} style={styles.selectedFileItem}>
                {file.kind === 'image' ? (
                  <ExpoImage source={{ uri: file.preview }} style={styles.selectedFilePreview} contentFit="cover" />
                ) : (
                  <View style={[styles.selectedFilePreview, { backgroundColor: isDark ? '#000' : '#000' }]}>
                    <Ionicons name="play-circle" size={24} color="#FFF" />
                  </View>
                )}
                <TouchableOpacity onPress={() => handleRemoveFile(idx)} style={styles.removeFileButton}>
                  <Ionicons name="close-circle" size={20} color="#FF0000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Input Area */}
        <View style={dynamicStyles.inputContainer}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={selectedFiles.length >= MAX_FILES || uploadingFiles}
            style={[styles.actionButton, { opacity: selectedFiles.length >= MAX_FILES ? 0.5 : 1 }]}>
            <Ionicons name="camera-outline" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickVideo}
            disabled={selectedFiles.length >= MAX_FILES || uploadingFiles}
            style={[styles.actionButton, { opacity: selectedFiles.length >= MAX_FILES ? 0.5 : 1 }]}>
            <Ionicons name="videocam-outline" size={24} color={iconColor} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            value={newText}
            onChangeText={setNewText}
            placeholder="اكتب رسالة..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            style={dynamicStyles.input}
            multiline
            editable={!uploadingFiles}
            textAlign="right"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={uploadingFiles || (!newText.trim() && selectedFiles.length === 0)}
            style={[
              styles.sendButton,
              { opacity: uploadingFiles || (!newText.trim() && selectedFiles.length === 0) ? 0.5 : 1 },
            ]}>
            {uploadingFiles ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {selectedFiles.length > 0 && (
          <View style={styles.filesCountContainer}>
            <Text style={[styles.filesCountText, { color: isDark ? '#999' : '#999' }]}>
              {selectedFiles.length}/{MAX_FILES} ملفات
            </Text>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#085173',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 4,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
  },
  myMessageBubbleStyle: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubbleStyle: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  messageImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 4,
  },
  videosContainer: {
    marginBottom: 8,
  },
  videoContainer: {
    marginBottom: 4,
  },
  videoThumbnail: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: 150,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  selectedFilesContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  selectedFileItem: {
    marginRight: 8,
    position: 'relative',
  },
  selectedFilePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeFileButton: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    textAlign: 'right',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filesCountContainer: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  filesCountText: {
    fontSize: 11,
    color: '#999',
  },
});