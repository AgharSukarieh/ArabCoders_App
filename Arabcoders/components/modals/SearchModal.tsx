import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Post, SearchUser } from '@/services/postsService';
import { searchModalStyles } from '@/styles/modal.styles';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchModalProps {
  visible: boolean;
  searchQuery: string;
  isSearching: boolean;
  searchResults: { posts: Post[]; users: SearchUser[] };
  onSearchInputChange: (text: string) => void;
  onClose: () => void;
  onSelectResult: (type: 'post' | 'user', item: Post | SearchUser) => void;
}

export function SearchModal({
  visible,
  searchQuery,
  isSearching,
  searchResults,
  onSearchInputChange,
  onClose,
  onSelectResult,
}: SearchModalProps) {
  const { isDark } = useTheme();

  if (!visible) return null;

  const dynamicStyles = {
    container: { ...searchModalStyles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...searchModalStyles.header, borderBottomColor: isDark ? '#333333' : '#E0E0E0' },
    inputContainer: { ...searchModalStyles.inputContainer, backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' },
    input: { ...searchModalStyles.input, color: isDark ? '#FFFFFF' : '#333' },
    loadingText: { ...searchModalStyles.loadingText, color: isDark ? '#CCCCCC' : '#666' },
    emptyText: { ...searchModalStyles.emptyText, color: isDark ? '#CCCCCC' : '#999' },
    sectionTitle: { ...searchModalStyles.sectionTitle, color: isDark ? '#FFFFFF' : '#333' },
    resultItem: { ...searchModalStyles.resultItem, borderBottomColor: isDark ? '#333333' : '#F0F0F0' },
    resultText: { ...searchModalStyles.resultText, color: isDark ? '#FFFFFF' : '#333' },
    postTitle: { ...searchModalStyles.postTitle, color: isDark ? '#FFFFFF' : '#333' },
    postText: { ...searchModalStyles.postText, color: isDark ? '#CCCCCC' : '#666' },
    postAuthor: { ...searchModalStyles.postAuthor, color: isDark ? '#AAAAAA' : '#999' },
  };

  const iconColor = isDark ? '#CCCCCC' : '#666';
  const closeIconColor = isDark ? '#FFFFFF' : '#333';
  const chevronColor = isDark ? '#AAAAAA' : '#999';

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.inputContainer}>
          <Ionicons name="search" size={20} color={iconColor} style={searchModalStyles.icon} />
          <TextInput
            style={dynamicStyles.input}
            placeholder="ابحث عن المنشور ..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={onSearchInputChange}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchInputChange('')} style={searchModalStyles.clearButton}>
              <Ionicons name="close-circle" size={20} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={searchModalStyles.closeButton}>
          <Ionicons name="close" size={24} color={closeIconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={searchModalStyles.resultsContainer}>
        {isSearching ? (
          <View style={searchModalStyles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
            <Text style={dynamicStyles.loadingText}>جاري البحث...</Text>
          </View>
        ) : searchQuery.length > 0 && searchResults.posts.length === 0 && searchResults.users.length === 0 ? (
          <View style={searchModalStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>لا توجد نتائج</Text>
          </View>
        ) : (
          <>
            {searchResults.users.length > 0 && (
              <View style={searchModalStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>الحسابات</Text>
                {searchResults.users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={dynamicStyles.resultItem}
                    onPress={() => onSelectResult('user', user)}>
                    <Image
                      source={{ uri: user.imageURL || 'https://via.placeholder.com/50' }}
                      style={searchModalStyles.resultAvatar}
                      contentFit="cover"
                    />
                    <Text style={dynamicStyles.resultText}>{user.userName}</Text>
                    <Ionicons name="chevron-forward" size={20} color={chevronColor} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchResults.posts.length > 0 && (
              <View style={searchModalStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>المنشورات</Text>
                {searchResults.posts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={dynamicStyles.resultItem}
                    onPress={() => onSelectResult('post', post)}>
                    <View style={searchModalStyles.postContent}>
                      <Text style={dynamicStyles.postTitle} numberOfLines={1}>{post.title}</Text>
                      <Text style={dynamicStyles.postText} numberOfLines={2}>{post.content}</Text>
                      <Text style={dynamicStyles.postAuthor}>بواسطة: {post.userName}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={chevronColor} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

