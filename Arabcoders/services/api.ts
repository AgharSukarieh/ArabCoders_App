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
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // Standard Bearer token format
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No token found in AsyncStorage');
    }
  } catch (error) {
    console.error('Error getting token:', error);
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

