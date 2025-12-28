import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { likesModalStyles } from '@/styles/modal.styles';

interface Like {
  userId: number;
  userName: string;
  imageURL: string;
}

interface LikesModalProps {
  visible: boolean;
  loading: boolean;
  likes: Like[];
  modalHeight: Animated.Value;
  onClose: () => void;
}

export function LikesModal({ visible, loading, likes, modalHeight, onClose }: LikesModalProps) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        const { dy } = gestureState;
        if (dy < 0) {
          const newHeight = Math.min(600, 400 - dy);
          modalHeight.setValue(newHeight);
        } else if (dy > 0) {
          const newHeight = Math.max(200, 400 - dy);
          modalHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_: any, gestureState: any) => {
        const { dy } = gestureState;
        if (dy > 100) {
          onClose();
        } else {
          Animated.spring(modalHeight, {
            toValue: 400,
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      style={likesModalStyles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableOpacity 
        style={likesModalStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View 
        style={[
          likesModalStyles.content,
          {
            height: modalHeight,
          }
        ]}
        {...panResponder.panHandlers}>
        <View style={likesModalStyles.dragHandle}>
          <View style={likesModalStyles.dragHandleBar} />
        </View>
        <View style={likesModalStyles.header}>
          <Text style={likesModalStyles.title}>المعجبين</Text>
          <TouchableOpacity 
            onPress={onClose}
            style={likesModalStyles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={likesModalStyles.separator} />

        <ScrollView 
          style={likesModalStyles.list}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}>
          {loading ? (
            <View style={likesModalStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#085173" />
            </View>
          ) : likes.length === 0 ? (
            <View style={likesModalStyles.emptyContainer}>
              <Text style={likesModalStyles.emptyText}>لا يوجد معجبين</Text>
            </View>
          ) : (
            likes.map((like) => (
              <View key={like.userId} style={likesModalStyles.item}>
                <Image
                  source={
                    like.imageURL 
                      ? { uri: like.imageURL }
                      : require('@/assets/images/icon.png')
                  }
                  style={likesModalStyles.userImage}
                  contentFit="cover"
                />
                <Text style={likesModalStyles.userName}>{like.userName}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

