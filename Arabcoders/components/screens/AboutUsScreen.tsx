import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface AboutUsScreenProps {
  onBack: () => void;
}

const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'الأغر سكريه',
    role: 'مطور الواجهة الأمامية',
    image: require('@/assets/images/aghar.jpeg'),
  },
  {
    id: 2,
    name: 'عبد الرحمن صافي',
    role: 'مطور الواجهة الخلفية',
    image: require('@/assets/images/abood.jpeg'),
  },
  {
    id: 3,
    name: 'أحمد نضال',
    role: 'مصمم واجهة المستخدم',
    image: require('@/assets/images/nedal.png'),
  },
  {
    id: 4,
    name: 'سمير صندوقه',
    role: 'مدير المشروع',
    image: require('@/assets/images/sameer.png'),
  },
];

export function AboutUsScreen({ onBack }: AboutUsScreenProps) {
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bannerScale = useRef(new Animated.Value(0.9)).current;
  
  // Animation refs for cards
  const box1Anim = useRef(new Animated.Value(0)).current;
  const box2Anim = useRef(new Animated.Value(0)).current;
  const teamAnim = useRef(new Animated.Value(0)).current;
  const info1Anim = useRef(new Animated.Value(0)).current;
  const info2Anim = useRef(new Animated.Value(0)).current;
  const memberAnims = useRef(TEAM_MEMBERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animations for cards
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(box1Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(box2Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    // Team section animation
    setTimeout(() => {
      Animated.spring(teamAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 600);

    // Team members staggered animation
    setTimeout(() => {
      memberAnims.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    }, 900);

    // Info cards animation
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(info1Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(info2Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1200);
  }, []);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const bannerAnimatedStyle = {
    transform: [{ scale: bannerScale }],
  };

  const getCardAnimation = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
    ],
  });

  const getMemberAnimation = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
    ],
  });

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    header: { ...styles.header, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderBottomColor: isDark ? '#333333' : '#E5E5E5' },
    headerTitle: { ...styles.headerTitle, color: isDark ? '#FFFFFF' : '#085173' },
    inputFieldContainer: { ...styles.inputFieldContainer, backgroundColor: isDark ? '#1E1E1E' : '#F8F9FA', borderColor: isDark ? '#333' : '#E3F2FD' },
    inputField: { ...styles.inputField, color: isDark ? '#FFFFFF' : '#333' },
    inputLabel: { ...styles.inputLabel, color: isDark ? '#0C85C1' : '#085173' },
    boxTitle: { ...styles.boxTitle, color: isDark ? '#FFFFFF' : '#085173' },
    boxDescription: { ...styles.boxDescription, color: isDark ? '#CCCCCC' : '#555' },
    teamSectionTitle: { ...styles.teamSectionTitle, color: isDark ? '#FFFFFF' : '#085173' },
    teamMemberName: { ...styles.teamMemberName, color: isDark ? '#FFFFFF' : '#085173' },
    teamMemberRole: { ...styles.teamMemberRole, color: isDark ? '#AAAAAA' : '#666' },
    infoCardTitle: { ...styles.infoCardTitle, color: isDark ? '#FFFFFF' : '#085173' },
    infoCardText: { ...styles.infoCardText, color: isDark ? '#CCCCCC' : '#555' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerSpacer} />
        <Text style={dynamicStyles.headerTitle}>من نحن</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <Animated.View style={animatedStyle}>
          {/* Icon Header */}
          <View style={styles.iconHeaderContainer}>
            <View style={[styles.iconContainer, isDark && { backgroundColor: '#1E1E1E' }]}>
              <Ionicons name="information-circle" size={64} color={isDark ? '#0C85C1' : '#085173'} />
            </View>
          </View>

          {/* About Section */}
          <View style={styles.aboutSection}>
            <Text style={[styles.aboutTitle, { color: isDark ? '#FFFFFF' : '#085173' }]}>من نحن</Text>
            <Text style={[styles.aboutDescription, { color: isDark ? '#CCCCCC' : '#555' }]}>
              منصة عرب كودرز هي منصة تعليمية وتنافسية مخصصة للمبرمجين العرب. نسعى لتوفير بيئة متكاملة تجمع بين التعلم العملي والمنافسة الشريفة في حل المشاكل البرمجية.
            </Text>
            <Text style={[styles.aboutDescription, { color: isDark ? '#CCCCCC' : '#555' }]}>
              نهدف إلى تطوير مهارات المبرمجين العرب وبناء مجتمع قوي من المطورين المتميزين من خلال مسابقات برمجية متنوعة، موارد تعليمية شاملة، ونظام تصنيف متقدم.
            </Text>
          </View>

          {/* Two Boxes Section */}
          <View style={styles.boxesContainer}>
            <Animated.View style={[styles.boxWrapper, getCardAnimation(box1Anim)]}>
              <LinearGradient
                colors={isDark ? ['#1A3A4A', '#1A4A5A'] : ['#E3F2FD', '#BBDEFB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.box}>
                <View style={[styles.boxIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                  <Ionicons name="trophy" size={48} color={iconColor} />
                </View>
                <Text style={dynamicStyles.boxTitle}>المسابقات البرمجية</Text>
                <Text style={dynamicStyles.boxDescription}>
                  انضم إلى مسابقات برمجية متنوعة ومثيرة لتحسين مهاراتك البرمجية وتحدي نفسك مع أفضل المبرمجين العرب. احصل على نقاط وارتقِ في التصنيفات.
                </Text>
              </LinearGradient>
            </Animated.View>
            
            <Animated.View style={[styles.boxWrapper, getCardAnimation(box2Anim)]}>
              <LinearGradient
                colors={isDark ? ['#1A3A2A', '#1A4A3A'] : ['#E8F5E9', '#C8E6C9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.box}>
                <View style={[styles.boxIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                  <Ionicons name="school" size={48} color={iconColor} />
                </View>
                <Text style={dynamicStyles.boxTitle}>التعلم والتطوير</Text>
                <Text style={dynamicStyles.boxDescription}>
                  استفد من موارد تعليمية شاملة تغطي جميع مستويات البرمجة. حل المشاكل البرمجية، تعلم الخوارزميات، وطور مهاراتك بشكل مستمر.
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Team Section */}
          <Animated.View style={[styles.teamSection, { opacity: teamAnim }]}>
            <Text style={dynamicStyles.teamSectionTitle}>فريق العمل</Text>
            <View style={styles.teamRow}>
              {TEAM_MEMBERS.map((member, index) => (
                <Animated.View
                  key={member.id}
                  style={[styles.teamMember, getMemberAnimation(memberAnims[index])]}>
                  <View style={styles.teamMemberImageContainer}>
                    <Image
                      source={member.image}
                      style={styles.teamMemberImage}
                      contentFit="cover"
                    />
                    <View style={[styles.teamMemberImageBorder, isDark && { borderColor: '#0C85C1' }]} />
                  </View>
                  <Text style={dynamicStyles.teamMemberName}>{member.name}</Text>
                  <Text style={dynamicStyles.teamMemberRole}>{member.role}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Additional Info */}
          <View style={styles.infoSection}>
            <Animated.View style={[styles.infoCardWrapper, getCardAnimation(info1Anim)]}>
              <LinearGradient
                colors={isDark ? ['#3A3A2A', '#4A4A3A'] : ['#FFF3E0', '#FFE0B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.infoCard, isDark && { borderLeftColor: '#0C85C1' }]}>
                <View style={[styles.infoCardIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                  <Ionicons name="flag" size={32} color={iconColor} />
                </View>
                <Text style={dynamicStyles.infoCardTitle}>رؤيتنا</Text>
                <Text style={dynamicStyles.infoCardText}>
                  أن نكون المنصة الرائدة في العالم العربي لتطوير مهارات البرمجة والتنافس. نسعى لبناء مجتمع قوي من المبرمجين المتميزين الذين يساهمون في تطوير التقنية في المنطقة العربية.
                </Text>
              </LinearGradient>
            </Animated.View>
            
            <Animated.View style={[styles.infoCardWrapper, getCardAnimation(info2Anim)]}>
              <LinearGradient
                colors={isDark ? ['#3A2A3A', '#4A3A4A'] : ['#F3E5F5', '#E1BEE7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.infoCard, isDark && { borderLeftColor: '#0C85C1' }]}>
                <View style={[styles.infoCardIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                  <Ionicons name="bulb" size={32} color={iconColor} />
                </View>
                <Text style={dynamicStyles.infoCardTitle}>رسالتنا</Text>
                <Text style={dynamicStyles.infoCardText}>
                  توفير بيئة تعليمية وتنافسية شاملة للمبرمجين العرب لتحقيق أقصى إمكاناتهم. نؤمن بأن كل مبرمج عربي يستحق فرصة متساوية للتعلم والنمو والتميز في عالم البرمجة.
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  iconHeaderContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  aboutSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#085173',
    marginBottom: 20,
    textAlign: 'right',
  },
  aboutDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 28,
    textAlign: 'right',
    marginBottom: 16,
  },
  boxesContainer: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  boxWrapper: {
    flex: 1,
  },
  box: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200,
  },
  boxIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 12,
    textAlign: 'center',
  },
  boxDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  teamSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  teamSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 24,
    textAlign: 'right',
  },
  teamRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  teamMember: {
    width: (SCREEN_WIDTH - 64) / 4,
    alignItems: 'center',
  },
  teamMemberImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  teamMemberImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  teamMemberImageBorder: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#085173',
    top: 0,
    left: 0,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 4,
    textAlign: 'center',
  },
  teamMemberRole: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  infoCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCard: {
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 5,
    borderLeftColor: '#085173',
  },
  infoCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoCardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    textAlign: 'right',
  },
});
