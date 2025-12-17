import api from './api';
import axios from 'axios';

// ============================================
// 1. إرسال OTP (للتسجيل)
// ============================================
export const sendOtp = async (email: string): Promise<string> => {
  try {
    if (!email || !email.trim()) {
      throw new Error('البريد الإلكتروني مطلوب');
    }
    const emailValue = email.trim();
    console.log('📤 Sending OTP request:', { email: emailValue });
    
    const response = await api.post(
      `/api/auth/otp?Email=${encodeURIComponent(emailValue)}`,
      null,
      {
        headers: {
          accept: '*/*',
        },
      }
    );
    
    console.log('✅ Send OTP response:', response.data);
    return response.data; // "The Otp Has Sent"
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'خطأ في إرسال رمز التحقق';
    throw new Error(errorMessage);
  }
};

// ============================================
// 2. إنشاء الحساب (Register)
// ============================================
export const register = async (
  email: string,
  password: string,
  username: string,
  countryId: number,
  otp: string,
  imageFile: any = null
): Promise<any> => {
  try {
    if (!email || !password || !username || !countryId || !otp) {
      throw new Error('جميع الحقول مطلوبة');
    }
    
    console.log('📤 Registering user:', { email, username, countryId });
    
    const queryParams = new URLSearchParams({
      Email: email.trim(),
      Password: password.trim(),
      UserName: username.trim(),
      CountryId: countryId.toString(),
      otp: otp.trim(),
    });
    
    const formData = new FormData();
    if (imageFile) {
      formData.append('Image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'image.jpg',
      } as any);
    } else {
      formData.append('Image', '' as any);
    }
    
    const response = await api.post(
      `/api/auth/register?${queryParams.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('✅ Register response:', response.data);
    
    if (!response.data?.isAuthenticated || !response.data?.token) {
      throw new Error(response.data?.message || 'فشل إنشاء الحساب');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error registering:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'حدث خطأ أثناء إنشاء الحساب';
    throw new Error(errorMessage);
  }
};

// ============================================
// 3. تسجيل الدخول (Login)
// ============================================
export const login = async (email: string, password: string): Promise<any> => {
  try {
    if (!email || !email.trim()) {
      throw new Error('يرجى إدخال البريد الإلكتروني');
    }
    if (!password || !password.trim()) {
      throw new Error('يرجى إدخال كلمة السر');
    }
    
    console.log('📤 Logging in:', { email: email.trim() });
    
    const response = await api.post(
      '/api/auth/login',
      {
        Email: email.trim(),
        Password: password.trim(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Login response:', response.data);
    
    if (!response.data?.token) {
      throw new Error(
        response.data?.message || 'خطأ في تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور'
      );
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error logging in:', error?.response?.data || error);
    
    const statusCode = error?.response?.status;
    
    // إذا كان الخطأ 400 أو 401، إرجاع رسالة واضحة بدون أرقام الأخطاء
    if (statusCode === 400 || statusCode === 401) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    // للخطأ 404
    if (statusCode === 404) {
      throw new Error('البريد الإلكتروني غير موجود');
    }
    
    // للخطأ 500 أو أخطاء الخادم
    if (statusCode >= 500) {
      throw new Error('حدث خطأ في الخادم، يرجى المحاولة لاحقاً');
    }
    
    // محاولة استخراج رسالة الخطأ من الـ API
    let errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'خطأ في تسجيل الدخول، حاول مرة أخرى لاحقاً';
    
    // إزالة أي أرقام أخطاء من الرسالة (400, 401, إلخ)
    errorMessage = errorMessage.replace(/\b(400|401|404|500)\b/g, '').trim();
    
    // إذا كانت الرسالة فارغة بعد الإزالة، استخدم رسالة افتراضية
    if (!errorMessage || errorMessage.length === 0) {
      errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    }
    
    throw new Error(errorMessage);
  }
};

// ============================================
// 4. إرسال OTP لاستعادة كلمة المرور
// ============================================
export const sendOtpForPasswordReset = async (email: string): Promise<string> => {
  try {
    if (!email || !email.trim()) {
      throw new Error('البريد الإلكتروني مطلوب');
    }
    const emailValue = email.trim();
    console.log('📤 Sending OTP for password reset:', { email: emailValue });
    
    const response = await api.post(
      `/api/auth/password/reset?Email=${encodeURIComponent(emailValue)}`,
      null,
      {
        headers: {
          accept: '*/*',
        },
      }
    );
    
    console.log('✅ Send OTP for password reset response:', response.data);
    return response.data; // "The Otp Has Sent"
  } catch (error: any) {
    console.error('❌ Error sending OTP for password reset:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'خطأ في إرسال رمز التحقق';
    throw new Error(errorMessage);
  }
};

// ============================================
// 5. تأكيد استعادة كلمة المرور
// ============================================
export const confirmPasswordReset = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<any> => {
  try {
    if (!email || !email.trim()) {
      throw new Error('البريد الإلكتروني مطلوب');
    }
    if (!otp || !otp.trim()) {
      throw new Error('رمز التحقق مطلوب');
    }
    if (!newPassword || !newPassword.trim()) {
      throw new Error('كلمة المرور الجديدة مطلوبة');
    }
    if (newPassword.trim().length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }
    
    const emailValue = email.trim();
    const otpValue = otp.toString().trim();
    console.log('📤 Confirming password reset:', { email: emailValue, otp: otpValue });
    
    const response = await api.post(
      '/api/auth/password/reset/confirm',
      {
        email: emailValue,
        otp: otpValue,
        password: newPassword.trim(),
      },
      {
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Confirm password reset response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error confirming password reset:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'خطأ في استعادة كلمة المرور';
    throw new Error(errorMessage);
  }
};

// ============================================
// 6. جلب قائمة الدول
// ============================================
export const getCountries = async (): Promise<Array<{ id: number; nameCountry: string; iconUrl: string }>> => {
  try {
    console.log('📤 Fetching countries...');
    
    const response = await api.get('/api/countries');
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('✅ Countries fetched:', response.data.length);
      return response.data;
    }
    
    console.warn('⚠️ No countries returned');
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching countries:', error);
    return [];
  }
};

// ============================================
// 7. تحديث Token (Refresh Token)
// ============================================
export const refreshToken = async (): Promise<any> => {
  try {
    console.log('📤 Refreshing token...');
    
    const response = await api.get('/api/auth/refresh-token');
    
    console.log('✅ Refresh token response:', response.data);
    
    if (!response.data?.token) {
      throw new Error(response.data?.message || 'فشل تحديث الـ token');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error refreshing token:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'فشل تحديث الـ token';
    throw new Error(errorMessage);
  }
};

// ============================================
// 8. إلغاء Token (Revoke Token) - تسجيل الخروج
// ============================================
export const revokeToken = async (token: string): Promise<any> => {
  try {
    if (!token || !token.trim()) {
      throw new Error('الـ token مطلوب');
    }
    
    const cleanToken = token.trim();
    console.log('📤 Revoking token...', cleanToken.substring(0, 30) + '...');
    
    // استخدام axios مباشرة لتجنب أي تداخل مع interceptor
    const response = await axios.post(
      'http://arabcodetest.runasp.net/api/auth/revoke-token',
      {
        token: cleanToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
          'Authorization': `Bearer ${cleanToken}`,
        },
        timeout: 10000,
      }
    );
    
    console.log('✅ Revoke token response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error revoking token:', error?.response?.data || error?.message || error);
    
    // حتى لو فشل الطلب، نعتبر أن تسجيل الخروج نجح محلياً
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'فشل إلغاء الـ token';
    
    // لا نرمي خطأ هنا، لأننا نريد مسح البيانات المحلية حتى لو فشل الطلب
    console.warn('⚠️ Revoke token failed, but continuing with local logout:', errorMessage);
    return { success: false, message: errorMessage };
  }
};

