import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRegister, useLogin, usePasswordReset } from '@/hooks/useAuth';
import { getRememberedCredentials } from '@/services/storage';
import { getCountries as fetchCountriesAPI, getUniversities as fetchUniversitiesAPI } from '@/services/authService';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// طباعة أبعاد الشاشة على Android
if (Platform.OS === 'android') {
  console.log('📱 Android Screen Dimensions:');
  console.log(`   Width: ${SCREEN_WIDTH}px`);
  console.log(`   Height: ${SCREEN_HEIGHT}px`);
  console.log(`   Resolution: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);
}

// Responsive helper functions
const wp = (percentage: number) => (SCREEN_WIDTH * percentage) / 100;
const hp = (percentage: number) => (SCREEN_HEIGHT * percentage) / 100;
const getResponsiveFontSize = (size: number) => {
  // للشاشات الصغيرة جداً (مثل 360x800)
  if (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800) {
    const scale = SCREEN_WIDTH / 375;
    const scaled = size * Math.min(scale, 0.85); // تصغير بنسبة 15%
    return Math.max(11, Math.min(scaled, size * 0.85));
  }
  // للشاشات الطويلة جداً (مثل Honor X5 1600x720)
  if (Platform.OS === 'android' && SCREEN_HEIGHT > 1500) {
    const scale = SCREEN_WIDTH / 375;
    const scaled = size * Math.min(scale, 0.9); // تصغير بنسبة 10%
    return Math.max(10, Math.min(scaled, size * 0.9));
  }
  // استخدام حساب أفضل يعتمد على كل من العرض والارتفاع
  const widthScale = SCREEN_WIDTH / 375;
  const heightScale = SCREEN_HEIGHT / 800; // استخدام 800 كقيمة مرجعية
  const combinedScale = (widthScale + heightScale) / 2; // متوسط القيمتين
  const scaled = size * Math.min(combinedScale, 1.4); // زيادة الحد الأقصى قليلاً
  return Math.max(12, Math.min(scaled, size * 1.4));
};

const getResponsiveValue = (small: number, medium: number, large: number) => {
  // استخدام حساب ديناميكي أفضل للشاشات المختلفة
  // 360x800: شاشة صغيرة جداً (مثل بعض أجهزة Android القديمة)
  // Samsung A15: ~800-900px height
  // Honor X5: ~950-1050px height (أكبر قليلاً)
  
  if (SCREEN_HEIGHT < 750 || (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800)) {
    // شاشات صغيرة جداً (مثل 360x800)
    return small * 0.9; // تصغير بنسبة 10% للشاشات الصغيرة جداً
  } else if (SCREEN_HEIGHT < 950) {
    // شاشات متوسطة (مثل Samsung A15)
    return medium;
  } else {
    // شاشات كبيرة (مثل Honor X5)
    // حساب ديناميكي للشاشات الكبيرة لضمان التوافق
    const scaleFactor = Math.min((SCREEN_HEIGHT - 950) / 150, 0.2); // زيادة تصل إلى 20%
    return large * (1 + scaleFactor);
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: number; nameCountry: string; iconUrl: string }>>([]);
  const [universities, setUniversities] = useState<Array<{ id: number; nameUniversity: string; imageUrl?: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const countryModalOpacity = useSharedValue(0);
  const countryModalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const universityModalOpacity = useSharedValue(0);
  const universityModalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    profilePicture: '',
    country: '',
    university: '',
  });
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [imageFile, setImageFile] = useState<any>(null);

  // Auth Hooks
  const { loading: registerLoading, otpSent, resendCooldown, handleSendOtp, handleResendOtp, handleVerifyOtpAndRegister } = useRegister();
  const { loading: loginLoading, handleLogin } = useLogin();
  const { loading: resetLoading, otpSent: resetOtpSent, resendCooldown: resetResendCooldown, handleSendOtp: handleResetSendOtp, handleResendOtp: handleResetResendOtp, handleConfirmPasswordReset } = usePasswordReset();

  const flipRotation = useSharedValue(0);
  const getInitialCardHeight = () => {
    if (Platform.OS === 'android') {
      // للشاشات الصغيرة جداً مثل 360x800
      if (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800) {
        const baseCardHeight = SCREEN_HEIGHT * 0.48; // تحسين النسبة ليتوافق مع باقي الشاشات
        const minCardHeight = 380;
        return Math.max(minCardHeight, baseCardHeight);
      } else if (SCREEN_HEIGHT > 1500) {
        // للشاشات الطويلة جداً مثل Honor X5 (1600x720)
        const baseCardHeight = SCREEN_HEIGHT * 0.35; // أصغر للشاشات الطويلة
        const minCardHeight = 300;
        return Math.max(minCardHeight, baseCardHeight);
      }
      const baseCardHeight = getResponsiveValue(
        SCREEN_HEIGHT * 0.50,
        SCREEN_HEIGHT * 0.50,
        SCREEN_HEIGHT * 0.45
      );
      const minCardHeight = getResponsiveValue(340, 380, 420);
      return Math.max(minCardHeight, baseCardHeight);
    } else {
      const baseCardHeight = getResponsiveValue(
        SCREEN_HEIGHT * 0.5,
        SCREEN_HEIGHT * 0.45,
        SCREEN_HEIGHT * 0.4
      );
      const minCardHeight = getResponsiveValue(350, 400, 450);
      return Math.max(minCardHeight, baseCardHeight);
    }
  };
  const cardHeight = useSharedValue(getInitialCardHeight());
  const logoScale = useSharedValue(getResponsiveValue(1.3, 1.4, 1.5));
  const logoTranslateY = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const socialSectionOpacity = useSharedValue(1);
  const [cardOpened, setCardOpened] = useState(false);
  const forgotPasswordModalOpacity = useSharedValue(0);
  const forgotPasswordModalTranslateX = useSharedValue(SCREEN_WIDTH);
  const forgotPasswordModalTranslateY = useSharedValue(0);

  const flipCard = () => {
    const newIsFlipped = !isFlipped;
    setIsFlipped(newIsFlipped);
    let baseCardHeight, signupCardHeight, minCardHeight, maxCardHeight;
    
    if (Platform.OS === 'android') {
      // للشاشات الصغيرة جداً مثل 360x800
      if (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800) {
        baseCardHeight = SCREEN_HEIGHT * 0.48; // نفس نسبة getInitialCardHeight
        signupCardHeight = SCREEN_HEIGHT * 0.75; // زيادة ارتفاع كارت التسجيل
        minCardHeight = 380;
        maxCardHeight = 620; // زيادة الحد الأقصى
      } else if (SCREEN_HEIGHT > 1500) {
        // للشاشات الطويلة جداً مثل Honor X5 (1600x720)
        baseCardHeight = SCREEN_HEIGHT * 0.35; // أصغر للشاشات الطويلة
        signupCardHeight = SCREEN_HEIGHT * 0.60; // زيادة ارتفاع كارت التسجيل
        minCardHeight = 300;
        maxCardHeight = 800;
      } else {
        baseCardHeight = getResponsiveValue(
          SCREEN_HEIGHT * 0.50,
          SCREEN_HEIGHT * 0.50,
          SCREEN_HEIGHT * 0.45
        );
        signupCardHeight = getResponsiveValue(
          SCREEN_HEIGHT * 0.75,
          SCREEN_HEIGHT * 0.75,
          SCREEN_HEIGHT * 0.70
        );
        minCardHeight = getResponsiveValue(340, 380, 420);
        maxCardHeight = getResponsiveValue(770, 870, 970);
      }
    } else {
      baseCardHeight = getResponsiveValue(
        SCREEN_HEIGHT * 0.5,
        SCREEN_HEIGHT * 0.45,
        SCREEN_HEIGHT * 0.4
      );
      signupCardHeight = getResponsiveValue(
        SCREEN_HEIGHT * 0.75,
        SCREEN_HEIGHT * 0.70,
        SCREEN_HEIGHT * 0.65
      );
      minCardHeight = getResponsiveValue(350, 400, 450);
      maxCardHeight = getResponsiveValue(750, 800, 850);
    }
    
    const animationDuration = Platform.OS === 'android' ? 300 : 600;
    
    flipRotation.value = withTiming(newIsFlipped ? 180 : 0, { duration: animationDuration });
    cardHeight.value = withTiming(
      newIsFlipped 
        ? Math.min(maxCardHeight, signupCardHeight)
        : Math.max(minCardHeight, baseCardHeight), 
      { duration: animationDuration }
    );
    if (Platform.OS === 'android') {
      logoScale.value = withTiming(
        newIsFlipped 
          ? getResponsiveValue(1.3, 1.4, 1.5)  // أكبر عندما يكون Register
          : getResponsiveValue(0.75, 0.8, 0.85),  // أصغر للـ Login
        { duration: animationDuration }
      );
      logoTranslateY.value = withTiming(
        newIsFlipped ? getResponsiveValue(-35, -40, -45) : 0,  // رفع اللوجو أكثر لأعلى
        { duration: animationDuration }
      );
      cardTranslateY.value = withTiming(
        newIsFlipped ? getResponsiveValue(-40, -45, -50) : 0,  // رفع الكارت أكثر لأعلى
        { duration: animationDuration }
      );
    } else {
      logoScale.value = withTiming(
        newIsFlipped 
          ? getResponsiveValue(1.1, 1.2, 1.3)  // أصغر عندما يكون Register
          : getResponsiveValue(1.3, 1.4, 1.5),  // أكبر للـ Login
        { duration: animationDuration }
      );
      logoTranslateY.value = withTiming(0, { duration: animationDuration });
      cardTranslateY.value = withTiming(
        newIsFlipped ? 0 : getResponsiveValue(0, 5, 0), 
        { duration: animationDuration }
      );
    }
    socialSectionOpacity.value = withTiming(newIsFlipped ? 0 : 1, { duration: animationDuration });
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { translateY: logoTranslateY.value },
      ],
    };
  });

  // طباعة أبعاد الشاشة عند تحميل الصفحة على Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const isSmallScreen = SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800;
      console.log('═══════════════════════════════════════');
      console.log('📱 Android Login Screen Dimensions:');
      console.log(`   Width: ${SCREEN_WIDTH}px`);
      console.log(`   Height: ${SCREEN_HEIGHT}px`);
      console.log(`   Resolution: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);
      console.log(`   Aspect Ratio: ${(SCREEN_WIDTH / SCREEN_HEIGHT).toFixed(2)}`);
      console.log(`   Screen Type: ${isSmallScreen ? 'Small (360x800)' : SCREEN_HEIGHT > 1500 ? 'Large (Honor X5)' : 'Medium'}`);
      console.log(`   Initial Card Height: ${getInitialCardHeight()}px`);
      console.log('═══════════════════════════════════════');
    }
  }, []);

  // Load remembered credentials
  useEffect(() => {
    getRememberedCredentials().then((data) => {
      if (data?.email && data?.password) {
        setFormData(prev => ({ 
          ...prev, 
          email: data.email,
          password: data.password 
        }));
        setRememberMe(true);
      } else if (data?.email) {
        setFormData(prev => ({ ...prev, email: data.email }));
        setRememberMe(true);
      }
    });
  }, []);

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const data = await fetchCountriesAPI();
        setCountries(data);
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    if (!cardOpened) {
      setCardOpened(true);
      const baseCardHeight = getResponsiveValue(
        SCREEN_HEIGHT * 0.5,
        SCREEN_HEIGHT * 0.45,
        SCREEN_HEIGHT * 0.4
      );
      const minCardHeight = getResponsiveValue(350, 400, 450);
      cardHeight.value = Math.max(minCardHeight, baseCardHeight);
    }
  }, []);

  const socialSectionAnimatedStyle = useAnimatedStyle(() => {
    const isVisible = socialSectionOpacity.value > 0;
    return {
      opacity: socialSectionOpacity.value,
      maxHeight: isVisible ? 200 : 0,
      overflow: 'hidden',
      marginTop: isVisible ? 20 : 0,
      marginBottom: isVisible ? 20 : 0,
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    const isVisible = flipRotation.value < 90;
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(flipRotation.value, [0, 90, 90, 180], [1, 1, 0, 0]),
      zIndex: isVisible ? 100 : -1,
      elevation: isVisible ? 100 : -1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    const isVisible = flipRotation.value >= 90;
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(flipRotation.value, [0, 90, 90, 180], [0, 0, 1, 1]),
      zIndex: isVisible ? 100 : -1,
      elevation: isVisible ? 100 : -1,
    };
  });

  const forgotPasswordOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: forgotPasswordModalOpacity.value,
    };
  });

  const forgotPasswordModalStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: forgotPasswordModalTranslateX.value },
        { translateY: forgotPasswordModalTranslateY.value },
      ],
    };
  });

  const countryModalOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: countryModalOpacity.value,
      zIndex: Platform.OS === 'ios' ? 9998 : 9998,
      elevation: Platform.OS === 'android' ? 9998 : 0,
    };
  });

  const countryModalStyle = useAnimatedStyle(() => {
    return {
      opacity: countryModalOpacity.value,
      transform: [{ translateY: countryModalTranslateY.value }],
      zIndex: Platform.OS === 'ios' ? 10000 : 10000,
      elevation: Platform.OS === 'android' ? 10000 : 0,
    };
  });

  const universityModalOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: universityModalOpacity.value,
      zIndex: Platform.OS === 'ios' ? 9998 : 9998,
      elevation: Platform.OS === 'android' ? 9998 : 0,
    };
  });

  const universityModalStyle = useAnimatedStyle(() => {
    return {
      opacity: universityModalOpacity.value,
      transform: [{ translateY: universityModalTranslateY.value }],
      zIndex: Platform.OS === 'ios' ? 10000 : 10000,
      elevation: Platform.OS === 'android' ? 10000 : 0,
    };
  });

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    forgotPasswordModalOpacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    forgotPasswordModalTranslateX.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  };

  const closeForgotPassword = () => {
    forgotPasswordModalOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.ease),
    });
    forgotPasswordModalTranslateX.value = withTiming(SCREEN_WIDTH, {
      duration: 400,
      easing: Easing.in(Easing.ease),
    });
    forgotPasswordModalTranslateY.value = withTiming(0, {
      duration: 400,
      easing: Easing.in(Easing.ease),
    });
    setTimeout(() => {
      setShowForgotPassword(false);
    }, 400);
  };

  useEffect(() => {
    if (!showForgotPassword) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        forgotPasswordModalTranslateY.value = withTiming(-80, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        forgotPasswordModalTranslateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.ease),
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [showForgotPassword]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('نحتاج إلى إذن للوصول إلى الصور!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const fileName = imageUri.split('/').pop() || 'image.png';
      setFormData({ ...formData, profilePicture: fileName });
      
      setImageFile({
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      });
    }
  };

  const fetchCountries = async () => {
    if (countries.length > 0) {
      setShowCountryDropdown(true);
      countryModalOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      countryModalTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      return;
    }

    setLoadingCountries(true);
    try {
      const data = await fetchCountriesAPI();
      setCountries(data);
      setShowCountryDropdown(true);
      countryModalOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      countryModalTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    } catch (error) {
      alert('حدث خطأ في جلب الدول. يرجى المحاولة مرة أخرى.');
      console.error('Error fetching countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const selectCountry = (country: { id: number; nameCountry: string; iconUrl: string }) => {
    setFormData({ ...formData, country: country.nameCountry });
    setSelectedCountryId(country.id);
    closeCountryModal();
  };

  const fetchUniversities = async () => {
    if (universities.length > 0) {
      setShowUniversityDropdown(true);
      universityModalOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      universityModalTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      return;
    }

    setLoadingUniversities(true);
    try {
      const data = await fetchUniversitiesAPI();
      setUniversities(data);
      setShowUniversityDropdown(true);
      universityModalOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      universityModalTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    } catch (error) {
      alert('حدث خطأ في جلب الجامعات. يرجى المحاولة مرة أخرى.');
      console.error('Error fetching universities:', error);
    } finally {
      setLoadingUniversities(false);
    }
  };

  const selectUniversity = (university: { id: number; nameUniversity: string; imageUrl?: string }) => {
    setFormData({ ...formData, university: university.nameUniversity });
    setSelectedUniversityId(university.id);
    closeUniversityModal();
  };

  const closeUniversityModal = () => {
    universityModalOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) });
    universityModalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.in(Easing.ease) });
    setTimeout(() => {
      setShowUniversityDropdown(false);
    }, 300);
  };

  const handleLoginPress = async () => {
    const result = await handleLogin(formData.email, formData.password, rememberMe);
    if (result.success) {
      router.replace('/home' as any);
    }
  };

  const handleSignupPress = async () => {
    if (!otpSent) {
      const result = await handleSendOtp(
        formData.email,
        formData.username,
        formData.password,
        selectedCountryId || 0,
        imageFile,
        selectedUniversityId || 0
      );
      if (result.success) {
        setShowOtpModal(true);
      }
    } else {
      const result = await handleVerifyOtpAndRegister(otpCode);
      if (result.success) {
        setShowOtpModal(false);
        setOtpCode('');
        flipCard();
      }
    }
  };

  const handleForgotPasswordSend = async () => {
    const result = await handleResetSendOtp(formData.email);
    if (result.success) {
      setForgotPasswordStep(2);
    }
  };

  const handleForgotPasswordConfirm = async () => {
    if (forgotPasswordStep === 2) {
      if (!forgotPasswordOtp || forgotPasswordOtp.length !== 6) {
        alert('يرجى إدخال رمز التحقق (6 أرقام)');
        return;
      }
      setForgotPasswordStep(3);
    } else if (forgotPasswordStep === 3) {
      const result = await handleConfirmPasswordReset(forgotPasswordOtp, newPassword);
      if (result.success) {
        closeForgotPassword();
        setForgotPasswordStep(1);
        setForgotPasswordOtp('');
        setNewPassword('');
      }
    }
  };

  const closeCountryModal = () => {
    countryModalOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) });
    countryModalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.in(Easing.ease) });
    setTimeout(() => {
      setShowCountryDropdown(false);
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? 0 : insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={Platform.OS === 'ios'}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: Math.max(insets.bottom, 20),
            paddingTop: Platform.OS === 'android' ? getResponsiveValue(10, 15, 20) : getResponsiveValue(-10, -5, 0)
          }
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}>
        
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={require('@/assets/images/logo_app.png')}
              style={[
                styles.logoImage,
                {
                  width: wp(getResponsiveValue(55, 60, 65)),
                  height: hp(getResponsiveValue(12, 14, 16)),
                  maxWidth: getResponsiveValue(230, 260, 280),
                  maxHeight: getResponsiveValue(95, 110, 125),
                  minWidth: 190,
                  minHeight: 80,
                }
              ]}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        {/* Flip Card Container */}
        <Animated.View style={[styles.cardContainer, containerAnimatedStyle]}>
          {/* Front Card - Login */}
          <Animated.View 
            style={[styles.card, styles.cardFront, frontAnimatedStyle]}
            pointerEvents={isFlipped ? 'none' : 'auto'}>
            <View style={styles.cardContent}>
              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>البريد الالكتروني</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="alaghrs@gmail.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>كلمة السر</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="كلمة السر"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLoginPress}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIconButton}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={openForgotPassword}>
                  <Text style={styles.forgotPassword}>هل نسيت كلمة المرور؟</Text>
                </TouchableOpacity>
                <View style={styles.rememberMeContainer}>
                  <Text style={styles.rememberMeText}>تذكرني</Text>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setRememberMe(!rememberMe)}>
                    <Ionicons 
                      name={rememberMe ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={rememberMe ? "#085173" : "#999"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.loginButton, loginLoading && styles.buttonDisabled]} 
                onPress={handleLoginPress}
                disabled={loginLoading}>
                {loginLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={flipCard} style={styles.createAccountLink}>
                <Text>
                  <Text style={styles.linkTextBlack}>ليس لديك حساب؟ </Text>
                  <Text style={styles.linkTextBlue}>انشاء حساب</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Back Card - Signup */}
          <Animated.View 
            style={[styles.card, styles.cardBack, backAnimatedStyle]}
            pointerEvents={isFlipped ? 'auto' : 'none'}>
            <View style={styles.cardContent}>
              {/* Username Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  placeholder="ahar"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                />
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>البريد الالكتروني</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="alaghrs@gmail.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>كلمة السر</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="كلمة السر"
                    placeholderTextColor="#999"
                    secureTextEntry={!showSignupPassword}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    onPress={() => setShowSignupPassword(!showSignupPassword)}
                    style={styles.eyeIconButton}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={showSignupPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Profile Picture Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>الصورة الشخصية</Text>
                <View style={styles.filePickerContainer}>
                  <TextInput
                    style={styles.fileInput}
                    value={formData.profilePicture}
                    placeholder="oghar.png"
                    placeholderTextColor="#999"
                    editable={false}
                  />
                  <TouchableOpacity style={styles.fileButton} onPress={pickImage}>
                    <Text style={styles.fileButtonText}>اختيار ملف</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Country and University Fields Row */}
              <View style={styles.countryUniversityRow}>
                {/* Country Field */}
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>اختر الدولة</Text>
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={fetchCountries}
                    activeOpacity={0.7}>
                    <Text style={[styles.countryButtonText, !formData.country && styles.countryButtonPlaceholder]} numberOfLines={1} ellipsizeMode="tail">
                      {formData.country || 'الأردن'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
                  </TouchableOpacity>
                </View>

                {/* University Field */}
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.label}>اختر الجامعة</Text>
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={fetchUniversities}
                    activeOpacity={0.7}>
                    <Text style={[styles.countryButtonText, !formData.university && styles.countryButtonPlaceholder]} numberOfLines={1} ellipsizeMode="tail">
                      {formData.university || 'اختر الجامعة'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.signupButton, registerLoading && styles.buttonDisabled]} 
                onPress={handleSignupPress}
                disabled={registerLoading}>
                {registerLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signupButtonText}>
                    {otpSent ? 'تحقق وإنشاء حساب' : 'انشاء حساب'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={flipCard} style={styles.loginLink}>
                <Text>
                  <Text style={styles.linkText}>هل لديك حساب؟ </Text>
                  <Text style={styles.linkTextBlue}>سجل الدخول</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>

      </ScrollView>
      
      {/* Legal Text - Fixed at bottom */}
      <View style={[styles.legalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.legalText}>بتسجيل الدخول،أنت </Text>
        <Text style={styles.legalText}>
          توافق على{' '}
          <Text 
            style={styles.legalLink}
            onPress={() => router.push('/terms' as any)}>
            الشروط والأحكام
          </Text>
          {' '}و{' '}
          <Text style={styles.legalLink}>سياسة الخصوصية</Text>
        </Text>
      </View>

      {/* Country Selection Modal */}
      {showCountryDropdown && (
        <>
          <Animated.View 
            style={[styles.modalOverlay, countryModalOverlayStyle]}
            pointerEvents="box-none">
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={closeCountryModal}
            />
          </Animated.View>
          <Animated.View style={[styles.countryModal, countryModalStyle]}>
            <View style={styles.countryModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>اختر الدولة</Text>
                <TouchableOpacity onPress={closeCountryModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.separatorLineDark} />
              <ScrollView style={styles.countryModalScrollView} nestedScrollEnabled>
                {loadingCountries ? (
                  <View style={styles.countryModalItem}>
                    <Text style={styles.countryModalItemText}>جاري التحميل...</Text>
                  </View>
                ) : countries.length > 0 ? (
                  countries.map((country) => (
                    <TouchableOpacity
                      key={country.id}
                      style={styles.countryModalItem}
                      onPress={() => selectCountry(country)}>
                      <Image
                        source={{ uri: country.iconUrl }}
                        style={styles.countryFlag}
                        contentFit="contain"
                      />
                      <Text style={styles.countryModalItemText}>{country.nameCountry}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.countryModalItem}>
                    <Text style={styles.countryModalItemText}>لا توجد دول متاحة</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}

      {/* University Selection Modal */}
      {showUniversityDropdown && (
        <>
          <Animated.View 
            style={[styles.modalOverlay, universityModalOverlayStyle]}
            pointerEvents="box-none">
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={closeUniversityModal}
            />
          </Animated.View>
          <Animated.View style={[styles.countryModal, universityModalStyle]}>
            <View style={styles.countryModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>اختر الجامعة</Text>
                <TouchableOpacity onPress={closeUniversityModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.separatorLineDark} />
              <ScrollView style={styles.countryModalScrollView} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {loadingUniversities ? (
                  <View style={styles.countryModalItem}>
                    <ActivityIndicator size="large" color="#085173" />
                  </View>
                ) : universities.length > 0 ? (
                  universities.map((university) => (
                    <TouchableOpacity
                      key={university.id}
                      style={styles.countryModalItem}
                      onPress={() => selectUniversity(university)}
                      activeOpacity={0.7}>
                      {university.imageUrl && (
                        <Image
                          source={{ uri: university.imageUrl }}
                          style={styles.countryFlag}
                          contentFit="contain"
                        />
                      )}
                      <Text style={styles.countryModalItemText} numberOfLines={2} ellipsizeMode="tail">
                        {university.nameUniversity}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.countryModalItem}>
                    <Text style={styles.countryModalItemText}>لا توجد جامعات متاحة</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <>
          <Animated.View 
            style={[styles.modalOverlay, forgotPasswordOverlayStyle]}
            pointerEvents="box-none">
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={closeForgotPassword}
            />
          </Animated.View>
          <Animated.View style={[styles.forgotPasswordModal, forgotPasswordModalStyle]}>
            <View style={styles.modalCard}>
              <TouchableOpacity 
                onPress={closeForgotPassword} 
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.forgotPasswordTitle}>استعادة كلمة السر</Text>
              <View style={styles.separatorLineDark} />
              
              {forgotPasswordStep === 1 && (
                <>
                  <Text style={styles.label}>البريد الالكتروني</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="alaghrs@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    editable={!resetLoading}
                  />
                  <Text style={styles.instructionText}>
                    سيتم إرسال رمز التحقق (OTP) المكون من 6 أرقام إلى بريدك الإلكتروني
                  </Text>
                  <TouchableOpacity 
                    style={[styles.sendButton, resetLoading && styles.buttonDisabled]} 
                    onPress={handleForgotPasswordSend}
                    disabled={resetLoading}>
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>ارسال</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {forgotPasswordStep === 2 && (
                <>
                  <Text style={styles.instructionText}>
                    تم إرسال رمز التحقق إلى: {formData.email}
                  </Text>
                  <Text style={styles.label}>رمز التحقق (OTP)</Text>
                  <TextInput
                    style={styles.input}
                    value={forgotPasswordOtp}
                    onChangeText={(text) => setForgotPasswordOtp(text.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!resetLoading}
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, (resetLoading || !forgotPasswordOtp || forgotPasswordOtp.length !== 6) && styles.buttonDisabled]} 
                    onPress={handleForgotPasswordConfirm}
                    disabled={resetLoading || !forgotPasswordOtp || forgotPasswordOtp.length !== 6}>
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>تحقق</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sendButton, { backgroundColor: '#999', marginTop: 8 }]} 
                    onPress={handleResetResendOtp}
                    disabled={resetResendCooldown > 0 || resetLoading}>
                    <Text style={styles.sendButtonText}>
                      {resetResendCooldown > 0 ? `إعادة الإرسال بعد ${resetResendCooldown} ثانية` : 'إعادة إرسال OTP'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sendButton, { backgroundColor: '#999', marginTop: 8 }]} 
                    onPress={() => setForgotPasswordStep(1)}
                    disabled={resetLoading}>
                    <Text style={styles.sendButtonText}>العودة</Text>
                  </TouchableOpacity>
                </>
              )}

              {forgotPasswordStep === 3 && (
                <>
                  <Text style={styles.label}>كلمة المرور الجديدة</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="كلمة المرور الجديدة"
                    placeholderTextColor="#999"
                    secureTextEntry
                    editable={!resetLoading}
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, (resetLoading || !newPassword || newPassword.length < 6) && styles.buttonDisabled]} 
                    onPress={handleForgotPasswordConfirm}
                    disabled={resetLoading || !newPassword || newPassword.length < 6}>
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>تغيير كلمة المرور</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sendButton, { backgroundColor: '#999', marginTop: 8 }]} 
                    onPress={() => setForgotPasswordStep(2)}
                    disabled={resetLoading}>
                    <Text style={styles.sendButtonText}>العودة</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </>
      )}

      {/* OTP Verification Modal for Signup */}
      {showOtpModal && (
        <>
          <Animated.View 
            style={[styles.modalOverlay, { opacity: 1, zIndex: 10001, elevation: 10001 }]}
            pointerEvents="box-none">
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={() => {
                setShowOtpModal(false);
                setOtpCode('');
              }}
            />
          </Animated.View>
          <Animated.View style={[styles.forgotPasswordModal, { zIndex: 10002, elevation: 10002 }]}>
            <View style={styles.modalCard}>
              <TouchableOpacity 
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpCode('');
                }} 
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.forgotPasswordTitle}>رمز التحقق</Text>
              <View style={styles.separatorLineDark} />
              <Text style={styles.instructionText}>
                تم إرسال رمز التحقق إلى: {formData.email}
              </Text>
              <Text style={styles.label}>رمز التحقق (OTP)</Text>
              <TextInput
                style={styles.input}
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                editable={!registerLoading}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (registerLoading || !otpCode || otpCode.length !== 6) && styles.buttonDisabled]} 
                onPress={handleSignupPress}
                disabled={registerLoading || !otpCode || otpCode.length !== 6}>
                {registerLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendButtonText}>تحقق وإنشاء حساب</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: '#999', marginTop: 8 }]} 
                onPress={handleResendOtp}
                disabled={resendCooldown > 0 || registerLoading}>
                <Text style={styles.sendButtonText}>
                  {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown} ثانية` : 'إعادة إرسال OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#085173',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    minHeight: SCREEN_HEIGHT * 0.95,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(15, 20, 25),
    justifyContent: 'center',
    position: 'absolute',
    top: Platform.OS === 'android' ? getResponsiveValue(10, 20, 30) : getResponsiveValue(0, 10, 20),
    left: 0,
    right: 0,
    zIndex: 1,
  },
  logoImage: {
    width: wp(50),
    height: hp(10),
    maxWidth: 200,
    maxHeight: 80,
  },
  cardContainer: {
    width: '100%',
    marginBottom: getResponsiveValue(20, 25, 30),
    marginTop: Platform.OS === 'android' ? getResponsiveValue(100, 120, 140) : getResponsiveValue(80, 100, 120),
    maxWidth: Math.min(500, SCREEN_WIDTH * 0.95),
    alignSelf: 'center',
    overflow: 'visible',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderRadius: (Platform.OS === 'android' && (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800)) || (Platform.OS === 'android' && SCREEN_HEIGHT > 1500)
      ? getResponsiveValue(12, 14, 16)
      : getResponsiveValue(16, 20, 24),
    padding: (Platform.OS === 'android' && (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800)) || (Platform.OS === 'android' && SCREEN_HEIGHT > 1500)
      ? getResponsiveValue(14, 16, 18)
      : getResponsiveValue(20, 24, 28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardBack: {
    backgroundColor: '#FFFFFF',
    borderRadius: (Platform.OS === 'android' && (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800)) || (Platform.OS === 'android' && SCREEN_HEIGHT > 1500)
      ? getResponsiveValue(12, 14, 16)
      : getResponsiveValue(16, 20, 24),
    padding: (Platform.OS === 'android' && (SCREEN_WIDTH <= 360 && SCREEN_HEIGHT <= 800)) || (Platform.OS === 'android' && SCREEN_HEIGHT > 1500)
      ? getResponsiveValue(14, 16, 18)
      : getResponsiveValue(20, 24, 28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ rotateY: '180deg' }],
  },
  cardContent: {
    flex: 1,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: Platform.OS === 'android' ? getResponsiveValue(8, 10, 12) : getResponsiveValue(6, 8, 10),
  },
  countryUniversityRow: {
    flexDirection: 'row',
    gap: getResponsiveValue(10, 12, 14),
    width: '100%',
  },
  halfWidth: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(14)
      : getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#000',
    marginBottom: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(6, 8, 10)
      : getResponsiveValue(8, 10, 12),
    marginTop: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(2, 4, 6)
      : getResponsiveValue(4, 6, 8),
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 6 : 8,
    paddingRight: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(12, 14, 16)
      : getResponsiveValue(14, 16, 18),
    paddingLeft: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(12, 14, 16)
      : getResponsiveValue(14, 16, 18),
    paddingVertical: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(10, 12, 14)
      : Platform.OS === 'android' ? getResponsiveValue(14, 16, 18) : getResponsiveValue(12, 14, 16),
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(14)
      : getResponsiveFontSize(16),
    color: '#000',
    textAlign: 'right',
    width: '100%',
    minHeight: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 46 : Platform.OS === 'android' ? 54 : 48,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    ...(Platform.OS === 'android' && SCREEN_HEIGHT > 1500 
      ? { height: 46 }
      : Platform.OS === 'android' ? { height: 54 } : { minHeight: 48 }),
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 6 : 8,
    paddingLeft: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 50 : 56,
    paddingRight: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(12, 14, 16)
      : getResponsiveValue(14, 16, 18),
    paddingVertical: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(10, 12, 14)
      : Platform.OS === 'android' ? getResponsiveValue(14, 16, 18) : getResponsiveValue(12, 14, 16),
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(14)
      : getResponsiveFontSize(16),
    color: '#000',
    textAlign: 'right',
    width: '100%',
    ...(Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? { 
          height: 46,
          includeFontPadding: false,
          textAlignVertical: 'center',
        }
      : Platform.OS === 'android' 
      ? { 
          height: 54,
          includeFontPadding: false,
          textAlignVertical: 'center',
        } 
      : { 
          minHeight: 48 
        }
    ),
  },
  eyeIconButton: {
    position: 'absolute',
    left: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(10, 12, 14)
      : getResponsiveValue(12, 14, 16),
    top: 0,
    bottom: 0,
    width: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 36 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getResponsiveValue(8, 10, 12),
    marginBottom: getResponsiveValue(16, 20, 24),
    flexWrap: 'wrap',
  },
  forgotPassword: {
    color: '#4A90E2',
    fontSize: getResponsiveFontSize(14),
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    marginLeft: 4,
  },
  rememberMeText: {
    color: '#000',
    fontSize: getResponsiveFontSize(14),
  },
  loginButton: {
    backgroundColor: '#085173',
    borderRadius: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 6 : 8,
    paddingVertical: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(10, 12, 14)
      : getResponsiveValue(14, 16, 18),
    paddingHorizontal: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(12, 16, 20)
      : getResponsiveValue(16, 20, 24),
    alignItems: 'center',
    marginTop: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(2, 4, 6)
      : getResponsiveValue(4, 6, 8),
    marginBottom: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(8, 12, 16)
      : getResponsiveValue(12, 16, 20),
    minHeight: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 
      ? getResponsiveValue(40, 44, 48) 
      : getResponsiveValue(48, 50, 54),
    width: '100%',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(16)
      : getResponsiveFontSize(18),
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#085173',
    borderRadius: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 6 : 8,
    paddingVertical: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(10, 12, 14)
      : getResponsiveValue(14, 16, 18),
    paddingHorizontal: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(12, 16, 20)
      : getResponsiveValue(16, 20, 24),
    alignItems: 'center',
    marginTop: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(8, 12, 16)
      : getResponsiveValue(12, 16, 20),
    marginBottom: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(8, 12, 16)
      : getResponsiveValue(12, 16, 20),
    minHeight: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 
      ? getResponsiveValue(40, 44, 48) 
      : getResponsiveValue(48, 50, 54),
    width: '100%',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(14)
      : getResponsiveFontSize(18),
    fontWeight: '600',
  },
  createAccountLink: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(-15, -15, -15)
      : Platform.OS === 'android' ? getResponsiveValue(-10, -10, -10) : getResponsiveValue(8, 10, 12),
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(-15, -15, -15)
      : Platform.OS === 'ios' 
      ? getResponsiveValue(-12, -10, -8) 
      : getResponsiveValue(-8, -6, -4),
  },
  linkText: {
    color: '#000',
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(12)
      : getResponsiveFontSize(14),
  },
  linkTextBlack: {
    color: '#000',
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(12)
      : getResponsiveFontSize(14),
  },
  linkTextBlue: {
    color: '#4A90E2',
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(12)
      : getResponsiveFontSize(14),
  },
  filePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  fileInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingVertical: Platform.OS === 'android' ? getResponsiveValue(14, 16, 18) : getResponsiveValue(12, 14, 16),
    fontSize: getResponsiveFontSize(16),
    color: '#000',
    textAlign: 'right',
    minHeight: Platform.OS === 'android' ? 54 : 48,
  },
  fileButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: getResponsiveValue(14, 16, 18),
    paddingVertical: getResponsiveValue(14, 16, 18),
    minHeight: Platform.OS === 'android' ? 54 : 48,
    justifyContent: 'center',
  },
  fileButtonText: {
    color: '#085173',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingVertical: Platform.OS === 'android' ? getResponsiveValue(14, 16, 18) : getResponsiveValue(12, 14, 16),
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'android' ? 54 : 48,
  },
  countryButtonText: {
    fontSize: getResponsiveFontSize(16),
    color: '#000',
    textAlign: 'right',
    flex: 1,
    marginRight: 8,
  },
  countryButtonPlaceholder: {
    color: '#999',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  countryModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  countryModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: getResponsiveValue(20, 24, 28),
    borderTopRightRadius: getResponsiveValue(20, 24, 28),
    padding: getResponsiveValue(20, 24, 28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 10000 : 8,
    maxHeight: SCREEN_HEIGHT * getResponsiveValue(0.6, 0.55, 0.5),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },
  countryModalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  countryModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveValue(14, 16, 18),
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: getResponsiveValue(52, 56, 60),
  },
  countryFlag: {
    width: 30,
    height: 20,
    marginLeft: 12,
    borderRadius: 4,
  },
  countryModalItemText: {
    fontSize: getResponsiveFontSize(16),
    color: '#000',
    textAlign: 'right',
    flex: 1,
  },
  socialSection: {
    marginTop: getResponsiveValue(20, 25, 30),
    marginBottom: getResponsiveValue(20, 25, 30),
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  separatorText: {
    color: '#CCCCCC',
    fontSize: getResponsiveFontSize(16),
    marginHorizontal: 12,
  },
  socialLoginText: {
    color: '#CCCCCC',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getResponsiveValue(16, 20, 24),
    paddingHorizontal: wp(5),
  },
  socialButton: {
    width: getResponsiveValue(50, 54, 58),
    height: getResponsiveValue(50, 54, 58),
    borderRadius: getResponsiveValue(25, 27, 29),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  socialIcon: {
    width: getResponsiveValue(28, 30, 32),
    height: getResponsiveValue(28, 30, 32),
  },
  gmailIcon: {
    width: getResponsiveValue(32, 36, 40),
    height: getResponsiveValue(32, 36, 40),
  },
  legalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: wp(5),
    paddingBottom: getResponsiveValue(20, 25, 30),
    paddingTop: getResponsiveValue(15, 20, 25),
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  legalText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(12),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(18),
  },
  legalLink: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    elevation: 9999,
  },
  overlayTouchable: {
    flex: 1,
  },
  forgotPasswordModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10000,
    pointerEvents: 'box-none',
  },
  modalCard: {
    width: SCREEN_WIDTH * getResponsiveValue(0.92, 0.9, 0.88),
    maxWidth: getResponsiveValue(350, 400, 450),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveValue(16, 20, 24),
    padding: getResponsiveValue(24, 28, 32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: SCREEN_HEIGHT * getResponsiveValue(0.8, 0.75, 0.7),
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginBottom: getResponsiveValue(8, 10, 12),
    padding: 4,
  },
  forgotPasswordTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  separatorLineDark: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  instructionText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'right',
    marginTop: getResponsiveValue(12, 14, 16),
    marginBottom: getResponsiveValue(20, 24, 28),
    lineHeight: getResponsiveFontSize(20),
  },
  sendButton: {
    backgroundColor: '#085173',
    borderRadius: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 ? 6 : 8,
    paddingVertical: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(10, 12, 14)
      : getResponsiveValue(14, 16, 18),
    paddingHorizontal: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(12, 16, 20)
      : getResponsiveValue(16, 20, 24),
    alignItems: 'center',
    marginTop: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveValue(6, 8, 10)
      : getResponsiveValue(8, 10, 12),
    minHeight: Platform.OS === 'android' && SCREEN_HEIGHT > 1500 
      ? getResponsiveValue(40, 44, 48) 
      : getResponsiveValue(48, 50, 54),
    width: '100%',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'android' && SCREEN_HEIGHT > 1500
      ? getResponsiveFontSize(14)
      : getResponsiveFontSize(18),
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
