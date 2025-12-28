import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CommentItem } from '@/components/comments/CommentItem';
import { commentsModalStyles } from '@/styles/modal.styles';
import { useTheme } from '@/contexts/ThemeContext';

interface Comment {
  id: number;
  text: string;
  userName?: string;
  user?: { userName: string };
  createdAt?: string;
  imageURL?: string;
  parentCommentId?: number;
  hasChild?: boolean;
}

interface CommentsModalProps {
  visible: boolean;
  loading: boolean;
  comments: Comment[];
  expandedComments: Set<number>;
  repliesByParent: Record<number, Comment[]>;
  repliesLoading: Set<number>;
  replyTarget: Comment | null;
  newCommentText: string;
  sendingComment: boolean;
  userProfileImage?: string;
  onCommentTextChange: (text: string) => void;
  onSendComment: () => void;
  onToggleReplies: (commentId: number) => void;
  onReplyPress: (comment: Comment) => void;
  onClose: () => void;
  renderComment: (comment: Comment, depth?: number) => React.ReactElement;
}

export function CommentsModal({
  visible,
  loading,
  comments,
  expandedComments,
  repliesByParent,
  repliesLoading,
  replyTarget,
  newCommentText,
  sendingComment,
  userProfileImage,
  onCommentTextChange,
  onSendComment,
  onToggleReplies,
  onReplyPress,
  onClose,
  renderComment,
}: CommentsModalProps) {
  const { isDark } = useTheme();

  if (!visible) return null;

  const getReplies = (parentId: number) => {
    if (repliesByParent[parentId]) {
      return repliesByParent[parentId];
    }
    return comments.filter(
      (c) => c?.parentCommentId === parentId && c?.id !== parentId
    );
  };

  const dynamicStyles = {
    overlay: { ...commentsModalStyles.overlay, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.55)' },
    backdrop: { ...commentsModalStyles.backdrop, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' },
    content: { ...commentsModalStyles.content, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    handle: { ...commentsModalStyles.handle, backgroundColor: isDark ? '#666' : '#E0E0E0' },
    title: { ...commentsModalStyles.title, color: isDark ? '#FFFFFF' : '#333' },
    sortText: { ...commentsModalStyles.sortText, color: isDark ? '#CCCCCC' : '#555' },
    separator: { ...commentsModalStyles.separator, backgroundColor: isDark ? '#333333' : '#E5E5E5' },
    loadingText: { ...commentsModalStyles.loadingText, color: isDark ? '#CCCCCC' : '#666' },
    emptyText: { ...commentsModalStyles.emptyText, color: isDark ? '#FFFFFF' : '#666' },
    emptySubtext: { ...commentsModalStyles.emptySubtext, color: isDark ? '#AAAAAA' : '#999' },
    replyContextText: { ...commentsModalStyles.replyContextText, color: isDark ? '#CCCCCC' : '#555' },
    inputContainer: { ...commentsModalStyles.inputContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderTopColor: isDark ? '#333333' : '#E5E5E5' },
    input: { ...commentsModalStyles.input, backgroundColor: isDark ? '#2E2E2E' : '#F7F8FA', color: isDark ? '#FFFFFF' : '#333' },
  };

  const iconColor = isDark ? '#CCCCCC' : '#666';
  const chevronColor = isDark ? '#CCCCCC' : '#333';
  const emptyIconColor = isDark ? '#666' : '#CCCCCC';
  const closeIconColor = isDark ? '#CCCCCC' : '#666';
  const actionIconColor = isDark ? '#AAAAAA' : '#666';

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableOpacity 
        style={dynamicStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.handle} />
        <View style={commentsModalStyles.header}>
          <Text style={dynamicStyles.title}>التعليقات</Text>
        </View>
        <View style={dynamicStyles.separator} />

        <ScrollView 
          style={commentsModalStyles.list}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}>
          {loading ? (
            <View style={commentsModalStyles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
              <Text style={dynamicStyles.loadingText}>جاري تحميل التعليقات...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={commentsModalStyles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={emptyIconColor} />
              <Text style={dynamicStyles.emptyText}>لا توجد تعليقات</Text>
              <Text style={dynamicStyles.emptySubtext}>كن أول من يعلق على هذا المنشور</Text>
            </View>
          ) : (
            comments
              .filter((comment: Comment) => !comment?.parentCommentId)
              .map((comment: Comment, index: number) => {
                if (!comment || !comment.id) {
                  return null;
                }
                return renderComment(comment);
              })
          )}
        </ScrollView>

        <View style={dynamicStyles.inputContainer}>
          {replyTarget && (
            <View style={commentsModalStyles.replyContext}>
              <Text style={dynamicStyles.replyContextText}>
                ردًا على {replyTarget.userName || replyTarget.user?.userName || 'تعليق'}
              </Text>
              <TouchableOpacity onPress={() => { onCommentTextChange(''); }}>
                <Ionicons name="close-circle" size={20} color={closeIconColor} />
              </TouchableOpacity>
            </View>
          )}
          <View style={commentsModalStyles.inputWrapper}>
            <TextInput
              style={dynamicStyles.input}
              placeholder={replyTarget ? 'اكتب ردك هنا...' : 'اكتب أفكارك هنا...'}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={newCommentText}
              onChangeText={onCommentTextChange}
              multiline
              maxLength={500}
            />
            {userProfileImage && (
              <Image
                source={{ uri: userProfileImage }}
                style={commentsModalStyles.userImage}
                contentFit="cover"
              />
            )}
          </View>
          <View style={commentsModalStyles.inputActions}>
            <TouchableOpacity style={commentsModalStyles.actionButton}>
              <Ionicons name="at" size={20} color={actionIconColor} />
            </TouchableOpacity>
            <TouchableOpacity style={commentsModalStyles.actionButton}>
              <Ionicons name="image-outline" size={20} color={actionIconColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[commentsModalStyles.sendButton, (!newCommentText.trim() || sendingComment) && commentsModalStyles.sendButtonDisabled]}
              onPress={onSendComment}
              disabled={!newCommentText.trim() || sendingComment}>
              {sendingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={commentsModalStyles.sendButtonText}>تعليق</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

