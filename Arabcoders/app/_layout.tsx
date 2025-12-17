import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import FlashMessage from 'react-native-flash-message';
import { View, ActivityIndicator, Image } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStoredToken } from '@/services/storage';
import { refreshToken } from '@/services/authService';
import { saveToken, saveUser, saveSession } from '@/services/storage';
import { decodeJwt } from '@/utils/authUtils';

export const unstable_settings = {
  initialRouteName: 'splash',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    checkAuthAndNavigate();
  }, []);

  useEffect(() => {
    // بعد التحقق من المصادقة، التوجيه إلى الصفحة المناسبة
    if (!isCheckingAuth && isAuthenticated !== null && !hasNavigated.current) {
      // استخدام setTimeout للتأكد من أن الـ Stack جاهز
      const timer = setTimeout(() => {
        try {
          // فقط التوجيه إذا كان المستخدم مسجل دخول
          // إذا لم يكن مسجل دخول، الصفحة الافتراضية هي index بالفعل
          if (isAuthenticated) {
            console.log('✅ User authenticated, redirecting to home');
            hasNavigated.current = true;
            router.replace('/home' as any);
          }
          // إذا لم يكن مسجل دخول، لا نحتاج للتوجيه لأن الصفحة الافتراضية هي index
        } catch (error) {
          console.error('Navigation error:', error);
          // في حالة الخطأ، إعادة تعيين hasNavigated للسماح بالمحاولة مرة أخرى
          hasNavigated.current = false;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  const checkAuthAndNavigate = async () => {
    try {
      setIsCheckingAuth(true);
      
      // جلب الـ token من التخزين
      const token = await getStoredToken();
      
      if (!token) {
        // لا يوجد token
        console.log('🔐 No token found');
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      // التحقق من صحة الـ token (فحص انتهاء الصلاحية)
      const tokenPayload = decodeJwt(token);
      if (!tokenPayload) {
        console.log('🔐 Invalid token format');
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      // التحقق من انتهاء صلاحية الـ token
      const currentTime = Date.now() / 1000; // تحويل إلى ثواني
      const tokenExp = tokenPayload.exp || tokenPayload.expires || 0;
      
      if (tokenExp && tokenExp > currentTime) {
        // الـ token صالح
        console.log('✅ Token is valid');
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      // الـ token منتهي الصلاحية، محاولة تحديثه
      console.log('🔄 Token expired, attempting to refresh...');
      try {
        const refreshResult = await refreshToken();
        
        if (refreshResult?.token) {
          // حفظ الـ token الجديد
          const tokenExpiration = Date.now() + 1000 * 60 * 60; // 1 hour
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
          
          console.log('✅ Token refreshed successfully');
          setIsAuthenticated(true);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError);
        // فشل تحديث الـ token
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#085173' }}>
        <Image
          source={require('@/assets/images/logo_app.png')}
          style={{ width: 200, height: 80, marginBottom: 30 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <StatusBar style="light" backgroundColor="#085173" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
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
    </ThemeProvider>
  );
}
