import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PostTag } from '@/services/postsService';
import { tagsModalStyles } from '@/styles/modal.styles';
import { useTheme } from '@/contexts/ThemeContext';

interface TagsModalProps {
  visible: boolean;
  loading: boolean;
  tags: PostTag[];
  selectedTags: PostTag[];
  onTagToggle: (tag: PostTag) => void;
  onClose: () => void;
}

export function TagsModal({
  visible,
  loading,
  tags,
  selectedTags,
  onTagToggle,
  onClose,
}: TagsModalProps) {
  const { isDark } = useTheme();

  if (!visible) return null;

  const dynamicStyles = {
    backdrop: { ...tagsModalStyles.backdrop, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' },
    container: { ...tagsModalStyles.container, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    header: { ...tagsModalStyles.header, borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    title: { ...tagsModalStyles.title, color: isDark ? '#FFFFFF' : '#333' },
    emptyText: { ...tagsModalStyles.emptyText, color: isDark ? '#CCCCCC' : '#999' },
    tagItem: { ...tagsModalStyles.tagItem, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5' },
    tagItemSelected: { ...tagsModalStyles.tagItemSelected, backgroundColor: isDark ? '#1A3A4A' : '#E3F2FD', borderColor: '#085173' },
    tagItemImagePlaceholder: { ...tagsModalStyles.tagItemImagePlaceholder, backgroundColor: isDark ? '#1E1E1E' : '#E0E0E0' },
    tagItemName: { ...tagsModalStyles.tagItemName, color: isDark ? '#FFFFFF' : '#333' },
    tagItemDescription: { ...tagsModalStyles.tagItemDescription, color: isDark ? '#CCCCCC' : '#666' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#333';
  const placeholderIconColor = isDark ? '#666' : '#999';
  const checkmarkColor = isDark ? '#0C85C1' : '#085173';

  return (
    <View style={tagsModalStyles.overlay}>
      <TouchableOpacity 
        style={dynamicStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={dynamicStyles.container}>
        <SafeAreaView style={tagsModalStyles.safeArea}>
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.title}>اختيار تاغ</Text>
            <TouchableOpacity onPress={onClose} style={tagsModalStyles.closeButton}>
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={tagsModalStyles.scrollView}
            contentContainerStyle={tagsModalStyles.scrollContent}>
            {loading ? (
              <View style={tagsModalStyles.loadingContainer}>
                <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
              </View>
            ) : tags.length === 0 ? (
              <View style={tagsModalStyles.emptyContainer}>
                <Text style={dynamicStyles.emptyText}>لا توجد تاغات متاحة</Text>
              </View>
            ) : (
              tags.map((tag: PostTag) => {
                const isSelected = selectedTags.some((t: PostTag) => t.id === tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      dynamicStyles.tagItem,
                      isSelected && dynamicStyles.tagItemSelected
                    ]}
                    onPress={() => onTagToggle(tag)}>
                    {tag.imageURL ? (
                      <Image
                        source={{ uri: tag.imageURL }}
                        style={tagsModalStyles.tagItemImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={dynamicStyles.tagItemImagePlaceholder}>
                        <Ionicons name="pricetag" size={24} color={placeholderIconColor} />
                      </View>
                    )}
                    <View style={tagsModalStyles.tagItemContent}>
                      <Text style={dynamicStyles.tagItemName}>{tag.tagName}</Text>
                      <Text style={dynamicStyles.tagItemDescription}>{tag.shortDescription}</Text>
                    </View>
                    {isSelected && (
                      <View style={tagsModalStyles.tagItemCheckmark}>
                        <Ionicons name="checkmark-circle" size={24} color={checkmarkColor} />
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
  );
}

