import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavProps {
  activeTab: 'home' | 'competitions' | 'notifications' | 'more';
  onTabPress: (tab: 'home' | 'competitions' | 'notifications' | 'more') => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress, unreadCount = 0 }) => {
  // ألوان ثابتة - لا تتغير مع الوضع الليلي
  const PRIMARY_COLOR = '#085173';
  const TEXT_WHITE = '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: PRIMARY_COLOR }]}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('home')}
        activeOpacity={0.7}>
        <View style={styles.tabContent}>
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={TEXT_WHITE}
          />
          <Text style={[styles.tabLabel, { color: TEXT_WHITE }]}>
            الرئيسيه
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('competitions')}
        activeOpacity={0.7}>
        <View style={styles.tabContent}>
          <Ionicons
            name={activeTab === 'competitions' ? 'trophy' : 'trophy-outline'}
            size={24}
            color={TEXT_WHITE}
          />
          <Text style={[styles.tabLabel, { color: TEXT_WHITE }]}>
            المسابقات
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('notifications')}
        activeOpacity={0.7}>
        <View style={styles.tabContent}>
          <Ionicons
            name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
            size={24}
            color={TEXT_WHITE}
          />
          <Text style={[styles.tabLabel, { color: TEXT_WHITE }]}>
            الاشعارات
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('more')}
        activeOpacity={0.7}>
        <View style={styles.tabContent}>
          <Ionicons
            name={activeTab === 'more' ? 'menu' : 'menu-outline'}
            size={24}
            color={TEXT_WHITE}
          />
          <Text style={[styles.tabLabel, { color: TEXT_WHITE }]}>
            المزيد
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '400',
  },
  notificationIconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

