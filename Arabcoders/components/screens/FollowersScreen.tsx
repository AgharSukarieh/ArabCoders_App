import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AnimatedReanimated, { FadeInDown } from 'react-native-reanimated';
import api from '@/services/api';

export interface FollowerUser {
  id: number;
  email: string;
  userName: string;
  imageUrl: string;
  registerAt: string;
  country: any;
  universityId: number | null;
  universityName: string;
}

export interface FollowersScreenProps {
  userId: number;
  onBack: () => void;
  onUserPress: (userId: number) => void;
}

export function FollowersScreen({ userId, onBack, onUserPress }: FollowersScreenProps) {
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      console.log('📤 Loading followers for user:', userId);
      
      const response = await api.get(`/api/follows/users/${userId}/followers`);
      console.log('✅ Followers loaded:', response.data);
      
      const followersData = Array.isArray(response.data) ? response.data : [];
      setFollowers(followersData);
    } catch (error: any) {
      console.error('❌ Error loading followers:', error);
      // إذا كان الخطأ 404، يعني لا يوجد followers
      if (error.response?.status !== 404) {
        console.error('Error loading followers:', error);
      }
      setFollowers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFollowers();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>يتابع</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#085173" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#085173" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>لا يوجد أشخاص يتابعهم</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#085173']}
              tintColor="#085173"
            />
          }>
          {followers.map((user, index) => (
            <AnimatedReanimated.View
              key={user.id}
              entering={FadeInDown.delay(index * 50).springify()}>
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => onUserPress(user.id)}
                activeOpacity={0.7}>
                <Image
                  source={
                    user.imageUrl && user.imageUrl !== 'xx@xx'
                      ? { uri: user.imageUrl }
                      : require('@/assets/images/icon.png')
                  }
                  style={styles.userImage}
                  contentFit="cover"
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.userName || 'مستخدم'}</Text>
                  {user.email && user.email !== 'xx@xx' && (
                    <Text style={styles.userEmail}>{user.email}</Text>
                  )}
                  {user.registerAt && (
                    <Text style={styles.userDate}>
                      انضم في {formatDate(user.registerAt)}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
              </TouchableOpacity>
            </AnimatedReanimated.View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#085173',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
});

