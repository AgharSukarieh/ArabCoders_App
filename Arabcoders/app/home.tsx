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
  PanResponder,
  Share,
  Linking,
} from 'react-native';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { CreatePost } from '@/components/posts/CreatePost';
import { PostCard } from '@/components/posts/PostCard';
import { SkeletonView } from '@/components/common/SkeletonView';
import { NotificationsScreen } from '@/components/screens/NotificationsScreen';
import { CompetitionsScreen } from '@/components/screens/CompetitionsScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { MoreScreen } from '@/components/screens/MoreScreen';
import { RankingScreen } from '@/components/screens/RankingScreen';
import { EventsScreen } from '@/components/screens/EventsScreen';
import { EventDetailScreen } from '@/components/screens/EventDetailScreen';
import { UserProfileScreen } from '@/components/screens/UserProfileScreen';
import { FAQScreen } from '@/components/screens/FAQScreen';
import { AboutUsScreen } from '@/components/screens/AboutUsScreen';
import { ContactUsScreen } from '@/components/screens/ContactUsScreen';
import { TermsAndConditionsScreen } from '@/components/screens/TermsAndConditionsScreen';
import { AlgorithmsScreen } from '@/components/screens/AlgorithmsScreen';
import { NotificationSettingsScreen } from '@/components/screens/NotificationSettingsScreen';
import { PostDetailView } from '@/components/posts/PostDetailView';
import { CommentItem } from '@/components/comments/CommentItem';
import { SearchModal } from '@/components/modals/SearchModal';
import { LikesModal } from '@/components/modals/LikesModal';
import { CreatePostModal } from '@/components/modals/CreatePostModal';
import { CommentsModal } from '@/components/modals/CommentsModal';
import { getPosts, toggleLike, getLikeStatus, getPostLikes, Post, getTags, PostTag, createPost, getPostWithComments, Comment, searchPostsRemote, SearchUser, deletePost, updatePost } from '@/services/postsService';
import { getHomeStyles } from '@/styles/home.styles';
import { useTheme } from '@/contexts/ThemeContext';
import { getStoredUser, getStoredSession, getStoredToken, clearAuthData, saveToken, saveUser, saveSession } from '@/services/storage';
import { revokeToken, refreshToken } from '@/services/authService';
import api from '@/services/api';
import { decodeJwt } from '@/utils/authUtils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getCountries } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const homeStyles = getHomeStyles(isDark);
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
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [repliesByParent, setRepliesByParent] = useState<Record<number, any[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<Set<number>>(new Set());
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Debug: مراقبة تغييرات التعليقات
  useEffect(() => {
    console.log('🔄 Comments state changed:', {
      count: comments.length,
      comments: comments.map(c => ({ id: c.id, text: c.text?.substring(0, 30) })),
    });
  }, [comments]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompetitions, setShowCompetitions] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAlgorithms, setShowAlgorithms] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedPostForLikes, setSelectedPostForLikes] = useState<Post | null>(null);
  const [likes, setLikes] = useState<Array<{userId: number, userName: string, imageURL: string}>>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const likesModalTranslateY = useRef(new Animated.Value(0)).current;
  const likesModalHeight = useRef(new Animated.Value(400)).current;
  const commentsModalOpenRef = useRef(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [createPostTitle, setCreatePostTitle] = useState('');
  const [createPostText, setCreatePostText] = useState('');
  const [createPostImages, setCreatePostImages] = useState<string[]>([]);
  const [createPostVideo, setCreatePostVideo] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tags, setTags] = useState<PostTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PostTag[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ posts: Post[]; users: SearchUser[] }>({ posts: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        const { dy } = gestureState;
        if (dy < 0) {
          // سحب للأعلى - تكبير
          const newHeight = Math.min(600, 400 - dy);
          likesModalHeight.setValue(newHeight);
        } else if (dy > 0) {
          // سحب للأسفل - تصغير
          const newHeight = Math.max(200, 400 - dy);
          likesModalHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_: any, gestureState: any) => {
        const { dy } = gestureState;
        if (dy > 100) {
          // إذا سحب للأسفل أكثر من 100، أغلق الـ modal
          closeLikesModal();
        } else {
          // ارجع للحجم الافتراضي
          Animated.spring(likesModalHeight, {
            toValue: 400,
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadUserProfile();
    loadPosts();
    loadUnreadCount();
    // التحقق من صلاحية token في الخلفية عند تحميل الصفحة
    verifyTokenInBackground();
  }, []);

  // التحقق من صلاحية token في الخلفية (بدون أن يشعر المستخدم)
  const verifyTokenInBackground = async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        // لا يوجد token - إعادة توجيه للوجن
        router.replace('/index' as any);
        return;
      }

      // التحقق من صحة الـ token (فحص انتهاء الصلاحية)
      const tokenPayload = decodeJwt(token);
      if (!tokenPayload) {
        console.log('🔐 Invalid token format, redirecting to login');
        await clearAuthData();
        router.replace('/index' as any);
        return;
      }

      // التحقق من انتهاء صلاحية الـ token
      const currentTime = Date.now() / 1000;
      const tokenExp = tokenPayload.exp || tokenPayload.expires || 0;
      
      // إذا كان الـ token صالحاً، لا حاجة لفعل شيء
      if (!tokenExp || tokenExp > currentTime) {
        console.log('✅ Token is valid');
        return;
      }

      // الـ token منتهي الصلاحية، محاولة تحديثه في الخلفية (بدون أن يشعر المستخدم)
      console.log('🔄 Token expired, refreshing in background...');
      try {
        const refreshResult = await refreshToken();
        
        if (refreshResult?.token) {
          // حفظ الـ token الجديد
          const rememberMe = await AsyncStorage.getItem('auth-remember');
          const tokenExpiration = rememberMe 
            ? Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days if remember me
            : Date.now() + 1000 * 60 * 60; // 1 hour if not
          await saveToken(refreshResult.token, tokenExpiration);
          
          // حفظ بيانات المستخدم إذا كانت موجودة
          if (refreshResult.responseUserDTO) {
            const user = {
              id: refreshResult.responseUserDTO.id,
              name: refreshResult.username || refreshResult.responseUserDTO.fullName || refreshResult.responseUserDTO.userName,
              email: refreshResult.email || refreshResult.responseUserDTO.email,
              role: refreshResult.role || refreshResult.responseUserDTO.role || 'User',
            };
            await saveUser(user);
            await saveSession(refreshResult);
          }
          
          console.log('✅ Token refreshed successfully in background');
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError: any) {
        console.error('❌ Failed to refresh token:', refreshError);
        
        // التحقق من نوع الخطأ
        const errorStatus = refreshError?.response?.status;
        const errorMessage = (refreshError?.message || '').toLowerCase();
        const errorDataMessage = (refreshError?.response?.data?.message || '').toLowerCase();
        
        // إذا كان الخطأ 400 أو 401 أو Invalid token، نمسح البيانات ونعيد التوجيه للوجن
        if (errorStatus === 400 || errorStatus === 401 || 
            errorMessage.includes('invalid token') || 
            errorDataMessage.includes('invalid token')) {
          console.log('🔐 Invalid token, redirecting to login');
          await clearAuthData();
          router.replace('/index' as any);
        }
        // للأخطاء الأخرى (network errors)، لا نفعل شيء - المستخدم يستمر في استخدام التطبيق
      }
    } catch (error) {
      console.error('❌ Error verifying token:', error);
      // لا نفعل شيء - المستخدم يستمر في استخدام التطبيق
    }
  };

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
      setCurrentUser(user);
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

  const loadCommentsCount = async (postId: number): Promise<number> => {
    try {
      const numericPostId = parseInt(String(postId), 10);
      if (isNaN(numericPostId) || numericPostId <= 0) {
        return 0;
      }
      // استخدم /api/posts/{id} لأنه يرجع comments ضمن نفس الرد
      // إضافة timeout أقصر لتجنب الانتظار الطويل
      const postWithComments = await Promise.race([
        getPostWithComments(numericPostId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000) // 10 ثواني بدلاً من 30
        )
      ]) as any;
      const comments = Array.isArray(postWithComments.comments) ? postWithComments.comments : [];
      return comments.length;
    } catch (error: any) {
      // إذا كان الخطأ timeout أو 405، نرجع 0 بدون عرض خطأ
      if (error?.message === 'Timeout' || error?.response?.status === 405) {
        console.log('⚠️ Comments count timeout or not available for post:', postId);
        return 0;
      }
      // للأخطاء الأخرى، نعرض log فقط بدون إزعاج المستخدم
      if (!error?.message?.includes('timeout')) {
        console.error('Error loading comments count:', error);
      }
      return 0;
    }
  };

  const loadPosts = async (isRefresh = false) => {
    try {
      // فقط ضع loading = true إذا لم يكن refresh
      if (!isRefresh) {
        setLoading(true);
      }
      const data = await getPosts();
      // ترتيب المنشورات من الأحدث إلى الأقدم حسب createdAt
      const sortedPosts = [...data].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // الأحدث أولاً
      });
      
      // جلب عدد التعليقات وحالة الإعجاب لكل منشور بشكل تدريجي
      // تقليل عدد الطلبات المتوازية لتجنب timeout
      const BATCH_SIZE = 5; // معالجة 5 منشورات في كل مرة
      const postsWithComments: any[] = [];
      
      for (let i = 0; i < sortedPosts.length; i += BATCH_SIZE) {
        const batch = sortedPosts.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (post) => {
          try {
            // جلب عدد التعليقات
            const commentCount = await loadCommentsCount(post.id);
            
            // التحقق من حالة الإعجاب من الـ API
            let isLiked = false;
            try {
              // getLikeStatus الآن يتعامل مع الأخطاء داخلياً ويرجع false في حالة 503/timeout
              isLiked = await getLikeStatus(post.id);
            } catch (likeError: any) {
              // إذا فشل التحقق من حالة الإعجاب (مثل 401)، نستخدم القيمة الأصلية
              const errorStatus = likeError?.response?.status;
              if (errorStatus === 401) {
                // 401 يعني مشكلة في المصادقة - نستخدم القيمة الأصلية
                isLiked = post.isLikedIt === true;
              } else {
                // للأخطاء الأخرى، نستخدم false كقيمة افتراضية
                isLiked = false;
              }
            }
            
            return {
              ...post,
              numberComment: commentCount,
              isLikedIt: isLiked,
            };
          } catch (error) {
            // في حالة الخطأ، نرجع المنشور مع القيم الافتراضية
            return {
              ...post,
              numberComment: 0,
              isLikedIt: post.isLikedIt || false,
            };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        const batchPosts = batchResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // في حالة الفشل، نرجع المنشور الأصلي بدون عدد التعليقات
            return {
              ...batch[index],
              numberComment: 0,
              isLikedIt: batch[index].isLikedIt || false,
            };
          }
        });
        
        postsWithComments.push(...batchPosts);
      }
      
      setPosts(postsWithComments);
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
    loadPosts(true); // تمرير true للإشارة إلى أن هذا refresh
  };

  const handleLike = async (postId: number) => {
    try {
      console.log('🔵 handleLike called with postId:', postId, 'Type:', typeof postId);
      
      // Ensure postId is an integer
      const numericPostId = parseInt(String(postId), 10);
      if (!numericPostId || isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
        console.error('❌ Invalid postId:', postId, 'Converted to:', numericPostId);
        Alert.alert('خطأ', 'معرف المنشور غير صحيح');
        return;
      }

      // Find the post
      const post = posts.find((p) => p.id === numericPostId || p.id === postId);
      if (!post) {
        console.error('❌ Post not found with id:', numericPostId);
        Alert.alert('خطأ', 'المنشور غير موجود');
        return;
      }

      // التحقق من حالة اللايك من الـ API
      console.log('📤 Checking like status from API...');
      const currentLikeStatus = await getLikeStatus(numericPostId);
      console.log('✅ Current like status from API:', currentLikeStatus);
      
      // Optimistically update UI
      const newLikeStatus = !currentLikeStatus;
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === numericPostId || p.id === postId) {
            return {
              ...p,
              isLikedIt: newLikeStatus,
              numberLike: currentLikeStatus ? p.numberLike - 1 : p.numberLike + 1,
            };
          }
          return p;
        })
      );

      // Call API to toggle like
      await toggleLike(numericPostId, currentLikeStatus);
      console.log('✅ Like toggled successfully');
    } catch (error: any) {
      console.error('❌ Error toggling like:', error);
      
      // Revert optimistic update on error
      const numericPostId = parseInt(String(postId), 10);
      const post = posts.find((p) => p.id === numericPostId || p.id === postId);
      if (post) {
        // إعادة التحقق من الحالة الفعلية وإعادة تحميل المنشورات
        try {
          const actualStatus = await getLikeStatus(numericPostId);
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              if (p.id === numericPostId || p.id === postId) {
                // نحسب العدد الصحيح بناءً على الحالة الفعلية
                const wasLiked = post.isLikedIt === true;
                const shouldBeLiked = actualStatus === true;
                let correctLikeCount = post.numberLike;
                
                // إذا تغيرت الحالة، نصحح العدد
                if (wasLiked && !shouldBeLiked) {
                  correctLikeCount = Math.max(0, post.numberLike - 1);
                } else if (!wasLiked && shouldBeLiked) {
                  correctLikeCount = post.numberLike + 1;
                }
                
                return {
                  ...p,
                  isLikedIt: actualStatus,
                  numberLike: correctLikeCount,
                };
              }
              return p;
            })
          );
        } catch (statusError) {
          // إذا فشل التحقق، نرجع للحالة الأصلية
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
      if (!post) {
        console.warn('⚠️ Post not found:', postId);
        return;
      }

      console.log('📝 Opening comments for post:', postId);
      
      // تحديد المنشور أولاً
      setSelectedPostForComments(post);
      
      // إعادة تعيين التعليقات قبل فتح الـ modal
      setComments([]);
      setLoadingComments(true);
      
      // فتح modal التعليقات
      commentsModalOpenRef.current = true;
      setShowCommentsModal(true);
      
      // جلب التعليقات بعد فتح الـ modal
      await loadComments(postId);
    } catch (error) {
      console.error('❌ Error opening comments:', error);
      setLoadingComments(false);
    }
  };

  const loadComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      console.log('📤 Loading comments for post:', postId);
      
      const postWithComments = await getPostWithComments(postId);
      console.log('✅ Post with comments fetched:', {
        postId: postWithComments.id,
        commentsCount: postWithComments.comments?.length || 0,
        comments: postWithComments.comments,
      });
      
      // جلب التعليقات من الـ post object
      const fetchedComments = postWithComments.comments || [];
      console.log('📝 Comments data:', JSON.stringify(fetchedComments, null, 2));
      console.log('📝 Comments array length:', fetchedComments.length);
      console.log('📝 Is array?', Array.isArray(fetchedComments));
      
      setComments(fetchedComments);
      // إعادة ضبط حالة توسعة الردود
      setExpandedComments(new Set());
      console.log('✅ Comments state updated, count:', fetchedComments.length);
      
      if (fetchedComments.length === 0) {
        console.log('ℹ️ No comments found for this post');
      } else {
        console.log('✅ Comments will be displayed:', fetchedComments.length);
      }
    } catch (error: any) {
      console.error('❌ Error loading comments:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        fullError: JSON.stringify(error, null, 2),
      });
      Alert.alert('خطأ', error?.message || 'حدث خطأ في جلب التعليقات');
      setComments([]);
    } finally {
      setLoadingComments(false);
      console.log('✅ Loading comments finished');
    }
  };

  const sendComment = async () => {
    if (!newCommentText.trim() || !selectedPostForComments) return;

    try {
      setSendingComment(true);
      
      const numericPostId = parseInt(String(selectedPostForComments.id), 10);
      if (isNaN(numericPostId) || numericPostId <= 0) {
        throw new Error('معرف المنشور غير صحيح');
      }

      // الحصول على معلومات المستخدم
      const user = await getStoredUser();
      if (!user) {
        Alert.alert('خطأ', 'لم يتم العثور على معلومات المستخدم. يرجى تسجيل الدخول مرة أخرى');
        setSendingComment(false);
        return;
      }

      // استخدام userId من المستخدم - محاولة عدة حقول محتملة
      const userIdValue = user.id || user.userId || user.uid || user.Id || user.user_id;
      let userId: number;
      
      if (typeof userIdValue === 'number') {
        userId = userIdValue;
      } else if (typeof userIdValue === 'string') {
        userId = parseInt(userIdValue, 10);
      } else {
        userId = 0;
      }

      const payload = {
        text: newCommentText.trim(),
        postId: numericPostId,
        userId: userId,
        parentCommentId: replyTarget?.id ?? null, // null للسطر الأساسي، وإلا id التعليق المُستهدف
        createdAt: new Date().toISOString(),
      };

      console.log('📤 Sending comment...', payload);

      const response = await api.post('/api/comments', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
      });

      console.log('✅ Comment sent successfully:', response.data);

      // Clear input and reply target
      setNewCommentText('');
      setReplyTarget(null);
      
      // إعادة تحميل التعليقات من الـ API
      await loadComments(numericPostId);
      setReplyTarget(null);
      
      // تحديث عدد التعليقات في المنشور
      if (selectedPostForComments) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === selectedPostForComments.id) {
              return {
                ...p,
                numberComment: (p.numberComment || 0) + 1,
              };
            }
            return p;
          })
        );
      }
    } catch (error: any) {
      console.error('❌ Error sending comment:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        headers: error?.response?.headers,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          data: error?.config?.data,
          headers: {
            Authorization: error?.config?.headers?.Authorization ? 'Bearer ***' : 'Not set',
            'Content-Type': error?.config?.headers?.['Content-Type'],
          },
        },
        message: error?.message,
      });
      
      let errorMessage = 'حدث خطأ في إرسال التعليق';
      
      if (error?.response) {
        if (error.response.status === 500) {
          errorMessage = 'خطأ في الخادم (500). يرجى المحاولة مرة أخرى لاحقاً';
        } else if (error.response.data) {
          if (typeof error.response.data === 'string' && error.response.data.trim()) {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.errors) {
            errorMessage = JSON.stringify(error.response.data.errors);
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setSendingComment(false);
    }
  };

  const toggleReplies = (commentId: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const getReplies = (parentId: number) => {
    if (repliesByParent[parentId]) {
      return repliesByParent[parentId];
    }
    return comments.filter(
      (c) => c?.parentCommentId === parentId && c?.id !== parentId
    );
  };

  const fetchReplies = async (parentId: number) => {
    setRepliesLoading((prev) => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
    try {
      const response = await api.get(`/api/comments/${parentId}/replies`);
      const data = Array.isArray(response.data) ? response.data : [];
      setRepliesByParent((prev) => ({ ...prev, [parentId]: data }));
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    } catch (error) {
      console.error('❌ Error fetching replies:', error);
    } finally {
      setRepliesLoading((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  const renderComment = (comment: any, depth: number = 0) => {
    const replies = getReplies(comment.id);
    const isExpanded = expandedComments.has(comment.id);
    const loading = repliesLoading.has(comment.id);

    return (
      <View key={comment.id} style={{ paddingRight: depth > 0 ? depth * 8 : 0 }}>
        <CommentItem
          comment={comment}
          replies={replies}
          isExpanded={isExpanded}
          repliesLoading={loading}
          onUserPress={(userId) => {
            setSelectedUserId(userId);
            setShowUserProfile(true);
          }}
          onToggleReplies={async () => {
            if (!isExpanded && !repliesByParent[comment.id] && comment?.hasChild) {
              await fetchReplies(comment.id);
              return;
            }
            toggleReplies(comment.id);
          }}
          onReplyPress={(c) => {
            setReplyTarget(c);
            setNewCommentText('');
          }}
        />

        {isExpanded && replies.length > 0 && (
          <View style={{ marginTop: 10, paddingRight: 12, borderRightWidth: 2, borderRightColor: '#E5E5E5', gap: 12 }}>
            {replies.map((reply: any) => renderComment(reply, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const closeCommentsModal = () => {
    commentsModalOpenRef.current = false;
    setShowCommentsModal(false);
    setSelectedPostForComments(null);
    setComments([]);
    setNewCommentText('');
    setReplyTarget(null);
  };

  const handleShare = async (postId: number) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) {
        console.warn('Post not found:', postId);
        return;
      }

      // إنشاء رابط المنشور
      const postUrl = `https://arabcoders.com/post/${postId}`;
      const shareMessage = post.title 
        ? `${post.title}\n\n${postUrl}`
        : `شاهد هذا المنشور على ArabCoders\n\n${postUrl}`;

      // فتح قائمة المشاركة
      const result = await Share.share({
        message: shareMessage,
        url: postUrl, // للـ iOS
        title: post.title || 'منشور من ArabCoders',
      });

      // إذا اختار المستخدم واتساب أو تطبيق آخر
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // تم المشاركة عبر تطبيق معين
          console.log('Shared via:', result.activityType);
        }
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      Alert.alert('خطأ', 'فشل مشاركة المنشور');
    }
  };

  const handleShowLikes = async (postId: number) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      
      setSelectedPostForLikes(post);
      setShowLikesModal(true);
      setLoadingLikes(true);
      
      // Reset animation values
      likesModalHeight.setValue(400);
      
      const likesData = await getPostLikes(postId);
      setLikes(likesData);
      
      // Animate modal appearance
      Animated.spring(likesModalHeight, {
        toValue: 400,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start();
    } catch (error: any) {
      console.error('Error loading likes:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ في جلب المعجبين');
    } finally {
      setLoadingLikes(false);
    }
  };

  const closeLikesModal = () => {
    Animated.timing(likesModalHeight, {
      toValue: 400,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowLikesModal(false);
      setSelectedPostForLikes(null);
      setLikes([]);
      likesModalTranslateY.setValue(0);
      likesModalHeight.setValue(400);
    });
  };


  const handleSearch = () => {
    if (isFiltered) {
      handleCloseSearch();
      return;
    }
    setShowSearchModal(true);
    setSearchQuery('');
    setSearchResults({ posts: [], users: [] });
  };

  const handleCloseSearch = (resetFilters = true) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults({ posts: [], users: [] });
    if (resetFilters) {
      setIsFiltered(false);
      setFilteredPosts([]);
    }
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults({ posts: [], users: [] });
      setIsSearching(false);
      setIsFiltered(false);
      setFilteredPosts([]);
      return;
    }
    
    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // عدم إرسال userId للبحث - نريد جميع النتائج وليس فقط منشورات المستخدم
        const results = await searchPostsRemote({
          text: trimmed,
          // userId: undefined - لا نرسل userId للبحث العام
        });

        console.log('🔍 Search results:', results.length, 'posts found');
        setSearchResults({ posts: results, users: [] });
        setFilteredPosts(results);
        setIsFiltered(results.length > 0);
      } catch (error: any) {
        console.error('Error searching posts:', error);
        Alert.alert('خطأ في البحث', error?.message || 'تعذر تنفيذ البحث، حاول مرة أخرى.');
        setSearchResults({ posts: [], users: [] });
        setFilteredPosts([]);
        setIsFiltered(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (type: 'post' | 'user', item: Post | SearchUser) => {
    if (type === 'post') {
      // عند الضغط على منشور من نتائج البحث، فتح تفاصيله مباشرة
      const post = item as Post;
      setSelectedPost(post);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults({ posts: [], users: [] });
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    } else {
      // عند الضغط على مستخدم، تصفية المنشورات حسب المستخدم
      const user = item as SearchUser;
      const remoteResults = searchResults.posts;
      const postsToShow = (remoteResults.length > 0 ? remoteResults : posts).filter(p => 
        (p.userName || '').toLowerCase().includes(user.userName.toLowerCase()) ||
        p.userId === user.id
      );
      setFilteredPosts(postsToShow);
      setIsFiltered(postsToShow.length > 0);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults({ posts: [], users: [] });
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
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
    setShowCreatePostModal(true);
    setCreatePostTitle('');
    setCreatePostText('');
    setCreatePostImages([]);
  };

  const handleSelectImage = async () => {
    try {
      // طلب الصلاحيات
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إلى صلاحية الوصول إلى الصور');
        return;
      }

      // فتح معرض الصور
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const selectedImages = result.assets.map((asset: any) => asset.uri);
        setCreatePostImages((prev: string[]) => [...prev, ...selectedImages]);
        // فتح صفحة إنشاء المنشور إذا لم تكن مفتوحة
        if (!showCreatePostModal) {
          setShowCreatePostModal(true);
        }
      }
    } catch (error: any) {
      console.error('Error selecting image:', error);
      Alert.alert('خطأ', 'حدث خطأ في اختيار الصورة');
    }
  };

  const handleSelectVideo = async () => {
    try {
      // طلب الصلاحيات
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إلى صلاحية الوصول إلى الفيديوهات');
        return;
      }

      // فتح معرض الفيديوهات
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 1,
        allowsEditing: false,
        videoMaxDuration: 300, // 5 دقائق كحد أقصى
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0].uri;
        setCreatePostVideo(selectedVideo);
        // فتح صفحة إنشاء المنشور إذا لم تكن مفتوحة
        if (!showCreatePostModal) {
          setShowCreatePostModal(true);
        }
      }
    } catch (error: any) {
      console.error('Error selecting video:', error);
      Alert.alert('خطأ', 'حدث خطأ في اختيار الفيديو');
    }
  };

  const handleRemoveVideo = () => {
    setCreatePostVideo(null);
  };

  const handleRemoveImage = (index: number) => {
    setCreatePostImages((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const handlePublishPost = async () => {
    if (!createPostText.trim() && createPostImages.length === 0 && !createPostVideo) {
      Alert.alert('تنبيه', 'يرجى إدخال نص أو إضافة صورة أو فيديو');
      return;
    }

    try {
      setIsCreatingPost(true);
      
      // جلب آخر token محفوظ من AsyncStorage (آخر token تم حفظه بعد تسجيل الدخول)
      const token = await AsyncStorage.getItem('token');
      if (!token || !token.trim()) {
        Alert.alert('خطأ', 'لم يتم العثور على token. يرجى تسجيل الدخول مرة أخرى');
        setIsCreatingPost(false);
        return;
      }
      const cleanToken = token.trim();
      console.log('🔑 Latest token from AsyncStorage:', cleanToken.substring(0, 30) + '...', 'Length:', cleanToken.length);
      
      // التحقق من أن الـ token ليس فارغاً
      if (cleanToken.length < 50) {
        Alert.alert('خطأ', 'الـ token غير صحيح. يرجى تسجيل الدخول مرة أخرى');
        setIsCreatingPost(false);
        return;
      }
      
      // الحصول على معلومات المستخدم (آخر بيانات محفوظة)
      const user = await getStoredUser();
      if (!user) {
        Alert.alert('خطأ', 'لم يتم العثور على معلومات المستخدم');
        setIsCreatingPost(false);
        return;
      }

      // استخدام userId من المستخدم - محاولة عدة حقول محتملة
      const userIdValue = user.id || user.userId || user.uid || user.Id || user.user_id;
      let userId: number;
      
      if (typeof userIdValue === 'number') {
        userId = userIdValue;
      } else if (typeof userIdValue === 'string') {
        userId = parseInt(userIdValue, 10);
      } else {
        userId = 0;
      }

      console.log('User data:', {
        id: user.id,
        userId: user.userId,
        uid: user.uid,
        Id: user.Id,
        user_id: user.user_id,
        calculatedUserId: userId,
      });

      if (!userId || userId <= 0 || isNaN(userId)) {
        Alert.alert('خطأ', `معرف المستخدم غير صحيح: ${userIdValue}. يرجى تسجيل الدخول مرة أخرى`);
        setIsCreatingPost(false);
        return;
      }

      // رفع الصور أولاً والحصول على URLs
      const uploadedImageUrls: string[] = [];
      if (createPostImages.length > 0) {
        console.log('Processing images...', createPostImages.length);
        const imageUploadPromises = createPostImages.map(async (imageUri: string, index: number) => {
          // إذا كانت الصورة URL موجودة (من cloudinary أو server)، نستخدمها مباشرة
          if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            console.log(`Image ${index + 1} is already a URL, using it directly:`, imageUri.substring(0, 50));
            return imageUri;
          }

          // إذا كانت الصورة من device، نرفعها
          try {
            console.log(`Uploading image ${index + 1}/${createPostImages.length}:`, imageUri.substring(0, 50) + '...');
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || `image_${Date.now()}_${index}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            // الـ API يتوقع اسم الحقل 'image' وليس 'file'
            formData.append('image', {
              uri: imageUri,
              type: type,
              name: filename,
            } as any);

            console.log(`Sending image ${index + 1} to /api/uploads/images`);
            const uploadResponse = await api.post('/api/uploads/images', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            console.log(`Image ${index + 1} upload response:`, uploadResponse.data);

            // استخراج URL من الـ response - محاولة عدة أشكال محتملة
            let imageUrl: string | null = null;
            if (typeof uploadResponse.data === 'string') {
              imageUrl = uploadResponse.data;
            } else if (uploadResponse.data?.url) {
              imageUrl = uploadResponse.data.url;
            } else if (uploadResponse.data?.imageUrl) {
              imageUrl = uploadResponse.data.imageUrl;
            } else if (uploadResponse.data?.data?.url) {
              imageUrl = uploadResponse.data.data.url;
            } else if (Array.isArray(uploadResponse.data) && uploadResponse.data.length > 0) {
              imageUrl = uploadResponse.data[0];
            }

            if (!imageUrl) {
              console.error('Could not extract URL from response:', uploadResponse.data);
              throw new Error('لم يتم العثور على URL في الـ response');
            }

            console.log(`Image ${index + 1} uploaded successfully:`, imageUrl);
            return imageUrl;
          } catch (error: any) {
            console.error(`Error uploading image ${index + 1}:`, {
              message: error?.message,
              status: error?.response?.status,
              statusText: error?.response?.statusText,
              data: error?.response?.data,
            });
            throw new Error(`فشل رفع الصورة ${index + 1}: ${error?.response?.data?.message || error?.message || 'خطأ غير معروف'}`);
          }
        });

        const uploadedImages = await Promise.allSettled(imageUploadPromises);
        
        // تسجيل النتائج
        uploadedImages.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`Image ${index + 1} processed successfully:`, result.value);
            uploadedImageUrls.push(result.value);
          } else {
            console.error(`Image ${index + 1} processing failed:`, result.reason);
          }
        });
        
        if (uploadedImageUrls.length === 0 && createPostImages.length > 0) {
          const errorMessages = uploadedImages
            .filter((r) => r.status === 'rejected')
            .map((r: any) => r.reason?.message || 'خطأ غير معروف')
            .join('\n');
          throw new Error(`فشل رفع جميع الصور:\n${errorMessages}`);
        }
        
        console.log(`Successfully processed ${uploadedImageUrls.length}/${createPostImages.length} images`);
      }

      // رفع الفيديو أولاً والحصول على URL
      let uploadedVideoUrl: string | null = null;
      if (createPostVideo) {
        // إذا كان الفيديو URL موجوداً (من cloudinary أو server)، نستخدمه مباشرة
        if (createPostVideo.startsWith('http://') || createPostVideo.startsWith('https://')) {
          console.log('Video is already a URL, using it directly:', createPostVideo.substring(0, 50));
          uploadedVideoUrl = createPostVideo;
        } else {
          // إذا كان الفيديو من device، نرفعه
          try {
            console.log('Uploading video...', createPostVideo.substring(0, 50) + '...');
            const formData = new FormData();
            const filename = createPostVideo.split('/').pop() || `video_${Date.now()}.mp4`;
            const match = /\.(\w+)$/.exec(filename);
            let type = 'video/mp4';
            if (match) {
              const ext = match[1].toLowerCase();
              if (ext === 'mov') type = 'video/quicktime';
              else if (ext === 'avi') type = 'video/x-msvideo';
              else if (ext === 'webm') type = 'video/webm';
            }
            
            const fileObject = {
              uri: createPostVideo,
              type: type,
              name: filename,
            } as any;
            
            // الـ API يتوقع اسم الحقل 'video'
            formData.append('video', fileObject);

            console.log('Sending video to /api/uploads/videos', {
              filename,
              type,
              uriLength: createPostVideo.length,
            });

            const uploadResponse = await api.post('/api/uploads/videos', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              transformRequest: (data, headers) => {
                // إزالة Content-Type للسماح لـ axios بتعيينه تلقائياً مع boundary
                delete headers['Content-Type'];
                return data;
              },
            });

            console.log('Video upload response:', uploadResponse.data);

            // استخراج URL من الـ response - محاولة عدة أشكال محتملة
            if (typeof uploadResponse.data === 'string') {
              uploadedVideoUrl = uploadResponse.data;
            } else if (uploadResponse.data?.url) {
              uploadedVideoUrl = uploadResponse.data.url;
            } else if (uploadResponse.data?.videoUrl) {
              uploadedVideoUrl = uploadResponse.data.videoUrl;
            } else if (uploadResponse.data?.data?.url) {
              uploadedVideoUrl = uploadResponse.data.data.url;
            }

            if (!uploadedVideoUrl) {
              console.error('Could not extract video URL from response:', uploadResponse.data);
              throw new Error('لم يتم العثور على URL في الـ response');
            }

            console.log('Video uploaded successfully:', uploadedVideoUrl);
          } catch (error: any) {
            console.error('Error uploading video:', {
              message: error?.message,
              status: error?.response?.status,
              statusText: error?.response?.statusText,
              data: error?.response?.data,
            });
            throw new Error(`فشل رفع الفيديو: ${error?.response?.data?.message || error?.message || 'خطأ غير معروف'}`);
          }
        }
      }

      // إعداد بيانات المنشور مع URLs المرفوعة - التأكد من الشكل الصحيح
      // استخدام userId الفعلي من بيانات المستخدم
      const postData: any = {
        title: createPostTitle.trim() || '',
        content: createPostText.trim() || '',
        userId: userId, // استخدام userId الفعلي من بيانات المستخدم
        images: uploadedImageUrls || [],
        videos: uploadedVideoUrl ? [{
          title: '',
          description: '',
          url: uploadedVideoUrl,
          thumbnailUrl: '',
        }] : [],
        tags: selectedTags.map((tag: PostTag) => tag.id) || [],
      };

      // التأكد من أن userId رقم صحيح وأكبر من 0
      if (!postData.userId || postData.userId <= 0 || !Number.isInteger(postData.userId)) {
        throw new Error(`معرف المستخدم غير صحيح: ${postData.userId}`);
      }

      console.log('Post data with userId:', userId, 'from user data');

      // التأكد من أن جميع الحقول موجودة حتى لو كانت فارغة
      if (!postData.title && !postData.content && postData.images.length === 0 && postData.videos.length === 0) {
        throw new Error('يجب إدخال نص أو إضافة صورة أو فيديو');
      }

      // إرسال المنشور إلى API
      console.log('Sending post data:', JSON.stringify(postData, null, 2));
      console.log('Post data structure:', {
        hasTitle: !!postData.title,
        hasContent: !!postData.content,
        userId: postData.userId,
        imagesCount: postData.images.length,
        videosCount: postData.videos.length,
        tagsCount: postData.tags.length,
      });
      
      try {
        if (isEditingPost && postToEdit) {
          // تعديل المنشور
          console.log('Updating post:', postToEdit.id);
          await updatePost(postToEdit.id, postData);
          console.log('Post updated successfully');
          Alert.alert('نجح', 'تم تحديث المنشور بنجاح');
        } else {
          // إنشاء منشور جديد
          const createdPost = await createPost(postData);
          console.log('Post created successfully:', createdPost);
          Alert.alert('نجح', 'تم نشر المنشور بنجاح');
        }
      } catch (error: any) {
        // الخطأ تم معالجته في createPost/updatePost، فقط نعيده
        throw error;
      }

      // إعادة تحميل المنشورات
      await loadPosts(true);
      
      // إغلاق الـ modal وإعادة تعيين الحقول
      setShowCreatePostModal(false);
      setCreatePostTitle('');
      setCreatePostText('');
      setCreatePostImages([]);
      setCreatePostVideo(null);
      setSelectedTags([]);
      setPostToEdit(null);
      setIsEditingPost(false);
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('خطأ', error?.response?.data?.message || error?.message || 'حدث خطأ في نشر المنشور');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const closeCreatePostModal = () => {
    setShowCreatePostModal(false);
    setCreatePostTitle('');
    setCreatePostText('');
    setCreatePostImages([]);
    setCreatePostVideo(null);
    setSelectedTags([]);
    setPostToEdit(null);
    setIsEditingPost(false);
  };

  const handleSelectTag = async () => {
    console.log('handleSelectTag called');
    try {
      // جلب التاغات أولاً إذا لم تكن موجودة
      if (tags.length === 0) {
        setLoadingTags(true);
        const fetchedTags = await getTags();
        console.log('Fetched tags:', fetchedTags);
        setTags(fetchedTags);
        setLoadingTags(false);
      }
      // فتح الـ modal (سيظهر فوق modal إنشاء المنشور)
      setShowTagsModal(true);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      setLoadingTags(false);
      Alert.alert('خطأ', 'حدث خطأ في جلب التاغات');
    }
  };

  const handleTagToggle = (tag: PostTag) => {
    setSelectedTags((prev: PostTag[]) => {
      const isSelected = prev.some((t: PostTag) => t.id === tag.id);
      if (isSelected) {
        return prev.filter((t: PostTag) => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const closeTagsModal = () => {
    setShowTagsModal(false);
  };

  const handlePostPress = (post: Post) => {
    setSelectedPost(post);
  };

  const closePostModal = () => {
    setSelectedPost(null);
  };

  const handleEditPost = async (post: Post) => {
    try {
      // تعيين بيانات المنشور للتعديل
      setPostToEdit(post);
      setIsEditingPost(true);
      setCreatePostTitle(post.title || '');
      
      // تنظيف HTML من المحتوى إذا كان موجوداً
      let cleanContent = post.content || '';
      if (cleanContent.includes('<')) {
        // إزالة HTML tags بسيطة
        cleanContent = cleanContent.replace(/<[^>]*>/g, '').trim();
      }
      setCreatePostText(cleanContent);
      
      // تحميل الصور (إذا كانت URLs موجودة)
      setCreatePostImages(Array.isArray(post.images) ? post.images : []);
      
      // تحميل الفيديو (إذا كان موجوداً)
      let videoUrl: string | null = null;
      if (Array.isArray(post.videos) && post.videos.length > 0) {
        videoUrl = post.videos[0];
      }
      setCreatePostVideo(videoUrl);
      
      // تحميل التاغات
      setSelectedTags(Array.isArray(post.postTags) ? post.postTags : []);
      
      setShowCreatePostModal(true);
    } catch (error) {
      console.error('Error loading post for edit:', error);
      Alert.alert('خطأ', 'فشل تحميل بيانات المنشور للتعديل');
    }
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert(
      'حذف المنشور',
      'هل أنت متأكد من حذف هذا المنشور؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              // استدعاء API لحذف المنشور
              await deletePost(postId);
              // إزالة المنشور من القائمة
              setPosts(posts.filter(p => p.id !== postId));
              setFilteredPosts(filteredPosts.filter(p => p.id !== postId));
              Alert.alert('نجح', 'تم حذف المنشور بنجاح');
            } catch (error: any) {
              Alert.alert('خطأ', error?.message || 'فشل حذف المنشور');
            }
          },
        },
      ]
    );
  };

  const handleReportPost = async (postId: number): Promise<boolean> => {
    try {
      const response = await api.post(`/api/post-likes/postsReports/${postId}`, {}, {
        headers: {
          'accept': '*/*',
        },
      });
      
      // عرض رسالة النجاح
      showMessage({
        message: 'تم الإبلاغ',
        description: 'شكراً لك، تم الإبلاغ عن المنشور بنجاح',
        type: 'success',
        duration: 3000,
        icon: 'success',
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error reporting post:', error);
      showMessage({
        message: 'خطأ',
        description: error?.response?.data?.message || error?.message || 'فشل الإبلاغ عن المنشور',
        type: 'danger',
        duration: 3000,
        icon: 'danger',
      });
      return false;
    }
  };

  let content: React.ReactElement | null = null;

  if (showNotifications) {
    content = (
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
  } else if (showCompetitions) {
    content = (
      <CompetitionsScreen 
        onBack={() => {
          setShowCompetitions(false);
          setActiveTab('home');
        }}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    );
  } else if (showProfile) {
    content = (
      <ProfileScreen 
        onBack={() => {
          setShowProfile(false);
          setShowMore(true);
          setActiveTab('more');
        }}
        onUserPress={(targetUserId) => {
          setSelectedUserId(targetUserId);
          setShowUserProfile(true);
          setShowProfile(false);
        }}
      />
    );
  } else if (showMore) {
    content = (
      <MoreScreen 
        onBack={() => {
          setShowMore(false);
          setActiveTab('home');
        }}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onProfilePress={() => setShowProfile(true)}
        onRankingPress={() => {
          setShowMore(false);
          setShowNotifications(false);
          setShowCompetitions(false);
          setShowProfile(false);
          setShowRanking(true);
        }}
        onEventsPress={() => {
          setShowMore(false);
          setShowNotifications(false);
          setShowCompetitions(false);
          setShowProfile(false);
          setShowRanking(false);
          setShowEvents(true);
        }}
        onAlgorithmsPress={() => {
          setShowMore(false);
          setShowNotifications(false);
          setShowCompetitions(false);
          setShowProfile(false);
          setShowRanking(false);
          setShowEvents(false);
          setShowAlgorithms(true);
        }}
        onNotificationsSettingsPress={() => {
          setShowMore(false);
          setShowNotificationSettings(true);
        }}
        onFAQPress={() => {
          setShowMore(false);
          setShowFAQ(true);
        }}
        onAboutUsPress={() => {
          setShowMore(false);
          setShowAboutUs(true);
        }}
        onContactUsPress={() => {
          setShowMore(false);
          setShowContactUs(true);
        }}
        onTermsPress={() => {
          setShowMore(false);
          setShowTerms(true);
        }}
      />
    );
  } else if (showTerms) {
    content = (
      <TermsAndConditionsScreen 
        onBack={() => {
          setShowTerms(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  } else if (showContactUs) {
    content = (
      <ContactUsScreen 
        onBack={() => {
          setShowContactUs(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  } else if (showAboutUs) {
    content = (
      <AboutUsScreen 
        onBack={() => {
          setShowAboutUs(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  } else if (showFAQ) {
    content = (
      <FAQScreen 
        onBack={() => {
          setShowFAQ(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  } else if (showRanking) {
    content = (
      <RankingScreen 
        onBack={() => {
          setShowRanking(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  } else if (showEventDetail && selectedEventId) {
    content = (
      <EventDetailScreen 
        eventId={selectedEventId}
        onBack={() => {
          setShowEventDetail(false);
          setSelectedEventId(null);
          // EventDetailScreen يفتح دائماً من EventsScreen، لذا نعود إليها
          setShowEvents(true);
        }}
      />
    );
  } else if (showUserProfile && selectedUserId) {
    content = (
      <UserProfileScreen 
        userId={selectedUserId}
        onBack={() => {
          setShowUserProfile(false);
          setSelectedUserId(null);
          // إذا فتحنا UserProfileScreen من ProfileScreen، نعود إليه، وإلا نعود للمزيد
          setShowProfile(true);
        }}
        onUserPress={(targetUserId) => {
          setSelectedUserId(targetUserId);
          // البقاء في نفس الصفحة، فقط تحديث userId
        }}
      />
    );
  } else if (showEvents) {
    content = (
      <EventsScreen 
        onBack={() => {
          setShowEvents(false);
          setShowMore(true);
          setActiveTab('more');
        }}
        onEventPress={(eventId) => {
          setSelectedEventId(eventId);
          setShowEventDetail(true);
        }}
      />
    );
  } else if (showAlgorithms) {
    content = (
      <AlgorithmsScreen 
        onBack={() => {
          setShowAlgorithms(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  } else if (showNotificationSettings) {
    content = (
      <NotificationSettingsScreen 
        onBack={() => {
          setShowNotificationSettings(false);
          setShowMore(true);
          setActiveTab('more');
        }}
      />
    );
  }

  if (!content) {
    content = (
      <View style={homeStyles.container}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScrollView
          style={homeStyles.scrollView}
          contentContainerStyle={homeStyles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#085173', '#0A6B9A', '#0C85C1']}
              tintColor="#085173"
              progressBackgroundColor="#F5F5F5"
              progressViewOffset={Platform.OS === 'android' ? 100 : 0}
            />
          }>
          <Header onSearchPress={handleSearch} isFiltered={isFiltered} />
          <CreatePost 
            profileImage={userProfileImage} 
            imageUrl={userImageUrl} 
            onCreatePost={handleCreatePost}
            onSelectImage={handleSelectImage}
            onSelectVideo={handleSelectVideo}
          />
          {loading ? (
            <View style={homeStyles.postsListContainer}>
              {[1, 2, 3].map((index) => (
                <View key={index} style={homeStyles.postSkeletonCard}>
                  <View style={homeStyles.postSkeletonHeader}>
                    <SkeletonView width={40} height={40} borderRadius={20} />
                    <View style={homeStyles.postSkeletonUserInfo}>
                      <SkeletonView width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                      <SkeletonView width={80} height={12} borderRadius={4} />
                    </View>
                    <SkeletonView width={24} height={24} borderRadius={12} />
                  </View>
                  <SkeletonView width="90%" height={18} borderRadius={4} style={{ marginTop: 12, marginBottom: 8 }} />
                  <SkeletonView width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonView width="85%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonView width="70%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                  <SkeletonView width="100%" height={200} borderRadius={8} style={{ marginBottom: 12 }} />
                  <View style={homeStyles.postSkeletonActions}>
                    <SkeletonView width={60} height={20} borderRadius={4} />
                    <SkeletonView width={60} height={20} borderRadius={4} />
                    <SkeletonView width={60} height={20} borderRadius={4} />
                  </View>
                </View>
              ))}
            </View>
          ) : posts.length === 0 ? (
            <View style={homeStyles.emptyContainer}>
              <Text style={homeStyles.emptyText}>لا توجد منشورات</Text>
            </View>
          ) : (
            (isFiltered ? filteredPosts : posts).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onPostPress={handlePostPress}
                onShowLikes={handleShowLikes}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
                onUserPress={(userId) => {
                  setSelectedUserId(userId);
                  setShowUserProfile(true);
                }}
                currentUserId={currentUser?.id || currentUser?.userId || currentUser?.Id}
              />
            ))
          )}
        </ScrollView>
        <BottomNav activeTab={activeTab} onTabPress={handleTabPress} unreadCount={unreadCount} />
      </View>
    );
  }

  return (
    <>
      {content}

      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => handleCloseSearch()}>
        <SearchModal
          visible={showSearchModal}
          searchQuery={searchQuery}
          isSearching={isSearching}
          searchResults={searchResults}
          onSearchInputChange={handleSearchInputChange}
          onClose={handleCloseSearch}
          onSelectResult={handleSelectSearchResult}
        />
      </Modal>

      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // منع إغلاق modal المنشور إذا كان modal التعليقات مفتوحاً
          if (!commentsModalOpenRef.current) {
            closePostModal();
          }
        }}>
        {selectedPost && (
          <PostDetailView 
            post={posts.find(p => p.id === selectedPost.id) || selectedPost} 
            onClose={closePostModal} 
            onLike={handleLike} 
            onComment={async (postId: number) => {
              // تحميل التعليقات فقط (PostDetailView سيفتح modal التعليقات محلياً)
              try {
                const post = posts.find((p) => p.id === postId);
                if (!post) {
                  console.warn('⚠️ Post not found:', postId);
                  return;
                }
                setSelectedPostForComments(post);
                setComments([]);
                setLoadingComments(true);
                await loadComments(postId);
              } catch (error) {
                console.error('❌ Error loading comments:', error);
                setLoadingComments(false);
              }
            }}
            onShare={handleShare}
            onUserPress={(userId) => {
              setSelectedUserId(userId);
              setShowUserProfile(true);
              closePostModal();
            }}
            comments={comments}
            loadingComments={loadingComments}
            expandedComments={expandedComments}
            repliesByParent={repliesByParent}
            repliesLoading={repliesLoading}
            replyTarget={replyTarget}
            newCommentText={newCommentText}
            sendingComment={sendingComment}
            userProfileImage={userProfileImage}
            onCommentTextChange={setNewCommentText}
            onSendComment={sendComment}
            onToggleReplies={toggleReplies}
            onReplyPress={(comment) => {
              setReplyTarget(comment);
              setNewCommentText('');
            }}
            renderComment={renderComment}
          />
        )}
      </Modal>

      <Modal
        visible={showLikesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeLikesModal}>
        <LikesModal
          visible={showLikesModal}
          loading={loadingLikes}
          likes={likes}
          modalHeight={likesModalHeight}
          onClose={closeLikesModal}
        />
      </Modal>

      <Modal
        visible={showCreatePostModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCreatePostModal}>
        <CreatePostModal
          visible={showCreatePostModal}
          isCreating={isCreatingPost}
          currentUser={currentUser}
          userImageUrl={userImageUrl}
          userProfileImage={userProfileImage}
          title={createPostTitle}
          text={createPostText}
          images={createPostImages}
          video={createPostVideo}
          selectedTags={selectedTags}
          showTagsModal={showTagsModal}
          loadingTags={loadingTags}
          tags={tags}
          onTitleChange={setCreatePostTitle}
          onTextChange={setCreatePostText}
          onSelectImage={handleSelectImage}
          onSelectVideo={handleSelectVideo}
          onRemoveImage={handleRemoveImage}
          onRemoveVideo={handleRemoveVideo}
          onSelectTag={handleSelectTag}
          onTagToggle={handleTagToggle}
          onCloseTagsModal={closeTagsModal}
          onPublish={handlePublishPost}
          onClose={closeCreatePostModal}
          isEditing={isEditingPost}
        />
      </Modal>

      {/* Modal التعليقات خارج modal المنشور (للحالات الأخرى - من PostCard) */}
      {!selectedPost && (
        <Modal
          visible={showCommentsModal}
          transparent={true}
          animationType="slide"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={closeCommentsModal}>
          <CommentsModal
            visible={showCommentsModal}
            loading={loadingComments}
            comments={comments}
            expandedComments={expandedComments}
            repliesByParent={repliesByParent}
            repliesLoading={repliesLoading}
            replyTarget={replyTarget}
            newCommentText={newCommentText}
            sendingComment={sendingComment}
            userProfileImage={userProfileImage}
            onCommentTextChange={setNewCommentText}
            onSendComment={sendComment}
            onToggleReplies={toggleReplies}
            onReplyPress={(comment) => {
              setReplyTarget(comment);
              setNewCommentText('');
            }}
            onClose={closeCommentsModal}
            renderComment={renderComment}
          />
        </Modal>
      )}
    </>
  );
}
