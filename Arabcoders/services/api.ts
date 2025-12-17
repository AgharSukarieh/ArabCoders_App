import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://arabcodetest.runasp.net';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

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

// Interceptor لمعالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      await AsyncStorage.multiRemove(['token', 'auth-user', 'auth-session']);
    }
    return Promise.reject(error);
  }
);

export default api;

