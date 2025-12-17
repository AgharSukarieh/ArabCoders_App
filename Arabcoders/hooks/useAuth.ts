import { useState } from 'react';
import { Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import {
  sendOtp,
  register,
  login,
  sendOtpForPasswordReset,
  confirmPasswordReset,
} from '../services/authService';
import {
  saveToken,
  saveUser,
  saveSession,
  saveRememberedEmail,
  saveRememberedCredentials,
  clearAuthData,
} from '../services/storage';
import { decodeJwt, isValidEmail } from '../utils/authUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Hook: useRegister (للتسجيل)
// ============================================
export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // إرسال OTP
  const handleSendOtp = async (
    email: string,
    username: string,
    password: string,
    countryId: number,
    imageFile: any
  ) => {
    try {
      setLoading(true);

      // التحقق من البيانات
      if (!username?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم');
        return { success: false };
      }
      if (!email?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
        return { success: false };
      }
      if (!isValidEmail(email.trim())) {
        Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
        return { success: false };
      }
      if (!password?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال كلمة السر');
        return { success: false };
      }
      if (password.trim().length < 6) {
        Alert.alert('خطأ', 'كلمة السر يجب أن تكون 6 أحرف على الأقل');
        return { success: false };
      }
      if (!countryId) {
        Alert.alert('خطأ', 'يرجى اختيار الدولة');
        return { success: false };
      }

      // إرسال OTP
      await sendOtp(email.trim());

      // حفظ البيانات المؤقتة
      const signupData = {
        email: email.trim(),
        username: username.trim(),
        password: password.trim(),
        countryId,
        imageFile,
      };
      await AsyncStorage.setItem('pendingSignupData', JSON.stringify(signupData));

      setOtpSent(true);
      setResendCooldown(60);
      Alert.alert('نجاح', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');

      // Start countdown timer
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return { success: true };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال رمز التحقق');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // إعادة إرسال OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return { success: false };
    try {
      setLoading(true);
      const signupDataStr = await AsyncStorage.getItem('pendingSignupData');
      if (!signupDataStr) {
        Alert.alert('خطأ', 'لا توجد بيانات مؤقتة');
        return { success: false };
      }
      const signupData = JSON.parse(signupDataStr);
      await sendOtp(signupData.email);
      setResendCooldown(60);
      Alert.alert('نجاح', 'تم إرسال رمز التحقق مرة أخرى');

      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return { success: true };
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      Alert.alert('خطأ', error.message || 'خطأ في إعادة الإرسال');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // التحقق من OTP وإنشاء الحساب
  const handleVerifyOtpAndRegister = async (otp: string) => {
    try {
      setLoading(true);
      if (!otp || !otp.trim()) {
        Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق');
        return { success: false };
      }

      const signupDataStr = await AsyncStorage.getItem('pendingSignupData');
      if (!signupDataStr) {
        Alert.alert('خطأ', 'خطأ في البيانات المؤقتة');
        return { success: false };
      }

      const signupData = JSON.parse(signupDataStr);

      // إنشاء الحساب
      const result = await register(
        signupData.email,
        signupData.password,
        signupData.username,
        signupData.countryId,
        otp.trim(),
        signupData.imageFile
      );

      // حفظ بيانات المستخدم
      const tokenExpiration = Date.now() + 1000 * 60 * 60; // 1 hour
      await saveToken(result.token, tokenExpiration);

      const tokenPayload = decodeJwt(result.token);
      const user = {
        id: result.responseUserDTO?.id || tokenPayload?.uid || tokenPayload?.sub || Date.now(),
        name: result.username || signupData.username,
        email: result.email || signupData.email,
        role: result.responseUserDTO?.role || 'User',
      };

      await saveUser(user);
      await saveSession(result);

      // مسح البيانات المؤقتة
      await AsyncStorage.removeItem('pendingSignupData');

      Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
      return { success: true, user, token: result.token };
    } catch (error: any) {
      console.error('Error verifying OTP and registering:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إنشاء الحساب');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    otpSent,
    resendCooldown,
    handleSendOtp,
    handleResendOtp,
    handleVerifyOtpAndRegister,
  };
};

// ============================================
// Hook: useLogin (لتسجيل الدخول)
// ============================================
export const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);

      if (!email?.trim()) {
        showMessage({
          message: 'خطأ في البريد الإلكتروني',
          description: 'يرجى إدخال البريد الإلكتروني',
          type: 'danger',
          icon: 'danger',
          duration: 3000,
        });
        return { success: false };
      }
      if (!isValidEmail(email.trim())) {
        showMessage({
          message: 'خطأ في البريد الإلكتروني',
          description: 'يرجى إدخال بريد إلكتروني صحيح',
          type: 'danger',
          icon: 'danger',
          duration: 3000,
        });
        return { success: false };
      }
      if (!password?.trim()) {
        showMessage({
          message: 'خطأ في كلمة المرور',
          description: 'يرجى إدخال كلمة المرور',
          type: 'danger',
          icon: 'danger',
          duration: 3000,
        });
        return { success: false };
      }

      // تسجيل الدخول
      const data = await login(email.trim(), password.trim());

      if (!data?.token) {
        const errorMessage = data?.message || 'خطأ في تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور';
        showMessage({
          message: 'فشل تسجيل الدخول',
          description: errorMessage,
          type: 'danger',
          icon: 'danger',
          duration: 4000,
        });
        return { success: false };
      }

      // حفظ Token
      const tokenExpiration = Date.now() + 1000 * 60 * 60; // 1 hour
      await saveToken(data.token, tokenExpiration);

      // استخراج بيانات المستخدم
      const tokenPayload = decodeJwt(data.token);
      const responseUser = data?.responseUserDTO ?? {};
      const resolvedUserId = responseUser.id || tokenPayload?.uid || tokenPayload?.sub || null;
      const resolvedUserName = responseUser.fullName || responseUser.userName || responseUser.name || email.trim();
      const resolvedUserEmail = responseUser.email || email.trim();
      const resolvedRole = responseUser.role || data?.role || 'User';

      const user = {
        ...responseUser,
        id: resolvedUserId || responseUser.id || Date.now(),
        name: resolvedUserName,
        email: resolvedUserEmail,
        role: resolvedRole,
      };

      const session = {
        ...data,
        username: data?.username || resolvedUserName,
        email: data?.email || resolvedUserEmail,
        role: resolvedRole,
        responseUserDTO: responseUser,
        storedAt: new Date().toISOString(),
      };

      // حفظ بيانات المستخدم
      await saveUser(user);
      await saveSession(session);

      // حفظ Remember Me (البريد الإلكتروني وكلمة المرور)
      if (rememberMe) {
        await saveRememberedCredentials(email.trim(), password.trim(), true);
      } else {
        await AsyncStorage.removeItem('auth-remember');
      }

    
      return {
        success: true,
        user,
        token: data.token,
        session,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // التحقق من حالة الخطأ من الـ API
      const statusCode = error?.response?.status;
      const hasResponse = !!error?.response; // التحقق من وجود response (يعني وصل للخادم)
      const errorMessage = error?.message || error?.response?.data?.message || error?.response?.data || '';
      
      let errorTitle = 'خطأ في تسجيل الدخول';
      let errorDescription = 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى';
      
      // التحقق من رسالة الخطأ أولاً (قد تكون من authService.ts بعد معالجة الخطأ)
      if (errorMessage.includes('البريد الإلكتروني أو كلمة المرور غير صحيحة')) {
        errorTitle = 'فشل تسجيل الدخول';
        errorDescription = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
      // إذا كان الخطأ 400 أو 401 (Bad Request / Unauthorized)، فهذا يعني بيانات خاطئة
      else if (statusCode === 400 || statusCode === 401) {
        errorTitle = 'فشل تسجيل الدخول';
        errorDescription = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
      // إذا كان الخطأ 404، المستخدم غير موجود
      else if (statusCode === 404 || errorMessage.includes('البريد الإلكتروني غير موجود')) {
        errorTitle = 'خطأ في البريد الإلكتروني';
        errorDescription = 'البريد الإلكتروني غير موجود';
      }
      // إذا كان الخطأ متعلق بالشبكة (لكن وصل للخادم)
      else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('econnrefused')) {
        errorTitle = 'مشكلة في الاتصال';
        errorDescription = 'يرجى التحقق من اتصالك بالإنترنت';
      }
      // إذا لم يكن هناك response (لم يصل للخادم) = مشكلة في الاتصال
      else if (!hasResponse) {
        errorTitle = 'مشكلة في الاتصال';
        errorDescription = 'يرجى التحقق من اتصالك بالإنترنت';
      }
      // تحليل رسالة الخطأ لتحديد نوع المشكلة
      else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('بريد') || errorMessage.toLowerCase().includes('إيميل')) {
        errorTitle = 'خطأ في البريد الإلكتروني';
        errorDescription = 'البريد الإلكتروني غير صحيح أو غير موجود';
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('كلمة') || errorMessage.toLowerCase().includes('مرور')) {
        errorTitle = 'خطأ في كلمة المرور';
        errorDescription = 'كلمة المرور غير صحيحة';
      } else if (errorMessage && !errorMessage.includes('400') && !errorMessage.includes('401')) {
        // عرض الرسالة فقط إذا لم تكن تحتوي على أرقام الأخطاء
        errorDescription = errorMessage;
      }
      
      showMessage({
        message: errorTitle,
        description: errorDescription,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
  };
};

// ============================================
// Hook: usePasswordReset (لاستعادة كلمة المرور)
// ============================================
export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // إرسال OTP لاستعادة كلمة المرور
  const handleSendOtp = async (email: string) => {
    try {
      setLoading(true);
      if (!email?.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
        return { success: false };
      }
      if (!isValidEmail(email.trim())) {
        Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
        return { success: false };
      }

      await sendOtpForPasswordReset(email.trim());
      await AsyncStorage.setItem('passwordResetEmail', email.trim());

      setOtpSent(true);
      setResendCooldown(60);
      Alert.alert('نجاح', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');

      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return { success: true };
    } catch (error: any) {
      console.error('Error sending OTP for password reset:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال رمز التحقق');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // إعادة إرسال OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return { success: false };
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('passwordResetEmail');
      if (!email) {
        Alert.alert('خطأ', 'لا توجد بيانات مؤقتة');
        return { success: false };
      }
      await sendOtpForPasswordReset(email);
      setResendCooldown(60);
      Alert.alert('نجاح', 'تم إرسال رمز التحقق مرة أخرى');

      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return { success: true };
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      Alert.alert('خطأ', error.message || 'خطأ في إعادة الإرسال');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // تأكيد استعادة كلمة المرور
  const handleConfirmPasswordReset = async (otp: string, newPassword: string) => {
    try {
      setLoading(true);
      if (!otp || !otp.trim()) {
        Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق');
        return { success: false };
      }
      if (!newPassword || !newPassword.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال كلمة المرور الجديدة');
        return { success: false };
      }
      if (newPassword.trim().length < 6) {
        Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return { success: false };
      }

      const email = await AsyncStorage.getItem('passwordResetEmail');
      if (!email) {
        Alert.alert('خطأ', 'لا توجد بيانات مؤقتة');
        return { success: false };
      }

      await confirmPasswordReset(email, otp.trim(), newPassword.trim());
      await AsyncStorage.removeItem('passwordResetEmail');

      Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح!');
      return { success: true };
    } catch (error: any) {
      console.error('Error confirming password reset:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    otpSent,
    resendCooldown,
    handleSendOtp,
    handleResendOtp,
    handleConfirmPasswordReset,
  };
};

