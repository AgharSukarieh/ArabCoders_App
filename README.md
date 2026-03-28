<div align="center">

# ArabCoders — تطبيق المبرمجين العرب

**منصة مجتمعية وتعليمية للمبرمجين الناطقين بالعربية**

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[الوصف بالعربية](#-نبذة) · [English](#-overview) · [التشغيل السريع](#-التشغيل-السريع) · [Quick start](#-quick-start)

</div>

---

## 🇸🇦 نبذة

**ArabCoders** تطبيق جوال (Android / iOS) مبني بـ **Expo** و**React Native**، يربط المستخدمين بخلفية API ويدعم تجربة عربية كاملة: المنشورات، التعليقات، الإعجابات، المسابقات، الترتيب، الفعاليات، الإشعارات الفورية، والملف الشخصي.

### المميزات

| المجال                   | التفاصيل                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| **المحتوى الاجتماعي**    | منشورات، وسوم، بحث، تفاصيل المنشور، تعليقات وإعجابات                |
| **المسابقات والفعاليات** | شاشات مخصصة للمسابقات والأحداث وتفاصيلها                            |
| **الحساب والأمان**       | تسجيل دخول، JWT، تجديد التوكن تلقائياً، تخزين آمن محلياً            |
| **الوقت الفعلي**         | SignalR للتفاعل الحي مع الخادم                                      |
| **تجربة المستخدم**       | وضع فاتح/داكن، رسوم متحركة (Reanimated / Lottie)، هيكل عظمي للتحميل |
| **وسائط**                | صور وفيديو، اختيار من المعرض أو الكاميرا                            |

---

## 🇬🇧 Overview

**ArabCoders** is a cross-platform mobile app for the Arabic-speaking developer community. It connects to a backend API and offers feeds, contests, events, rankings, profiles, and real-time updates via SignalR.

---

## 🛠 التقنيات | Tech stack

- **Framework:** [Expo](https://expo.dev/) ~54, [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **UI:** React Native 0.81, React 19, TypeScript
- **Networking:** Axios، اعتراضات للتوكن وتجديد الجلسة
- **Realtime:** [@microsoft/signalr](https://www.npmjs.com/package/@microsoft/signalr)
- **Other:** AsyncStorage، expo-image / expo-video، react-native-reanimated، Skia (حسب الشاشات)

---

## المتطلبات | Prerequisites

- [Node.js](https://nodejs.org/) (LTS موصى به)
- [npm](https://www.npmjs.com/) أو yarn
- لتشغيل على جهاز حقيقي: [Expo Go](https://expo.dev/go) أو **Development Build**
- لبناء Android محلياً: Android Studio + JDK (بعد `npx expo prebuild` إن لزم)

---

## ⚡ التشغيل السريع

من مجلد المشروع `Arabcoders`:

```bash
npm install
npm start
```

ثم اختر من الطرفية: مسح QR في **Expo Go**، أو محاكي Android/iOS، أو الويب (`w`).

أوامر إضافية من `package.json`:

| الأمر             | الوظيفة                                          |
| ----------------- | ------------------------------------------------ |
| `npm run android` | تشغيل على Android (يتطلب بيئة أصلية أو prebuild) |
| `npm run ios`     | تشغيل على iOS (macOS)                            |
| `npm run web`     | تشغيل واجهة الويب                                |
| `npm run lint`    | فحص ESLint                                       |

---

## ⚡ Quick start

```bash
cd Arabcoders
npm install
npm start
```

Use Expo Go, an emulator, or press `w` for web.

---

## 🔧 إعداد الخادم | API configuration

عنوان الـ API الافتراضي مُعرَّف في الكود. لبيئة التطوير أو الإنتاج، عدّل قاعدة العنوان في:

`services/api.ts` → `API_BASE_URL`

تأكد من أن الخادم يدعم **HTTPS** في الإنتاج، وأن سياسات CORS / الشهادات مناسبة لتطبيق الجوال.

---

## 📁 هيكل المشروع (مختصر)

```
Arabcoders/
├── app/                 # شاشات Expo Router (تسجيل، رئيسية، مسابقة، إلخ)
├── components/          # مكوّنات واجهة مشتركة
├── services/            # API، المصادقة، المنشورات، المسابقات، الرفع، التخزين
├── contexts/            # سياقات (مثل الثيم)
├── constants/           # ألوان وثوابت
├── assets/              # صور وأيقونات
└── app.json             إعدادات Expo (الاسم، الحزم، الأذونات)
```

---

## 📱 بناء إصدار Android

إن وُجد مجلد `android/` مولَّدًا (`expo prebuild`):

```bash
npm run build:android:apk    # APK
npm run build:android:bundle # AAB (متجر Google Play)
```

للتفاصيل الإضافية راجع ملفات البناء في المستودع إن وُجدت (مثل `BUILD_RELEASE_APK.md`).

---

## 📄 الترخيص والمساهمة

المشروع **خاص** (`private: true` في `package.json`). للمساهمات أو الاستخدام، تواصل مع مالك المستودع.

---

<div align="center">

**صُنع لمجتمع المبرمجين العرب — ArabCoders**

</div>
