# أوامر بناء APK للتطبيق

## الطريقة 1: بناء APK باستخدام Expo (موصى بها)

### الخطوات:

1. **التأكد من أنك في مجلد المشروع:**
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders
```

2. **تثبيت/تحديث الحزم:**
```bash
npm install
```

3. **بناء APK للاختبار (Debug APK):**
```bash
npx expo run:android --variant debug
```

4. **بناء APK للإنتاج (Release APK):**
```bash
npx expo run:android --variant release
```

---

## الطريقة 2: بناء APK باستخدام Gradle مباشرة

### الخطوات:

1. **الانتقال لمجلد Android:**
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android
```

2. **تنظيف المشروع:**
```bash
./gradlew clean
```

3. **بناء APK للاختبار:**
```bash
./gradlew assembleDebug
```

4. **بناء APK للإنتاج (مُوقّع):**
```bash
./gradlew assembleRelease
```

### موقع ملفات APK بعد البناء:

- **Debug APK:**
  ```
  android/app/build/outputs/apk/debug/app-debug.apk
  ```

- **Release APK:**
  ```
  android/app/build/outputs/apk/release/app-release.apk
  ```

---

## الطريقة 3: بناء APK Bundle (AAB) للتوزيع على Google Play

```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android
./gradlew bundleRelease
```

**موقع ملف AAB:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## ملاحظات مهمة:

1. **تأكد من تحديث versionCode في app.json قبل كل بناء جديد:**
   - افتح `app.json`
   - زد قيمة `android.versionCode` (مثلاً: من 1 إلى 2)

2. **للبناء Release APK، يجب أن يكون لديك keystore:**
   - الملف موجود في: `android/app/arabcoders-release-key.keystore`
   - تأكد من وجود ملف `android/app/build.gradle` مع إعدادات التوقيع

3. **للتحقق من حجم APK:**
```bash
ls -lh android/app/build/outputs/apk/*/app-*.apk
```

4. **لحذف ملفات البناء القديمة:**
```bash
cd android
./gradlew clean
```

---

## أوامر سريعة (نسخ ولصق):

### بناء Debug APK:
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders && npx expo run:android --variant debug
```

### بناء Release APK:
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders && npx expo run:android --variant release
```

### بناء باستخدام Gradle (Release):
```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android && ./gradlew clean && ./gradlew assembleRelease
```

