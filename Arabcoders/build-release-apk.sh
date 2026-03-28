#!/bin/bash

# سكريبت بناء APK Release
# استخدام: ./build-release-apk.sh

set -e  # إيقاف عند أي خطأ

echo "🚀 بدء بناء APK Release..."

# الانتقال لمجلد المشروع
cd "$(dirname "$0")"

# 1. تحديث versionCode في app.json
echo "📝 تحديث versionCode..."
CURRENT_VERSION=$(grep -o '"versionCode": [0-9]*' app.json | grep -o '[0-9]*')
NEW_VERSION=$((CURRENT_VERSION + 1))
sed -i "s/\"versionCode\": $CURRENT_VERSION/\"versionCode\": $NEW_VERSION/" app.json
echo "✅ تم تحديث versionCode من $CURRENT_VERSION إلى $NEW_VERSION"

# 2. تنظيف المشروع
echo "🧹 تنظيف المشروع..."
cd android
./gradlew clean

# 3. بناء APK Release
echo "🔨 بناء APK Release (قد يستغرق 5-15 دقيقة)..."
./gradlew assembleRelease

# 4. التحقق من نجاح البناء
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ ✅ ✅ تم بناء APK بنجاح! ✅ ✅ ✅"
    echo ""
    echo "📦 موقع APK:"
    echo "   $(pwd)/$APK_PATH"
    echo ""
    echo "📊 حجم APK: $APK_SIZE"
    echo ""
    echo "🎉 يمكنك الآن تثبيت APK على جهاز Android!"
else
    echo "❌ فشل بناء APK. تحقق من الأخطاء أعلاه."
    exit 1
fi






