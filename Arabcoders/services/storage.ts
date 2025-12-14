import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TOKEN: 'token',
  TOKEN_EXPIRATION: 'token-expiration',
  USER: 'auth-user',
  SESSION: 'auth-session',
  ID_USER: 'idUser',
  REMEMBER_EMAIL: 'auth-remember',
};

// حفظ Token
export const saveToken = async (token: string, expiration?: number) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (expiration) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRATION, expiration.toString());
    }
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

// جلب Token
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// حفظ بيانات المستخدم
export const saveUser = async (user: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// جلب بيانات المستخدم
export const getStoredUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// حفظ Session
export const saveSession = async (session: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

// حفظ Remember Me
export const saveRememberedEmail = async (email: string, remember: boolean) => {
  try {
    if (remember && email) {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, JSON.stringify({
        email,
        remember: true,
      }));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
    }
  } catch (error) {
    console.error('Error saving remembered email:', error);
  }
};

// جلب Remember Me
export const getRememberedEmail = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting remembered email:', error);
    return null;
  }
};

// مسح جميع بيانات المصادقة
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRATION,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.ID_USER,
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

