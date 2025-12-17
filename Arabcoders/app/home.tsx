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
import { getPosts, toggleLike, getLikeStatus, getPostLikes, Post, getTags, PostTag, createPost, getPostWithComments, Comment, searchPostsRemote, SearchUser } from '@/services/postsService';
import { getStoredUser, getStoredToken, clearAuthData } from '@/services/storage';
import { revokeToken } from '@/services/authService';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedPostForLikes, setSelectedPostForLikes] = useState<Post | null>(null);
  const [likes, setLikes] = useState<Array<{userId: number, userName: string, imageURL: string}>>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const likesModalTranslateY = useRef(new Animated.Value(0)).current;
  const likesModalHeight = useRef(new Animated.Value(400)).current;
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [createPostTitle, setCreatePostTitle] = useState('');
  const [createPostText, setCreatePostText] = useState('');
  const [createPostImages, setCreatePostImages] = useState<string[]>([]);
  const [createPostVideo, setCreatePostVideo] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
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
      const postWithComments = await getPostWithComments(numericPostId);
      const comments = Array.isArray(postWithComments.comments) ? postWithComments.comments : [];
      return comments.length;
    } catch (error: any) {
      // إذا كان الخطأ 405، ربما الـ endpoint لا يدعم GET بهذه الطريقة
      // نرجع 0 بدون عرض خطأ لتجنب إزعاج المستخدم
      if (error?.response?.status === 405) {
        console.log('⚠️ Comments count endpoint not available for post:', postId);
        return 0;
      }
      // للأخطاء الأخرى، نعرض log فقط بدون إزعاج المستخدم
      console.error('Error loading comments count:', error);
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
      const postsWithCommentsPromises = sortedPosts.map(async (post) => {
        try {
          // جلب عدد التعليقات
          const commentCount = await loadCommentsCount(post.id);
          
          // التحقق من حالة الإعجاب من الـ API
          let isLiked = false;
          try {
            isLiked = await getLikeStatus(post.id);
          } catch (likeError) {
            // إذا فشل التحقق من حالة الإعجاب، نستخدم القيمة الأصلية
            isLiked = post.isLikedIt === true;
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
      
      const postsWithCommentsResults = await Promise.allSettled(postsWithCommentsPromises);
      const postsWithComments = postsWithCommentsResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // في حالة الفشل، نرجع المنشور الأصلي بدون عدد التعليقات
          return {
            ...sortedPosts[index],
            numberComment: 0,
            isLikedIt: sortedPosts[index].isLikedIt || false,
          };
        }
      });
      
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
      
      // إعادة تعيين التعليقات قبل فتح الـ modal
      setComments([]);
      setLoadingComments(true);
      setSelectedPostForComments(post);
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
          <View style={styles.repliesContainer}>
            {replies.map((reply: any) => renderComment(reply, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedPostForComments(null);
    setComments([]);
    setNewCommentText('');
    setReplyTarget(null);
  };

  const handleShare = (postId: number) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
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
        const numericUserId = currentUser?.id || currentUser?.userId || currentUser?.Id;
        const results = await searchPostsRemote({
          text: trimmed,
          userId: numericUserId ? Number(numericUserId) : undefined,
        });

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
    const remoteResults = searchResults.posts;

    if (type === 'post') {
      const postsToShow = remoteResults.length > 0 ? remoteResults : [item as Post];
      setFilteredPosts(postsToShow);
      setIsFiltered(postsToShow.length > 0);
    } else {
      const user = item as SearchUser;
      const postsToShow = (remoteResults.length > 0 ? remoteResults : posts).filter(p => 
        (p.userName || '').toLowerCase().includes(user.userName.toLowerCase()) ||
        p.userId === user.id
      );
      setFilteredPosts(postsToShow);
      setIsFiltered(postsToShow.length > 0);
    }
    
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults({ posts: [], users: [] });
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
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
        console.log('Uploading images...', createPostImages.length);
        const imageUploadPromises = createPostImages.map(async (imageUri: string, index: number) => {
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
            console.log(`Image ${index + 1} uploaded successfully:`, result.value);
            uploadedImageUrls.push(result.value);
          } else {
            console.error(`Image ${index + 1} upload failed:`, result.reason);
          }
        });
        
        if (uploadedImageUrls.length === 0) {
          const errorMessages = uploadedImages
            .filter((r) => r.status === 'rejected')
            .map((r: any) => r.reason?.message || 'خطأ غير معروف')
            .join('\n');
          throw new Error(`فشل رفع جميع الصور:\n${errorMessages}`);
        }
        
        console.log(`Successfully uploaded ${uploadedImageUrls.length}/${createPostImages.length} images`);
      }

      // رفع الفيديو أولاً والحصول على URL
      let uploadedVideoUrl: string | null = null;
      if (createPostVideo) {
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
        // استخدام service function لإنشاء المنشور
        const createdPost = await createPost(postData);
        console.log('Post created successfully:', createdPost);
      } catch (error: any) {
        // الخطأ تم معالجته في createPost، فقط نعيده
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
      
      Alert.alert('نجح', 'تم نشر المنشور بنجاح');
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

  if (showProfile) {
    return (
      <ProfileScreen 
        onBack={() => {
          setShowProfile(false);
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
        onProfilePress={() => setShowProfile(true)}
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
        />
        
        {loading ? (
          <View style={styles.postsListContainer}>
            {[1, 2, 3].map((index) => (
              <View key={index} style={styles.postSkeletonCard}>
                {/* Header Skeleton */}
                <View style={styles.postSkeletonHeader}>
                  <SkeletonView width={40} height={40} borderRadius={20} />
                  <View style={styles.postSkeletonUserInfo}>
                    <SkeletonView width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                    <SkeletonView width={80} height={12} borderRadius={4} />
                  </View>
                  <SkeletonView width={24} height={24} borderRadius={12} />
                </View>
                {/* Title Skeleton */}
                <SkeletonView width="90%" height={18} borderRadius={4} style={{ marginTop: 12, marginBottom: 8 }} />
                {/* Content Skeleton */}
                <SkeletonView width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonView width="85%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonView width="70%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                {/* Image Skeleton */}
                <SkeletonView width="100%" height={200} borderRadius={8} style={{ marginBottom: 12 }} />
                {/* Actions Skeleton */}
                <View style={styles.postSkeletonActions}>
                  <SkeletonView width={60} height={20} borderRadius={4} />
                  <SkeletonView width={60} height={20} borderRadius={4} />
                  <SkeletonView width={60} height={20} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد منشورات</Text>
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
            />
          ))
        )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} unreadCount={unreadCount} />

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => handleCloseSearch()}>
        <SafeAreaView style={styles.searchModalContainer}>
          <StatusBar style="dark" />
          
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث عن المنشور ..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchInputChange('')} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => handleCloseSearch()} style={styles.closeSearchButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          <ScrollView style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#085173" />
                <Text style={styles.searchLoadingText}>جاري البحث...</Text>
              </View>
            ) : searchQuery.length > 0 && searchResults.posts.length === 0 && searchResults.users.length === 0 ? (
              <View style={styles.searchEmptyContainer}>
                <Text style={styles.searchEmptyText}>لا توجد نتائج</Text>
              </View>
            ) : (
              <>
                {/* Users Results */}
                {searchResults.users.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text style={styles.searchSectionTitle}>الحسابات</Text>
                    {searchResults.users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.searchResultItem}
                        onPress={() => handleSelectSearchResult('user', user)}>
                        <Image
                          source={{ uri: user.imageURL || 'https://via.placeholder.com/50' }}
                          style={styles.searchResultAvatar}
                          contentFit="cover"
                        />
                        <Text style={styles.searchResultText}>{user.userName}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Posts Results */}
                {searchResults.posts.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text style={styles.searchSectionTitle}>المنشورات</Text>
                    {searchResults.posts.map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        style={styles.searchResultItem}
                        onPress={() => handleSelectSearchResult('post', post)}>
                        <View style={styles.searchPostContent}>
                          <Text style={styles.searchPostTitle} numberOfLines={1}>{post.title}</Text>
                          <Text style={styles.searchPostText} numberOfLines={2}>{post.content}</Text>
                          <Text style={styles.searchPostAuthor}>بواسطة: {post.userName}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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

      {/* Likes Modal */}
      <Modal
        visible={showLikesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeLikesModal}>
        <KeyboardAvoidingView 
          style={styles.likesModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity 
            style={styles.likesModalBackdrop}
            activeOpacity={1}
            onPress={closeLikesModal}
          />
          <Animated.View 
            style={[
              styles.likesModalContent,
              {
                height: likesModalHeight,
              }
            ]}
            {...panResponder.panHandlers}>
            {/* Drag Handle */}
            <View style={styles.likesModalDragHandle}>
              <View style={styles.dragHandleBar} />
            </View>
            {/* Header */}
            <View style={styles.likesModalHeader}>
              <Text style={styles.likesModalTitle}>المعجبين</Text>
              <TouchableOpacity 
                onPress={closeLikesModal}
                style={styles.closeLikesButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.likesSeparator} />

            {/* Likes List */}
            <ScrollView 
              style={styles.likesList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              {loadingLikes ? (
                <View style={styles.likesLoadingContainer}>
                  <ActivityIndicator size="large" color="#085173" />
                </View>
              ) : likes.length === 0 ? (
                <View style={styles.likesEmptyContainer}>
                  <Text style={styles.likesEmptyText}>لا يوجد معجبين</Text>
                </View>
              ) : (
                likes.map((like) => (
                  <View key={like.userId} style={styles.likeItem}>
                    <Image
                      source={
                        like.imageURL 
                          ? { uri: like.imageURL }
                          : require('@/assets/images/icon.png')
                      }
                      style={styles.likeUserImage}
                      contentFit="cover"
                    />
                    <Text style={styles.likeUserName}>{like.userName}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePostModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCreatePostModal}>
        <SafeAreaView style={styles.createPostModalContainer}>
          <StatusBar style="dark" />
          
          {/* Header */}
          <View style={styles.createPostHeader}>
            <TouchableOpacity onPress={closeCreatePostModal} style={styles.createPostCancelButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.createPostTitle}>انشاء منشور</Text>
            <TouchableOpacity 
              onPress={handlePublishPost}
              disabled={isCreatingPost || (!createPostText.trim() && createPostImages.length === 0 && !createPostVideo)}
              style={[
                styles.createPostPublishButton,
                (isCreatingPost || (!createPostText.trim() && createPostImages.length === 0 && !createPostVideo)) && styles.createPostPublishButtonDisabled
              ]}>
              {isCreatingPost ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createPostPublishText}>نشر</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.createPostScrollView}
            contentContainerStyle={styles.createPostScrollContent}
            keyboardShouldPersistTaps="handled">
            
            {/* User Info */}
            <View style={styles.createPostUserInfo}>
              <Image
                source={
                  userImageUrl || userProfileImage
                    ? { uri: userImageUrl || userProfileImage }
                    : require('@/assets/images/icon.png')
                }
                style={styles.createPostUserImage}
                contentFit="cover"
              />
              <Text style={styles.createPostUserName}>
                {currentUser?.userName || currentUser?.name || currentUser?.username || 'المستخدم'}
              </Text>
            </View>

            {/* Title Input */}
            <TextInput
              style={styles.createPostTitleInput}
              placeholder="العنوان"
              placeholderTextColor="#999"
              value={createPostTitle}
              onChangeText={setCreatePostTitle}
              textAlignVertical="top"
              autoFocus
            />

            {/* Text Input */}
            <TextInput
              style={styles.createPostTextInput}
              placeholder="انشر بماذا تفكر"
              placeholderTextColor="#999"
              value={createPostText}
              onChangeText={setCreatePostText}
              multiline
              textAlignVertical="top"
            />

            {/* Video Preview */}
            {createPostVideo && (
              <View style={styles.createPostVideoContainer}>
                <View style={styles.createPostVideoWrapper}>
                  <View style={styles.createPostVideoPlaceholder}>
                    <Ionicons name="videocam" size={48} color="#999" />
                    <Text style={styles.createPostVideoText}>فيديو محدد</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.createPostRemoveVideoButton}
                    onPress={handleRemoveVideo}>
                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Images Preview */}
            {createPostImages.length > 0 && (
              <View style={styles.createPostImagesContainer}>
                {createPostImages.map((uri: string, index: number) => (
                  <View key={index} style={styles.createPostImageWrapper}>
                    <Image
                      source={{ uri }}
                      style={styles.createPostImage}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.createPostRemoveImageButton}
                      onPress={() => handleRemoveImage(index)}>
                      <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Options */}
            <View style={styles.createPostOptionsContainer}>
              <TouchableOpacity 
                style={styles.createPostOption}
                onPress={handleSelectImage}>
                <Ionicons name="images-outline" size={24} color="#4CAF50" />
                <Text style={styles.createPostOptionText}>إضافة المزيد من الصور</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createPostOption}
                onPress={handleSelectVideo}>
                <Ionicons name="videocam-outline" size={24} color="#FF3B30" />
                <Text style={styles.createPostOptionText}>الفيديو</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createPostOption}
                onPress={handleSelectTag}>
                <Ionicons name="pricetag-outline" size={24} color="#2196F3" />
                <Text style={styles.createPostOptionText}>اختيار تاغ</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <View style={styles.createPostSelectedTagsContainer}>
                <Text style={styles.createPostSelectedTagsTitle}>التاغات المختارة:</Text>
                <View style={styles.createPostSelectedTagsList}>
                  {selectedTags.map((tag: PostTag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={styles.createPostSelectedTag}
                      onPress={() => handleTagToggle(tag)}>
                      <Text style={styles.createPostSelectedTagText}>{tag.tagName}</Text>
                      <Ionicons name="close-circle" size={18} color="#666" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Tags Modal - يظهر فوق modal إنشاء المنشور */}
          {showTagsModal && (
            <View style={styles.tagsModalOverlay}>
              <TouchableOpacity 
                style={styles.tagsModalBackdrop}
                activeOpacity={1}
                onPress={closeTagsModal}
              />
              <View style={styles.tagsModalContainer}>
                <SafeAreaView style={styles.tagsModalSafeArea}>
                  {/* Header */}
                  <View style={styles.tagsModalHeader}>
                    <Text style={styles.tagsModalTitle}>اختيار تاغ</Text>
                    <TouchableOpacity onPress={closeTagsModal} style={styles.tagsModalCloseButton}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {/* Tags List */}
                  <ScrollView 
                    style={styles.tagsModalScrollView}
                    contentContainerStyle={styles.tagsModalScrollContent}>
                    {loadingTags ? (
                      <View style={styles.tagsLoadingContainer}>
                        <ActivityIndicator size="large" color="#085173" />
                      </View>
                    ) : tags.length === 0 ? (
                      <View style={styles.tagsEmptyContainer}>
                        <Text style={styles.tagsEmptyText}>لا توجد تاغات متاحة</Text>
                      </View>
                    ) : (
                      tags.map((tag: PostTag) => {
                        const isSelected = selectedTags.some((t: PostTag) => t.id === tag.id);
                        return (
                          <TouchableOpacity
                            key={tag.id}
                            style={[
                              styles.tagItem,
                              isSelected && styles.tagItemSelected
                            ]}
                            onPress={() => handleTagToggle(tag)}>
                            {tag.imageURL ? (
                              <Image
                                source={{ uri: tag.imageURL }}
                                style={styles.tagItemImage}
                                contentFit="cover"
                              />
                            ) : (
                              <View style={styles.tagItemImagePlaceholder}>
                                <Ionicons name="pricetag" size={24} color="#999" />
                              </View>
                            )}
                            <View style={styles.tagItemContent}>
                              <Text style={styles.tagItemName}>{tag.tagName}</Text>
                              <Text style={styles.tagItemDescription}>{tag.shortDescription}</Text>
                            </View>
                            {isSelected && (
                              <View style={styles.tagItemCheckmark}>
                                <Ionicons name="checkmark-circle" size={24} color="#085173" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </SafeAreaView>
              </View>
            </View>
          )}
        </SafeAreaView>
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
            <View style={styles.commentsHandle} />
            {/* Header */}
            <View style={styles.commentsModalHeader}>
              <TouchableOpacity style={styles.commentsSortButton}>
                <Text style={styles.commentsSortText}>الأكثر ارتباطاً</Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>
              <Text style={styles.commentsModalTitle}>التعليقات</Text>
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
                  <Text style={styles.commentsLoadingText}>جاري تحميل التعليقات...</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.commentsEmptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.commentsEmptyText}>لا توجد تعليقات</Text>
                  <Text style={styles.commentsEmptySubtext}>كن أول من يعلق على هذا المنشور</Text>
                </View>
              ) : (
            comments
              .filter((comment: any) => !comment?.parentCommentId)
              .map((comment: any, index: number) => {
                if (!comment || !comment.id) {
                  console.warn('⚠️ Invalid comment at index', index, comment);
                  return null;
                }
                return renderComment(comment);
              })
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
            {replyTarget && (
              <View style={styles.replyContext}>
                <Text style={styles.replyContextText}>
                  ردًا على {replyTarget.userName || 'تعليق'}
                </Text>
                <TouchableOpacity onPress={() => { setReplyTarget(null); setNewCommentText(''); }}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputWrapper}>
                <TextInput
                  style={styles.commentInput}
                placeholder={replyTarget ? 'اكتب ردك هنا...' : 'اكتب أفكارك هنا...'}
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

// Custom Skeleton Component
const SkeletonView: React.FC<{ width?: number | string; height?: number; borderRadius?: number; style?: any }> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
};

const CompetitionsScreen: React.FC<CompetitionsScreenProps> = ({ onBack, activeTab, onTabPress }) => {
  const router = useRouter();
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

      <ScrollView
          style={styles.competitionsScrollView}
          contentContainerStyle={styles.competitionsScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          
          {/* Upcoming Competitions Carousel */}
          {loading ? (
            <View style={styles.carouselContainer}>
              <View style={[styles.carouselCard, { width: SCREEN_WIDTH - 15, height: 200 }]}>
                <SkeletonView width="100%" height={200} borderRadius={12} />
              </View>
            </View>
          ) : upcomingContests.length > 0 && (
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
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Tab View */}
          {loading ? (
            <View style={styles.tabContainer}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <SkeletonView width={100} height={40} borderRadius={4} />
                <SkeletonView width={100} height={40} borderRadius={4} />
              </View>
            </View>
          ) : (
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
          )}

          {/* Competitions List */}
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
              <Text style={styles.competitionsEmptyText}>
                {activeCompetitionTab === 'my' ? 'لا توجد مسابقات خاصة بك' : 'لا توجد مسابقات'}
              </Text>
            </View>
          ) : (
            displayedContests.map((contest, index) => (
              <TouchableOpacity
                key={contest.id || index}
                style={styles.competitionCard}
                onPress={() => {
                  if (contest.id) {
                    router.push(`/contest/${contest.id}` as any);
                  }
                }}
                activeOpacity={0.7}>
                <View style={styles.competitionCardContentWrapper}>
                  <View style={styles.competitionCardTop}>
                    <View style={styles.competitionCardLeft}>
                      <Ionicons name="chevron-back" size={32} color="#CCCCCC" style={styles.competitionArrow} />
                    </View>
                    <View style={styles.competitionCardRight}>
                      <View style={styles.competitionCardContent}>
                        <View style={styles.competitionCardHeader}>
                          <Text style={styles.competitionCardTitle}>{contest.name}</Text>
                        </View>
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
              </TouchableOpacity>
            ))
          )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

// More Screen Component
interface ProfileScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
}

interface MoreScreenProps {
  onBack: () => void;
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
  onProfilePress?: () => void;
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

// Profile Screen Component
const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, activeTab, onTabPress }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Animated values for numbers
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.responseUserDTO) {
      const userData = user.responseUserDTO;
      
      // Animate numbers with easing
      animateNumber(0, userData.easyProblemsSolvedCount || 0, 1500, setEasyCount);
      animateNumber(0, userData.mediumProblemsSolvedCount || 0, 1500, setMediumCount);
      animateNumber(0, userData.hardProblemsSolvedCount || 0, 1500, setHardCount);
      animateNumber(0, userData.totalSubmissions || 0, 1500, setSubmissionsCount);
      animateNumber(0, userData.totalProblemsSolved || 0, 1500, setSolvedCount);
      animateNumber(0, userData.streakDay || 0, 1500, setStreakCount);
      animateNumber(0, userData.followers || 0, 1500, setFollowersCount);
      animateNumber(0, userData.following || 0, 1500, setFollowingCount);
    }
  }, [user]);

  const animateNumber = (from: number, to: number, duration: number, setter: (value: number) => void) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.floor(from + (to - from) * easeOut);
      setter(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

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

  const userData = user?.responseUserDTO || {};

  if (loading) {
    return (
      <View style={styles.profileContainer}>
        <ActivityIndicator size="large" color="#085173" />
      </View>
    );
  }

  return (
    <View style={styles.profileContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={onBack} style={styles.profileBackButton}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.profileHeaderTitleContainer}>
          <Text style={styles.profileHeaderTitle}>الصفحة الشخصية</Text>
          <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
        </View>
        <TouchableOpacity style={styles.profileEditButton}>
          <Ionicons name="create-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.profileScrollView} contentContainerStyle={styles.profileScrollContent}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={
              userData.imageUrl
                ? { uri: userData.imageUrl }
                : require('@/assets/images/icon.png')
            }
            style={styles.profileMainImage}
            contentFit="cover"
          />
          <Text style={styles.profileName}>{userData.userName || 'غير محدد'}</Text>
        </View>

        {/* Account Information */}
        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>المعلومات الحساب</Text>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>الايميل :</Text>
            <Text style={styles.profileInfoValue}>{user?.email || userData.email || 'غير محدد'}</Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>الجامعه :</Text>
            <Text style={styles.profileInfoValue}>{userData.universityName || 'غير محدد'}</Text>
          </View>
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>المدينه :</Text>
            <Text style={styles.profileInfoValue}>{userData.country?.nameCountry || 'غير محدد'}</Text>
          </View>
        </View>

        {/* Performance Section */}
        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>الاداء</Text>
          <Text style={styles.profileComponentText}>◆ Component 16</Text>
          
          {/* Difficulty Progress Circles */}
          <View style={styles.difficultyCirclesContainer}>
            <View style={styles.difficultyCircle}>
              <Text style={styles.difficultyNumber}>{easyCount}</Text>
              <Text style={styles.difficultyLabel}>سهل</Text>
              <Text style={styles.difficultyProgress}>0/1954</Text>
            </View>
            <View style={styles.difficultyCircle}>
              <Text style={styles.difficultyNumber}>{mediumCount}</Text>
              <Text style={styles.difficultyLabel}>متوسط</Text>
              <Text style={styles.difficultyProgress}>0/1954</Text>
            </View>
            <View style={styles.difficultyCircle}>
              <Text style={styles.difficultyNumber}>{hardCount}</Text>
              <Text style={styles.difficultyLabel}>صعب</Text>
              <Text style={styles.difficultyProgress}>0/1954</Text>
            </View>
          </View>

          {/* Stats Cards Grid */}
          <View style={styles.statsGrid}>
            {/* Acceptance Rate */}
            <View style={[styles.statCard, styles.acceptanceCard]}>
              <View style={styles.donutChart}>
                <Text style={styles.donutText}>{userData.acceptanceRate || 0}%</Text>
              </View>
              <Text style={styles.statCardLabel}>نسبة القبول</Text>
            </View>

            {/* Suggestions */}
            <View style={[styles.statCard, styles.suggestionsCard]}>
              <Ionicons name="people-outline" size={32} color="#4A90E2" />
              <Text style={styles.statCardLabel}>عدد الاقتراحات</Text>
              <Text style={styles.statCardValue}>{submissionsCount}</Text>
            </View>

            {/* Solved Problems */}
            <View style={[styles.statCard, styles.solvedCard]}>
              <Ionicons name="home-outline" size={32} color="#8B7355" />
              <Text style={styles.statCardLabel}>عدد المشاكل المحلولة</Text>
              <Text style={styles.statCardValue}>{solvedCount}/38542</Text>
            </View>

            {/* Current Streak */}
            <View style={[styles.statCard, styles.streakCard]}>
              <Ionicons name="calendar-outline" size={32} color="#4A90E2" />
              <Text style={styles.statCardLabel}>السلسلة الحالية</Text>
              <Text style={styles.statCardValue}>{streakCount}</Text>
            </View>

            {/* Followers */}
            <View style={[styles.statCard, styles.followersCard]}>
              <Ionicons name="people-outline" size={32} color="#4CAF50" />
              <Text style={styles.statCardLabel}>المتابعين</Text>
              <Text style={styles.statCardValue}>{followersCount}</Text>
            </View>

            {/* Following */}
            <View style={[styles.statCard, styles.followingCard]}>
              <Ionicons name="person-outline" size={32} color="#FFC107" />
              <Text style={styles.statCardLabel}>يتابع</Text>
              <Text style={styles.statCardValue}>{followingCount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
};

const MoreScreen: React.FC<MoreScreenProps> = ({ onBack, activeTab, onTabPress, onProfilePress }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const router = useRouter();

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
    if (onProfilePress) {
      onProfilePress();
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              // جلب الـ token قبل مسحه
              const token = await getStoredToken();
              
              // إلغاء الـ token من الخادم أولاً
              if (token) {
                try {
                  console.log('🔄 Revoking token on server...');
                  await revokeToken(token);
                  console.log('✅ Token revoked successfully on server');
                } catch (revokeError) {
                  // حتى لو فشل إلغاء الـ token، نكمل مع مسح البيانات المحلية
                  console.warn('⚠️ Failed to revoke token on server, continuing with local logout:', revokeError);
                }
              } else {
                console.log('⚠️ No token found to revoke');
              }
              
              // مسح جميع البيانات المحلية
              console.log('🔄 Clearing local storage...');
              await clearAuthData();
              // مسح البيانات الإضافية
              await AsyncStorage.multiRemove(['rememberedEmail', 'pendingSignupData', 'passwordResetEmail']);
              
              console.log('✅ Logged out successfully, all data cleared');
              
              // التوجيه إلى صفحة تسجيل الدخول
              console.log('🔄 Redirecting to login page...');
              
              // التأكد من أن جميع العمليات غير المتزامنة اكتملت
              await new Promise(resolve => setTimeout(resolve, 100));
              
              try {
                // استخدام المسار الجذري للعودة لتسجيل الدخول
                console.log('Attempting router.replace("/")...');
                router.replace('/');
                console.log('✅ Navigation successful');
              } catch (navError) {
                console.error('❌ Navigation error:', navError);
                // محاولة بديلة - استخدام push
                try {
                  console.log('Attempting router.push("/")...');
                  router.push('/');
                  console.log('✅ Push navigation successful');
                } catch (pushError) {
                  console.error('❌ Push also failed:', pushError);
                  // محاولة أخيرة - إعادة تحميل التطبيق
                  console.log('Attempting to reload app...');
                  // في حالة فشل كل المحاولات، يمكن استخدام Linking لإعادة فتح التطبيق
                  // لكن الأفضل هو التأكد من أن التوجيه يعمل
                }
              }
            } catch (error) {
              console.error('❌ Error logging out:', error);
              // حتى لو حدث خطأ، نحاول مسح البيانات المحلية والتوجيه
              try {
                await clearAuthData();
                await AsyncStorage.multiRemove(['rememberedEmail', 'pendingSignupData', 'passwordResetEmail']);
                console.log('✅ Local data cleared, redirecting to login');
                setTimeout(() => {
                  try {
                    router.replace('/');
                  } catch (navError) {
                    console.error('Navigation error, trying alternative:', navError);
                    try {
                      router.push('/');
                    } catch (pushError) {
                      console.error('Push also failed:', pushError);
                      router.replace('/');
                    }
                  }
                }, 300);
              } catch (cleanupError) {
                console.error('❌ Error during cleanup:', cleanupError);
                Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
              }
            }
          },
        },
      ]
    );
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

        {/* Logout Button */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
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
  replies?: any[];
  isExpanded?: boolean;
  onToggleReplies?: () => void;
  onReplyPress?: (comment: any) => void;
  repliesLoading?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, replies = [], isExpanded = false, onToggleReplies, onReplyPress, repliesLoading = false }) => {
  const formatDate = (dateString: string) => {
    try {
      // التحقق من أن التاريخ صحيح وليس القيمة الافتراضية
      if (!dateString || dateString === '0001-01-01T00:00:00' || dateString.startsWith('0001-')) {
        return 'منذ وقت';
      }
      const date = new Date(dateString);
      // التحقق من أن التاريخ صحيح
      if (isNaN(date.getTime())) {
        return 'منذ وقت';
      }
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return 'منذ وقت';
    }
  };

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentItemContent}>
        <View style={styles.commentItemHeader}>
          <Image
            source={
              comment.imageURL
                ? { uri: comment.imageURL }
                : require('@/assets/images/icon.png')
            }
            style={styles.commentItemUserImage}
            contentFit="cover"
          />
          <View style={styles.commentItemUserInfo}>
            <Text style={styles.commentItemUserName}>
              {comment.userName || comment.user?.userName || 'مستخدم'}
            </Text>
            {comment.createdAt && comment.createdAt !== '0001-01-01T00:00:00' && (
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
          <TouchableOpacity style={styles.commentItemActionButton} onPress={() => onReplyPress?.(comment)}>
            <Text style={styles.commentItemActionText}>رد</Text>
          </TouchableOpacity>
          {comment?.hasChild && (
            <TouchableOpacity style={styles.commentItemActionButton} onPress={onToggleReplies}>
              {repliesLoading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text style={styles.commentItemActionText}>
                  {isExpanded ? 'إخفاء الردود' : 'عرض الردود'}
                  {replies.length > 0 ? ` (${replies.length})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        {isExpanded && replies.length > 0 && (
          <View style={styles.repliesContainer} />
        )}
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
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  postsListContainer: {
    paddingBottom: 20,
  },
  postSkeletonCard: {
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
  postSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postSkeletonUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postSkeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  commentsModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  commentsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: SCREEN_HEIGHT * 0.55,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  commentsModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 10,
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  commentsHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 10,
  },
  commentsSortButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentsSortText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  closeCommentsButton: {
    padding: 4,
  },
  commentsSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 0,
  },
  commentsList: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.45,
    paddingHorizontal: 8,
  },
  commentsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsLoadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  commentsEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsEmptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  commentsEmptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  commentItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentItemContent: {
    flex: 1,
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentItemUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
    gap: 12,
    flexWrap: 'wrap',
  },
  commentItemActionButton: {
    paddingVertical: 4,
  },
  commentItemActionText: {
    fontSize: 14,
    color: '#666',
  },
  repliesContainer: {
    marginTop: 10,
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: '#E5E5E5',
    gap: 12,
  },
  replyItem: {
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyUserImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  replyUserInfo: {
    flex: 1,
  },
  replyUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  replyTime: {
    fontSize: 11,
    color: '#888',
    textAlign: 'left',
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'right',
  },
  replyActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  replyActionButton: {
    paddingVertical: 2,
  },
  replyActionText: {
    fontSize: 13,
    color: '#666',
  },
  commentInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  replyContext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  replyContextText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
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
    backgroundColor: '#F7F8FA',
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
  // Likes Modal Styles
  likesModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  likesModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  likesModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    marginTop: Dimensions.get('window').height * 0.3, // رفع الـ modal للأعلى
  },
  likesModalDragHandle: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  likesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  likesModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeLikesButton: {
    padding: 4,
  },
  likesSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  likesList: {
    flex: 1,
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  likesLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  likesEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  likesEmptyText: {
    fontSize: 16,
    color: '#999',
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  likeUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  likeUserName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
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
  competitionsListContainer: {
    paddingBottom: 20,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginBottom: 26,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginRight: 8,
    textAlign: 'right',
  },
  // Create Post Modal Styles
  createPostModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  createPostCancelButton: {
    padding: 4,
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createPostPublishButton: {
    backgroundColor: '#085173',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostPublishButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createPostPublishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createPostScrollView: {
    flex: 1,
  },
  createPostScrollContent: {
    padding: 16,
  },
  createPostUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  createPostUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  createPostUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  createPostTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minHeight: 50,
    textAlign: 'right',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  createPostTextInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlign: 'right',
    marginBottom: 16,
  },
  createPostVideoContainer: {
    marginBottom: 16,
  },
  createPostVideoWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  createPostVideoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostVideoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  createPostRemoveVideoButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  createPostImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  createPostImageWrapper: {
    width: (Dimensions.get('window').width - 48) / 2,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  createPostImage: {
    width: '100%',
    height: '100%',
  },
  createPostRemoveImageButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  createPostOptionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  createPostOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  createPostOptionText: {
    fontSize: 15,
    color: '#333',
  },
  createPostSelectedTagsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  createPostSelectedTagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  createPostSelectedTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  createPostSelectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  createPostSelectedTagText: {
    fontSize: 13,
    color: '#085173',
    fontWeight: '500',
  },
  // Tags Modal Styles
  tagsModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  tagsModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tagsModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tagsModalSafeArea: {
    flex: 1,
  },
  tagsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tagsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tagsModalCloseButton: {
    padding: 4,
  },
  tagsModalScrollView: {
    flex: 1,
  },
  tagsModalScrollContent: {
    padding: 16,
  },
  tagsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  tagsEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  tagsEmptyText: {
    fontSize: 16,
    color: '#999',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#085173',
  },
  tagItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  tagItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tagItemContent: {
    flex: 1,
  },
  tagItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tagItemDescription: {
    fontSize: 13,
    color: '#666',
  },
  tagItemCheckmark: {
    marginLeft: 8,
  },
  // Search Modal Styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  clearSearchButton: {
    padding: 4,
  },
  closeSearchButton: {
    padding: 8,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchEmptyText: {
    fontSize: 16,
    color: '#999',
  },
  searchSection: {
    paddingVertical: 16,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: 'right',
  },
  searchResultItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  searchResultText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  searchPostContent: {
    flex: 1,
    marginLeft: 12,
  },
  searchPostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  searchPostText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  searchPostAuthor: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  // Profile Screen Styles
  profileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileBackButton: {
    padding: 8,
  },
  profileHeaderTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  profileHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileEditButton: {
    padding: 8,
  },
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    paddingBottom: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileMainImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  profileSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right',
  },
  profileComponentText: {
    fontSize: 16,
    color: '#9C27B0',
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
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    textAlign: 'right',
  },
  profileInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  difficultyCirclesContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  difficultyCircle: {
    alignItems: 'center',
    width: 100,
  },
  difficultyNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (Dimensions.get('window').width - 44) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptanceCard: {
    backgroundColor: '#FFFFFF',
  },
  suggestionsCard: {
    backgroundColor: '#E3F2FD',
  },
  solvedCard: {
    backgroundColor: '#F5E6D3',
  },
  streakCard: {
    backgroundColor: '#E3F2FD',
  },
  followersCard: {
    backgroundColor: '#E8F5E9',
  },
  followingCard: {
    backgroundColor: '#FFF9C4',
  },
  donutChart: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  donutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
});

