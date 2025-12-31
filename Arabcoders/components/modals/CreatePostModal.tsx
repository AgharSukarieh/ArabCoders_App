import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PostTag } from '@/services/postsService';
import { createPostModalStyles, tagsModalStyles } from '@/styles/modal.styles';
import { TagsModal } from './TagsModal';
import { useTheme } from '@/contexts/ThemeContext';

interface CreatePostModalProps {
  visible: boolean;
  isCreating: boolean;
  currentUser: any;
  userImageUrl?: string;
  userProfileImage?: string;
  title: string;
  text: string;
  images: string[];
  video: string | null;
  selectedTags: PostTag[];
  showTagsModal: boolean;
  loadingTags: boolean;
  tags: PostTag[];
  onTitleChange: (text: string) => void;
  onTextChange: (text: string) => void;
  onSelectImage: () => void;
  onSelectVideo: () => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
  onSelectTag: () => void;
  onTagToggle: (tag: PostTag) => void;
  onCloseTagsModal: () => void;
  onPublish: () => void;
  onClose: () => void;
  isEditing?: boolean;
}

export function CreatePostModal({
  visible,
  isCreating,
  currentUser,
  userImageUrl,
  userProfileImage,
  title,
  text,
  images,
  video,
  selectedTags,
  showTagsModal,
  loadingTags,
  tags,
  onTitleChange,
  onTextChange,
  onSelectImage,
  onSelectVideo,
  onRemoveImage,
  onRemoveVideo,
  onSelectTag,
  onTagToggle,
  onCloseTagsModal,
  onPublish,
  onClose,
  isEditing = false,
}: CreatePostModalProps) {
  const { isDark } = useTheme();

  if (!visible) return null;

  const canPublish = text.trim() || images.length > 0 || video !== null;

  const dynamicStyles = {
    container: { ...createPostModalStyles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...createPostModalStyles.header, borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    title: { ...createPostModalStyles.title, color: isDark ? '#FFFFFF' : '#333' },
    userName: { ...createPostModalStyles.userName, color: isDark ? '#FFFFFF' : '#333' },
    titleInput: { ...createPostModalStyles.titleInput, backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', color: isDark ? '#FFFFFF' : '#333' },
    textInput: { ...createPostModalStyles.textInput, color: isDark ? '#FFFFFF' : '#333' },
    videoWrapper: { ...createPostModalStyles.videoWrapper, backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' },
    videoText: { ...createPostModalStyles.videoText, color: isDark ? '#CCCCCC' : '#666' },
    optionText: { ...createPostModalStyles.optionText, color: isDark ? '#FFFFFF' : '#333' },
    selectedTagsContainer: { ...createPostModalStyles.selectedTagsContainer, borderTopColor: isDark ? '#333333' : '#E5E5E5' },
    selectedTagsTitle: { ...createPostModalStyles.selectedTagsTitle, color: isDark ? '#CCCCCC' : '#666' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#333';
  const videoIconColor = isDark ? '#AAAAAA' : '#999';
  const closeIconColor = isDark ? '#FFFFFF' : '#FFFFFF';
  const tagCloseIconColor = isDark ? '#AAAAAA' : '#666';

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={onClose} style={createPostModalStyles.cancelButton}>
          <Ionicons name="close" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={dynamicStyles.title}>{isEditing ? 'تعديل المنشور' : 'انشاء منشور'}</Text>
        <TouchableOpacity 
          onPress={onPublish}
          disabled={isCreating || !canPublish}
          style={[
            createPostModalStyles.publishButton,
            (isCreating || !canPublish) && createPostModalStyles.publishButtonDisabled
          ]}>
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={createPostModalStyles.publishText}>{isEditing ? 'حفظ' : 'نشر'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={createPostModalStyles.scrollView}
        contentContainerStyle={createPostModalStyles.scrollContent}
        keyboardShouldPersistTaps="handled">
        
        <View style={createPostModalStyles.userInfo}>
          <Image
            source={
              userImageUrl || userProfileImage
                ? { uri: userImageUrl || userProfileImage }
                : require('@/assets/images/icon.png')
            }
            style={createPostModalStyles.userImage}
            contentFit="cover"
          />
          <Text style={dynamicStyles.userName}>
            {currentUser?.userName || currentUser?.name || currentUser?.username || 'المستخدم'}
          </Text>
        </View>

        <TextInput
          style={dynamicStyles.titleInput}
          placeholder="العنوان"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={title}
          onChangeText={onTitleChange}
          textAlignVertical="top"
          autoFocus
        />

        <TextInput
          style={dynamicStyles.textInput}
          placeholder="انشر بماذا تفكر"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={text}
          onChangeText={onTextChange}
          multiline
          textAlignVertical="top"
        />

        {video && (
          <View style={createPostModalStyles.videoContainer}>
            <View style={dynamicStyles.videoWrapper}>
              <View style={createPostModalStyles.videoPlaceholder}>
                <Ionicons name="videocam" size={48} color={videoIconColor} />
                <Text style={dynamicStyles.videoText}>فيديو محدد</Text>
              </View>
              <TouchableOpacity
                style={createPostModalStyles.removeVideoButton}
                onPress={onRemoveVideo}>
                <Ionicons name="close-circle" size={24} color={closeIconColor} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {images.length > 0 && (
          <View style={createPostModalStyles.imagesContainer}>
            {images.map((uri: string, index: number) => (
              <View key={index} style={createPostModalStyles.imageWrapper}>
                <Image
                  source={{ uri }}
                  style={createPostModalStyles.image}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={createPostModalStyles.removeImageButton}
                  onPress={() => onRemoveImage(index)}>
                  <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={createPostModalStyles.optionsContainer}>
          <TouchableOpacity 
            style={createPostModalStyles.option}
            onPress={onSelectImage}>
            <Ionicons name="images-outline" size={24} color="#4CAF50" />
            <Text style={dynamicStyles.optionText}>إضافة المزيد من الصور</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={createPostModalStyles.option}
            onPress={onSelectVideo}>
            <Ionicons name="videocam-outline" size={24} color="#FF3B30" />
            <Text style={dynamicStyles.optionText}>الفيديو</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={createPostModalStyles.option}
            onPress={onSelectTag}>
            <Ionicons name="pricetag-outline" size={24} color="#2196F3" />
            <Text style={dynamicStyles.optionText}>اختيار تاغ</Text>
          </TouchableOpacity>
        </View>

        {selectedTags.length > 0 && (
          <View style={dynamicStyles.selectedTagsContainer}>
            <Text style={dynamicStyles.selectedTagsTitle}>التاغات المختارة:</Text>
            <View style={createPostModalStyles.selectedTagsList}>
              {selectedTags.map((tag: PostTag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={createPostModalStyles.selectedTag}
                  onPress={() => onTagToggle(tag)}>
                  <Text style={createPostModalStyles.selectedTagText}>{tag.tagName}</Text>
                  <Ionicons name="close-circle" size={18} color={tagCloseIconColor} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {showTagsModal && (
        <TagsModal
          visible={showTagsModal}
          loading={loadingTags}
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={onTagToggle}
          onClose={onCloseTagsModal}
        />
      )}
    </SafeAreaView>
  );
}

