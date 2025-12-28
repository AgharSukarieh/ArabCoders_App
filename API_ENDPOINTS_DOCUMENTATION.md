# توثيق شامل لجميع مسارات API - مشروع ArabCoders

**Base URL:** `http://arabcodetest.runasp.net`

**Authentication:** معظم الطلبات تتطلب Bearer Token في Header:
```
Authorization: Bearer {token}
```

---

## 📋 جدول المحتويات

1. [Authentication - المصادقة](#1-authentication---المصادقة)
2. [Users - المستخدمين](#2-users---المستخدمين)
3. [Posts - المنشورات](#3-posts---المنشورات)
4. [Comments - التعليقات](#4-comments---التعليقات)
5. [Likes - الإعجابات](#5-likes---الإعجابات)
6. [Follows - المتابعات](#6-follows---المتابعات)
7. [Messages - الرسائل](#7-messages---الرسائل)
8. [Contests - المسابقات](#8-contests---المسابقات)
9. [Events - الفعاليات](#9-events---الفعاليات)
10. [Notifications - الإشعارات](#10-notifications---الإشعارات)
11. [Algorithms - الخوارزميات](#11-algorithms---الخوارزميات)
12. [Ranking - التصنيف](#12-ranking---التصنيف)
13. [Uploads - رفع الملفات](#13-uploads---رفع-الملفات)
14. [Search - البحث](#14-search---البحث)
15. [Bell Activations - تفعيل الجرس](#15-bell-activations---تفعيل-الجرس)
16. [General - عام](#16-general---عام)

---

## 1. Authentication - المصادقة

### 1.1 إرسال OTP للتسجيل
**Endpoint:** `POST /api/auth/otp`

**Query Parameters:**
- `Email` (string, required): البريد الإلكتروني

**Headers:**
```
accept: */*
```

**Request Body:** `null`

**Response:** 
```
"The Otp Has Sent"
```

**Usage:** إرسال رمز تحقق OTP إلى البريد الإلكتروني للتسجيل

---

### 1.2 إنشاء حساب جديد (Register)
**Endpoint:** `POST /api/auth/register`

**Query Parameters:**
- `Email` (string, required): البريد الإلكتروني
- `Password` (string, required): كلمة المرور
- `UserName` (string, required): اسم المستخدم
- `CountryId` (number, required): معرف الدولة
- `otp` (string, required): رمز التحقق OTP

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `Image` (file, optional): صورة المستخدم

**Response:**
```json
{
  "isAuthenticated": true,
  "token": "string",
  "email": "string",
  "username": "string",
  "role": "string",
  "responseUserDTO": {
    "id": number,
    "fullName": "string",
    "userName": "string",
    "email": "string",
    "role": "string",
    "imageURL": "string"
  }
}
```

**Usage:** إنشاء حساب مستخدم جديد

---

### 1.3 تسجيل الدخول (Login)
**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "string",
  "Password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "email": "string",
  "username": "string",
  "role": "string",
  "responseUserDTO": {
    "id": number,
    "fullName": "string",
    "userName": "string",
    "email": "string",
    "role": "string",
    "imageURL": "string"
  }
}
```

**Usage:** تسجيل دخول المستخدم والحصول على Token

---

### 1.4 إرسال OTP لاستعادة كلمة المرور
**Endpoint:** `POST /api/auth/password/reset`

**Query Parameters:**
- `Email` (string, required): البريد الإلكتروني

**Headers:**
```
accept: */*
```

**Request Body:** `null`

**Response:** 
```
"The Otp Has Sent"
```

**Usage:** إرسال رمز تحقق OTP لاستعادة كلمة المرور

---

### 1.5 تأكيد استعادة كلمة المرور
**Endpoint:** `POST /api/auth/password/reset/confirm`

**Headers:**
```
Content-Type: application/json
accept: */*
```

**Request Body:**
```json
{
  "email": "string",
  "otp": "string",
  "password": "string"
}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** تأكيد استعادة كلمة المرور باستخدام OTP

---

### 1.6 تحديث Token (Refresh Token)
**Endpoint:** `GET /api/auth/refresh-token`

**Headers:**
```
accept: */*
Authorization: Bearer {token} (optional - يمكن إرسال token منتهي الصلاحية)
```

**Response:**
```json
{
  "token": "string",
  "email": "string",
  "username": "string",
  "role": "string",
  "responseUserDTO": {
    "id": number,
    "fullName": "string",
    "userName": "string",
    "email": "string",
    "role": "string",
    "imageURL": "string"
  }
}
```

**Usage:** تحديث Token عند انتهاء صلاحيته

---

### 1.7 إلغاء Token (تسجيل الخروج)
**Endpoint:** `POST /api/auth/revoke-token`

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "token": "string"
}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** إلغاء Token وتسجيل الخروج

---

## 2. Users - المستخدمين

### 2.1 جلب قائمة الدول
**Endpoint:** `GET /api/countries`

**Headers:**
```
accept: */*
```

**Response:**
```json
[
  {
    "id": number,
    "nameCountry": "string",
    "iconUrl": "string"
  }
]
```

**Usage:** جلب قائمة جميع الدول المتاحة

---

### 2.2 جلب قائمة الجامعات
**Endpoint:** `GET /api/universities`

**Headers:**
```
accept: */*
```

**Response:**
```json
[
  {
    "id": number,
    "nameUniversity": "string",
    "imageUrl": "string"
  }
]
```

**Usage:** جلب قائمة جميع الجامعات

---

### 2.3 إرسال OTP لتغيير الإيميل
**Endpoint:** `POST /api/users/email/reset`

**Query Parameters:**
- `Email` (string, required): البريد الإلكتروني الجديد

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Request Body:** `null`

**Response:** 
```
"The Otp Has Sent"
```

**Usage:** إرسال رمز تحقق OTP لتغيير البريد الإلكتروني

---

### 2.4 تحديث بيانات المستخدم
**Endpoint:** `PUT /api/users/{userId}`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
Content-Type: application/json
accept: text/plain
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "id": number,
  "email": "string",
  "userName": "string",
  "imageURL": "string",
  "countryId": number,
  "universityId": number,
  "otp": "string" // مطلوب فقط في حالة تغيير الإيميل
}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** تحديث بيانات المستخدم (الاسم، الإيميل، الصورة، الدولة، الجامعة)

---

### 2.5 جلب معلومات مستخدم معين
**Endpoint:** `GET /api/users/{userId}`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: text/plain
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": number,
  "userName": "string",
  "email": "string",
  "imageURL": "string",
  "countryId": number,
  "universityId": number,
  "registerAt": "string",
  "country": {
    "id": number,
    "nameCountry": "string",
    "iconUrl": "string"
  },
  "university": {
    "id": number,
    "nameUniversity": "string",
    "imageUrl": "string"
  }
}
```

**Usage:** جلب معلومات مستخدم معين

---

### 2.6 جلب أفضل المبرمجين (Top Coders)
**Endpoint:** `GET /api/users/top-coders/filter`

**Query Parameters:**
- `CountryId` (number, optional): فلترة حسب الدولة
- `search` (string, optional): البحث بالاسم

**Headers:**
```
accept: text/plain
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "userId": number,
    "userName": "string",
    "imageURL": "string",
    "totalSolved": number,
    "rank": number,
    "country": {
      "id": number,
      "nameCountry": "string",
      "iconUrl": "string"
    },
    "university": {
      "id": number,
      "nameUniversity": "string",
      "imageUrl": "string"
    }
  }
]
```

**Usage:** جلب قائمة أفضل المبرمجين مع إمكانية الفلترة حسب الدولة أو البحث

---

## 3. Posts - المنشورات

### 3.1 جلب جميع المنشورات
**Endpoint:** `GET /api/posts`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "title": "string",
    "content": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "userId": number,
    "userName": "string",
    "imageURL": "string",
    "numberLike": number,
    "isLikedIt": boolean,
    "mostCommonType": number,
    "secondCommonType": number,
    "thirdCommonType": number,
    "videos": ["string"],
    "images": ["string"],
    "postTags": [
      {
        "id": number,
        "tagName": "string",
        "shortDescription": "string",
        "description": "string",
        "imageURL": "string"
      }
    ],
    "numberComment": number
  }
]
```

**Usage:** جلب جميع المنشورات مع معلومات الإعجابات والتعليقات

---

### 3.2 جلب منشور معين مع التعليقات
**Endpoint:** `GET /api/posts/{postId}`

**Path Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": number,
  "title": "string",
  "content": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "userId": number,
  "userName": "string",
  "imageURL": "string",
  "numberLike": number,
  "isLikedIt": boolean,
  "mostCommonType": number,
  "secondCommonType": number,
  "thirdCommonType": number,
  "videos": ["string"],
  "images": ["string"],
  "postTags": [
    {
      "id": number,
      "tagName": "string",
      "shortDescription": "string",
      "description": "string",
      "imageURL": "string"
    }
  ],
  "numberComment": number,
  "comments": [
    {
      "id": number,
      "text": "string",
      "createdAt": "string",
      "userId": number,
      "userName": "string",
      "imageURL": "string",
      "postId": number,
      "parentCommentId": number,
      "replies": []
    }
  ]
}
```

**Usage:** جلب منشور معين مع جميع التعليقات

---

### 3.3 إنشاء منشور جديد
**Endpoint:** `POST /api/posts`

**Headers:**
```
Content-Type: application/json
Accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "userId": number,
  "videos": [
    {
      "title": "string",
      "description": "string",
      "url": "string",
      "thumbnailUrl": "string"
    }
  ],
  "images": ["string"],
  "tags": [number] // array of tag IDs
}
```

**Response:**
```json
{
  "id": number,
  "title": "string",
  "content": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "userId": number,
  "userName": "string",
  "imageURL": "string",
  "numberLike": number,
  "isLikedIt": boolean,
  "videos": ["string"],
  "images": ["string"],
  "postTags": []
}
```

**Usage:** إنشاء منشور جديد (نص، صور، فيديوهات، تاغات)

---

### 3.4 تحديث منشور
**Endpoint:** `PUT /api/posts/{postId}`

**Path Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
Content-Type: application/json
Accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "id": 0,
  "title": "string",
  "content": "string",
  "userId": number,
  "videos": [
    {
      "title": "string",
      "description": "string",
      "url": "string",
      "thumbnailUrl": "string"
    }
  ],
  "images": ["string"],
  "tags": [number]
}
```

**Response:**
```json
{
  "id": number,
  "title": "string",
  "content": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "userId": number,
  "userName": "string",
  "imageURL": "string",
  "numberLike": number,
  "isLikedIt": boolean,
  "videos": ["string"],
  "images": ["string"],
  "postTags": []
}
```

**Usage:** تحديث منشور موجود

---

### 3.5 حذف منشور
**Endpoint:** `DELETE /api/posts/{postId}`

**Path Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** حذف منشور (يجب أن يكون المستخدم هو صاحب المنشور)

---

### 3.6 البحث عن المنشورات
**Endpoint:** `GET /api/posts/search`

**Query Parameters:**
- `text` (string, required): نص البحث
- `from` (string, optional): تاريخ البداية (ISO format)
- `to` (string, optional): تاريخ النهاية (ISO format)
- `userId` (number, optional): فلترة حسب المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "title": "string",
    "content": "string",
    "createdAt": "string",
    "userId": number,
    "userName": "string",
    "imageURL": "string",
    "numberLike": number,
    "isLikedIt": boolean,
    "videos": ["string"],
    "images": ["string"],
    "postTags": []
  }
]
```

**Usage:** البحث عن المنشورات حسب النص والتواريخ والمستخدم

---

### 3.7 جلب التاغات (Tags)
**Endpoint:** `GET /api/tags`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "tagName": "string",
    "shortDescription": "string",
    "description": "string",
    "imageURL": "string"
  }
]
```

**Usage:** جلب قائمة جميع التاغات المتاحة

---

## 4. Comments - التعليقات

### 4.1 إنشاء تعليق جديد
**Endpoint:** `POST /api/comments`

**Headers:**
```
Content-Type: application/json
Accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "text": "string",
  "postId": number,
  "userId": number,
  "parentCommentId": number | null, // null للتعليق الأساسي، أو id التعليق للرد
  "createdAt": "string" // ISO format
}
```

**Response:**
```json
{
  "id": number,
  "text": "string",
  "createdAt": "string",
  "userId": number,
  "userName": "string",
  "imageURL": "string",
  "postId": number,
  "parentCommentId": number
}
```

**Usage:** إضافة تعليق جديد على منشور أو رد على تعليق موجود

---

### 4.2 جلب ردود تعليق معين
**Endpoint:** `GET /api/comments/{parentId}/replies`

**Path Parameters:**
- `parentId` (number, required): معرف التعليق الأب

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "text": "string",
    "createdAt": "string",
    "userId": number,
    "userName": "string",
    "imageURL": "string",
    "postId": number,
    "parentCommentId": number
  }
]
```

**Usage:** جلب جميع الردود على تعليق معين

---

## 5. Likes - الإعجابات

### 5.1 إضافة إعجاب لمنشور
**Endpoint:** `POST /api/post-likes?postId={postId}`

**Query Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Request Body:** `null`

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** إضافة إعجاب لمنشور

---

### 5.2 إزالة الإعجاب من منشور
**Endpoint:** `DELETE /api/post-likes?postId={postId}`

**Query Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** إزالة الإعجاب من منشور

---

### 5.3 التحقق من حالة الإعجاب
**Endpoint:** `GET /api/post-likes/status?postId={postId}`

**Query Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
true // أو false
```

**Usage:** التحقق من كون المستخدم معجب بالمنشور

---

### 5.4 جلب قائمة المعجبين بمنشور
**Endpoint:** `GET /api/post-likes/posts/{postId}`

**Path Parameters:**
- `postId` (number, required): معرف المنشور

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "userId": number,
    "userName": "string",
    "imageURL": "string"
  }
]
```

**Usage:** جلب قائمة جميع المستخدمين الذين أعجبوا بالمنشور

---

## 6. Follows - المتابعات

### 6.1 متابعة مستخدم
**Endpoint:** `POST /api/follows`

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "follower": number, // معرف المتابع
  "follow": number    // معرف الشخص المتابوع
}
```

**Response:**
```json
{
  "follower": number,
  "follow": number
}
```

**Usage:** متابعة مستخدم معين

---

### 6.2 إلغاء متابعة مستخدم
**Endpoint:** `DELETE /api/follows`

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "follower": number, // معرف المتابع
  "follow": number    // معرف الشخص المتابوع
}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** إلغاء متابعة مستخدم معين

---

### 6.3 التحقق من حالة المتابعة
**Endpoint:** `GET /api/follows/status?followerId={followerId}&followId={followId}`

**Query Parameters:**
- `followerId` (number, required): معرف المتابع
- `followId` (number, required): معرف الشخص المتابوع

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
true // أو false
```

**Usage:** التحقق من كون المستخدم يتابع مستخدم آخر

---

### 6.4 جلب قائمة المتابعين
**Endpoint:** `GET /api/follows/users/{userId}/followers`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "userName": "string",
    "imageURL": "string",
    "email": "string"
  }
]
```

**Usage:** جلب قائمة المستخدمين الذين يتابعون مستخدم معين

---

### 6.5 جلب قائمة المتابعين (Following)
**Endpoint:** `GET /api/follows/users/{userId}/following`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "userName": "string",
    "imageURL": "string",
    "email": "string"
  }
]
```

**Usage:** جلب قائمة المستخدمين الذين يتابعهم مستخدم معين

**ملاحظة:** يمكن أيضاً استخدام:
```
GET /api/follows/users/{userId}/followers?type=following
```

---

## 7. Messages - الرسائل

### 7.1 إرسال رسالة
**Endpoint:** `POST /api/messages`

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "message": "string",
  "senderId": number,
  "receiverId": number,
  "videos": [
    {
      "title": "string",
      "description": "string",
      "url": "string",
      "thumbnailUrl": "string"
    }
  ],
  "images": ["string"]
}
```

**Response:**
```json
{
  "id": number,
  "message": "string",
  "senderId": number,
  "receiverId": number,
  "videos": [],
  "images": [],
  "createdAt": "string",
  "senderName": "string",
  "receiverName": "string",
  "senderImageUrl": "string",
  "receiverImageUrl": "string"
}
```

**Usage:** إرسال رسالة (نص، صور، فيديوهات) إلى مستخدم آخر

---

### 7.2 جلب رسائل مستخدم معين
**Endpoint:** `GET /api/messages/users/{userId}`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم (المستقبل)

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "message": "string",
    "senderId": number,
    "receiverId": number,
    "videos": [],
    "images": [],
    "createdAt": "string",
    "senderName": "string",
    "receiverName": "string",
    "senderImageUrl": "string",
    "receiverImageUrl": "string"
  }
]
```

**Usage:** جلب جميع الرسائل المرسلة إلى مستخدم معين

---

### 7.3 تحديث رسالة
**Endpoint:** `PUT /api/messages/{messageId}`

**Path Parameters:**
- `messageId` (number, required): معرف الرسالة

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "id": number,
  "message": "string",
  "senderId": number,
  "receiverId": number,
  "videos": [],
  "images": []
}
```

**Response:**
```json
{
  "id": number,
  "message": "string",
  "senderId": number,
  "receiverId": number,
  "videos": [],
  "images": [],
  "createdAt": "string"
}
```

**Usage:** تحديث رسالة موجودة

---

### 7.4 حذف رسالة
**Endpoint:** `DELETE /api/messages/{messageId}`

**Path Parameters:**
- `messageId` (number, required): معرف الرسالة

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** حذف رسالة

---

### 7.5 جلب قائمة المستخدمين المرسل إليهم رسائل
**Endpoint:** `GET /api/messages/sent`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "email": "string",
    "userName": "string",
    "imageUrl": "string",
    "registerAt": "string",
    "country": {},
    "hasUnReadMessage": boolean,
    "isOnline": boolean
  }
]
```

**Usage:** جلب قائمة المستخدمين الذين تم إرسال رسائل لهم (للعرض في قائمة المحادثات)

---

## 8. Contests - المسابقات

### 8.1 جلب جميع المسابقات
**Endpoint:** `GET /api/contests`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "name": "string",
    "nameUserCreateContest": "string",
    "startTime": "string",
    "endTime": "string",
    "createdById": number,
    "imageURL": "string",
    "problems": [
      {
        "id": number,
        "title": "string",
        "userName": "string",
        "idUser": number,
        "statueProblem": number,
        "acceptanceRate": number,
        "difficulty": "string",
        "numberOfUsersSolved": number,
        "tags": [],
        "dateTime": "string"
      }
    ],
    "universityId": number,
    "universityName": "string",
    "isPublic": boolean,
    "termsAndConditions": "string",
    "prizes": "string",
    "location": "string",
    "difficultyLevel": number
  }
]
```

**Usage:** جلب قائمة جميع المسابقات المتاحة

---

### 8.2 جلب مسابقة معينة
**Endpoint:** `GET /api/contests/{contestId}`

**Path Parameters:**
- `contestId` (number, required): معرف المسابقة

**Headers:**
```
accept: text/plain
Authorization: Bearer {token}
```

**Response:**
```json
{
  "name": "string",
  "nameUserCreateContest": "string",
  "startTime": "string",
  "endTime": "string",
  "createdById": number,
  "imageURL": "string",
  "problems": [],
  "universityId": number,
  "universityName": "string",
  "isPublic": boolean,
  "termsAndConditions": "string",
  "prizes": "string",
  "location": "string",
  "difficultyLevel": number
}
```

**Usage:** جلب تفاصيل مسابقة معينة

---

### 8.3 جلب مسابقات مستخدم معين
**Endpoint:** `GET /api/contests/by-user/{userId}`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "name": "string",
    "nameUserCreateContest": "string",
    "startTime": "string",
    "endTime": "string",
    "createdById": number,
    "imageURL": "string",
    "problems": [],
    "universityId": number,
    "universityName": "string",
    "isPublic": boolean
  }
]
```

**Usage:** جلب جميع المسابقات التي شارك فيها مستخدم معين

---

### 8.4 التسجيل في مسابقة
**Endpoint:** `POST /api/register?ContestId={contestId}`

**Query Parameters:**
- `ContestId` (number, required): معرف المسابقة

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:** `{}`

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** التسجيل في مسابقة معينة

---

### 8.5 إلغاء التسجيل في مسابقة
**Endpoint:** `DELETE /api/register?ContestId={contestId}`

**Query Parameters:**
- `ContestId` (number, required): معرف المسابقة

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:** 
```
"Success" أو رسالة نجاح
```

**Usage:** إلغاء التسجيل في مسابقة

---

### 8.6 التحقق من حالة التسجيل في مسابقة
**Endpoint:** `GET /api/register?ContestId={contestId}`

**Query Parameters:**
- `ContestId` (number, required): معرف المسابقة

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
true // أو false
```

**Usage:** التحقق من كون المستخدم مسجل في مسابقة معينة

---

## 9. Events - الفعاليات

### 9.1 جلب جميع الفعاليات
**Endpoint:** `GET /api/events`

**Headers:**
```
accept: text/plain
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "title": "string",
    "description": "string",
    "startDate": "string",
    "endDate": "string",
    "location": "string",
    "imageURL": "string",
    "createdAt": "string",
    "createdBy": number,
    "createdByName": "string"
  }
]
```

**Usage:** جلب قائمة جميع الفعاليات

---

### 9.2 جلب فعالية معينة
**Endpoint:** `GET /api/events/{eventId}`

**Path Parameters:**
- `eventId` (number, required): معرف الفعالية

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": number,
  "title": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string",
  "location": "string",
  "imageURL": "string",
  "createdAt": "string",
  "createdBy": number,
  "createdByName": "string"
}
```

**Usage:** جلب تفاصيل فعالية معينة

---

## 10. Notifications - الإشعارات

### 10.1 جلب إشعارات مستخدم معين
**Endpoint:** `GET /api/notifications/users/{userId}`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "title": "string",
    "message": "string",
    "isRead": boolean,
    "createdAt": "string",
    "userId": number,
    "type": "string"
  }
]
```

**Usage:** جلب جميع الإشعارات الخاصة بمستخدم معين

---

### 10.2 جلب عدد الإشعارات غير المقروءة
**Endpoint:** `GET /api/notifications/users/{userId}/unread-count`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "count": number
}
```

**Usage:** جلب عدد الإشعارات غير المقروءة لمستخدم معين

---

## 11. Algorithms - الخوارزميات

### 11.1 جلب جميع الخوارزميات مع التاغات
**Endpoint:** `GET /api/explained-tags/with-tags`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "title": "string",
    "description": "string",
    "imageURL": "string",
    "tags": [
      {
        "id": number,
        "tagName": "string",
        "shortDescription": "string",
        "description": "string",
        "imageURL": "string"
      }
    ]
  }
]
```

**Usage:** جلب قائمة جميع الخوارزميات مع تفاصيل التاغات

---

### 11.2 جلب خوارزمية معينة
**Endpoint:** `GET /api/explained-tags/{algorithmId}`

**Path Parameters:**
- `algorithmId` (number, required): معرف الخوارزمية

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": number,
  "title": "string",
  "description": "string",
  "imageURL": "string",
  "content": "string",
  "tags": [],
  "examples": [],
  "complexity": "string"
}
```

**Usage:** جلب تفاصيل خوارزمية معينة

---

## 12. Ranking - التصنيف

### 12.1 جلب قائمة أفضل المبرمجين (مع فلترة)
**Endpoint:** `GET /api/users/top-coders/filter`

**Query Parameters:**
- `CountryId` (number, optional): فلترة حسب الدولة
- `search` (string, optional): البحث بالاسم

**Headers:**
```
accept: text/plain
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "userId": number,
    "userName": "string",
    "imageURL": "string",
    "totalSolved": number,
    "rank": number,
    "country": {
      "id": number,
      "nameCountry": "string",
      "iconUrl": "string"
    },
    "university": {
      "id": number,
      "nameUniversity": "string",
      "imageUrl": "string"
    }
  }
]
```

**Usage:** جلب قائمة أفضل المبرمجين مع إمكانية الفلترة حسب الدولة أو البحث

---

## 13. Uploads - رفع الملفات

### 13.1 رفع صورة
**Endpoint:** `POST /api/uploads/images`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Request Body (FormData):**
- `file` (file, required): ملف الصورة

**Response:**
```json
{
  "url": "string", // رابط الصورة المرفوعة
  "fileName": "string"
}
```

**Usage:** رفع صورة والحصول على رابطها

---

### 13.2 رفع فيديو
**Endpoint:** `POST /api/uploads/videos`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Request Body (FormData):**
- `file` (file, required): ملف الفيديو

**Response:**
```json
{
  "url": "string", // رابط الفيديو المرفوع
  "thumbnailUrl": "string", // رابط الصورة المصغرة
  "fileName": "string"
}
```

**Usage:** رفع فيديو والحصول على رابط الفيديو والصورة المصغرة

---

## 14. Search - البحث

### 14.1 البحث عن المنشورات والمستخدمين
**Endpoint:** `GET /api/search?query={query}`

**Query Parameters:**
- `query` (string, required): نص البحث

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "posts": [
    {
      "id": number,
      "title": "string",
      "content": "string",
      "userId": number,
      "userName": "string",
      "imageURL": "string"
    }
  ],
  "users": [
    {
      "id": number,
      "userName": "string",
      "imageURL": "string"
    }
  ]
}
```

**Usage:** البحث الشامل عن المنشورات والمستخدمين

---

## 15. Bell Activations - تفعيل الجرس

### 15.1 جلب تفعيلات الجرس لمستخدم معين
**Endpoint:** `GET /api/Users/{userId}/bell-activations`

**Path Parameters:**
- `userId` (number, required): معرف المستخدم

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "userId": number,
    "bellType": "string",
    "isActivated": boolean
  }
]
```

**Usage:** جلب تفعيلات الجرس (الإشعارات) لمستخدم معين

---

### 15.2 جلب جميع تفعيلات الجرس
**Endpoint:** `GET /api/bell-activations`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": number,
    "userId": number,
    "bellType": "string",
    "isActivated": boolean
  }
]
```

**Usage:** جلب جميع تفعيلات الجرس للمستخدم الحالي

---

### 15.3 تحديث تفعيل الجرس
**Endpoint:** `PUT /api/bell-activations`

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "id": number,
  "userId": number,
  "bellType": "string",
  "isActivated": boolean
}
```

**Response:**
```json
{
  "id": number,
  "userId": number,
  "bellType": "string",
  "isActivated": boolean
}
```

**Usage:** تحديث حالة تفعيل الجرس

---

### 15.4 إنشاء تفعيل جرس جديد
**Endpoint:** `POST /api/bell-activations`

**Headers:**
```
Content-Type: application/json
accept: */*
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "userId": number,
  "bellType": "string",
  "isActivated": boolean
}
```

**Response:**
```json
{
  "id": number,
  "userId": number,
  "bellType": "string",
  "isActivated": boolean
}
```

**Usage:** إنشاء تفعيل جرس جديد

---

## 16. General - عام

### 16.1 جلب معلومات المستخدم العام
**Endpoint:** `GET /api/general/User`

**Headers:**
```
accept: */*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": number,
  "userName": "string",
  "email": "string",
  "imageURL": "string",
  "countryId": number,
  "universityId": number,
  "registerAt": "string",
  "country": {},
  "university": {}
}
```

**Usage:** جلب معلومات المستخدم الحالي المسجل دخوله

---

## 📝 ملاحظات مهمة

1. **Authentication Token:**
   - جميع الـ endpoints (ما عدا التسجيل وتسجيل الدخول) تتطلب Bearer Token في Header
   - يتم إضافة Token تلقائياً عبر axios interceptor
   - عند انتهاء صلاحية Token، يتم تحديثه تلقائياً عبر `/api/auth/refresh-token`

2. **Base URL:**
   - جميع الـ endpoints تبدأ بـ `http://arabcodetest.runasp.net`

3. **Error Handling:**
   - عند حدوث خطأ 401 (Unauthorized)، يتم محاولة تحديث Token تلقائياً
   - عند حدوث خطأ 400 (Bad Request)، يتم إرجاع رسالة الخطأ من الـ API
   - عند حدوث خطأ 404 (Not Found)، يتم إرجاع رسالة "غير موجود"
   - عند حدوث خطأ 403 (Forbidden)، يتم إرجاع رسالة "ليس لديك صلاحية"

4. **Content Types:**
   - معظم الـ POST/PUT requests تستخدم `application/json`
   - رفع الملفات يستخدم `multipart/form-data`
   - بعض الـ GET requests قد تستخدم `text/plain` في accept header

5. **Pagination:**
   - حالياً لا يوجد pagination في معظم الـ endpoints
   - جميع النتائج تُرجع مرة واحدة

6. **Date Formats:**
   - جميع التواريخ في ISO 8601 format: `"2024-01-01T00:00:00Z"`

---

## 🔗 ملخص سريع للـ Endpoints

### Authentication
- `POST /api/auth/otp` - إرسال OTP للتسجيل
- `POST /api/auth/register` - إنشاء حساب
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/password/reset` - إرسال OTP لاستعادة كلمة المرور
- `POST /api/auth/password/reset/confirm` - تأكيد استعادة كلمة المرور
- `GET /api/auth/refresh-token` - تحديث Token
- `POST /api/auth/revoke-token` - تسجيل الخروج

### Users
- `GET /api/countries` - قائمة الدول
- `GET /api/universities` - قائمة الجامعات
- `POST /api/users/email/reset` - إرسال OTP لتغيير الإيميل
- `PUT /api/users/{userId}` - تحديث بيانات المستخدم
- `GET /api/users/{userId}` - جلب معلومات مستخدم
- `GET /api/users/top-coders/filter` - أفضل المبرمجين

### Posts
- `GET /api/posts` - جميع المنشورات
- `GET /api/posts/{postId}` - منشور معين
- `POST /api/posts` - إنشاء منشور
- `PUT /api/posts/{postId}` - تحديث منشور
- `DELETE /api/posts/{postId}` - حذف منشور
- `GET /api/posts/search` - البحث عن المنشورات
- `GET /api/tags` - قائمة التاغات

### Comments
- `POST /api/comments` - إنشاء تعليق
- `GET /api/comments/{parentId}/replies` - ردود تعليق

### Likes
- `POST /api/post-likes?postId={postId}` - إضافة إعجاب
- `DELETE /api/post-likes?postId={postId}` - إزالة إعجاب
- `GET /api/post-likes/status?postId={postId}` - حالة الإعجاب
- `GET /api/post-likes/posts/{postId}` - قائمة المعجبين

### Follows
- `POST /api/follows` - متابعة مستخدم
- `DELETE /api/follows` - إلغاء متابعة
- `GET /api/follows/status` - حالة المتابعة
- `GET /api/follows/users/{userId}/followers` - قائمة المتابعين
- `GET /api/follows/users/{userId}/following` - قائمة المتابعين

### Messages
- `POST /api/messages` - إرسال رسالة
- `GET /api/messages/users/{userId}` - رسائل مستخدم
- `PUT /api/messages/{messageId}` - تحديث رسالة
- `DELETE /api/messages/{messageId}` - حذف رسالة
- `GET /api/messages/sent` - قائمة المحادثات

### Contests
- `GET /api/contests` - جميع المسابقات
- `GET /api/contests/{contestId}` - مسابقة معينة
- `GET /api/contests/by-user/{userId}` - مسابقات مستخدم
- `POST /api/register?ContestId={contestId}` - التسجيل في مسابقة
- `DELETE /api/register?ContestId={contestId}` - إلغاء التسجيل
- `GET /api/register?ContestId={contestId}` - حالة التسجيل

### Events
- `GET /api/events` - جميع الفعاليات
- `GET /api/events/{eventId}` - فعالية معينة

### Notifications
- `GET /api/notifications/users/{userId}` - إشعارات مستخدم
- `GET /api/notifications/users/{userId}/unread-count` - عدد غير المقروءة

### Algorithms
- `GET /api/explained-tags/with-tags` - جميع الخوارزميات
- `GET /api/explained-tags/{algorithmId}` - خوارزمية معينة

### Uploads
- `POST /api/uploads/images` - رفع صورة
- `POST /api/uploads/videos` - رفع فيديو

### Search
- `GET /api/search?query={query}` - بحث شامل

### Bell Activations
- `GET /api/Users/{userId}/bell-activations` - تفعيلات مستخدم
- `GET /api/bell-activations` - جميع التفعيلات
- `PUT /api/bell-activations` - تحديث تفعيل
- `POST /api/bell-activations` - إنشاء تفعيل

### General
- `GET /api/general/User` - معلومات المستخدم الحالي

---

**تاريخ الإنشاء:** 2024  
**آخر تحديث:** 2024


