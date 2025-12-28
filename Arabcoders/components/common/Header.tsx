import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onSearchPress: () => void;
  isFiltered?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSearchPress, isFiltered = false }) => {
  const { isDark } = useTheme();
  
  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.searchButton} onPress={onSearchPress}>
            <Ionicons name={isFiltered ? 'close' : 'search'} size={24} color={isDark ? '#CCCCCC' : '#666'} />
          </TouchableOpacity>
        </View>
        <View style={styles.rightSection}>
          <Image
            source={require('@/assets/images/logo_white.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  leftSection: {
    flex: 1,
  },
  searchButton: {
    paddingBottom: 25,
    paddingLeft: 10,
    alignSelf: 'flex-start',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 0,
  },
  logo: {
    width: 100,
    height: 50,
    transform: [{ scale: 1.9 }],
    paddingTop: 20,
  },
});

