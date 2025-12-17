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
import { getCountries as fetchCountriesAPI } from '@/services/authService';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: number; nameCountry: string; iconUrl: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const countryModalOpacity = useSharedValue(0);
  const countryModalTranslateY = useSharedValue(SCREEN_WIDTH);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    profilePicture: '',
    country: '',
  });
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [imageFile, setImageFile] = useState<any>(null);

  // Auth Hooks
  const { loading: registerLoading, otpSent, resendCooldown, handleSendOtp, handleResendOtp, handleVerifyOtpAndRegister } = useRegister();
  const { loading: loginLoading, handleLogin } = useLogin();
  const { loading: resetLoading, otpSent: resetOtpSent, resendCooldown: resetResendCooldown, handleSendOtp: handleResetSendOtp, handleResendOtp: handleResetResendOtp, handleConfirmPasswordReset } = usePasswordReset();

  const flipRotation = useSharedValue(0);
  const cardHeight = useSharedValue(400);
  const logoScale = useSharedValue(1.5);
  const cardTranslateY = useSharedValue(0);
  const socialSectionOpacity = useSharedValue(1);
  const inputWidth = useSharedValue(4);
  const createAccountLinkTranslateY = useSharedValue(-50);
  const [cardOpened, setCardOpened] = useState(false);
  const forgotPasswordModalOpacity = useSharedValue(0);
  const forgotPasswordModalTranslateX = useSharedValue(SCREEN_WIDTH);
  const forgotPasswordModalTranslateY = useSharedValue(0);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    flipRotation.value = withTiming(isFlipped ? 0 : 180, { duration: 600 });
    cardHeight.value = withTiming(isFlipped ? 400 : 600, { duration: 600 });
    logoScale.value = withTiming(isFlipped ? 1.5 : 1.3, { duration: 600 });
    cardTranslateY.value = withTiming(isFlipped ? 0 : -30, { duration: 600 });
    socialSectionOpacity.value = withTiming(isFlipped ? 1 : 0, { duration: 600 });
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  // Load remembered email and password
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
        // للتوافق مع البيانات القديمة
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
    // Start all animations when card first opens
    if (!cardOpened) {
      setCardOpened(true);
      // Start all animations together when card opens
      inputWidth.value = withTiming(100, { duration: 800, easing: Easing.out(Easing.ease) });
      createAccountLinkTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    }
  }, []);

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${inputWidth.value}%`,
      alignSelf: 'flex-end',
    };
  });

  const passwordInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${inputWidth.value}%`,
      alignSelf: 'flex-end',
      overflow: 'hidden',
    };
  });

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

  const createAccountLinkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: createAccountLinkTranslateY.value }],
      opacity: interpolate(createAccountLinkTranslateY.value, [-50, 0], [0, 1]),
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(flipRotation.value, [0, 90, 90, 180], [1, 1, 0, 0]),
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(flipRotation.value, [0, 90, 90, 180], [0, 0, 1, 1]),
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
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('نحتاج إلى إذن للوصول إلى الصور!');
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
      const fileName = imageUri.split('/').pop() || 'image.png';
      setFormData({ ...formData, profilePicture: fileName });
      
      // Save image file for API
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

  // Login Handler
  const handleLoginPress = async () => {
    const result = await handleLogin(formData.email, formData.password, rememberMe);
    if (result.success) {
      // Navigate to home screen
      router.replace('/home' as any);
    }
  };

  // Signup Handler
  const handleSignupPress = async () => {
    if (!otpSent) {
      // Send OTP
      const result = await handleSendOtp(
        formData.email,
        formData.username,
        formData.password,
        selectedCountryId || 0,
        imageFile
      );
      if (result.success) {
        setShowOtpModal(true);
      }
    } else {
      // Verify OTP and Register
      const result = await handleVerifyOtpAndRegister(otpCode);
      if (result.success) {
        setShowOtpModal(false);
        setOtpCode('');
        flipCard(); // Go back to login
      }
    }
  };

  // Forgot Password Handler
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
    countryModalTranslateY.value = withTiming(SCREEN_WIDTH, { duration: 300, easing: Easing.in(Easing.ease) });
    setTimeout(() => {
      setShowCountryDropdown(false);
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={require('@/assets/images/logo_app.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        {/* Flip Card Container */}
        <Animated.View style={[styles.cardContainer, containerAnimatedStyle]}>
          {/* Front Card - Login */}
          <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
            <View style={styles.cardContent}>
              <Text style={styles.label}>البريد الالكتروني</Text>
              <Animated.View style={inputAnimatedStyle}>
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
              </Animated.View>

              <Text style={styles.label}>كلمة السر</Text>
              <Animated.View style={passwordInputAnimatedStyle}>
                <View style={styles.passwordContainer}>
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}>
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="كلمة السر"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                  />
                </View>
              </Animated.View>

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

                    <Animated.View style={createAccountLinkAnimatedStyle}>
                      <TouchableOpacity onPress={flipCard} style={styles.createAccountLink}>
                        <Text>
                          <Text style={styles.linkTextBlack}>ليس لديك حساب؟ </Text>
                          <Text style={styles.linkTextBlue}>انشاء حساب</Text>
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
            </View>
          </Animated.View>

          {/* Back Card - Signup */}
          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <View style={styles.cardContent}>
              <Text style={styles.label}>اسم المستخدم</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="ahar"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>البريد الالكتروني</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="alaghrs@gmail.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>كلمة السر</Text>
              <Animated.View style={passwordInputAnimatedStyle}>
                <View style={styles.passwordContainer}>
                  <TouchableOpacity
                    onPress={() => setShowSignupPassword(!showSignupPassword)}
                    style={styles.eyeIcon}>
                    <Ionicons
                      name={showSignupPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="كلمة السر"
                    placeholderTextColor="#999"
                    secureTextEntry={!showSignupPassword}
                  />
                </View>
              </Animated.View>

              <Text style={styles.label}>الصورة الشخصية</Text>
              <Animated.View style={inputAnimatedStyle}>
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
              </Animated.View>

              <Text style={styles.label}>اختر الدولة</Text>
              <Animated.View style={inputAnimatedStyle}>
                <TouchableOpacity
                  style={styles.countryButton}
                  onPress={fetchCountries}
                  activeOpacity={0.7}>
                  <Text style={[styles.countryButtonText, !formData.country && styles.countryButtonPlaceholder]}>
                    {formData.country || 'الأردن'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
                </TouchableOpacity>
              </Animated.View>

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

        {/* Social Login Section */}
        <Animated.View style={[styles.socialSection, socialSectionAnimatedStyle]}>
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>أو</Text>
            <View style={styles.separatorLine} />
          </View>

          <Text style={styles.socialLoginText}>سجل الدخول باستخدام</Text>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require('@/assets/icons/likedin.png')}
                style={styles.socialIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require('@/assets/icons/gmail.png')}
                style={styles.gmailIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
      
      {/* Legal Text - Fixed at bottom */}
      <View style={styles.legalContainer}>
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 70,
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 30,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardBack: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
  },
  eyeIcon: {
    padding: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotPassword: {
    color: '#4A90E2',
    fontSize: 14,
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
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#085173',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#085173',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    zIndex: Platform.OS === 'ios' ? 1 : 1,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  createAccountLink: {
    alignItems: 'center',
  },
  loginLink: {
    alignItems: 'center',
  },
  linkText: {
    color: '#000',
    fontSize: 14,
  },
  linkTextBlack: {
    color: '#000',
    fontSize: 14,
  },
  linkTextBlue: {
    color: '#4A90E2',
    fontSize: 14,
  },
  filePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
  },
  fileButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fileButtonText: {
    color: '#085173',
    fontSize: 14,
    fontWeight: '600',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  countryButtonText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
    flex: 1,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 10000 : 8,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },
  countryModalScrollView: {
    maxHeight: 300,
  },
  countryModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  countryFlag: {
    width: 30,
    height: 20,
    marginLeft: 12,
    borderRadius: 4,
  },
  countryModalItemText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'right',
    flex: 1,
  },
  socialSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  separatorText: {
    color: '#CCCCCC',
    fontSize: 16,
    marginHorizontal: 12,
  },
  socialLoginText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    width: 30,
    height: 30,
  },
  gmailIcon: {
    width: 36,
    height: 36,
  },
  legalContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#085173',
  },
  legalText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
    zIndex: 999,
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
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  modalCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  forgotPasswordTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
    marginBottom: 12,
  },
  separatorLineDark: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#085173',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

