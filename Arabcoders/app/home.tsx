import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { CreatePost } from '@/components/posts/CreatePost';
import { PostCard } from '@/components/posts/PostCard';
import { getPosts, toggleLike, Post } from '@/services/postsService';
import { getStoredUser } from '@/services/storage';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'competitions' | 'notifications' | 'more'>('home');
  const [userProfileImage, setUserProfileImage] = useState<string>('');
  const [userImageUrl, setUserImageUrl] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompetitions, setShowCompetitions] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadPosts();
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const user = await getStoredUser();
      const userIdValue = user?.id || user?.userId || user?.Id;
      if (userIdValue) {
        const numericUserId = parseInt(String(userIdValue), 10);
        if (!isNaN(numericUserId) && numericUserId > 0) {
          const response = await api.get(`/api/notifications/users/${numericUserId}/unread-count`);
          setUnreadCount(response.data || 0);
        }
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const user = await getStoredUser();
      if (user?.imageURL) {
        setUserProfileImage(user.imageURL);
      }
      if (user?.imageUrl) {
        setUserImageUrl(user.imageUrl);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getPosts();
      setPosts(data);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ في جلب المنشورات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleLike = async (postId: number) => {
    try {
      console.log('🔵 handleLike called with postId:', postId, 'Type:', typeof postId);
      console.log('🔵 Available posts IDs:', posts.map(p => ({ id: p.id, type: typeof p.id })));
      
      // Ensure postId is an integer
      const numericPostId = parseInt(String(postId), 10);
      if (!numericPostId || isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
        console.error('❌ Invalid postId:', postId, 'Converted to:', numericPostId);
        Alert.alert('خطأ', 'معرف المنشور غير صحيح');
        return;
      }

      // Find the post to get current like status
      const post = posts.find((p) => p.id === numericPostId || p.id === postId);
      if (!post) {
        console.error('❌ Post not found with id:', numericPostId);
        console.log('❌ Available post IDs:', posts.map(p => p.id));
        Alert.alert('خطأ', 'المنشور غير موجود');
        return;
      }

      console.log('✅ Post found:', { id: post.id, isLikedIt: post.isLikedIt });
      const currentLikeStatus = post.isLikedIt === true;
      
      // Use the numeric postId for API call
      const finalPostId = numericPostId;
      
      // Optimistically update UI
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === finalPostId || p.id === postId) {
            return {
              ...p,
              isLikedIt: !currentLikeStatus,
              numberLike: currentLikeStatus ? p.numberLike - 1 : p.numberLike + 1,
            };
          }
          return p;
        })
      );

      // Call API with the numeric postId
      await toggleLike(finalPostId, currentLikeStatus);
    } catch (error: any) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      const numericPostId = parseInt(String(postId), 10);
      const post = posts.find((p) => p.id === numericPostId || p.id === postId);
      if (post) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === numericPostId || p.id === postId) {
              return {
                ...p,
                isLikedIt: post.isLikedIt,
                numberLike: post.numberLike,
              };
            }
            return p;
          })
        );
      }
      
      // Don't show alert for 401 - it will be handled by interceptor
      if (!error.message?.includes('غير مصرح')) {
        Alert.alert('خطأ', error.message || 'حدث خطأ في الإعجاب بالمنشور');
      }
    }
  };

  const handleComment = async (postId: number) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      setSelectedPostForComments(post);
      setShowCommentsModal(true);
      await loadComments(postId);
    } catch (error) {
      console.error('Error opening comments:', error);
    }
  };

  const loadComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      const numericPostId = parseInt(String(postId), 10);
      const response = await api.get(`/api/comments?postId=${numericPostId}`);
      setComments(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في جلب التعليقات');
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const sendComment = async () => {
    if (!newCommentText.trim() || !selectedPostForComments) return;

    try {
      setSendingComment(true);
      const response = await api.post('/api/comments', {
        text: newCommentText.trim(),
        postId: selectedPostForComments.id,
        userId: 0, // Will be set by backend from token
        parentCommentId: 0,
      });

      // Add new comment to list
      setComments((prev) => [response.data, ...prev]);
      setNewCommentText('');
    } catch (error: any) {
      console.error('Error sending comment:', error);
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في إرسال التعليق');
    } finally {
      setSendingComment(false);
    }
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedPostForComments(null);
    setComments([]);
    setNewCommentText('');
  };

  const handleShare = (postId: number) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  };

  const handleSearch = () => {
    // TODO: Navigate to search screen
    console.log('Search pressed');
  };

  const handleTabPress = (tab: 'home' | 'competitions' | 'notifications' | 'more') => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      setShowNotifications(true);
      setShowCompetitions(false);
      // Reload unread count when opening notifications
      loadUnreadCount();
    } else if (tab === 'competitions') {
      setShowCompetitions(true);
      setShowNotifications(false);
      setShowMore(false);
    } else if (tab === 'more') {
      setShowMore(true);
      setShowNotifications(false);
      setShowCompetitions(false);
    } else {
      setShowNotifications(false);
      setShowCompetitions(false);
      setShowMore(false);
    }
  };

  const handleCreatePost = () => {
    // TODO: Navigate to create post screen
    console.log('Create post pressed');
  };

  const handlePostPress = (post: Post) => {
    setSelectedPost(post);
  };

  const closePostModal = () => {
    setSelectedPost(null);
  };

  if (showNotifications) {
    return (
      <NotificationsScreen 
        onBack={() => {
          setShowNotifications(false);
          setActiveTab('home');
        }}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onUnreadCountChange={setUnreadCount}
        unreadCount={unreadCount}
      />
    );
  }

  if (showCompetitions) {
    return (
      <CompetitionsScreen 
        onBack={() => {
          setShowCompetitions(false);
          setActiveTab('home');
        }}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    );
  }

  if (showMore) {
    return (
      <MoreScreen 
        onBack={() => {
          setShowMore(false);
          setActiveTab('home');
        }}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Header onSearchPress={handleSearch} />
        <CreatePost profileImage={userProfileImage} imageUrl={userImageUrl} onCreatePost={handleCreatePost} />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#085173" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد منشورات</Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onPostPress={handlePostPress}
            />
          ))
        )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} unreadCount={unreadCount} />

      {/* Post Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePostModal}>
        {selectedPost && (
          <PostDetailView 
            post={posts.find(p => p.id === selectedPost.id) || selectedPost} 
            onClose={closePostModal} 
            onLike={handleLike} 
            onComment={handleComment}
            onShare={handleShare}
          />
        )}
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCommentsModal}>
        <KeyboardAvoidingView 
          style={styles.commentsModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity 
            style={styles.commentsModalBackdrop}
            activeOpacity={1}
            onPress={closeCommentsModal}
          />
          <View style={styles.commentsModalContent}>
            {/* Header */}
            <View style={styles.commentsModalHeader}>
              <Text style={styles.commentsModalTitle}>التعليقات</Text>
              <TouchableOpacity 
                onPress={closeCommentsModal}
                style={styles.closeCommentsButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.commentsSeparator} />

            {/* Comments List */}
            <ScrollView 
              style={styles.commentsList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              {loadingComments ? (
                <View style={styles.commentsLoadingContainer}>
                  <ActivityIndicator size="large" color="#085173" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.commentsEmptyContainer}>
                  <Text style={styles.commentsEmptyText}>لا توجد تعليقات</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <CommentItem key={comment.id || Math.random()} comment={comment} />
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputWrapper}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="اكتب أفكارك هنا..."
                  placeholderTextColor="#999"
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  multiline
                  maxLength={500}
                />
                {userProfileImage && (
                  <Image
                    source={{ uri: userProfileImage }}
                    style={styles.commentUserImage}
                    contentFit="cover"
                  />
                )}
              </View>
              <View style={styles.commentInputActions}>
                <TouchableOpacity style={styles.commentActionButton}>
                  <Ionicons name="at" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentActionButton}>
                  <Ionicons name="image-outline" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.commentSendButton, (!newCommentText.trim() || sendingComment) && styles.commentSendButtonDisabled]}
                  onPress={sendComment}
                  disabled={!newCommentText.trim() || sendingComment}>
                  {sendingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.commentSendButtonText}>تعليق</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Post Detail Full Screen Component
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostDetailViewProps {
  post: Post;
  onClose: () => void;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onShare: (postId: number) => void;
}

// Notifications Screen Component
interface NotificationsScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
  onUnreadCountChange?: (count: number) => void;
  unreadCount?: number;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, activeTab, onTabPress, onUnreadCountChange, unreadCount = 0 }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

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

  const loadNotifications = async (userId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications/users/${userId}`);
      const notificationsData = Array.isArray(response.data) ? response.data : [];
      setNotifications(notificationsData);
      
      // Update unread count
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
      case 1: // ForRegister - تسجيل جديد
        return 'person-add';
      case 2: // ProblemRequest - طلب مشكلة
        return 'help-circle';
      case 3: // SolveProblem - حل مشكلة
        return 'checkmark-circle';
      case 4: // Follow - متابعة
        return 'people';
      case 5: // StreakDays - أيام متتالية
        return 'flame';
      case 6: // System - نظام
        return 'settings';
      case 7: // AddPost - إضافة منشور
        return 'document-text';
      default:
        return 'notifications';
    }
  };

  const getNotificationIconColor = (notificationType: number | null | undefined) => {
    if (notificationType === null || notificationType === undefined) return '#666';
    switch (notificationType) {
      case 1: // ForRegister - تسجيل جديد
        return '#4CAF50';
      case 2: // ProblemRequest - طلب مشكلة
        return '#FF9800';
      case 3: // SolveProblem - حل مشكلة
        return '#4CAF50';
      case 4: // Follow - متابعة
        return '#2196F3';
      case 5: // StreakDays - أيام متتالية
        return '#FF5722';
      case 6: // System - نظام
        return '#9E9E9E';
      case 7: // AddPost - إضافة منشور
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.notificationsContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.notificationsHeader}>
        <TouchableOpacity style={styles.notificationsMenuButton}>
          <Image
            source={require('@/assets/icons/menu_settings.png')}
            style={styles.notificationsMenuIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <View style={styles.notificationsTitleContainer}>
          <Text style={styles.notificationsTitle}>الاشعارات</Text>
        </View>
      </View>

      <ScrollView
        style={styles.notificationsScrollView}
        contentContainerStyle={styles.notificationsScrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {loading ? (
          <View style={styles.notificationsLoadingContainer}>
            <ActivityIndicator size="large" color="#085173" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.notificationsEmptyContainer}>
            <Text style={styles.notificationsEmptyText}>لا توجد إشعارات</Text>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const notificationType = notification.type || 0;
            const isUnread = notification.isRead === false;
            
            return (
              <View 
                key={notification.id || index} 
                style={[
                  styles.notificationItem,
                  isUnread && styles.notificationItemUnread
                ]}>
                <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationIconColor(notificationType) + '20' }]}>
                  <Ionicons
                    name={getNotificationIcon(notificationType)}
                    size={24}
                    color={getNotificationIconColor(notificationType)}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {stripHtml(notification.startMessage || notification.title || notification.message || 'إشعار')}
                  </Text>
                  {notification.endMessage && (
                    <Text style={styles.notificationDescription} numberOfLines={2}>
                      {stripHtml(notification.endMessage)}
                    </Text>
                  )}
                  {notification.createdAt && (
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} unreadCount={unreadCount} />
    </View>
  );
};

// Competitions Screen Component
interface Contest {
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
}

interface CompetitionsScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
}

const CompetitionsScreen: React.FC<CompetitionsScreenProps> = ({ onBack, activeTab, onTabPress }) => {
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
      console.log('👤 User data:', user);
      const userIdValue = user?.id || user?.userId || user?.Id || user?.uid;
      console.log('🆔 User ID value:', userIdValue);
      
      if (userIdValue) {
        const numericUserId = parseInt(String(userIdValue), 10);
        console.log('🔢 Numeric User ID:', numericUserId);
        
        if (!isNaN(numericUserId) && numericUserId > 0) {
          console.log('📤 Fetching my contests from:', `/api/contests/by-user/${numericUserId}`);
          const response = await api.get(`/api/contests/by-user/${numericUserId}`);
          console.log('✅ My contests response:', response.data);
          setMyContests(Array.isArray(response.data) ? response.data : []);
        } else {
          console.warn('⚠️ Invalid user ID:', numericUserId);
          setMyContests([]);
        }
      } else {
        console.warn('⚠️ No user ID found');
        setMyContests([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading my contests:', error);
      console.error('❌ Error response:', error?.response?.data);
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

  // Get upcoming/close contests for carousel
  const getUpcomingContests = () => {
    const now = new Date();
    return contests
      .filter(contest => {
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

  // Auto-scroll carousel
  useEffect(() => {
    if (upcomingContests.length > 1) {
      carouselTimerRef.current = setInterval(() => {
        setCurrentCarouselIndex((prevIndex: number) => {
          const nextIndex = (prevIndex + 1) % upcomingContests.length;
          carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          return nextIndex;
        });
      }, 3000); // Change slide every 3 seconds

      return () => {
        if (carouselTimerRef.current) {
          clearInterval(carouselTimerRef.current);
        }
      };
    }
  }, [upcomingContests.length]);

  const displayedContests = activeCompetitionTab === 'all' ? contests : myContests;

  return (
    <View style={styles.competitionsContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.competitionsHeader}>
        <View style={styles.competitionsTitleContainer}>
          <Text style={styles.competitionsTitle}>المسابقات</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.competitionsLoadingContainer}>
          <ActivityIndicator size="large" color="#085173" />
        </View>
      ) : (
        <ScrollView
          style={styles.competitionsScrollView}
          contentContainerStyle={styles.competitionsScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          
          {/* Upcoming Competitions Carousel */}
          {upcomingContests.length > 0 && (
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
                  <View style={[styles.carouselCard, { width: SCREEN_WIDTH - 15 }]}>
                    <Image
                      source={{ uri: item.imageURL }}
                      style={styles.carouselImage}
                      contentFit="cover"
                    />
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
                          <Text style={styles.carouselLevelText}>مستوى الفا</Text>
                          <View style={styles.redDot} />
                        </View>
                        <Text style={styles.carouselTime}>
                          الوقت المتبقي: {getTimeRemaining(item.startTime, item.endTime)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          {/* Tab View */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeCompetitionTab === 'all' && styles.tabActive]}
              onPress={() => setActiveCompetitionTab('all')}>
              <Text style={[styles.tabText, activeCompetitionTab === 'all' && styles.tabTextActive]}>
                المسابقات
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeCompetitionTab === 'my' && styles.tabActive]}
              onPress={() => {
                setActiveCompetitionTab('my');
                loadMyContests();
              }}>
              <Text style={[styles.tabText, activeCompetitionTab === 'my' && styles.tabTextActive]}>
                مسابقاتي
              </Text>
            </TouchableOpacity>
          </View>

          {/* Competitions List */}
          {activeCompetitionTab === 'my' && loadingMyContests ? (
            <View style={styles.competitionsLoadingContainer}>
              <ActivityIndicator size="large" color="#085173" />
            </View>
          ) : displayedContests.length === 0 ? (
            <View style={styles.competitionsEmptyContainer}>
              <Text style={styles.competitionsEmptyText}>
                {activeCompetitionTab === 'my' ? 'لا توجد مسابقات خاصة بك' : 'لا توجد مسابقات'}
              </Text>
            </View>
          ) : (
            displayedContests.map((contest, index) => (
              <View key={contest.id || index} style={styles.competitionCard}>
                <View style={styles.competitionCardContentWrapper}>
                  <View style={styles.competitionCardTop}>
                    <View style={styles.competitionCardLeft}>
                      <Ionicons name="chevron-back" size={32} color="#CCCCCC" style={styles.competitionArrow} />
                    </View>
                    <View style={styles.competitionCardRight}>
                      <View style={styles.competitionCardContent}>
                        <Text style={styles.competitionCardTitle}>{contest.name}</Text>
                        {isOnline(contest.startTime, contest.endTime) && (
                          <View style={styles.competitionOnlineBadge}>
                            <Text style={styles.competitionOnlineBadgeText}>أونلاين</Text>
                          </View>
                        )}
                        <View style={styles.competitionCardLevel}>
                          <Text style={styles.competitionCardLevelText}>مستوى الفا</Text>
                          <View style={styles.competitionRedDot} />
                        </View>
                        {contest.universityName && (
                          <Text style={styles.competitionSponsor}>برعاية {contest.universityName}</Text>
                        )}
                      </View>
                      <Image
                        source={{ uri: contest.imageURL }}
                        style={styles.competitionThumbnail}
                        contentFit="cover"
                      />
                    </View>
                  </View>
                  <View style={styles.competitionCardBottom}>
                    <Text style={styles.competitionDate}>{formatDateRange(contest.startTime, contest.endTime)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

// More Screen Component
interface MoreScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
}

// Stars Animation Component
const Star: React.FC<{ size: number; position: { x: string; y: string }; duration: number }> = ({ size, position, duration }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [duration, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          width: size,
          height: size,
          left: position.x as any,
          top: position.y as any,
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

const Stars: React.FC = () => {
  const starData = [
    { size: 2, position: { x: '15%', y: '20%' }, duration: 2000 },
    { size: 1, position: { x: '25%', y: '60%' }, duration: 3000 },
    { size: 2, position: { x: '80%', y: '30%' }, duration: 2500 },
    { size: 1.5, position: { x: '90%', y: '75%' }, duration: 1800 },
    { size: 1, position: { x: '5%', y: '85%' }, duration: 3200 },
    { size: 2, position: { x: '50%', y: '10%' }, duration: 2200 },
    { size: 1.5, position: { x: '65%', y: '90%' }, duration: 2800 },
    { size: 2, position: { x: '15%', y: '20%' }, duration: 2000 },
    { size: 1, position: { x: '25%', y: '60%' }, duration: 3000 },
    { size: 2, position: { x: '80%', y: '30%' }, duration: 2500 },
    { size: 1.5, position: { x: '90%', y: '75%' }, duration: 1800 },
    { size: 1, position: { x: '5%', y: '85%' }, duration: 3200 },
    { size: 2, position: { x: '50%', y: '10%' }, duration: 2200 },
    { size: 1.5, position: { x: '35%', y: '90%' }, duration: 2800 },
    { size: 2, position: { x: '55%', y: '20%' }, duration: 2000 },
    { size: 1, position: { x: '25%', y: '60%' }, duration: 3000 },
    { size: 2, position: { x: '0%', y: '30%' }, duration: 2500 },
    { size: 1.5, position: { x: '90%', y: '75%' }, duration: 1800 },
    { size: 1, position: { x: '66%', y: '85%' }, duration: 3200 },
    { size: 2, position: { x: '70%', y: '10%' }, duration: 2200 },
    { size: 1.5, position: { x: '65%', y: '90%' }, duration: 2800 },
  ];

  return (
    <View style={StyleSheet.absoluteFill}>
      {starData.map((star, index) => (
        <Star key={index} {...star} />
      ))}
    </View>
  );
};

// Ripple Effect Component
interface RippleEffectCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  rippleColor?: string;
}

const RippleEffectCard: React.FC<RippleEffectCardProps> = ({
  children,
  style,
  onPress,
  rippleColor = '#183E9F',
}) => {
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });
  const [ripples, setRipples] = useState<Array<{
    key: number;
    style: { left: number; top: number };
    anim: Animated.Value;
    maxDiameter: number;
  }>>([]);

  const handlePressIn = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = cardDimensions;
    const maxDiameter = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) * 2;

    const newRipple = {
      key: Date.now(),
      style: { left: locationX, top: locationY },
      anim: new Animated.Value(0),
      maxDiameter,
    };

    setRipples((prev) => [...prev, newRipple]);

    Animated.timing(newRipple.anim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setRipples((prev) => prev.filter((r) => r.key !== newRipple.key));
    });
  };

  return (
    <Pressable
      style={style}
      onPressIn={handlePressIn}
      onPress={onPress}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setCardDimensions({ width, height });
      }}>
      {children}
      <View style={styles.rippleContainer}>
        {ripples.map((ripple) => (
          <Animated.View
            key={ripple.key}
            style={[
              styles.ripple,
              { backgroundColor: rippleColor },
              ripple.style,
              {
                width: ripple.maxDiameter,
                height: ripple.maxDiameter,
                borderRadius: ripple.maxDiameter / 2,
                transform: [
                  { translateX: -ripple.maxDiameter / 2 },
                  { translateY: -ripple.maxDiameter / 2 },
                  { scale: ripple.anim },
                ],
                opacity: ripple.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
};

const MoreScreen: React.FC<MoreScreenProps> = ({ onBack, activeTab, onTabPress }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nightMode, setNightMode] = useState(false);

  const chevronAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

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
          ])
        )
      )
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
    // Handle card press
    console.log('Card pressed');
  };

  return (
    <View style={styles.moreContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.moreHeader}>
        <View style={styles.moreTitleContainer}>
          <Text style={styles.moreTitle}>المزيد</Text>
        </View>
      </View>

      <ScrollView style={styles.moreScrollView} contentContainerStyle={styles.moreScrollContent}>
        <RippleEffectCard
          style={styles.userCard}
          onPress={handleCardPress}
          rippleColor="#183E9F">
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

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>الاقسام</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>الاحداث</Text>
            <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>التصنيفات</Text>
            <Ionicons name="grid-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>الاداء</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>الاشعارات</Text>
            <Ionicons name="notifications-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, nightMode && styles.toggleActive]}
                onPress={() => setNightMode(!nightMode)}>
                <View style={[styles.toggleThumb, nightMode && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.menuItemText}>الوضع الليلي</Text>
            <Ionicons name="moon-outline" size={20} color="#4A90E2" />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>المساعدة والدعم</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>الاسئلة المتكررة</Text>
            <Ionicons name="help-circle-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>تواصل معنا</Text>
            <Ionicons name="mail-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>حول</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>من نحن</Text>
            <Ionicons name="information-circle-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="chevron-back" size={16} color="#CCCCCC" />
            <Text style={styles.menuItemText}>الشروط والاحكام</Text>
            <Ionicons name="document-text-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

// Comment Item Component
interface CommentItemProps {
  comment: any;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return 'منذ وقت';
    }
  };

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentItemContent}>
        <View style={styles.commentItemHeader}>
          <View style={styles.commentItemUserInfo}>
            <Text style={styles.commentItemUserName}>
              {comment.userName || comment.user?.userName || 'مستخدم'}
            </Text>
            {comment.createdAt && (
              <Text style={styles.commentItemTime}>
                {formatDate(comment.createdAt)}
              </Text>
            )}
          </View>
        </View>
        {comment.text && (
          <Text style={styles.commentItemText}>{comment.text}</Text>
        )}
        <View style={styles.commentItemActions}>
          <TouchableOpacity style={styles.commentItemActionButton}>
            <Text style={styles.commentItemActionText}>إعجاب</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentItemActionButton}>
            <Text style={styles.commentItemActionText}>رد</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const PostDetailView: React.FC<PostDetailViewProps> = ({ post, onClose, onLike, onComment, onShare }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [textTruncated, setTextTruncated] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return 'منذ وقت';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const hasContent = post.content && stripHtml(post.content).length > 0;
  const hasImages = post.images && post.images.length > 0;
  const contentText = hasContent ? stripHtml(post.content) : '';

  // Check if text is long enough to be truncated
  React.useEffect(() => {
    if (contentText.length > 150) { // Approximate: 3 lines * ~50 chars per line
      setTextTruncated(true);
    } else {
      setTextTruncated(false);
    }
    setShowFullText(false);
  }, [post.id, contentText]);

  const handleTextLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    const lineHeight = 22; // lineHeight من الـ style
    const maxHeight = lineHeight * 3.5; // 3 أسطر مع هامش صغير
    
    // Check if text is truncated based on height
    if (height > maxHeight && !showFullText) {
      setTextTruncated(true);
    }
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <StatusBar style="light" />
      
      {/* Header with back button */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.modalContentWrapper}>
        {/* Main Image - Centered */}
        {hasImages && (
          <View style={styles.modalImageContainer}>
            <Image
              source={{ uri: post.images[0] }}
              style={styles.modalMainImage}
              contentFit="contain"
            />
          </View>
        )}

        {/* Bottom Section */}
        <View style={styles.modalBottomSection}>
          {/* Left Side - Actions (Vertical) */}
          <View style={styles.modalActionsLeft}>
            <TouchableOpacity 
              style={styles.modalActionItem}
              onPress={() => onLike(post.id)}>
              <Ionicons 
                name={post.isLikedIt ? "heart" : "heart-outline"} 
                size={24} 
                color={post.isLikedIt ? "#FF3B30" : "#FFFFFF"} 
              />
              <Text style={styles.modalActionNumber}>{post.numberLike}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalActionItem}
              onPress={() => onComment(post.id)}>
              <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
              <Text style={styles.modalActionNumber}>5</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalActionItem}
              onPress={() => onShare(post.id)}>
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Right Side - User Info and Content */}
          <ScrollView 
            style={styles.modalRightSection} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.modalRightContent}>
            {/* User Info */}
            <View style={styles.modalUserInfoBottom}>
              <View style={styles.modalUserDetailsBottom}>
                <Text style={styles.modalUserNameBottom}>{post.userName}</Text>
                <Text style={styles.modalUserTitle}>{formatDate(post.createdAt)}</Text>
              </View>
              <Image
                source={post.imageURL ? { uri: post.imageURL } : require('@/assets/images/icon.png')}
                style={styles.modalProfileImageBottom}
                contentFit="cover"
              />
            </View>

            {/* Title */}
            {post.title && (
              <View style={styles.modalContentBottom}>
                <Text style={styles.modalTitleTextBottom}>{post.title}</Text>
              </View>
            )}

            {/* Content */}
            {hasContent && (
              <View style={styles.modalContentBottom}>
                <View onLayout={handleTextLayout}>
                  <Text 
                    style={styles.modalContentTextBottom}
                    numberOfLines={!showFullText ? 3 : undefined}>
                    {contentText}
                  </Text>
                </View>
                {textTruncated && !showFullText && (
                  <TouchableOpacity 
                    onPress={() => setShowFullText(true)}
                    style={styles.moreButton}>
                    <Text style={styles.moreButtonText}>...المزيد</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Full Text Modal */}
      <Modal
        visible={showFullText}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFullText(false)}>
        <View style={styles.fullTextModalOverlay}>
          <TouchableOpacity 
            style={styles.fullTextModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFullText(false)}
          />
          <View style={styles.fullTextModalContent}>
            <View style={styles.fullTextModalHeader}>
              <Text style={styles.fullTextModalTitle}>النص الكامل</Text>
              <TouchableOpacity 
                onPress={() => setShowFullText(false)}
                style={styles.closeFullTextButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.fullTextSeparator} />
            <ScrollView 
              style={styles.fullTextScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              <Text style={styles.fullTextContent}>{contentText}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginTop: 30,
  },
  modalContentWrapper: {
    flex: 1,
  },
  modalImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  modalMainImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  modalBottomSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#000000',
    minHeight: 150,
  },
  modalActionsLeft: {
    alignItems: 'center',
    marginRight: 20,
    gap: 20,
  },
  modalActionItem: {
    alignItems: 'center',
    gap: 4,
  },
  modalActionNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalRightSection: {
    flex: 1,
    maxHeight: 200,
  },
  modalRightContent: {
    alignItems: 'flex-end',
  },
  modalUserInfoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalProfileImageBottom: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
  },
  modalUserDetailsBottom: {
    alignItems: 'flex-end',
  },
  modalUserNameBottom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'right',
  },
  modalUserTitle: {
    fontSize: 13,
    color: '#CCCCCC',
    textAlign: 'right',
  },
  modalContentBottom: {
    marginBottom: 8,
    alignItems: 'flex-end',
    width: '100%',
  },
  modalTitleTextBottom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  modalContentTextBottom: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'right',
  },
  moreButton: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  moreButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  fullTextModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  fullTextModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullTextModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  fullTextModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  fullTextModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeFullTextButton: {
    padding: 4,
  },
  fullTextSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  fullTextScrollView: {
    maxHeight: 400,
  },
  fullTextContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    padding: 20,
    textAlign: 'right',
  },
  // Comments Modal Styles
  commentsModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentsModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  commentsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeCommentsButton: {
    padding: 4,
  },
  commentsSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  commentsList: {
    flex: 1,
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  commentsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  commentsEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  commentsEmptyText: {
    fontSize: 16,
    color: '#999',
  },
  commentItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentItemContent: {
    flex: 1,
  },
  commentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentItemUserInfo: {
    flex: 1,
  },
  commentItemUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commentItemTime: {
    fontSize: 12,
    color: '#999',
  },
  commentItemText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'right',
  },
  commentItemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentItemActionButton: {
    paddingVertical: 4,
  },
  commentItemActionText: {
    fontSize: 14,
    color: '#666',
  },
  commentInputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
    textAlignVertical: 'top',
  },
  commentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentActionButton: {
    padding: 4,
  },
  commentSendButton: {
    backgroundColor: '#085173',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  commentSendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Notifications Screen Styles
  notificationsContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  notificationsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
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
  // Competitions Screen Styles
  competitionsContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  competitionsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  competitionsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  competitionsScrollView: {
    flex: 1,
  },
  competitionsScrollContent: {
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
  // Carousel Styles
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
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
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
  // Tab View Styles
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
  // Competition Card Styles
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
  competitionRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
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
  // More Screen Styles
  moreContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  moreHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  moreTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  moreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
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
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
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
  // Menu Styles
  menuSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#085173',
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
    borderBottomColor: '#E5E5E5',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#4A90E2',
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
});

