import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  withDelay,
  useDerivedValue,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  const router = useRouter();

  // Animation values
  const starOpacity = useSharedValue(0);
  const orbitOpacity = useSharedValue(0);
  const orbitRotation = useSharedValue(0);
  const arrowTranslateX = useSharedValue(0); // للصورة السوداء (اليسار)
  const arrowTranslateY = useSharedValue(0); // للصورة السوداء (اليسار)
  const checkTranslateX = useSharedValue(0); // للصورة الخضراء (اليمين)
  const checkTranslateY = useSharedValue(0); // للصورة الخضراء (اليمين)
  const arabOpacity = useSharedValue(0); // لصورة arab.png
  const arabTranslateX = useSharedValue(0); // لصورة arab.png
  const codersOpacity = useSharedValue(0); // لصورة coders.png
  const codersTranslateX = useSharedValue(0); // لصورة coders.png

  useEffect(() => {
    // النجمة تظهر بعد 0.8 ثانية
    starOpacity.value = withDelay(
      800,
      withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      })
    );

    // المدار يظهر بعد 1.5 ثانية
    orbitOpacity.value = withDelay(
      1500,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );

    // المدار يدور من 0 درجة إلى 270 درجة بعد 2.3 ثانية
    orbitRotation.value = withDelay(
      2300,
      withTiming(270, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      })
    );

    // بعد انتهاء الدوران مباشرة، الصورة السوداء (اليسار) تتحرك لليسار
    // عند 270 درجة، لليسار في الشاشة = translateY سالب بالنسبة للمدار
    arrowTranslateX.value = withDelay(
      4300, // 2300 + 2000 (بعد انتهاء الدوران مباشرة)
      withTiming(30, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    arrowTranslateY.value = withDelay(
      4300, // 2300 + 2000 (بعد انتهاء الدوران مباشرة)
      withTiming(-50, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );

    // صورة arab.png تظهر بعد تحرك الصورة السوداء لليسار
    arabOpacity.value = withDelay(
      4900, // 4300 + 600 (بعد تحرك الصورة السوداء)
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    arabTranslateX.value = withDelay(
      4900, // 4300 + 600 (بعد تحرك الصورة السوداء)
      withTiming(-50, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );

    // صورة coders.png تظهر بعد تحرك الصورة الخضراء
    codersOpacity.value = withDelay(
      4900, // 4300 + 600 (بعد تحرك الصورة الخضراء)
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );
    codersTranslateX.value = withDelay(
      4900, // 4300 + 600 (بعد تحرك الصورة الخضراء)
      withTiming(-30, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );

    // بعد انتهاء الدوران مباشرة، الصورة الخضراء (اليمين) تطلع للأعلى
    // عند 270 درجة، للأعلى في الشاشة = translateX سالب بالنسبة للمدار
    checkTranslateX.value = withDelay(
      4300, // 2300 + 2000 (بعد انتهاء الدوران مباشرة)
      withTiming(-30, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    checkTranslateY.value = withDelay(
      4300, // 2300 + 2000 (بعد انتهاء الدوران مباشرة)
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );

    // الانتقال بعد 8 ثواني
    const timer = setTimeout(() => {
      router.replace('/' as any);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // Star animated style
  const starAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: starOpacity.value,
    };
  });

  // Orbit animated style
  const orbitAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: orbitOpacity.value,
      transform: [
        { rotate: `${orbitRotation.value}deg` },
      ],
    };
  });

  // Arrow animated style (الصورة السوداء - logo_partone.png)
  // تأخذ translateY من الصورة الخضراء
  const arrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: arrowTranslateX.value },
        { translateY: checkTranslateY.value },
      ],
    };
  });

  // Check animated style (الصورة الخضراء - logo_parttwo.png)
  // تأخذ translateY من الصورة السوداء
  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: checkTranslateX.value },
        { translateY: arrowTranslateY.value },
      ],
    };
  });

  // Arab animated style (صورة arab.png)
  const arabAnimatedStyle = useAnimatedStyle(() => {
    const rotation = orbitRotation.value;
    const radians = (rotation * Math.PI) / 180;
    // حساب الحركة بناءً على زاوية الدوران - نفس حركة الصورة السوداء
    const translateX = arrowTranslateX.value * Math.cos(radians) - arrowTranslateY.value * Math.sin(radians);
    const translateY = arrowTranslateX.value * Math.sin(radians) + arrowTranslateY.value * Math.cos(radians);
    
    return {
      opacity: arabOpacity.value,
      transform: [
        { translateX },
        { translateY },
        { rotate: '90deg' }, // زاوية 90 درجة لتكون أفقية
      ],
    };
  });

  // Coders animated style (صورة coders.png)
  const codersAnimatedStyle = useAnimatedStyle(() => {
    const rotation = orbitRotation.value;
    const radians = (rotation * Math.PI) / 180;
    // حساب الحركة بناءً على زاوية الدوران - نفس حركة الصورة الخضراء
    const translateX = checkTranslateX.value * Math.cos(radians) - checkTranslateY.value * Math.sin(radians);
    const translateY = checkTranslateX.value * Math.sin(radians) + checkTranslateY.value * Math.cos(radians);
    
    return {
      opacity: codersOpacity.value,
      transform: [
        { translateX },
        { translateY },
        { rotate: '90deg' }, // زاوية 90 درجة لتكون أفقية
      ],
    };
  });


  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#085173" />
      
      <View style={styles.splashContainer}>
        {/* الصورة الثابتة في الوسط */}
        <Animated.View style={[styles.star, starAnimatedStyle]}>
          <Image
            source={require('@/assets/icons/logo_partthree.png')}
            style={styles.starImage}
            contentFit="contain"
          />
        </Animated.View>

        {/* المدار مع الصورتين بشكل أفقي */}
        <Animated.View style={[styles.orbit, orbitAnimatedStyle]}>
          {/* الصورة فوق (السوداء - اليسار بعد الدوران) */}
          <Animated.View style={[styles.arrowContainer, arrowAnimatedStyle]}>
            <Image
              source={require('@/assets/icons/logo_partone.png')}
              style={styles.arrowImage}
              contentFit="contain"
            />
          </Animated.View>
          
          {/* صورة arab.png تحت الصورة السوداء */}
          <Animated.View style={[styles.arabContainer, arabAnimatedStyle]}>
            <Image
              source={require('@/assets/images/arab.png')}
              style={styles.arabImage}
              contentFit="contain"
            />
          </Animated.View>
          
          {/* الصورة تحت (الخضراء - اليمين بعد الدوران) */}
          <Animated.View style={[styles.checkContainer, checkAnimatedStyle]}>
            <Image
              source={require('@/assets/icons/logo_parttwo.png')}
              style={styles.checkImage}
              contentFit="contain"
            />
          </Animated.View>
          
          {/* صورة coders.png تحت الصورة الخضراء */}
          <Animated.View style={[styles.codersContainer, codersAnimatedStyle]}>
            <Image
              source={require('@/assets/images/coders.png')}
              style={styles.codersImage}
              contentFit="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#085173',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starImage: {
    width: 40,
    height: 40,
  },
  orbit: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowImage: {
    width: 25,
    height: 25,
  },
  arabContainer: {
    position: 'absolute',
    top: 55, // نفس ارتفاع الصورة السوداء
    left: 90, // على يمين الصورة السوداء
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabImage: {
    width: 80,
    height: 15,
  },
  checkContainer: {
    position: 'absolute',
    bottom: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkImage: {
    width: 25,
    height: 25,
  },
  codersContainer: {
    position: 'absolute',
    bottom: 10, // تحت الصورة الخضراء
    left: -40, // على يسار الصورة الخضراء
    justifyContent: 'center',
    alignItems: 'center',
  },
  codersImage: {
    width: 80,
    height: 15,
  },
});

