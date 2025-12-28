import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshToken } from './authService';
import { saveToken, saveUser, saveSession } from './storage';

const API_BASE_URL = 'http://arabcodetest.runasp.net';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// متغير لمنع تكرار محاولات تجديد التوكن
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor لإضافة Token للطلبات
api.interceptors.request.use(async (config) => {
  try {
    // جلب آخر token محفوظ من AsyncStorage (آخر token تم حفظه بعد تسجيل الدخول)
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // تنظيف الـ token من أي مسافات أو أحرف غير مرئية
      const cleanToken = token.trim();
      
      if (!cleanToken) {
        console.warn('⚠️ Token is empty after trimming');
        return config;
      }
      
      // Standard Bearer token format - استخدام آخر token محفوظ
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('🔑 Latest token added to request:', cleanToken.substring(0, 30) + '...', 'Length:', cleanToken.length);
    } else {
      console.warn('⚠️ No token found in AsyncStorage - user may need to login again');
    }
  } catch (error) {
    console.error('Error getting token from AsyncStorage:', error);
  }
  return config;
});

// Interceptor لمعالجة الأخطاء وتجديد التوكن تلقائياً
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // إذا كان الخطأ 401 ولم نكن قد حاولنا تجديد التوكن من قبل
    // ولا يكون الطلب نفسه هو refresh-token (لتجنب حلقة لا نهائية)
    // ولا يكون الطلب هو refresh-token نفسه (للتحقق من وجود refresh-token في URL)
    const isRefreshTokenRequest = originalRequest.url?.includes('/refresh-token') || originalRequest.url?.includes('refresh-token');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshTokenRequest) {
      if (isRefreshing) {
        // إذا كان هناك محاولة تجديد جارية، ننتظر
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Token expired, attempting to refresh automatically...');
        const refreshResult = await refreshToken();

        if (refreshResult?.token) {
          // حفظ التوكن الجديد - نستخدم نفس صلاحية "تذكرني" إذا كانت موجودة
          const rememberMe = await AsyncStorage.getItem('auth-remember');
          const tokenExpiration = rememberMe 
            ? Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days if remember me
            : Date.now() + 1000 * 60 * 60; // 1 hour if not
          await saveToken(refreshResult.token, tokenExpiration);

          // حفظ بيانات المستخدم إذا كانت موجودة
          if (refreshResult.responseUserDTO) {
            const user = {
              id: refreshResult.responseUserDTO.id,
              name: refreshResult.username || refreshResult.responseUserDTO.fullName || refreshResult.responseUserDTO.userName,
              email: refreshResult.email || refreshResult.responseUserDTO.email,
              role: refreshResult.role || refreshResult.responseUserDTO.role || 'User',
            };
            await saveUser(user);
            await saveSession(refreshResult);
          }

          // تحديث التوكن في الطلب الأصلي
          originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;

          // معالجة الطلبات المعلقة
          processQueue(null, refreshResult.token);

          console.log('✅ Token refreshed successfully, retrying original request');
          isRefreshing = false;

          // إعادة محاولة الطلب الأصلي
          return api(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError: any) {
        console.error('❌ Failed to refresh token:', refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);

        // إذا فشل التجديد بسبب Invalid token أو 400، مسح البيانات
        // لكن إذا كان الخطأ بسبب network أو server error، لا نمسح البيانات
        const errorStatus = refreshError?.response?.status;
        const errorMessage = (refreshError?.message || '').toLowerCase();
        const errorData = refreshError?.response?.data;
        const errorDataMessage = (errorData?.message || '').toLowerCase();
        
        // التحقق من نوع الخطأ
        const isInvalidToken = errorStatus === 400 || 
                               errorStatus === 401 || 
                               errorMessage.includes('invalid token') ||
                               errorDataMessage.includes('invalid token');
        
        const isNetworkError = !refreshError?.response || 
                              errorMessage.includes('network') ||
                              errorMessage.includes('timeout') ||
                              errorMessage.includes('econnrefused') ||
                              errorMessage.includes('failed to fetch');
        
        if (isInvalidToken && !isNetworkError) {
          console.log('🔐 Invalid token, clearing auth data');
          await AsyncStorage.multiRemove(['token', 'auth-user', 'auth-session', 'token-expiration']);
        } else {
          console.log('⚠️ Refresh failed but keeping token (network/server error or temporary issue)');
          // لا نمسح البيانات في حالة network error - قد يكون مؤقتاً
        }
        
        return Promise.reject(refreshError);
      }
    }

    // للأخطاء الأخرى، إرجاع الخطأ كما هو
    return Promise.reject(error);
  }
);

export default api;

