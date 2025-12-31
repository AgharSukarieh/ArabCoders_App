import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Post } from '@/services/postsService';
import { CommentsModal } from '@/components/modals/CommentsModal';

const SCREEN = Dimensions.get('window');

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

export interface PostDetailViewProps {
  post: Post;
  onClose: () => void;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onShare: (postId: number) => void;
  onUserPress?: (userId: number) => void;
  // Props للتعليقات
  comments?: Comment[];
  loadingComments?: boolean;
  expandedComments?: Set<number>;
  repliesByParent?: Record<number, Comment[]>;
  repliesLoading?: Set<number>;
  replyTarget?: Comment | null;
  newCommentText?: string;
  sendingComment?: boolean;
  userProfileImage?: string;
  onCommentTextChange?: (text: string) => void;
  onSendComment?: () => void;
  onToggleReplies?: (commentId: number) => void;
  onReplyPress?: (comment: Comment) => void;
  renderComment?: (comment: Comment, depth?: number) => React.ReactElement;
}

export function PostDetailView({ 
  post, 
  onClose, 
  onLike, 
  onComment, 
  onShare, 
  onUserPress,
  comments = [],
  loadingComments = false,
  expandedComments = new Set(),
  repliesByParent = {},
  repliesLoading = new Set(),
  replyTarget = null,
  newCommentText = '',
  sendingComment = false,
  userProfileImage,
  onCommentTextChange,
  onSendComment,
  onToggleReplies,
  onReplyPress,
  renderComment,
}: PostDetailViewProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [textTruncated, setTextTruncated] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  
  // Video player for post videos
  const hasVideos = post.videos && post.videos.length > 0;
  // Extract video URL (handle both string and object formats)
  const firstVideo = hasVideos ? post.videos[0] : null;
  const videoUrl = firstVideo 
    ? (typeof firstVideo === 'string' ? firstVideo : ((firstVideo as any).url || (firstVideo as any).videoUrl || String(firstVideo)))
    : null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return 'منذ وقت';
    }
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

  const hasContent = post.content && stripHtml(post.content).length > 0;
  const hasImages = post.images && post.images.length > 0;
  const contentText = hasContent ? stripHtml(post.content) : '';

  useEffect(() => {
    if (contentText.length > 150) {
      setTextTruncated(true);
    } else {
      setTextTruncated(false);
    }
    setShowFullText(false);
  }, [post.id, contentText]);

  const handleTextLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    const lineHeight = 22;
    const maxHeight = lineHeight * 3.5;
    if (height > maxHeight && !showFullText) {
      setTextTruncated(true);
    }
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <StatusBar style="light" />

      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.modalContentWrapper}>
        {hasVideos && videoUrl && (
          <View style={styles.modalImageContainer}>
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body {
                          margin: 0;
                          padding: 0;
                          background: #000;
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          height: 100vh;
                        }
                        video {
                          width: 100%;
                          height: 100%;
                          object-fit: contain;
                        }
                      </style>
                    </head>
                    <body>
                      <video controls autoplay>
                        <source src="${videoUrl}" type="video/mp4">
                        <source src="${videoUrl}" type="video/webm">
                        <source src="${videoUrl}" type="video/ogg">
                        Your browser does not support the video tag.
                      </video>
                    </body>
                  </html>
                `
              }}
              style={styles.modalMainImage}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        )}
        {!hasVideos && hasImages && (
          <View style={styles.modalImageContainer}>
            <Image source={{ uri: post.images[0] }} style={styles.modalMainImage} contentFit="contain" />
          </View>
        )}

        {/* Actions positioned absolutely over the image */}
        <View style={styles.modalActionsLeft}>
          <TouchableOpacity style={styles.modalActionItem} onPress={() => onLike(post.id)}>
            <Ionicons
              name={post.isLikedIt ? 'heart' : 'heart-outline'}
              size={24}
              color={post.isLikedIt ? '#FF3B30' : '#FFFFFF'}
            />
            <Text style={styles.modalActionNumber}>{post.numberLike}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modalActionItem} 
            onPress={() => {
              // فتح modal التعليقات محلياً داخل PostDetailView
              setShowCommentsModal(true);
              // استدعاء onComment لتحميل التعليقات
              onComment(post.id);
            }}>
            <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
            <Text style={styles.modalActionNumber}>5</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalActionItem} onPress={() => onShare(post.id)}>
            <Image 
              source={require('@/assets/icons/sharing.png')} 
              style={{ width: 24, height: 24, tintColor: "#FFFFFF" }}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBottomSection}>

          <ScrollView
            style={styles.modalRightSection}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.modalRightContent}>
            <View style={styles.modalUserInfoBottom}>
              <TouchableOpacity
                style={styles.modalUserDetailsBottom}
                onPress={() => {
                  if (onUserPress && post.userId) {
                    onUserPress(post.userId);
                  }
                }}
                activeOpacity={0.7}>
                <Text style={styles.modalUserNameBottom}>{post.userName}</Text>
                <Text style={styles.modalUserTitle}>{formatDate(post.createdAt)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (onUserPress && post.userId) {
                    onUserPress(post.userId);
                  }
                }}
                activeOpacity={0.7}>
                <Image
                  source={post.imageURL ? { uri: post.imageURL } : require('@/assets/images/icon.png')}
                  style={styles.modalProfileImageBottom}
                  contentFit="cover"
                />
              </TouchableOpacity>
            </View>

            {post.title && (
              <View style={styles.modalContentBottom}>
                <Text style={styles.modalTitleTextBottom}>{post.title}</Text>
              </View>
            )}

            {hasContent && (
              <View style={styles.modalContentBottom}>
                <View onLayout={handleTextLayout}>
                  <Text style={styles.modalContentTextBottom} numberOfLines={!showFullText ? 3 : undefined}>
                    {contentText}
                  </Text>
                </View>
                {textTruncated && !showFullText && (
                  <TouchableOpacity onPress={() => setShowFullText(true)} style={styles.moreButton}>
                    <Text style={styles.moreButtonText}>...المزيد</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal visible={showFullText} transparent animationType="slide" onRequestClose={() => setShowFullText(false)}>
        <View style={styles.fullTextModalOverlay}>
          <TouchableOpacity
            style={styles.fullTextModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFullText(false)}
          />
          <View style={styles.fullTextModalContent}>
            <View style={styles.fullTextModalHeader}>
              <Text style={styles.fullTextModalTitle}>النص الكامل</Text>
              <TouchableOpacity onPress={() => setShowFullText(false)} style={styles.closeFullTextButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.fullTextSeparator} />
            <ScrollView style={styles.fullTextScrollView} showsVerticalScrollIndicator nestedScrollEnabled>
              <Text style={styles.fullTextContent}>{contentText}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal التعليقات داخل PostDetailView */}
      {renderComment && onCommentTextChange && onSendComment && onToggleReplies && onReplyPress && (
        <Modal
          visible={showCommentsModal}
          transparent={true}
          animationType="slide"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setShowCommentsModal(false)}>
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
            onCommentTextChange={onCommentTextChange}
            onSendComment={onSendComment}
            onToggleReplies={onToggleReplies}
            onReplyPress={onReplyPress}
            onClose={() => setShowCommentsModal(false)}
            renderComment={renderComment}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    position: 'relative',
  },
  modalImageContainer: {
    width: SCREEN.width,
    height: SCREEN.height * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  modalMainImage: {
    width: SCREEN.width,
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
    position: 'absolute',
    left: 16,
    top: SCREEN.height * 0.65 - 120,
    alignItems: 'center',
    gap: 20,
    zIndex: 5,
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
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  videoPlaceholderSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

