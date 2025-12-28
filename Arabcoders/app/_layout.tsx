import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef, useCallback } from 'react';
import 'react-native-reanimated';
import FlashMessage from 'react-native-flash-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStoredToken, clearAuthData } from '@/services/storage';
import { refreshToken } from '@/services/authService';
import { saveToken, saveUser, saveSession } from '@/services/storage';
import { decodeJwt } from '@/utils/authUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/contexts/ThemeContext';

// إزالة unstable_settings - سنستخدم initialRouteName في Stack مباشرة

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // تعطيل Splash Screen مؤقتاً
  const [splashFinished, setSplashFinished] = useState(true); // تم تعطيل Splash Screen مؤقتاً
  const hasNavigated = useRef(false);
  const hasCheckedSplash = useRef(false);
  const authCheckedRef = useRef(false);

  // لا نحتاج للتنقل اليدوي - initialRouteName="splash" في Stack سيتعامل مع هذا
  // تم إزالة محاولة التنقل الفورية لتجنب خطأ "Attempted to navigate before mounting"

  // التحقق من صلاحية التوكن في الخلفية (بعد الدخول)
  const verifyTokenInBackground = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      // التحقق من صحة الـ token (فحص انتهاء الصلاحية)
      const tokenPayload = decodeJwt(token);
      if (!tokenPayload) {
        console.log('🔐 Invalid token format in background');
        await clearAuthData();
        // إعادة توجيه للوجن إذا كان المستخدم في الهوم
        router.replace('/index' as any);
        return;
      }

      // التحقق من انتهاء صلاحية الـ token
      const currentTime = Date.now() / 1000;
      const tokenExp = tokenPayload.exp || tokenPayload.expires || 0;
      
      // إذا كان الـ token صالحاً، لا حاجة لفعل شيء
      if (!tokenExp || tokenExp > currentTime) {
        console.log('✅ Token is valid (background check)');
        return;
      }

      // الـ token منتهي الصلاحية، محاولة تحديثه في الخلفية
      console.log('🔄 Token expired, attempting to refresh in background...');
      try {
        const refreshResult = await refreshToken();
        
        if (refreshResult?.token) {
          // حفظ الـ token الجديد
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
          
          console.log('✅ Token refreshed successfully in background');
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError: any) {
        console.error('❌ Failed to refresh token in background:', refreshError);
        
        // التحقق من نوع الخطأ
        const errorStatus = refreshError?.response?.status;
        const errorMessage = (refreshError?.message || '').toLowerCase();
        const errorDataMessage = (refreshError?.response?.data?.message || '').toLowerCase();
        
        // إذا كان الخطأ 400 أو 401 أو Invalid token، نمسح البيانات ونعيد التوجيه للوجن
        if (errorStatus === 400 || errorStatus === 401 || 
            errorMessage.includes('invalid token') || 
            errorDataMessage.includes('invalid token')) {
          console.log('🔐 Invalid token in background, redirecting to login');
          await clearAuthData();
          router.replace('/index' as any);
        }
        // للأخطاء الأخرى (network errors)، لا نفعل شيء - المستخدم يستمر في استخدام التطبيق
      }
    } catch (error) {
      console.error('❌ Error verifying token in background:', error);
      // لا نفعل شيء - المستخدم يستمر في استخدام التطبيق
    }
  }, [router]);

  // التحقق من المصادقة مباشرة (بدون انتظار splash screen)
  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;
    
    // التحقق من وجود token وصلاحيته فوراً بعد انتهاء splash
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token || token.trim().length === 0) {
          console.log('🔐 No token found, redirecting to login');
          setIsAuthenticated(false);
          return;
        }

        // التحقق من صحة الـ token (فحص انتهاء الصلاحية)
        const tokenPayload = decodeJwt(token);
        if (!tokenPayload) {
          console.log('🔐 Invalid token format, redirecting to login');
          await clearAuthData();
          setIsAuthenticated(false);
          return;
        }

        // التحقق من انتهاء صلاحية الـ token
        const currentTime = Date.now() / 1000;
        const tokenExp = tokenPayload.exp || tokenPayload.expires || 0;
        
        if (tokenExp && tokenExp <= currentTime) {
          // الـ token منتهي الصلاحية، محاولة تحديثه
          console.log('🔄 Token expired, attempting to refresh...');
          try {
            const refreshResult = await refreshToken();
            
            if (refreshResult?.token) {
              // حفظ الـ token الجديد
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
              
              console.log('✅ Token refreshed successfully, user authenticated');
              setIsAuthenticated(true);
            } else {
              throw new Error('No token in refresh response');
            }
          } catch (refreshError: any) {
            console.error('❌ Failed to refresh token:', refreshError);
            
            // التحقق من نوع الخطأ
            const errorStatus = refreshError?.response?.status;
            const errorMessage = (refreshError?.message || '').toLowerCase();
            const errorDataMessage = (refreshError?.response?.data?.message || '').toLowerCase();
            
            // إذا كان الخطأ 400 أو 401 أو Invalid token، نمسح البيانات ونعيد التوجيه للوجن
            if (errorStatus === 400 || errorStatus === 401 || 
                errorMessage.includes('invalid token') || 
                errorDataMessage.includes('invalid token')) {
              console.log('🔐 Invalid token, redirecting to login');
              await clearAuthData();
              setIsAuthenticated(false);
            } else {
              // للأخطاء الأخرى (network errors)، نعتبر المستخدم مسجل دخول
              console.log('⚠️ Network error, assuming user is authenticated');
              setIsAuthenticated(true);
            }
          }
        } else {
          // الـ token صالح
          console.log('✅ Token is valid, user authenticated');
          setIsAuthenticated(true);
          // بدء التحقق من صلاحية التوكن في الخلفية (بعد الدخول)
          verifyTokenInBackground().catch(() => {});
        }
      } catch (error) {
        console.error('❌ Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [verifyTokenInBackground]); // تم إزالة splashFinished - Splash Screen معطل

  // تم تعطيل Splash Screen - لا حاجة للاستماع لانتهاء splash screen
  // useEffect(() => {
  //   // Splash screen disabled temporarily
  // }, []);

  // التوجيه إلى الصفحة المناسبة بعد التحقق من المصادقة (Splash Screen معطل)
  useEffect(() => {
    if (isAuthenticated !== null && !hasNavigated.current) {
      // استخدام setTimeout بسيط (200ms) لضمان أن التوجيه يحدث بعد render
      const timer = setTimeout(() => {
        try {
          if (isAuthenticated) {
            console.log('✅ User authenticated, redirecting to home');
            hasNavigated.current = true;
            router.replace('/home' as any);
          } else {
            console.log('🔐 User not authenticated, staying on login page');
            // لا حاجة لإعادة التوجيه - نحن بالفعل في صفحة index (login)
            hasNavigated.current = true;
          }
        } catch (error) {
          console.error('Navigation error:', error);
          hasNavigated.current = false;
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);



  return (
    <ThemeProvider>
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="index" // تم تعطيل Splash Screen مؤقتاً - تغيير من "splash" إلى "index"
        >
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="terms" options={{ headerShown: false }} />
          <Stack.Screen name="contest/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
        <FlashMessage position="top" />
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}
