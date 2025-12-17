import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface CreatePostProps {
  profileImage?: string;
  imageUrl?: string;
  onCreatePost: () => void;
  onSelectImage?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ profileImage, imageUrl, onCreatePost, onSelectImage }) => {
  // Use imageUrl from user data, fallback to profileImage, then default icon
  const userImage = imageUrl || profileImage;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.inputContainer}
        onPress={onCreatePost}
        activeOpacity={0.7}>
        <TextInput
          style={styles.input}
          placeholder="ما الذي يدور في ذهنك؟"
          placeholderTextColor="#999"
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
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionEmoji}>😊</Text>
          <Text style={styles.optionText}>مشاعر أنشطة</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.option}
          onPress={onSelectImage}>
          <Ionicons name="camera" size={20} color="#4CAF50" />
          <Text style={styles.optionText}>صورا فيديو</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="videocam" size={20} color="#FF3B30" />
          <Text style={styles.optionText}>بت مباشر</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
});

