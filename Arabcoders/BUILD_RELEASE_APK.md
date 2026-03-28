# دليل بناء APK Release للتطبيق

## ⚠️ خطوات مهمة قبل البناء

### 1. تحديث رقم الإصدار

افتح `app.json` وزد `versionCode`:
```json
"android": {
  "versionCode": 2  // زد الرقم من 1 إلى 2 أو أكثر
}
```

### 2. التأكد من إعدادات التوقيع

الملف `android/app/build.gradle` يجب أن يحتوي على إعدادات release signing.

---

## 🚀 الطريقة 1: بناء APK باستخدام Expo (موصى بها)

### الخطوات:

```bash
# 1. الانتقال لمجلد المشروع
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders

# 2. تنظيف المشروع
cd android
./gradlew clean
cd ..

# 3. بناء APK Release
npx expo run:android --variant release
```

**موقع APK بعد البناء:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🛠️ الطريقة 2: بناء APK باستخدام Gradle مباشرة

### الخطوات:

```bash
# 1. الانتقال لمجلد Android
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android

# 2. تنظيف المشروع
./gradlew clean

# 3. بناء APK Release
./gradlew assembleRelease
```

**موقع APK بعد البناء:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 بناء APK Bundle (AAB) للتوزيع على Google Play

```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android
./gradlew clean
./gradlew bundleRelease
```

**موقع AAB:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## ✅ التحقق من نجاح البناء

```bash
# التحقق من وجود APK
ls -lh android/app/build/outputs/apk/release/app-release.apk

# التحقق من حجم APK
du -h android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 حل المشاكل الشائعة

### 1. خطأ في الذاكرة (Out of Memory)
```bash
# زيادة ذاكرة Gradle في gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### 2. خطأ في التوقيع
- تأكد من وجود keystore في `android/app/`
- تحقق من إعدادات signingConfigs في `build.gradle`

### 3. خطأ في التبعيات
```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
cd android
./gradlew assembleRelease
```

### 4. خطأ في Metro Bundler
```bash
# إيقاف Metro وإعادة تشغيله
npx expo start --clear
```

---

## 📋 أوامر سريعة (نسخ ولصق)

### بناء Release APK كامل:
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders && \
cd android && \
./gradlew clean && \
./gradlew assembleRelease && \
echo "✅ APK جاهز في: android/app/build/outputs/apk/release/app-release.apk"
```

### بناء باستخدام Expo:
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders && \
npx expo run:android --variant release
```

---

## 📝 ملاحظات مهمة

1. **تحديث versionCode**: يجب زيادته في كل بناء جديد
2. **التوقيع**: تأكد من إعدادات التوقيع في build.gradle
3. **الذاكرة**: تأكد من وجود ذاكرة كافية (4GB+)
4. **الإنترنت**: قد يحتاج Gradle لتحميل dependencies
5. **الوقت**: البناء قد يستغرق 5-15 دقيقة حسب الجهاز

---

## 🎯 خطوات ما بعد البناء

1. اختبر APK على جهاز Android
2. تحقق من حجم APK (يجب أن يكون أقل من 100MB)
3. اختبر جميع الميزات الأساسية
4. احفظ APK في مكان آمن
5. ارفع AAB إلى Google Play Console (إذا كنت تستخدمه)






