 فيه  # وثائق API للمسابقات (Competitions API)

## Base URL
```
http://arabcodetest.runasp.net
```

## Authentication
جميع الطلبات تحتاج إلى Bearer Token في الـ Header:
```
Authorization: Bearer {token}
```

---

## 1. جلب جميع المسابقات (Get All Contests)

### Endpoint
```
GET /api/contests
```

### الوصف
جلب قائمة بجميع المسابقات المتاحة

### Headers
```
accept: */*
Authorization: Bearer {token}
```

### Response
```json
[
  {
    "id": 1,
    "name": "اسم المسابقة",
    "startTime": "2024-01-01T10:00:00",
    "endTime": "2024-01-01T14:00:00",
    "imageURL": "https://example.com/image.jpg",
    "createdByUserName": "اسم المنشئ",
    "createdById": 123,
    "universityId": 1,
    "universityName": "اسم الجامعة",
    "isPublic": true,
    "difficultyLevel": 2
  }
]
```

### مثال الاستخدام في الكود
```typescript
import api from '@/services/api';

const loadContests = async () => {
  try {
    const response = await api.get('/api/contests');
    const contests = Array.isArray(response.data) ? response.data : [];
    console.log('Contests:', contests);
  } catch (error) {
    console.error('Error loading contests:', error);
  }
};
```

---

## 2. جلب مسابقة محددة (Get Contest By ID)

### Endpoint
```
GET /api/contests/{contestId}
```

### الوصف
جلب تفاصيل مسابقة محددة بناءً على معرف المسابقة

### Parameters
- `contestId` (number): معرف المسابقة

### Headers
```
accept: text/plain
Authorization: Bearer {token}
```

### Response
```json
{
  "name": "اسم المسابقة",
  "nameUserCreateContest": "اسم المنشئ",
  "startTime": "2024-01-01T10:00:00",
  "endTime": "2024-01-01T14:00:00",
  "createdById": 123,
  "imageURL": "https://example.com/image.jpg",
  "problems": [
    {
      "id": 1,
      "title": "عنوان المشكلة",
      "userName": "اسم المستخدم",
      "idUser": 123,
      "statueProblem": 1,
      "acceptanceRate": 75.5,
      "difficulty": "Medium",
      "numberOfUsersSolved": 50,
      "tags": [
        {
          "id": 1,
          "tagName": "Array",
          "shortDescription": "وصف قصير",
          "description": "وصف كامل",
          "imageURL": "https://example.com/tag.jpg"
        }
      ],
      "dateTime": "2024-01-01T10:00:00"
    }
  ],
  "universityId": 1,
  "universityName": "اسم الجامعة",
  "isPublic": true,
  "termsAndConditions": "الشروط والأحكام",
  "prizes": "الجوائز",
  "location": "الموقع",
  "difficultyLevel": 2
}
```

### مثال الاستخدام في الكود
```typescript
import { getContestById } from '@/services/contestService';

const fetchContest = async (contestId: number) => {
  try {
    const contest = await getContestById(contestId);
    console.log('Contest details:', contest);
  } catch (error) {
    console.error('Error fetching contest:', error);
  }
};
```

---

## 3. جلب مسابقات مستخدم محدد (Get Contests By User ID)

### Endpoint
```
GET /api/contests/by-user/{userId}
```

### الوصف
جلب جميع المسابقات التي أنشأها مستخدم محدد

### Parameters
- `userId` (number): معرف المستخدم

### Headers
```
accept: */*
Authorization: Bearer {token}
```

### Response
```json
[
  {
    "id": 1,
    "name": "اسم المسابقة",
    "startTime": "2024-01-01T10:00:00",
    "endTime": "2024-01-01T14:00:00",
    "imageURL": "https://example.com/image.jpg",
    "createdByUserName": "اسم المنشئ",
    "createdById": 123,
    "universityId": 1,
    "universityName": "اسم الجامعة",
    "isPublic": true,
    "difficultyLevel": 2
  }
]
```

### مثال الاستخدام في الكود
```typescript
import api from '@/services/api';
import { getStoredUser } from '@/services/storage';

const loadMyContests = async () => {
  try {
    const user = await getStoredUser();
    const userId = user?.id || user?.userId || user?.Id || user?.uid;
    
    if (userId) {
      const numericUserId = parseInt(String(userId), 10);
      if (!isNaN(numericUserId) && numericUserId > 0) {
        const response = await api.get(`/api/contests/by-user/${numericUserId}`);
        const myContests = Array.isArray(response.data) ? response.data : [];
        console.log('My contests:', myContests);
      }
    }
  } catch (error) {
    console.error('Error loading my contests:', error);
  }
};
```

---

## 4. التحقق من حالة التسجيل في مسابقة (Check Registration Status)

### Endpoint
```
GET /api/register?ContestId={contestId}
```

### الوصف
التحقق من whether المستخدم مسجل في مسابقة معينة أم لا

### Query Parameters
- `ContestId` (number): معرف المسابقة

### Headers
```
accept: */*
Authorization: Bearer {token}
```

### Response
```json
true
```
أو
```json
false
```

### مثال الاستخدام في الكود
```typescript
import api from '@/services/api';

const checkRegistrationStatus = async (contestId: number) => {
  try {
    const response = await api.get(`/api/register?ContestId=${contestId}`);
    const isRegistered = response.data === true || response.data === 'true';
    console.log('Is registered:', isRegistered);
    return isRegistered;
  } catch (error) {
    console.error('Error checking registration:', error);
    return false;
  }
};
```

---

## 5. التسجيل في مسابقة (Register for Contest)

### Endpoint
```
POST /api/register
```

### الوصف
تسجيل المستخدم في مسابقة معينة

### Headers
```
accept: */*
Content-Type: application/json
Authorization: Bearer {token}
```

### Request Body
```json
{
  "contestId": 1
}
```

### Response
```json
{
  "success": true,
  "message": "تم التسجيل بنجاح"
}
```

### مثال الاستخدام في الكود
```typescript
import api from '@/services/api';

const registerForContest = async (contestId: number) => {
  try {
    const response = await api.post('/api/register', {
      contestId: contestId
    });
    console.log('Registration successful:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error registering:', error);
    throw new Error(error?.response?.data?.message || 'فشل التسجيل');
  }
};
```

---

## 6. إلغاء التسجيل من مسابقة (Unregister from Contest)

### Endpoint
```
DELETE /api/register?ContestId={contestId}
```

### الوصف
إلغاء تسجيل المستخدم من مسابقة معينة

### Query Parameters
- `ContestId` (number): معرف المسابقة

### Headers
```
accept: */*
Authorization: Bearer {token}
```

### Response
```json
{
  "success": true,
  "message": "تم إلغاء التسجيل بنجاح"
}
```

### مثال الاستخدام في الكود
```typescript
import api from '@/services/api';

const unregisterFromContest = async (contestId: number) => {
  try {
    const response = await api.delete(`/api/register?ContestId=${contestId}`);
    console.log('Unregistration successful:', response.data);
    return true;
  } catch (error: any) {
    console.error('Error unregistering:', error);
    throw new Error(error?.response?.data?.message || 'فشل إلغاء التسجيل');
  }
};
```

---

## أنواع البيانات (TypeScript Interfaces)

### Contest Interface
```typescript
export interface Contest {
  name: string;
  nameUserCreateContest: string;
  startTime: string;
  endTime: string;
  createdById: number;
  imageURL: string;
  problems: ContestProblem[];
  universityId: number;
  universityName: string;
  isPublic: boolean;
  termsAndConditions?: string;
  prizes?: string;
  location?: string;
  difficultyLevel?: number; // 0 - 3
}
```

### ContestProblem Interface
```typescript
export interface ContestProblem {
  id: number;
  title: string;
  userName: string;
  idUser: number;
  statueProblem: number;
  acceptanceRate: number;
  difficulty: string;
  numberOfUsersSolved: number;
  tags: ContestTag[];
  dateTime: string;
}
```

### ContestTag Interface
```typescript
export interface ContestTag {
  id: number;
  tagName: string;
  shortDescription: string | null;
  description: string | null;
  imageURL: string | null;
}
```

---

## ملاحظات مهمة

1. **Authentication**: جميع الطلبات تحتاج إلى Bearer Token في الـ Header
2. **Error Handling**: يجب معالجة الأخطاء بشكل صحيح:
   - `404`: المسابقة غير موجودة
   - `401`: غير مصرح - قد تحتاج إلى تسجيل الدخول مرة أخرى
   - `400`: بيانات غير صحيحة
3. **Base URL**: `http://arabcodetest.runasp.net`
4. **Timeout**: الـ timeout الافتراضي هو 30 ثانية

---

## أمثلة كاملة للاستخدام

### مثال: جلب جميع المسابقات وعرضها
```typescript
import React, { useEffect, useState } from 'react';
import api from '@/services/api';

export function CompetitionsScreen() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/contests');
      setContests(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error loading contests:', error);
      Alert.alert('خطأ', error?.response?.data?.message || 'حدث خطأ في جلب المسابقات');
    } finally {
      setLoading(false);
    }
  };

  return (
    // عرض المسابقات
  );
}
```

### مثال: جلب تفاصيل مسابقة والتسجيل فيها
```typescript
import { getContestById } from '@/services/contestService';
import api from '@/services/api';

const handleContestPress = async (contestId: number) => {
  try {
    // جلب تفاصيل المسابقة
    const contest = await getContestById(contestId);
    console.log('Contest:', contest);

    // التحقق من حالة التسجيل
    const registrationResponse = await api.get(`/api/register?ContestId=${contestId}`);
    const isRegistered = registrationResponse.data === true;

    if (!isRegistered) {
      // التسجيل في المسابقة
      await api.post('/api/register', { contestId });
      console.log('Registered successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

