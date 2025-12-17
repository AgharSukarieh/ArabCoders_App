import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, FlatList, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Post } from '@/services/postsService';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onShare: (postId: number) => void;
  onPostPress?: (post: Post) => void;
  onShowLikes?: (postId: number) => void;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onPostPress, onShowLikes }) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showFullTextModal, setShowFullTextModal] = useState(false);
  const flatListRef = useRef<FlatList<MediaItem>>(null);
  
  // Animation values for full text modal
  const fullTextModalOpacity = useSharedValue(0);
  const fullTextModalTranslateY = useSharedValue(SCREEN_HEIGHT);

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
  
  // حساب المحتوى المختصر والكامل
  const CONTENT_PREVIEW_LENGTH = 150; // عدد الأحرف للعرض المختصر
  const fullContent = hasContent ? stripHtml(post.content || '') : '';
  const isContentLong = fullContent.length > CONTENT_PREVIEW_LENGTH;
  const previewContent = isContentLong ? fullContent.substring(0, CONTENT_PREVIEW_LENGTH) + '...' : fullContent;

  // دمج الصور والفيديوهات في مصفوفة واحدة
  const getAllMedia = (): MediaItem[] => {
    const media: MediaItem[] = [];
    if (post.images && post.images.length > 0) {
      post.images.forEach(url => media.push({ type: 'image', url }));
    }
    if (post.videos && post.videos.length > 0) {
      post.videos.forEach(url => media.push({ type: 'video', url }));
    }
    return media;
  };

  const allMedia = getAllMedia();
  const hasMultipleMedia = allMedia.length > 4;
  const displayedMedia = hasMultipleMedia ? allMedia.slice(0, 4) : allMedia;
  const remainingCount = allMedia.length - 4;

  const openMediaModal = (index: number = 0) => {
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  useEffect(() => {
    if (showMediaModal && flatListRef.current) {
      // تأخير بسيط لضمان أن الـ FlatList جاهز
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedMediaIndex,
          animated: false,
        });
      }, 100);
    }
  }, [showMediaModal, selectedMediaIndex]);

  const closeMediaModal = () => {
    setShowMediaModal(false);
  };

  // Animation styles for full text modal
  const fullTextModalOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: fullTextModalOpacity.value,
      zIndex: Platform.OS === 'ios' ? 9998 : 9998,
      elevation: Platform.OS === 'android' ? 9998 : 0,
    };
  });

  const fullTextModalStyle = useAnimatedStyle(() => {
    return {
      opacity: fullTextModalOpacity.value,
      transform: [{ translateY: fullTextModalTranslateY.value }],
      zIndex: Platform.OS === 'ios' ? 10000 : 10000,
      elevation: Platform.OS === 'android' ? 10000 : 0,
    };
  });

  const openFullTextModal = () => {
    setShowFullTextModal(true);
    fullTextModalOpacity.value = withTiming(1, { 
      duration: 300, 
      easing: Easing.out(Easing.ease) 
    });
    fullTextModalTranslateY.value = withTiming(0, { 
      duration: 300, 
      easing: Easing.out(Easing.ease) 
    });
  };

  const closeFullTextModal = () => {
    fullTextModalOpacity.value = withTiming(0, { 
      duration: 300, 
      easing: Easing.in(Easing.ease) 
    });
    fullTextModalTranslateY.value = withTiming(SCREEN_HEIGHT, { 
      duration: 300, 
      easing: Easing.in(Easing.ease) 
    });
    setTimeout(() => {
      setShowFullTextModal(false);
    }, 300);
  };

  const renderMediaGrid = () => {
    if (displayedMedia.length === 0) return null;

    if (displayedMedia.length === 1) {
      // صورة واحدة - عرض كامل العرض
      return (
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => openMediaModal(0)}
          activeOpacity={0.9}>
          <Image
            source={{ uri: displayedMedia[0].url }}
            style={styles.singleImage}
            contentFit="cover"
          />
          {displayedMedia[0].type === 'video' && (
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={50} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (displayedMedia.length === 2) {
      // صورتان - جنباً إلى جنب
      return (
        <View style={styles.twoImagesContainer}>
          {displayedMedia.map((media, index) => (
            <TouchableOpacity
              key={index}
              style={styles.twoImageItem}
              onPress={() => openMediaModal(index)}
              activeOpacity={0.9}>
              <Image
                source={{ uri: media.url }}
                style={styles.twoImage}
                contentFit="cover"
              />
              {media.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={40} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (displayedMedia.length === 3) {
      // ثلاث صور - واحدة كبيرة واثنتان صغيرتان
      return (
        <View style={styles.threeImagesContainer}>
          <TouchableOpacity
            style={styles.threeImagesLarge}
            onPress={() => openMediaModal(0)}
            activeOpacity={0.9}>
            <Image
              source={{ uri: displayedMedia[0].url }}
              style={styles.threeImagesLargeImage}
              contentFit="cover"
            />
            {displayedMedia[0].type === 'video' && (
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={50} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.threeImagesSmall}>
            {displayedMedia.slice(1, 3).map((media, index) => (
              <TouchableOpacity
                key={index + 1}
                style={[
                  styles.threeImagesSmallItem,
                  index === displayedMedia.slice(1, 3).length - 1 && styles.threeImagesSmallItemLast,
                ]}
                onPress={() => openMediaModal(index + 1)}
                activeOpacity={0.9}>
                <Image
                  source={{ uri: media.url }}
                  style={styles.threeImagesSmallImage}
                  contentFit="cover"
                />
                {media.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={30} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // 4 صور أو أكثر - grid 2x2
    return (
      <View style={styles.fourImagesContainer}>
        {displayedMedia.map((media, index) => {
          const isLastInRow = index % 2 === 1;
          const isLastRow = index >= 2;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.fourImageItem,
                isLastInRow && styles.fourImageItemLastInRow,
                isLastRow && styles.fourImageItemLastRow,
              ]}
              onPress={() => openMediaModal(index)}
              activeOpacity={0.9}>
              <Image
                source={{ uri: media.url }}
                style={styles.fourImage}
                contentFit="cover"
              />
              {media.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={30} color="#fff" />
                </View>
              )}
              {hasMultipleMedia && index === 3 && remainingCount > 0 && (
                <View style={styles.remainingOverlay}>
                  <View style={styles.remainingBadge}>
                    <Text style={styles.remainingText}>+{remainingCount}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderMediaModal = () => {
    if (allMedia.length === 0) return null;

    return (
      <Modal
        visible={showMediaModal}
        transparent={false}
        animationType="slide"
        onRequestClose={closeMediaModal}>
        <SafeAreaView style={styles.modalContainer}>
          {/* زر الرجوع في الأعلى */}
          <View style={styles.modalTopBar}>
            <TouchableOpacity onPress={closeMediaModal} style={styles.modalCloseButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* الصور مع إمكانية التقلب - تأخذ معظم المساحة */}
          <View style={styles.modalImagesWrapper}>
            <FlatList
              ref={flatListRef}
              data={allMedia}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setSelectedMediaIndex(index);
              }}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: false,
                  });
                });
              }}
              renderItem={({ item, index }) => (
                <View style={styles.modalMediaContainer}>
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.modalImage}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={styles.modalVideoContainer}>
                      <Text style={styles.videoPlaceholder}>Video: {item.url}</Text>
                    </View>
                  )}
                </View>
              )}
              keyExtractor={(item, index) => `media-${index}`}
            />
          </View>

          {/* مؤشرات الصور (dots) تحت الصور مباشرة */}
          {allMedia.length > 1 && (
            <View style={styles.modalDotsIndicator}>
              {allMedia.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.modalDot,
                    index === selectedMediaIndex && styles.modalDotActive,
                    index < allMedia.length - 1 && { marginRight: 8 },
                  ]}
                />
              ))}
            </View>
          )}

          {/* المحتوى القابل للتمرير */}
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}>
            {/* معلومات المستخدم والمحتوى على اليمين */}
            <View style={styles.modalPostContent}>
              {/* الصورة الشخصية */}
              <View style={styles.modalUserImageContainer}>
                <Image
                  source={post.imageURL ? { uri: post.imageURL } : require('@/assets/images/icon.png')}
                  style={styles.modalProfileImageLarge}
                  contentFit="cover"
                />
              </View>

              {/* العنوان */}
              {post.title && (
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitleText}>{post.title}</Text>
                </View>
              )}

              {/* النص مع زر المزيد */}
              {hasContent && (
                <View style={styles.modalContentContainer}>
                  <Text style={styles.modalContentText}>
                    {previewContent}
                  </Text>
                  {isContentLong && (
                    <TouchableOpacity 
                      onPress={openFullTextModal}
                      style={styles.moreButton}>
                      <Text style={styles.moreButtonText}>المزيد</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Tags */}
              {post.postTags && post.postTags.length > 0 && (
                <View style={styles.modalTagsContainer}>
                  {post.postTags.map((tag) => (
                    <View key={tag.id} style={styles.modalTag}>
                      <Text style={styles.modalTagText}>{tag.tagName}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal للنص الكامل - نفس تصميم modal اختيار الدولة */}
          {showFullTextModal && (
            <>
              <Animated.View 
                style={[styles.fullTextModalOverlay, fullTextModalOverlayStyle]}
                pointerEvents="box-none">
                <TouchableOpacity 
                  style={styles.fullTextOverlayTouchable}
                  activeOpacity={1}
                  onPress={closeFullTextModal}
                />
              </Animated.View>
              <Animated.View style={[styles.fullTextModal, fullTextModalStyle]}>
                <View style={styles.fullTextModalCard}>
                  <View style={styles.fullTextModalHeader}>
                    <Text style={styles.fullTextModalTitle}>النص الكامل</Text>
                    <TouchableOpacity 
                      onPress={closeFullTextModal}
                      style={styles.fullTextModalCloseButton}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.fullTextSeparatorLine} />
                  <ScrollView 
                    style={styles.fullTextModalScrollView} 
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}>
                    <Text style={styles.fullTextModalText}>
                      {fullContent}
                    </Text>
                  </ScrollView>
                </View>
              </Animated.View>
            </>
          )}

          {/* Actions على اليسار بشكل عمودي */}
          <View style={styles.modalActionsVertical}>
            <TouchableOpacity 
              style={[styles.modalActionVerticalItem, { marginBottom: 16 }]}
              onPress={() => {
                onLike(post.id);
              }}>
              <Ionicons 
                name={post.isLikedIt ? "heart" : "heart-outline"} 
                size={24} 
                color={post.isLikedIt ? "#FF3B30" : "#666"} 
              />
              {post.numberLike > 0 && (
                <Text style={styles.modalActionCount}>{post.numberLike}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalActionVerticalItem, { marginBottom: 16 }]}
              onPress={() => {
                closeMediaModal();
                onComment(post.id);
              }}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              {post.numberComment !== undefined && post.numberComment > 0 && (
                <Text style={styles.modalActionCount}>{post.numberComment}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalActionVerticalItem}
              onPress={() => onShare(post.id)}>
              <Ionicons name="arrow-up" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={post.imageURL ? { uri: post.imageURL } : require('@/assets/images/icon.png')}
            style={styles.profileImage}
            contentFit="cover"
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.timeAgo}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreOptionsButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      {post.title && (
        <View style={styles.contentContainer}>
          <Text style={styles.titleText}>{post.title}</Text>
        </View>
      )}

      {/* Content */}
      {hasContent && (
        <View style={styles.contentContainer}>
          <Text style={styles.contentText} numberOfLines={3}>
            {stripHtml(post.content)}
          </Text>
        </View>
      )}

      {/* Media (Images & Videos) */}
      {allMedia.length > 0 && (
        <View style={styles.mediaContainer}>
          {renderMediaGrid()}
        </View>
      )}

      {/* Media Modal */}
      {renderMediaModal()}

      {/* Tags */}
      {post.postTags && post.postTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.postTags.map((tag) => (
            <View key={tag.id} style={styles.tag}>
              <Text style={styles.tagText}>{tag.tagName}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onShare(post.id)}>
            <Ionicons name="arrow-up" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.commentButtonContainer}
            onPress={() => onComment(post.id)}
            activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            {post.numberComment !== undefined && post.numberComment > 0 && (
              <Text style={styles.commentCount}>{post.numberComment}</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity 
            style={styles.likeCountContainer}
            onPress={() => onShowLikes && onShowLikes(post.id)}
            disabled={post.numberLike === 0}
            activeOpacity={post.numberLike === 0 ? 1 : 0.7}>
            <Text style={styles.likeCount}>{post.numberLike}</Text>
            <Text style={styles.likeCountLabel}>المعجبين</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => onLike(post.id)}>
            <Ionicons 
              name={post.isLikedIt ? "heart" : "heart-outline"} 
              size={20} 
              color={post.isLikedIt ? "#FF3B30" : "#666"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  moreOptionsButton: {
    padding: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  mediaContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  singleImageContainer: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  twoImagesContainer: {
    flexDirection: 'row',
    height: 250,
  },
  twoImageItem: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 2,
  },
  twoImageItemLast: {
    marginRight: 0,
  },
  twoImage: {
    width: '100%',
    height: '100%',
  },
  threeImagesContainer: {
    flexDirection: 'row',
    height: 300,
  },
  threeImagesLarge: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 2,
  },
  threeImagesLargeImage: {
    width: '100%',
    height: '100%',
  },
  threeImagesSmall: {
    flex: 1,
  },
  threeImagesSmallItem: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginBottom: 2,
  },
  threeImagesSmallItemLast: {
    marginBottom: 0,
  },
  threeImagesSmallImage: {
    width: '100%',
    height: '100%',
  },
  fourImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 300,
  },
  fourImageItem: {
    width: '49%',
    height: '49%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
    marginRight: '2%',
    marginBottom: '2%',
  },
  fourImageItemLastInRow: {
    marginRight: 0,
  },
  fourImageItemLastRow: {
    marginBottom: 0,
  },
  fourImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  remainingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalImagesWrapper: {
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#000',
  },
  modalMediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  modalVideoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    color: '#fff',
    fontSize: 16,
  },
  modalDotsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  modalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  modalDotActive: {
    width: 24,
    backgroundColor: '#085173',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalPostContent: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  modalUserImageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  modalProfileImageLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalTitleContainer: {
    marginBottom: 12,
    width: '100%',
    alignItems: 'flex-end',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'right',
  },
  modalContentContainer: {
    marginBottom: 12,
    width: '100%',
    alignItems: 'flex-end',
  },
  modalContentText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 8,
  },
  moreButton: {
    paddingVertical: 4,
  },
  moreButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
  },
  fullTextModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullTextOverlayTouchable: {
    flex: 1,
  },
  fullTextModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fullTextModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 10000 : 8,
    maxHeight: '80%',
  },
  fullTextModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fullTextModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },
  fullTextModalCloseButton: {
    padding: 4,
  },
  fullTextSeparatorLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  fullTextModalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  fullTextModalText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    textAlign: 'right',
    paddingVertical: 8,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  modalTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  modalTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalActionsVertical: {
    position: 'absolute',
    left: 16,
    bottom: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  modalActionVerticalItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  modalActionCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
  },
  placeholder: {
    width: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
  },
  commentButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  commentCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeCountContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    minWidth: 80,
    justifyContent: 'center',
  },
  likeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  likeCount: {
    fontSize: 14,
    color: '#085173',
    fontWeight: '700',
  },
  likeCountLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

