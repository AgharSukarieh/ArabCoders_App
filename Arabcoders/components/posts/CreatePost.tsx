import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface CreatePostProps {
  profileImage?: string;
  imageUrl?: string;
  onCreatePost: () => void;
  onSelectImage?: () => void;
  onSelectVideo?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ profileImage, imageUrl, onCreatePost, onSelectImage, onSelectVideo }) => {
  const { isDark } = useTheme();
  // Use imageUrl from user data, fallback to profileImage, then default icon
  const userImage = imageUrl || profileImage;
  
  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    input: { ...styles.input, backgroundColor: isDark ? '#2E2E2E' : '#F5F5F5', color: isDark ? '#FFFFFF' : '#000' },
    optionText: { ...styles.optionText, color: isDark ? '#E0E0E0' : '#333' },
  };
  
  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity 
        style={styles.inputContainer}
        onPress={onCreatePost}
        activeOpacity={0.7}>
        <TextInput
          style={dynamicStyles.input}
          placeholder="ما الذي يدور في ذهنك؟"
          placeholderTextColor={isDark ? '#888' : '#999'}
          multiline
          editable={false}
          pointerEvents="none"
        />
        <Image
          source={userImage ? { uri: userImage } : require('@/assets/images/icon.png')}
          style={styles.profileImage}
          contentFit="cover"
        />
      </TouchableOpacity>
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.option}
          onPress={onSelectImage}>
          <Text style={dynamicStyles.optionText}>صور</Text>
          <Ionicons name="images-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.option}
          onPress={onSelectVideo}>
          <Text style={dynamicStyles.optionText}>فيديو</Text>
          <Ionicons name="videocam-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    textAlign: 'right',
    minHeight: 44,
    maxHeight: 100,
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  optionsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: 8,
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
});

