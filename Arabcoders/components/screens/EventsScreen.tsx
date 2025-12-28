import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';


export interface Event {
  id: number;
  title: string;
  description: string;
  imageURL: string;
  createdAt: string;
  location: string;
  keyWord: string;
  linkRegistration: string;
  views: number;
  numberClickedButton: number;
}

export interface EventsScreenProps {
  onBack: () => void;
  onEventPress?: (eventId: number) => void;
}

export function EventsScreen({ onBack, onEventPress }: EventsScreenProps) {
  const { isDark } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events', {
        headers: {
          'accept': 'text/plain',
        },
      });
      
      console.log('✅ Events response:', response.data);
      
      let data = Array.isArray(response.data) ? response.data : [];
      
      // ترتيب الأحداث حسب التاريخ (الأحدث أولاً)
      data = data.sort((a: Event, b: Event) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setEvents(data);
    } catch (error: any) {
      console.error('❌ Error loading events:', error);
      console.error('❌ Error response:', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const handleEventPress = (event: Event) => {
    if (onEventPress) {
      onEventPress(event.id);
    }
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    loadingText: { ...styles.loadingText, color: isDark ? '#CCCCCC' : '#666' },
    eventTitle: { color: isDark ? '#FFFFFF' : '#FFFFFF' },
    eventDate: { color: isDark ? '#CCCCCC' : '#FFFFFF' },
    moreInfoText: { color: isDark ? '#FFFFFF' : '#FFFFFF' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={dynamicStyles.header}>
          <View style={styles.headerSpacer} />
          <Text style={dynamicStyles.headerTitle}>جميع الأحداث</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
          <Text style={dynamicStyles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <Text style={dynamicStyles.headerTitle}>جميع الأحداث</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => handleEventPress(event)}
            activeOpacity={0.9}>
            {/* Event Image */}
            <Image
              source={{ uri: event.imageURL || 'https://via.placeholder.com/400' }}
              style={styles.eventImage}
              contentFit="cover"
            />
            
            {/* Event Info Overlay */}
            <View style={styles.eventOverlay}>
              <TouchableOpacity
                style={styles.moreInfoButton}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.8}>
                <Text style={dynamicStyles.moreInfoText}>المزيد من المعلومات</Text>
              </TouchableOpacity>
              <View style={styles.eventInfo}>
                <Text style={dynamicStyles.eventTitle}>{event.title}</Text>
                <Text style={dynamicStyles.eventDate}>الموعد: {formatDate(event.createdAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#085173',
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  eventCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'right',
  },
  eventDate: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  moreInfoButton: {
    backgroundColor: '#085173',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  moreInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

