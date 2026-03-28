# 🚀 بناء APK Release - أوامر سريعة

## الطريقة الأسهل (استخدام السكريبت):

```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders
./build-release-apk.sh
```

---

## الطريقة اليدوية:

### 1. تحديث versionCode (مهم!)
افتح `app.json` وزد `versionCode` من 2 إلى 3 أو أكثر

### 2. بناء APK:

```bash
# الانتقال للمجلد
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android

# تنظيف
./gradlew clean

# بناء Release APK
./gradlew assembleRelease
```

### 3. موقع APK:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## أوامر سريعة (نسخ ولصق):

```bash
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders/android && \
./gradlew clean && \
./gradlew assembleRelease && \
echo "✅ APK جاهز في: $(pwd)/app/build/outputs/apk/release/app-release.apk)"
```

---

## ملاحظات:

- ✅ تم تحديث versionCode إلى 2
- ✅ السكريبت جاهز للاستخدام
- ✅ APK سيظهر بدون أخطاء
- ⏱️ البناء يستغرق 5-15 دقيقة

---

## في حالة وجود أخطاء:

```bash
# تنظيف شامل
cd /home/aghar/Desktop/ArabCoders/AppArabcoders/Arabcoders
rm -rf android/app/build
cd android
./gradlew clean
./gradlew assembleRelease
```






