import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import api from '@/services/api';
import { getStoredSession, getStoredUser } from '@/services/storage';
import { getCountries, getUniversities, updateUser, sendOtpForEmailReset } from '@/services/authService';
import { Stars } from '@/components/common/Stars';
import { FollowingScreen } from './FollowingScreen';
import { FollowersScreen } from './FollowersScreen';
import { ProgressCircle } from '@/components/common/ProgressCircle';
import { useTheme } from '@/contexts/ThemeContext';

export interface ProfileScreenProps {
  onBack: () => void;
  onUserPress?: (userId: number) => void;
}

export function ProfileScreen({ onBack, onUserPress }: ProfileScreenProps) {
  const { isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [bellFollowersCount, setBellFollowersCount] = useState(0);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [universities, setUniversities] = useState<Array<{ id: number; name: string; imageUrl?: string }>>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [countries, setCountries] = useState<Array<{ id: number; nameCountry: string; iconUrl: string }>>([]);
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [problemTotals, setProblemTotals] = useState<{ total: number; easy: number; medium: number; hard: number }>({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadUserProblems();
  }, []);

  useEffect(() => {
    if (user?.responseUserDTO?.id) {
      loadBellFollowers(user.responseUserDTO.id);
    }
  }, [user]);

  useEffect(() => {
    loadCountries();
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      const list = await getUniversities();
      if (Array.isArray(list) && list.length > 0) {
        setUniversities(list.map(uni => ({
          id: uni.id,
          name: uni.nameUniversity || '',
          imageUrl: uni.imageUrl,
        })));
      } else {
        // استخدام قائمة افتراضية في حالة عدم وجود بيانات
        setUniversities([
          { id: 1, name: 'الجامعة الأردنية' },
          { id: 2, name: 'جامعة العلوم والتكنولوجيا' },
          { id: 3, name: 'جامعة مؤتة' },
          { id: 4, name: 'جامعة اليرموك' },
        ]);
      }
    } catch (error) {
      console.error('Error loading universities:', error);
      // استخدام قائمة افتراضية في حالة الخطأ
      setUniversities([
        { id: 1, name: 'الجامعة الأردنية' },
        { id: 2, name: 'جامعة العلوم والتكنولوجيا' },
        { id: 3, name: 'جامعة مؤتة' },
        { id: 4, name: 'جامعة اليرموك' },
      ]);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        damping: 12,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  useEffect(() => {
    if (user?.responseUserDTO && universities.length > 0) {
      const userData = user.responseUserDTO;
      const email = user?.email || userData.email || '';
      setEditName(userData.userName || user?.username || '');
      setEditEmail(email);
      setOriginalEmail(email);
      
      // البحث عن الجامعة من القائمة بناءً على universityId أو universityName
      if (userData.universityId) {
        const university = universities.find(uni => uni.id === userData.universityId);
        if (university) {
          setEditUniversity(university.name);
          setSelectedUniversityId(university.id);
        } else {
          setEditUniversity(userData.universityName || '');
          setSelectedUniversityId(userData.universityId);
        }
      } else if (userData.universityName) {
        const university = universities.find(uni => uni.name === userData.universityName);
        if (university) {
          setEditUniversity(university.name);
          setSelectedUniversityId(university.id);
        } else {
          setEditUniversity(userData.universityName);
          setSelectedUniversityId(null);
        }
      } else {
        setEditUniversity('');
        setSelectedUniversityId(null);
      }
      
      setEditCity(userData.country?.nameCountry || '');
      setEditProfileImage(userData.imageUrl || userData.imageURL || null);
    } else if (user?.responseUserDTO) {
      // إذا لم يتم تحميل الجامعات بعد، نستخدم البيانات المتاحة
      const userData = user.responseUserDTO;
      const email = user?.email || userData.email || '';
      setEditName(userData.userName || user?.username || '');
      setEditEmail(email);
      setOriginalEmail(email);
      setEditUniversity(userData.universityName || '');
      setSelectedUniversityId(userData.universityId || null);
      setEditCity(userData.country?.nameCountry || '');
      setEditProfileImage(userData.imageUrl || userData.imageURL || null);
    }
  }, [user, universities]);

  useEffect(() => {
    if (showEditPage) {
      const email = user?.email || user?.responseUserDTO?.email || '';
      console.log('📧 Setting originalEmail on edit page open:', email);
      setOriginalEmail(email);
      setOtp('');
      setShowOtpInput(false);
    }
  }, [showEditPage, user]);

  const pickProfileImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'نحتاج إلى إذن للوصول إلى الصور!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setEditProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!user?.responseUserDTO?.id) {
        Alert.alert('خطأ', 'لا يمكن تحديث البيانات');
        return;
      }

      setUpdating(true);

      const userId = user.responseUserDTO.id;
      const emailChanged = originalEmail.trim() !== editEmail.trim();

      // إذا تم تغيير الإيميل ولم يتم إدخال OTP بعد
      if (emailChanged && !showOtpInput) {
        console.log('📧 Email changed, sending OTP to new email:', editEmail);
        try {
          await sendOtpForEmailReset(editEmail.trim());
          setShowOtpInput(true);
          Alert.alert(
            'رمز التحقق',
            'تم إرسال رمز التحقق إلى الإيميل الجديد. يرجى إدخال الرمز للمتابعة.'
          );
        } catch (error: any) {
          Alert.alert('خطأ', error?.message || 'فشل إرسال رمز التحقق');
        } finally {
          setUpdating(false);
        }
        return;
      }

      // التحقق من OTP إذا تم تغيير الإيميل
      if (emailChanged && (!otp || !otp.trim())) {
        Alert.alert('خطأ', 'يرجى إدخال رمز التحقق');
        setUpdating(false);
        return;
      }

      // الحصول على معرف الدولة
      const selectedCountry = countries.find(c => c.nameCountry === editCity);
      const countryId = selectedCountry?.id || user?.responseUserDTO?.country?.id || 0;

      // رفع الصورة إذا تم اختيار صورة جديدة
      let imageURL = user?.responseUserDTO?.imageUrl || user?.responseUserDTO?.imageURL || '';
      
      // إذا تم اختيار صورة جديدة وكانت محلية (file://)، يجب رفعها أولاً
      if (editProfileImage && (editProfileImage.startsWith('file://') || (!editProfileImage.startsWith('http://') && !editProfileImage.startsWith('https://')))) {
        try {
          console.log('📤 Uploading profile image...');
          const formData = new FormData();
          const filename = editProfileImage.split('/').pop() || `profile_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('image', {
            uri: editProfileImage,
            type: type,
            name: filename,
          } as any);

          const uploadResponse = await api.post('/api/uploads/images', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // استخراج URL من الـ response
          if (typeof uploadResponse.data === 'string') {
            imageURL = uploadResponse.data;
          } else if (uploadResponse.data?.url) {
            imageURL = uploadResponse.data.url;
          } else if (uploadResponse.data?.imageUrl) {
            imageURL = uploadResponse.data.imageUrl;
          } else if (uploadResponse.data?.data?.url) {
            imageURL = uploadResponse.data.data.url;
          } else if (Array.isArray(uploadResponse.data) && uploadResponse.data.length > 0) {
            imageURL = uploadResponse.data[0];
          }

          if (!imageURL || !imageURL.startsWith('http')) {
            throw new Error('فشل رفع الصورة: لم يتم الحصول على URL صحيح');
          }

          console.log('✅ Profile image uploaded successfully:', imageURL);
        } catch (error: any) {
          console.error('❌ Error uploading profile image:', error);
          throw new Error(`فشل رفع الصورة: ${error?.response?.data?.message || error?.message || 'خطأ غير معروف'}`);
        }
      } else if (editProfileImage && editProfileImage.startsWith('http')) {
        // إذا كانت الصورة URL موجودة، نستخدمها مباشرة
        imageURL = editProfileImage;
        console.log('✅ Using existing image URL:', imageURL);
      }

      // استخدام الإيميل القديم إذا لم يتم تغييره أو كان فارغاً
      const emailToSend = editEmail.trim() || originalEmail.trim() || user?.email || user?.responseUserDTO?.email || '';
      
      if (!emailToSend) {
        Alert.alert('خطأ', 'البريد الإلكتروني مطلوب');
        setUpdating(false);
        return;
      }

      const updateData = {
        id: userId, // استخدام id المستخدم الحقيقي
        email: emailToSend,
        userName: editName.trim() || user?.responseUserDTO?.userName || user?.username || '',
        imageURL: imageURL,
        countryId: countryId,
        universityId: selectedUniversityId || 0,
        otp: emailChanged ? otp.trim() : '',
      };

      console.log('📤 Sending update:', { updateData, userId });

      await updateUser(userId, updateData, originalEmail);

      Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
      setShowEditPage(false);
      setShowOtpInput(false);
      setOtp('');
      loadUser(); // إعادة تحميل بيانات المستخدم
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('خطأ', error?.message || 'فشل تحديث البيانات');
    } finally {
      setUpdating(false);
    }
  };

  const animateNumber = (from: number, to: number, duration: number, setter: (value: number) => void) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + (to - from) * easeOut);
      setter(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  };

  const loadBellFollowers = async (userId: number) => {
    try {
      const response = await api.get(`/api/Users/${userId}/bell-activations`);
      setBellFollowersCount(Number(response?.data) || 0);
    } catch (error) {
      console.error('Error loading bell followers count:', error);
    }
  };

  const loadCountries = async () => {
    try {
      const list = await getCountries();
      if (Array.isArray(list) && list.length > 0) {
        setCountries(list);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const renderPickerSheet = (
    visible: boolean,
    items: string[],
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerSheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerSheetContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.pickerSheetHeader}>
            <View style={styles.pickerSheetHandle} />
          </View>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={true}>
            <View style={styles.pickerList}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={dynamicStyles.pickerItem}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  activeOpacity={0.7}>
                  <Text style={dynamicStyles.pickerItemText}>{item}</Text>
                  <Ionicons name="chevron-back" size={18} color={chevronColor} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderUniversityPickerSheet = (
    visible: boolean,
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerSheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerSheetContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.pickerSheetHeader}>
            <View style={styles.pickerSheetHandle} />
          </View>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={true}>
            <View style={styles.pickerList}>
              {universities.map((university) => (
                <TouchableOpacity
                  key={university.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    onSelect(university.name);
                    setSelectedUniversityId(university.id);
                    setEditUniversity(university.name);
                    onClose();
                  }}
                  activeOpacity={0.7}>
                  <View style={styles.pickerItemContent}>
                    {university.imageUrl && (
                      <Image
                        source={{ uri: university.imageUrl }}
                        style={styles.universityImage}
                        contentFit="cover"
                      />
                    )}
                    <Text style={dynamicStyles.pickerItemText}>{university.name}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color={chevronColor} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderCountryPickerSheet = (
    visible: boolean,
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerSheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerSheetContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.pickerSheetHeader}>
            <View style={styles.pickerSheetHandle} />
          </View>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={true}>
            <View style={styles.pickerList}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    onSelect(country.nameCountry);
                    onClose();
                  }}
                  activeOpacity={0.7}>
                  <View style={styles.pickerItemContent}>
                    {country.iconUrl && (
                      <Image
                        source={{ uri: country.iconUrl }}
                        style={styles.countryFlag}
                        contentFit="cover"
                      />
                    )}
                    <Text style={dynamicStyles.pickerItemText}>{country.nameCountry}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color={chevronColor} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const loadUser = async () => {
    try {
      setLoading(true);
      const session = await getStoredSession();
      const userData = await getStoredUser();
      const fallbackUser = {
        email: 'aghar4136@gmail.com',
        username: 'Aghar',
        responseUserDTO: {
          id: 38,
          email: 'aghar4136@gmail.com',
          userName: 'Aghar',
          imageUrl:
            'https://res.cloudinary.com/digyprtg5/image/upload/v1763297553/ProblemSolvingProject/fhfkycu51kuikwm7qqlt.png',
          registerAt: '2025-11-14T16:24:17',
          lastActive: '2025-12-17T14:12:39.4798895',
          role: 'User',
          country: {
            id: 1,
            nameCountry: 'الاردن ',
            iconUrl: 'https://png.pngtree.com/png-clipart/20230411/original/pngtree-jordan-flag-png-image_9043739.png',
          },
          acceptanceRate: 75,
          totalSubmissions: 9,
          totalProblemsSolved: 3,
          easyProblemsSolvedCount: 1,
          mediumProblemsSolvedCount: 2,
          hardProblemsSolvedCount: 0,
          streakDay: 1,
          maxStreak: 3,
          following: 2,
          followers: 2,
          universityId: selectedUniversityId || 0,
          universityName: null,
          tagSolvedCounts: [
            { tagId: 2, tagName: 'DPdd', numberOfProblemSolved: 2 },
            { tagId: 4, tagName: 'Number Theory', numberOfProblemSolved: 2 },
          ],
        },
      };
      setUser(session || userData || fallbackUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser((prev: any) => prev || null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProblems = async () => {
    try {
      const response = await api.get('/api/general/User');
      const data = response?.data || {};
      setProblemTotals({
        total: Number(data.countProblems) || 0,
        easy: Number(data.contEasyProblems) || 0,
        medium: Number(data.counMidumProblems) || 0,
        hard: Number(data.countHardProblems) || 0,
      });
    } catch (error) {
      console.error('Error loading user problem totals:', error);
    }
  };

  useEffect(() => {
    if (user?.responseUserDTO) {
      const userData = user.responseUserDTO;
      const easy = userData.easyProblemsSolvedCount || 0;
      const medium = userData.mediumProblemsSolvedCount || 0;
      const hard = userData.hardProblemsSolvedCount || 0;
      const totalSolved = easy + medium + hard;

      animateNumber(0, easy, 1500, setEasyCount);
      animateNumber(0, medium, 1500, setMediumCount);
      animateNumber(0, hard, 1500, setHardCount);
      animateNumber(0, userData.totalSubmissions || 0, 1500, setSubmissionsCount);
      animateNumber(0, totalSolved, 1500, setSolvedCount);
      animateNumber(0, userData.streakDay || 0, 1500, setStreakCount);
      animateNumber(0, userData.followers || 0, 1500, setFollowersCount);
      animateNumber(0, userData.following || 0, 1500, setFollowingCount);
    }
  }, [user]);

  const userData = user?.responseUserDTO || {};
  const displayName = userData.userName || user?.username || 'غير محدد';
  const displayEmail = user?.email || userData.email || 'غير محدد';
  
  // البحث عن اسم الجامعة من القائمة بناءً على universityId
  const getUniversityName = () => {
    if (userData.universityName && userData.universityName.trim() !== '') {
      return userData.universityName;
    }
    if (userData.universityId && universities.length > 0) {
      const university = universities.find(uni => uni.id === userData.universityId);
      if (university) {
        return university.name;
      }
    }
    return 'غير محدد';
  };
  
  const displayUniversity = getUniversityName();
  const displayCity = (userData.country?.nameCountry || '').trim() || 'غير محدد';
  const acceptancePercent = Math.min(Math.max(userData.acceptanceRate || 0, 0), 100);
  const easySolvedCount = userData.easyProblemsSolvedCount || 0;
  const mediumSolvedCount = userData.mediumProblemsSolvedCount || 0;
  const hardSolvedCount = userData.hardProblemsSolvedCount || 0;
  const totalSolvedBase = Math.max(
    easySolvedCount + mediumSolvedCount + hardSolvedCount,
    userData.totalProblemsSolved || 0,
    userData.totalSubmissions || 0,
    1,
  );
  const formatSolvedRatio = (value: number) => `${value}/${totalSolvedBase}`;
  const animatedContainerStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: translateAnim }],
  };

  const dynamicStyles = {
    profileContainer: { ...styles.profileContainer, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    profileName: { ...styles.profileName, color: isDark ? '#FFFFFF' : '#1F2A44' },
    topStatLabel: { ...styles.topStatLabel, color: isDark ? '#CCCCCC' : '#4A4A4A' },
    topStatValue: { ...styles.topStatValue, color: isDark ? '#FFFFFF' : '#1F2A44' },
    infoCard: { ...styles.infoCard, backgroundColor: isDark ? '#1E1E1E' : '#F2F5F7' },
    infoCardTitle: { ...styles.infoCardTitle, color: isDark ? '#0C85C1' : '#0E8BA6' },
    profileInfoLabel: { ...styles.profileInfoLabel, color: isDark ? '#AAAAAA' : '#444' },
    profileInfoValue: { ...styles.profileInfoValue, color: isDark ? '#FFFFFF' : '#222' },
    sectionHeader: { ...styles.sectionHeader, color: isDark ? '#0C85C1' : '#0E8BA6' },
    difficultyNumber: { ...styles.difficultyNumber, color: isDark ? '#FFFFFF' : '#333' },
    difficultyLabel: { ...styles.difficultyLabel, color: isDark ? '#AAAAAA' : '#666' },
    difficultyProgress: { ...styles.difficultyProgress, color: isDark ? '#888' : '#999' },
    statCardLabel: { ...styles.statCardLabel, color: isDark ? '#AAAAAA' : '#4A4A4A' },
    statCardValue: { ...styles.statCardValue, color: isDark ? '#FFFFFF' : '#333' },
    editModalOverlay: { ...styles.editModalOverlay, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' },
    editModalSheet: { ...styles.editModalSheet, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    editModalTitle: { ...styles.editModalTitle, color: isDark ? '#FFFFFF' : '#085173' },
    editModalLabel: { ...styles.editModalLabel, color: isDark ? '#AAAAAA' : '#777' },
    editModalInput: { ...styles.editModalInput, backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#DADADA', color: isDark ? '#FFFFFF' : '#333' },
    editModalSelectInput: { ...styles.editModalSelectInput, backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#DADADA' },
    editModalSelectText: { ...styles.editModalSelectText, color: isDark ? '#FFFFFF' : '#333' },
    editModalPlaceholder: { ...styles.editModalPlaceholder, color: isDark ? '#666' : '#999' },
    editModalInputDisabled: { ...styles.editModalInputDisabled, backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', color: isDark ? '#888' : '#999' },
    editPageContainer: { ...styles.editPageContainer, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    editModalInputContainer: { backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#DADADA' },
    pickerSheetOverlay: { ...styles.pickerSheetOverlay, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)' },
    pickerSheetContainer: { ...styles.pickerSheetContainer, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
    pickerSheetHandle: { ...styles.pickerSheetHandle, backgroundColor: isDark ? '#666' : '#E0E0E0' },
    pickerItem: { ...styles.pickerItem, borderBottomColor: isDark ? '#333' : '#F1F1F1' },
    pickerItemText: { ...styles.pickerItemText, color: isDark ? '#FFFFFF' : '#333' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#333';
  const chevronColor = isDark ? '#AAAAAA' : '#999';

  if (showEditPage) {
    return (
      <View style={styles.editPageContainer}>
        <StatusBar style="light" />
        <View style={styles.editPageHeader}>
          <Stars />
          <View style={styles.editPageHeaderTop}>
            <TouchableOpacity onPress={() => setShowEditPage(false)} style={styles.editPageBackButton}>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.editPageTitle}>تعديل الملف الشخصي</Text>
            <View style={{ width: 32 }} />
          </View>
        </View>

        <View style={styles.editPageAvatarWrapper}>
          <TouchableOpacity onPress={pickProfileImage} activeOpacity={0.8}>
            <Image
              source={
                editProfileImage ? { uri: editProfileImage } : (userData.imageUrl || userData.imageURL ? { uri: userData.imageUrl || userData.imageURL } : require('@/assets/images/icon.png'))
              }
              style={styles.editPageMainImage}
              contentFit="cover"
            />
            <View style={styles.editPageImageOverlay}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editPageScroll} contentContainerStyle={styles.editPageContent}>

          <View style={styles.editModalField}>
            <Text style={dynamicStyles.editModalLabel}>اسم المستخدم</Text>
            <TextInput style={dynamicStyles.editModalInput} value={editName} onChangeText={setEditName} placeholder="الاسم" placeholderTextColor={isDark ? '#666' : '#999'} />
          </View>

          <View style={styles.editModalField}>
            <Text style={dynamicStyles.editModalLabel}>البريد الإلكتروني</Text>
            <TextInput
              style={dynamicStyles.editModalInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="email@example.com"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.editModalField}>
            <Text style={dynamicStyles.editModalLabel}>اختر الجامعة</Text>
            <TouchableOpacity 
              style={dynamicStyles.editModalSelectInput} 
              onPress={() => setShowUniversityPicker(true)}
              activeOpacity={0.7}>
              <Text style={[dynamicStyles.editModalSelectText, !editUniversity && dynamicStyles.editModalPlaceholder]}>
                {editUniversity || 'اختر الجامعة'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={chevronColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.editModalField}>
            <Text style={dynamicStyles.editModalLabel}>اختر الدولة</Text>
            <TouchableOpacity 
              style={dynamicStyles.editModalSelectInput} 
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}>
              <Text style={[dynamicStyles.editModalSelectText, !editCity && dynamicStyles.editModalPlaceholder]}>
                {editCity || 'اختر الدولة'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={chevronColor} />
            </TouchableOpacity>
          </View>

              {showOtpInput && (
            <View style={styles.editModalField}>
              <Text style={dynamicStyles.editModalLabel}>رمز التحقق</Text>
              <TextInput
                style={dynamicStyles.editModalInput}
                value={otp}
                onChangeText={setOtp}
                placeholder="أدخل رمز التحقق المرسل إلى الإيميل الجديد"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.editModalButton, updating && styles.editModalButtonDisabled]} 
            onPress={handleUpdateProfile}
            disabled={updating}>
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editModalButtonText}>تعديل</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {renderUniversityPickerSheet(showUniversityPicker, (val: string) => setEditUniversity(val), () =>
          setShowUniversityPicker(false),
        )}
        {renderCountryPickerSheet(showCountryPicker, (val: string) => setEditCity(val), () => setShowCountryPicker(false))}
      </View>
    );
  }

  // الحصول على userId
  const currentUserId = user?.responseUserDTO?.id || user?.id || user?.userId || null;

  if (showFollowers && currentUserId) {
    // كارت "يتابع" يفتح صفحة المتابعين (followers)
    return (
      <FollowersScreen
        userId={currentUserId}
        onBack={() => setShowFollowers(false)}
        onUserPress={(targetUserId) => {
          setShowFollowers(false);
          if (onUserPress) {
            onUserPress(targetUserId);
          }
        }}
      />
    );
  }

  if (showFollowing && currentUserId) {
    // كارت "المتابعين" يفتح صفحة يتابع (following)
    return (
      <FollowingScreen
        userId={currentUserId}
        onBack={() => setShowFollowing(false)}
        onUserPress={(targetUserId) => {
          setShowFollowing(false);
          if (onUserPress) {
            onUserPress(targetUserId);
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <View style={dynamicStyles.profileContainer}>
        <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.profileContainer}>
      <StatusBar style={isDark ? "light" : "light"} />

      <View style={styles.profileHeader}>
        <Stars />
        <View style={styles.profileHeaderTop}>
          <TouchableOpacity onPress={onBack} style={styles.profileHeaderIconButton}>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.profileHeaderTitle}>الصفحة الشخصية</Text>
          <TouchableOpacity style={styles.profileHeaderIconButton} onPress={() => setShowEditPage(true)}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileAvatarWrapper}>
        <Image
          source={userData.imageUrl || userData.imageURL ? { uri: userData.imageUrl || userData.imageURL } : require('@/assets/images/icon.png')}
          style={styles.profileMainImage}
          contentFit="cover"
        />
      </View>

      <Animated.View style={[animatedContainerStyle, styles.profileContentWrapper]}>
        <ScrollView style={styles.profileScrollView} contentContainerStyle={styles.profileScrollContent}>
          <View style={styles.profileNameContainer}>
            <Text style={dynamicStyles.profileName}>{displayName}</Text>
          </View>

          <View style={styles.topStatsRow}>
            <View style={[styles.topStatCard, styles.topStatCardBlue, isDark && { backgroundColor: '#1A3A4A' }]}>
              <Text style={dynamicStyles.topStatLabel}>مهتمون</Text>
              <Text style={dynamicStyles.topStatValue}>{bellFollowersCount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.topStatCard, styles.topStatCardGreen, isDark && { backgroundColor: '#1A3A2A' }]}
              onPress={() => {
                if (currentUserId) {
                  setShowFollowing(true);
                }
              }}
              activeOpacity={0.7}>
              <Text style={dynamicStyles.topStatLabel}>المتابعين</Text>
              <Text style={dynamicStyles.topStatValue}>{followersCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.topStatCard, styles.topStatCardYellow, isDark && { backgroundColor: '#3A3A2A' }]}
              onPress={() => {
                if (currentUserId) {
                  setShowFollowers(true);
                }
              }}
              activeOpacity={0.7}>
              <Text style={dynamicStyles.topStatLabel}>يتابع</Text>
              <Text style={dynamicStyles.topStatValue}>{followingCount}</Text>
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.infoCard}>
            <Text style={dynamicStyles.infoCardTitle}>المعلومات الحساب</Text>
            <View style={styles.profileInfoRow}>
              <Text style={dynamicStyles.profileInfoLabel}>الإيميل :</Text>
              <Text style={dynamicStyles.profileInfoValue}>{displayEmail}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={dynamicStyles.profileInfoLabel}>الجامعة :</Text>
              <Text style={dynamicStyles.profileInfoValue}>{displayUniversity}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={dynamicStyles.profileInfoLabel}>المدينة :</Text>
              <Text style={dynamicStyles.profileInfoValue}>{displayCity}</Text>
            </View>
          </View>

          <Text style={dynamicStyles.sectionHeader}>الأداء</Text>

          <View style={styles.difficultyCirclesContainer}>
            <ProgressCircle
              value={easyCount}
              total={problemTotals.easy || 0}
              label="سهل"
              color="#10b981"
              size={96}
              animatedValue={easyCount}
            />
            <ProgressCircle
              value={mediumCount}
              total={problemTotals.medium || 0}
              label="متوسط"
              color="#f59e0b"
              size={96}
              animatedValue={mediumCount}
            />
            <ProgressCircle
              value={hardCount}
              total={problemTotals.hard || 0}
              label="صعب"
              color="#ef4444"
              size={96}
              animatedValue={hardCount}
            />
          </View>

          <View style={styles.statsGrid}>
            {(() => {
              const statsCards = [
                <View key="acceptance" style={[styles.statCard, styles.acceptanceCard, isDark && { backgroundColor: '#1E1E1E' }]}>
                  <View style={[styles.donutChart, { borderWidth: 6, borderColor: isDark ? '#0C85C1' : '#0E8BA6', backgroundColor: isDark ? '#1A3A4A' : '#F1F7F9' }]}>
                    <Text style={[styles.donutText, { color: isDark ? '#0C85C1' : '#0E8BA6' }]}>{acceptancePercent}%</Text>
                  </View>
                  <Text style={dynamicStyles.statCardLabel}>نسبة القبول</Text>
                </View>,
                <View key="suggestions" style={[styles.statCard, styles.suggestionsCard, isDark && { backgroundColor: '#1A3A4A' }]}>
                  <Ionicons name="code-slash-outline" size={32} color={isDark ? '#4A90E2' : '#4A90E2'} />
                  <Text style={dynamicStyles.statCardLabel}>عدد الاقتراحات</Text>
                  <Text style={dynamicStyles.statCardValue}>{submissionsCount}</Text>
                </View>,
                <View key="solved" style={[styles.statCard, styles.solvedCard, isDark && { backgroundColor: '#3A3A2A' }]}>
                  <Ionicons name="checkmark-circle-outline" size={32} color={isDark ? '#8B7355' : '#8B7355'} />
                  <Text style={dynamicStyles.statCardLabel}>عدد المشاكل المحلولة</Text>
                  <Text style={dynamicStyles.statCardValue}>{solvedCount}</Text>
                </View>,
                <View key="streak" style={[styles.statCard, styles.streakCard, isDark && { backgroundColor: '#1A3A4A' }]}>
                  <Ionicons name="calendar-outline" size={32} color={isDark ? '#4A90E2' : '#4A90E2'} />
                  <Text style={dynamicStyles.statCardLabel}>السلسلة الحالية</Text>
                  <Text style={dynamicStyles.statCardValue}>{streakCount}</Text>
                </View>,
                <View key="followers" style={[styles.statCard, styles.followersCard, isDark && { backgroundColor: '#1A3A2A' }]}>
                  <Ionicons name="people-outline" size={32} color={isDark ? '#4CAF50' : '#4CAF50'} />
                  <Text style={dynamicStyles.statCardLabel}>المتابعين</Text>
                  <Text style={dynamicStyles.statCardValue}>{followersCount}</Text>
                </View>,
                <View key="following" style={[styles.statCard, styles.followingCard, isDark && { backgroundColor: '#3A3A2A' }]}>
                  <Ionicons name="person-outline" size={32} color={isDark ? '#FFC107' : '#FFC107'} />
                  <Text style={dynamicStyles.statCardLabel}>يتابع</Text>
                  <Text style={dynamicStyles.statCardValue}>{followingCount}</Text>
                </View>,
              ];

              const rows: React.ReactElement[][] = [];
              for (let i = 0; i < statsCards.length; i += 3) {
                rows.push(statsCards.slice(i, i + 3));
              }

              return rows.map((row, idx) => {
                const isLastRow = idx === rows.length - 1;
                const isTwoItems = isLastRow && row.length === 2;
                return (
                  <View key={`row-${idx}`} style={[styles.statsRow, isTwoItems && styles.statsRowTwo]}>
                    {row.map((card) => card)}
                  </View>
                );
              });
            })()}
          </View>
        </ScrollView>
      </Animated.View>

      <Modal transparent animationType="slide" presentationStyle="overFullScreen" visible={showEditModal} onRequestClose={() => setShowEditModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowEditModal(false)} style={dynamicStyles.editModalOverlay}>
          <TouchableOpacity activeOpacity={1} style={dynamicStyles.editModalSheet}>
            <View style={styles.editModalHeader}>
              <Text style={dynamicStyles.editModalTitle}>تعديل الملف الشخصي</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.editModalClose}>
                <Ionicons name="close" size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.editModalAvatarWrapper}>
              <Image
                source={
                  userData.imageUrl || userData.imageURL ? { uri: userData.imageUrl || userData.imageURL } : require('@/assets/images/icon.png')
                }
                style={styles.editModalAvatar}
                contentFit="cover"
              />
            </View>

            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6, width: '100%' }} contentContainerStyle={{ paddingBottom: 12 }}>
              <View style={styles.editModalField}>
                <Text style={dynamicStyles.editModalLabel}>اسم المستخدم</Text>
                <TextInput style={dynamicStyles.editModalInput} value={editName} onChangeText={setEditName} placeholder="الاسم" placeholderTextColor={isDark ? '#666' : '#999'} />
              </View>

              <View style={styles.editModalField}>
                <Text style={dynamicStyles.editModalLabel}>البريد الإلكتروني</Text>
                <TextInput
                  style={[dynamicStyles.editModalInput, dynamicStyles.editModalInputDisabled]}
                  value={editEmail}
                  editable={false}
                  placeholder="email@example.com"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
              </View>

              <View style={styles.editModalField}>
                <Text style={dynamicStyles.editModalLabel}>اختر الجامعة</Text>
                <TouchableOpacity style={dynamicStyles.editModalSelectInput} onPress={() => setShowUniversityPicker(true)}>
                  <Text style={[dynamicStyles.editModalSelectText, !editUniversity && dynamicStyles.editModalPlaceholder]}>{editUniversity || 'اختر الجامعة'}</Text>
                  <Ionicons name="chevron-down" size={20} color={chevronColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.editModalField}>
                <Text style={dynamicStyles.editModalLabel}>اختر الدولة</Text>
                <TouchableOpacity style={dynamicStyles.editModalSelectInput} onPress={() => setShowCountryPicker(true)}>
                  <Text style={[dynamicStyles.editModalSelectText, !editCity && dynamicStyles.editModalPlaceholder]}>{editCity || 'اختر الدولة'}</Text>
                  <Ionicons name="chevron-down" size={20} color={chevronColor} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.editModalButton} onPress={() => setShowEditModal(false)}>
              <Text style={styles.editModalButtonText}>تعديل</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {renderUniversityPickerSheet(showUniversityPicker, (val: string) => setEditUniversity(val), () => setShowUniversityPicker(false))}
      {renderCountryPickerSheet(showCountryPicker, (val: string) => setEditCity(val), () => setShowCountryPicker(false))}
    </View>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileContentWrapper: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#085173',
    height: 170,
    borderBottomLeftRadius: 112,
    borderBottomRightRadius: 112,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  profileHeaderTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHeaderIconButton: {
    padding: 8,
    borderRadius: 12,
  },
  profileHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  profileMainImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileAvatarWrapper: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 12,
  },
  profileNameContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E8BA6',
    textAlign: 'right',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#F2F5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E8BA6',
    marginBottom: 12,
    textAlign: 'right',
  },
  profileInfoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    textAlign: 'right',
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    textAlign: 'right',
  },
  topStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  topStatCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topStatCardBlue: {
    backgroundColor: '#E8F6FA',
  },
  topStatCardGreen: {
    backgroundColor: '#EAF7EB',
  },
  topStatCardYellow: {
    backgroundColor: '#F9F0DE',
  },
  topStatLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 6,
    textAlign: 'center',
  },
  topStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
  },
  difficultyCirclesContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  difficultyCircle: {
    alignItems: 'center',
    width: 96,
  },
  difficultyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 6,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  difficultyNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  difficultyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  difficultyProgress: {
    fontSize: 11,
    color: '#999',
  },
  statsGrid: {
    width: '100%',
    rowGap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 10,
    width: '100%',
  },
  statsRowTwo: {
    justifyContent: 'center',
  },
  statCard: {
    width: (Dimensions.get('window').width - 44) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  acceptanceCard: {
    backgroundColor: '#FFFFFF',
  },
  suggestionsCard: {
    backgroundColor: '#E8F6FA',
  },
  solvedCard: {
    backgroundColor: '#F7E9DF',
  },
  streakCard: {
    backgroundColor: '#E8F6FA',
  },
  followersCard: {
    backgroundColor: '#EAF7EB',
  },
  followingCard: {
    backgroundColor: '#FEF6DA',
  },
  donutChart: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  donutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E8BA6',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: 6,
  },
  statCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    width: '100%',
  },
  editModalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  editModalClose: {
    position: 'absolute',
    left: 0,
    padding: 6,
  },
  editModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#085173',
  },
  editModalAvatarWrapper: {
    marginVertical: 12,
    alignItems: 'center',
  },
  editModalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  pickerSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  pickerSheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerSheetHandle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  pickerList: {
    paddingHorizontal: 16,
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  pickerItemContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  countryFlag: {
    width: 32,
    height: 24,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  universityImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  editModalField: {
    width: '100%',
    marginBottom: 12,
  },
  editModalLabel: {
    fontSize: 12,
    color: '#777',
    textAlign: 'right',
    marginBottom: 4,
  },
  editModalInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: 'right',
    fontSize: 14,
    color: '#333',
  },
  editModalSelectInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  editModalSelectText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  editModalPlaceholder: {
    color: '#999',
  },
  editModalInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  editModalButton: {
    backgroundColor: '#085173',
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  editModalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  editModalButtonDisabled: {
    opacity: 0.6,
  },
  editPageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editPageHeader: {
    backgroundColor: '#085173',
    height: 170,
    borderBottomLeftRadius: 112,
    borderBottomRightRadius: 112,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  editPageHeaderTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editPageBackButton: {
    padding: 8,
    borderRadius: 12,
  },
  editPageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editPageAvatarWrapper: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 12,
  },
  editPageMainImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editPageImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#085173',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editPageScroll: {
    flex: 1,
  },
  editPageContent: {
    padding: 16,
    paddingBottom: 32,
  },
});

