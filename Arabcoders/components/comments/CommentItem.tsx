import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet, Alert, Modal, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getCommentLikeStatus, toggleCommentLike, getCommentLikes } from '@/services/commentLikesService';

export interface CommentItemProps {
  comment: any;
  replies?: any[];
  isExpanded?: boolean;
  onToggleReplies?: () => void;
  onReplyPress?: (comment: any) => void;
  onUserPress?: (userId: number) => void;
  repliesLoading?: boolean;
}

const baseStyles = StyleSheet.create({
  commentItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
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
    marginBottom: 4,
  },
  commentItemTime: {
    fontSize: 12,
  },
  commentItemText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'right',
  },
  commentItemActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    flexWrap: 'wrap',
  },
  commentItemActionButton: {
    paddingVertical: 4,
  },
  commentItemActionText: {
    fontSize: 14,
  },
  commentItemActionButtonWithIcon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  repliesContainer: {
    marginTop: 10,
    paddingRight: 12,
    borderRightWidth: 2,
    gap: 12,
  },
  likesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  likesModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
    paddingTop: 12,
    paddingBottom: 20,
  },
  likesModalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  likesModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  likesModalCloseButton: {
    padding: 4,
  },
  likesModalList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  likesModalItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  likesModalUserImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
  },
  likesModalUserName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  likesModalEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  likesModalEmptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

const formatDate = (dateString: string) => {
  try {
    if (!dateString || dateString === '0001-01-01T00:00:00' || dateString.startsWith('0001-')) {
      return 'منذ وقت';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'منذ وقت';
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch {
    return 'منذ وقت';
  }
};

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  replies = [],
  isExpanded = false,
  onToggleReplies,
  onReplyPress,
  onUserPress,
  repliesLoading = false,
}) => {
  const { isDark } = useTheme();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);
  const [checkingLikeStatus, setCheckingLikeStatus] = useState<boolean>(true);
  const [showLikesModal, setShowLikesModal] = useState<boolean>(false);
  const [likesList, setLikesList] = useState<Array<{userId: number, userName: string, imageURL: string}>>([]);
  const [loadingLikes, setLoadingLikes] = useState<boolean>(false);

  // تحميل حالة الإعجاب وعدد الإعجابات عند تحميل المكون
  useEffect(() => {
    if (comment?.id) {
      loadLikeStatus();
      loadLikeCount();
    }
  }, [comment?.id]);

  const loadLikeStatus = async () => {
    try {
      setCheckingLikeStatus(true);
      const status = await getCommentLikeStatus(comment.id);
      setIsLiked(status);
    } catch (error: any) {
      console.error('Error loading comment like status:', error);
      // في حالة الخطأ، نترك القيمة الافتراضية (false)
    } finally {
      setCheckingLikeStatus(false);
    }
  };

  const loadLikeCount = async () => {
    try {
      const likes = await getCommentLikes(comment.id);
      setLikeCount(likes.length);
    } catch (error: any) {
      console.error('Error loading comment like count:', error);
      // في حالة الخطأ، نترك القيمة الافتراضية (0)
    }
  };

  const handleToggleLike = async () => {
    if (!comment?.id || likeLoading) return;

    try {
      setLikeLoading(true);
      const previousIsLiked = isLiked;
      const previousLikeCount = likeCount;

      // تحديث فوري للواجهة (optimistic update)
      setIsLiked(!previousIsLiked);
      setLikeCount(previousIsLiked ? previousLikeCount - 1 : previousLikeCount + 1);

      // تنفيذ العملية على الخادم
      await toggleCommentLike(comment.id, previousIsLiked);

      // إعادة تحميل العدد الفعلي من الخادم
      await loadLikeCount();
    } catch (error: any) {
      // في حالة الخطأ، نعيد القيم السابقة
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      
      Alert.alert('خطأ', error?.message || 'فشل تحديث الإعجاب');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleLongPressLike = async () => {
    if (!comment?.id || likeCount === 0) return;

    try {
      setShowLikesModal(true);
      setLoadingLikes(true);
      const likes = await getCommentLikes(comment.id);
      setLikesList(likes);
    } catch (error: any) {
      console.error('Error loading comment likes:', error);
      Alert.alert('خطأ', error?.message || 'فشل تحميل قائمة المعجبين');
      setShowLikesModal(false);
    } finally {
      setLoadingLikes(false);
    }
  };

  const dynamicStyles = {
    commentItem: { ...baseStyles.commentItem, borderBottomColor: isDark ? '#333333' : '#F0F0F0' },
    commentItemUserName: { ...baseStyles.commentItemUserName, color: isDark ? '#FFFFFF' : '#333' },
    commentItemTime: { ...baseStyles.commentItemTime, color: isDark ? '#AAAAAA' : '#999' },
    commentItemText: { ...baseStyles.commentItemText, color: isDark ? '#FFFFFF' : '#333' },
    commentItemActionText: { ...baseStyles.commentItemActionText, color: isDark ? '#AAAAAA' : '#666' },
    commentItemActionTextLiked: { ...baseStyles.commentItemActionText, color: isDark ? '#0C85C1' : '#085173' },
    repliesContainer: { ...baseStyles.repliesContainer, borderRightColor: isDark ? '#333333' : '#E5E5E5' },
    likesModalOverlay: { ...baseStyles.likesModalOverlay, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' },
    likesModalContent: { ...baseStyles.likesModalContent, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    likesModalTitle: { ...baseStyles.likesModalTitle, color: isDark ? '#FFFFFF' : '#333' },
    likesModalHeader: { ...baseStyles.likesModalHeader, borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    likesModalItem: { ...baseStyles.likesModalItem, borderBottomColor: isDark ? '#333333' : '#F0F0F0' },
    likesModalUserName: { ...baseStyles.likesModalUserName, color: isDark ? '#FFFFFF' : '#333' },
    likesModalEmptyText: { ...baseStyles.likesModalEmptyText, color: isDark ? '#AAAAAA' : '#999' },
  };

  const activityIndicatorColor = isDark ? '#AAAAAA' : '#666';
  const likeIconColor = isLiked ? (isDark ? '#0C85C1' : '#085173') : (isDark ? '#AAAAAA' : '#666');

  return (
    <View style={dynamicStyles.commentItem}>
      <View style={baseStyles.commentItemContent}>
        <View style={baseStyles.commentItemHeader}>
          <TouchableOpacity
            onPress={() => {
              if (onUserPress && comment.userId) {
                onUserPress(comment.userId);
              }
            }}
            activeOpacity={0.7}>
            <Image
              source={comment.imageURL ? { uri: comment.imageURL } : require('@/assets/images/icon.png')}
              style={baseStyles.commentItemUserImage}
              contentFit="cover"
            />
          </TouchableOpacity>
          <View style={baseStyles.commentItemUserInfo}>
            <TouchableOpacity
              onPress={() => {
                if (onUserPress && comment.userId) {
                  onUserPress(comment.userId);
                }
              }}
              activeOpacity={0.7}>
              <Text style={dynamicStyles.commentItemUserName}>{comment.userName || comment.user?.userName || 'مستخدم'}</Text>
            </TouchableOpacity>
            {comment.createdAt && comment.createdAt !== '0001-01-01T00:00:00' && (
              <Text style={dynamicStyles.commentItemTime}>{formatDate(comment.createdAt)}</Text>
            )}
          </View>
        </View>
        {comment.text && <Text style={dynamicStyles.commentItemText}>{comment.text}</Text>}
        <View style={baseStyles.commentItemActions}>
          <TouchableOpacity 
            style={baseStyles.commentItemActionButtonWithIcon} 
            onPress={handleToggleLike}
            onLongPress={handleLongPressLike}
            disabled={likeLoading || checkingLikeStatus}
            activeOpacity={0.7}>
            {likeLoading || checkingLikeStatus ? (
              <ActivityIndicator size="small" color={activityIndicatorColor} />
            ) : (
              <>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={16} 
                  color={likeIconColor} 
                />
                <Text style={isLiked ? dynamicStyles.commentItemActionTextLiked : dynamicStyles.commentItemActionText}>
                  {likeCount > 0 ? likeCount : ''} إعجاب
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={baseStyles.commentItemActionButton} onPress={() => onReplyPress?.(comment)}>
            <Text style={dynamicStyles.commentItemActionText}>رد</Text>
          </TouchableOpacity>
          {comment?.hasChild && (
            <TouchableOpacity style={baseStyles.commentItemActionButton} onPress={onToggleReplies}>
              {repliesLoading ? (
                <ActivityIndicator size="small" color={activityIndicatorColor} />
              ) : (
                <Text style={dynamicStyles.commentItemActionText}>
                  {isExpanded ? 'إخفاء الردود' : 'عرض الردود'}
                  {replies.length > 0 ? ` (${replies.length})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        {isExpanded && replies.length > 0 && <View style={dynamicStyles.repliesContainer} />}
      </View>

      {/* Modal لعرض المعجبين */}
      <Modal
        visible={showLikesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLikesModal(false)}>
        <TouchableOpacity
          style={dynamicStyles.likesModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLikesModal(false)}>
          <View style={dynamicStyles.likesModalContent} onStartShouldSetResponder={() => true}>
            <View style={dynamicStyles.likesModalHeader}>
              <Text style={dynamicStyles.likesModalTitle}>المعجبين ({likeCount})</Text>
              <TouchableOpacity
                onPress={() => setShowLikesModal(false)}
                style={baseStyles.likesModalCloseButton}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={baseStyles.likesModalList} showsVerticalScrollIndicator={true}>
              {loadingLikes ? (
                <View style={baseStyles.likesModalEmptyContainer}>
                  <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
                </View>
              ) : likesList.length === 0 ? (
                <View style={baseStyles.likesModalEmptyContainer}>
                  <Ionicons name="heart-outline" size={48} color={isDark ? '#666' : '#CCCCCC'} />
                  <Text style={dynamicStyles.likesModalEmptyText}>لا يوجد معجبين</Text>
                </View>
              ) : (
                likesList.map((like) => (
                  <TouchableOpacity
                    key={like.userId}
                    style={dynamicStyles.likesModalItem}
                    onPress={() => {
                      setShowLikesModal(false);
                      if (onUserPress) {
                        onUserPress(like.userId);
                      }
                    }}
                    activeOpacity={0.7}>
                    <Image
                      source={
                        like.imageURL
                          ? { uri: like.imageURL }
                          : require('@/assets/images/icon.png')
                      }
                      style={baseStyles.likesModalUserImage}
                      contentFit="cover"
                    />
                    <Text style={dynamicStyles.likesModalUserName}>{like.userName}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

