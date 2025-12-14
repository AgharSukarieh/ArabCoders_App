import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/services/postsService';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onShare: (postId: number) => void;
  onPostPress?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onPostPress }) => {
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
        <TouchableOpacity style={styles.moreButton}>
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

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {post.images.map((imageUrl, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => onPostPress && onPostPress(post)}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.postImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

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
          <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post.id)}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => onLike(post.id)}>
            <Text style={styles.likeButtonText}>المعجبين</Text>
            <Text style={styles.likeCount}>{post.numberLike}</Text>
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
  moreButton: {
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
  imagesContainer: {
    marginTop: 8,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
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
  },
  actionButton: {
    padding: 4,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  likeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});

