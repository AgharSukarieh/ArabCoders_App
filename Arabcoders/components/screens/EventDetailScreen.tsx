import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { Event } from './EventsScreen';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface EventDetailScreenProps {
  eventId: number;
  onBack: () => void;
}

export function EventDetailScreen({ eventId, onBack }: EventDetailScreenProps) {
  const { isDark } = useTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/events/${eventId}`, {
        headers: {
          'accept': 'text/plain',
        },
      });
      
      console.log('✅ Event details response:', response.data);
      
      if (response.data) {
        setEvent(response.data);
      }
    } catch (error: any) {
      console.error('❌ Error loading event details:', error);
      Alert.alert('خطأ', 'فشل تحميل تفاصيل الحدث');
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

  const handleBookSpot = () => {
    if (event?.linkRegistration) {
      Linking.openURL(event.linkRegistration);
    } else {
      Alert.alert('تنبيه', 'رابط التسجيل غير متوفر');
    }
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    loadingText: { ...styles.loadingText, color: isDark ? '#CCCCCC' : '#666' },
    errorText: { ...styles.errorText, color: isDark ? '#CCCCCC' : '#666' },
    label: { ...styles.label, color: isDark ? '#0C85C1' : '#085173' },
    value: { ...styles.value, color: isDark ? '#FFFFFF' : '#333' },
    description: { ...styles.description, color: isDark ? '#CCCCCC' : '#333' },
    buttonContainer: { ...styles.buttonContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderTopColor: isDark ? '#333333' : '#E5E5E5' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={dynamicStyles.header}>
          <View style={styles.headerSpacer} />
          <Text style={dynamicStyles.headerTitle}>تفاصيل الحدث</Text>
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

  if (!event) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={dynamicStyles.header}>
          <View style={styles.headerSpacer} />
          <Text style={dynamicStyles.headerTitle}>تفاصيل الحدث</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={dynamicStyles.errorText}>حدث خطأ في تحميل البيانات</Text>
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
        <Text style={dynamicStyles.headerTitle}>تفاصيل الحدث</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Event Image */}
        <Image
          source={{ uri: event.imageURL || 'https://via.placeholder.com/400' }}
          style={styles.eventImage}
          contentFit="cover"
        />
        
        {/* Event Details */}
        <View style={[styles.detailsContainer, isDark && { backgroundColor: '#1E1E1E' }]}>
          <Text style={dynamicStyles.label}>عنوان الحدث :</Text>
          <Text style={dynamicStyles.value}>{event.title}</Text>
          
          <Text style={dynamicStyles.label}>الموعد :</Text>
          <Text style={dynamicStyles.value}>{formatDate(event.createdAt)}</Text>
          
          <Text style={dynamicStyles.label}>وصف الحدث :</Text>
          <Text style={dynamicStyles.description}>{event.description}</Text>
          
          <Text style={dynamicStyles.label}>الموقع الحدث :</Text>
          <Text style={dynamicStyles.value}>{event.location}</Text>
          
          {event.keyWord && (
            <>
              <Text style={dynamicStyles.label}>الكلمات المفتاحية :</Text>
              <Text style={dynamicStyles.value}>{event.keyWord}</Text>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Book Spot Button */}
      <View style={dynamicStyles.buttonContainer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookSpot}
          activeOpacity={0.8}>
          <Text style={styles.bookButtonText}>احجز مكانك</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  eventImage: {
    width: '100%',
    height: 250,
  },
  detailsContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#085173',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  value: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bookButton: {
    backgroundColor: '#085173',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

