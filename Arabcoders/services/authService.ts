import api from './api';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken } from './storage';

const API_BASE_URL = 'http://arabcodetest.runasp.net';

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
  imageFile: any = null,
  universityId: number = 0
): Promise<any> => {
  try {
    if (!email || !password || !username || !countryId || !otp) {
      throw new Error('جميع الحقول مطلوبة');
    }
    
    console.log('📤 Registering user:', { email, username, countryId, universityId });
    
    const queryParams = new URLSearchParams({
      Email: email.trim(),
      Password: password.trim(),
      UserName: username.trim(),
      CountryId: countryId.toString(),
      UniversityId: universityId.toString(),
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
    console.log('📤 Refreshing token from refresh-token endpoint...');
    
    // استخدام axios مباشرة لتجنب interceptor الذي قد يحاول تجديد token مرة أخرى
    // refresh-token endpoint قد لا يحتاج إلى token في header (يستخدم cookies/session)
    // أو قد يحتاج إلى token منتهي الصلاحية
    const token = await AsyncStorage.getItem('token');
    
    const response = await axios.get(`${API_BASE_URL}/api/auth/refresh-token`, {
      headers: {
        'accept': '*/*',
        // إضافة token في header إذا كان موجوداً (حتى لو كان منتهي الصلاحية)
        ...(token ? { 'Authorization': `Bearer ${token.trim()}` } : {}),
      },
      timeout: 10000,
    });
    
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
  // تسجيل الخروج المحلي فقط بدون محاولة إلغاء الـ token من السيرفر
  return { success: true, message: 'تم تسجيل الخروج بنجاح' };
};

// ============================================
// 8.5. جلب قائمة الجامعات
// ============================================
export const getUniversities = async (): Promise<Array<{ id: number; nameUniversity: string; imageUrl?: string }>> => {
  try {
    console.log('📤 Fetching universities...');
    
    const response = await api.get('/api/universities', {
      headers: {
        'accept': '*/*',
      },
    });
    
    console.log('✅ Universities fetched:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data.map((university: any) => ({
        id: university.id || 0,
        nameUniversity: university.nameUniversity || university.name || '',
        imageUrl: university.imageUrl || university.iconUrl || '',
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching universities:', error?.response?.data || error);
    // إرجاع قائمة فارغة في حالة الخطأ
    return [];
  }
};

// ============================================
// 9. إرسال OTP لتغيير الإيميل
// ============================================
export const sendOtpForEmailReset = async (email: string): Promise<string> => {
  try {
    if (!email || !email.trim()) {
      throw new Error('البريد الإلكتروني مطلوب');
    }
    const emailValue = email.trim();
    console.log('📤 Sending OTP for email reset:', { email: emailValue });
    
    const response = await api.post(
      `/api/users/email/reset?Email=${encodeURIComponent(emailValue)}`,
      null,
      {
        headers: {
          accept: '*/*',
        },
      }
    );
    
    console.log('✅ Send OTP for email reset response:', response.data);
    return response.data; // "The Otp Has Sent"
  } catch (error: any) {
    console.error('❌ Error sending OTP for email reset:', error?.response?.data || error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'خطأ في إرسال رمز التحقق';
    throw new Error(errorMessage);
  }
};

// ============================================
// 10. تحديث بيانات المستخدم
// ============================================
export interface UpdateUserData {
  id: number;
  email: string;
  userName: string;
  imageURL: string;
  countryId: number;
  universityId: number;
  otp: string;
}

export const updateUser = async (
  userId: number,
  userData: UpdateUserData,
  originalEmail?: string
): Promise<any> => {
  try {
    console.log('📤 Updating user:', userId, userData);
    
    // لا نحاول تجديد الـ token هنا - الـ interceptor سيتعامل مع هذا تلقائياً عند الحاجة
    // التحقق من تغيير الإيميل
    const emailChanged = originalEmail && originalEmail.trim() !== userData.email.trim();
    
    if (emailChanged) {
      // إذا تم تغيير الإيميل، يجب التحقق من وجود OTP
      console.log('📧 Email changed, verifying OTP');
      if (!userData.otp || !userData.otp.trim()) {
        throw new Error('يرجى إدخال رمز التحقق المرسل إلى الإيميل الجديد');
      }
    } else {
      // إذا لم يتم تغيير الإيميل، نرسل OTP فارغ
      console.log('✅ Email not changed, updating without OTP');
      userData.otp = '';
    }
    
    console.log('📤 Update user data:', userData);
    
    // الـ interceptor في api.ts سيتعامل مع الـ token تلقائياً
    const response = await api.put(
      `/api/users/${userId}`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json',
          accept: 'text/plain',
        },
      }
    );
    
    console.log('✅ Update user response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating user:', error);
    console.error('❌ Error response data:', error?.response?.data);
    console.error('❌ Error response status:', error?.response?.status);
    
    // محاولة استخراج رسالة الخطأ من عدة مصادر
    let errorMessage = 'خطأ في تحديث بيانات المستخدم';
    
    if (error?.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.title) {
        errorMessage = error.response.data.title;
      }
      } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// جلب معلومات مستخدم معين
export const getUserById = async (userId: number): Promise<any> => {
  try {
    console.log('📤 Fetching user:', userId);
    const response = await api.get(`/api/users/${userId}`, {
      headers: {
        'accept': 'text/plain',
      },
    });
    console.log('✅ User fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching user:', error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل جلب معلومات المستخدم');
  }
};

// متابعة مستخدم
export const followUser = async (followerId: number, followId: number): Promise<any> => {
  try {
    console.log('📤 Following user:', { followerId, followId });
    const response = await api.post('/api/follows', {
      follower: followerId,
      follow: followId,
    }, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ User followed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error following user:', error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل متابعة المستخدم');
  }
};

// إلغاء متابعة مستخدم
export const unfollowUser = async (followerId: number, followId: number): Promise<any> => {
  try {
    console.log('📤 Unfollowing user:', { followerId, followId });
    const response = await api.delete('/api/follows', {
      data: {
        follower: followerId,
        follow: followId,
      },
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ User unfollowed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error unfollowing user:', error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل إلغاء متابعة المستخدم');
  }
};

// التحقق من حالة المتابعة
export const getFollowStatus = async (followerId: number, followId: number): Promise<boolean> => {
  try {
    console.log('📤 Checking follow status:', { followerId, followId });
    const response = await api.get(`/api/follows/status?followerId=${followerId}&followId=${followId}`, {
      headers: {
        'accept': '*/*',
      },
    });
    console.log('✅ Follow status:', response.data);
    // قد يكون response.data boolean أو object يحتوي على isFollowing
    if (typeof response.data === 'boolean') {
      return response.data;
    }
    return response.data?.isFollowing || false;
  } catch (error: any) {
    console.error('❌ Error checking follow status:', error);
    return false;
  }
};

