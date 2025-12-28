# 📚 توثيق API الخوارزميات (Algorithms API Documentation)

## 🔗 Base URL
```
http://arabcodetest.runasp.net
```

---

## 1️⃣ جلب قائمة الخوارزميات مع الفئات (Get Algorithms with Tags)

### **Endpoint:**
```
GET /api/explained-tags/with-tags
```

### **المنطق والخطوات (Logic & Flow):**
1. يتم إرسال طلب GET إلى `/api/explained-tags/with-tags`
2. **لا يحتاج** أي parameters في الـ URL
3. يتم إضافة Token تلقائياً في Header عبر interceptor
4. الـ API يرجع قائمة بالفئات (Tags) وكل فئة تحتوي على الخوارزميات الخاصة بها

### **Request Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}
```

### **Request Parameters:**
لا يوجد parameters - فقط GET request عادي

### **Response Structure:**
```typescript
interface AlgorithmTag {
  id: number;                    // رقم الفئة
  tagName: string;               // اسم الفئة (مثل: "Array", "Sorting", إلخ)
  shortDescription: string;      // وصف مختصر للفئة
  description: string;           // وصف كامل للفئة
  imageURL: string;              // رابط صورة الفئة
  explaineTags: Algorithm[];     // قائمة الخوارزميات داخل هذه الفئة
}

interface Algorithm {
  id: number;                    // رقم الخوارزمية
  title: string;                 // عنوان الخوارزمية
  tagId: number;                 // رقم الفئة التي تنتمي إليها
  shortDescription?: string;     // وصف مختصر (اختياري)
  description?: string;          // وصف كامل (اختياري)
  code?: string;                 // كود مثال (اختياري)
  explanation?: string;          // شرح (اختياري)
  complexity?: string;           // التعقيد الزمني (اختياري)
  examples?: string;             // أمثلة (اختياري)
  imageURL?: string;             // رابط صورة الخوارزمية (اختياري)
}
```

### **Response Example:**
```json
[
  {
    "id": 1,
    "tagName": "Array",
    "shortDescription": "خوارزميات المصفوفات",
    "description": "مجموعة من الخوارزميات المتعلقة بالتعامل مع المصفوفات",
    "imageURL": "https://example.com/array-icon.png",
    "explaineTags": [
      {
        "id": 1,
        "title": "Binary Search",
        "tagId": 1,
        "shortDescription": "البحث الثنائي في مصفوفة مرتبة",
        "description": "خوارزمية بحث فعالة في مصفوفة مرتبة",
        "complexity": "O(log n)",
        "imageURL": "https://example.com/binary-search.png"
      },
      {
        "id": 2,
        "title": "Two Pointers",
        "tagId": 1,
        "shortDescription": "تقنية المؤشرين",
        "complexity": "O(n)"
      }
    ]
  },
  {
    "id": 2,
    "tagName": "Sorting",
    "shortDescription": "خوارزميات الترتيب",
    "explaineTags": [
      {
        "id": 3,
        "title": "Quick Sort",
        "tagId": 2,
        "complexity": "O(n log n)"
      }
    ]
  }
]
```

### **كود التطبيق المستخدم:**
```typescript
// في AlgorithmsScreen.tsx
const loadTags = async () => {
  try {
    setLoading(true);
    const response = await api.get('/api/explained-tags/with-tags');
    const tagsData = Array.isArray(response.data) ? response.data : [];
    
    // التأكد من أن explaineTags موجودة لكل tag
    const tagsWithAlgorithms = tagsData.map((tag: any) => ({
      ...tag,
      explaineTags: Array.isArray(tag.explaineTags) ? tag.explaineTags : [],
    }));
    
    setTags(tagsWithAlgorithms);
  } catch (error: any) {
    console.error('Error loading tags:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 2️⃣ جلب تفاصيل خوارزمية محددة (Get Algorithm Details)

### **Endpoint:**
```
GET /api/explained-tags/{algorithmId}
```

### **المنطق والخطوات (Logic & Flow):**
1. يتم إرسال طلب GET إلى `/api/explained-tags/{algorithmId}`
2. يتم استبدال `{algorithmId}` برقم الخوارزمية المطلوبة
3. يتم إضافة Token تلقائياً في Header
4. الـ API يرجع تفاصيل كاملة للخوارزمية

### **Request Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}
```

### **URL Parameters:**
- `algorithmId` (path parameter) - رقم الخوارزمية (مطلوب)
  - نوع: `number`
  - مثال: `1`, `2`, `3`, إلخ

### **Response Structure:**
```typescript
interface AlgorithmDetail {
  id: number;                    // رقم الخوارزمية
  title: string;                 // عنوان الخوارزمية
  overview: string;              // نظرة عامة
  complexity: string;            // التعقيد الزمني
  steps: string;                 // الخطوات
  shortDescription: string;      // وصف مختصر
  imageURL: string;              // رابط الصورة
  start: string;                 // البداية
  end: string;                   // النهاية
  tagId: number;                 // رقم الفئة
  exampleTags: ExampleTag[];     // أمثلة الكود
  youTubeLinks: YouTubeLink[];   // روابط YouTube
  videos: AlgorithmVideo[];      // فيديوهات
}

interface ExampleTag {
  id: number;
  title: string;
  code: string;
  explaineTagId: number;
}

interface YouTubeLink {
  id: number;
  url: string;
  explaineTagId: number;
}

interface AlgorithmVideo {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  explaineTagId: number;
}
```

### **Response Example:**
```json
{
  "id": 1,
  "title": "Binary Search",
  "overview": "Binary Search is an efficient algorithm for finding an item from a sorted list of items...",
  "complexity": "O(log n)",
  "steps": "1. Find the middle element\n2. Compare with target\n3. Search in the appropriate half",
  "shortDescription": "البحث الثنائي في مصفوفة مرتبة",
  "imageURL": "https://example.com/binary-search.png",
  "start": "ابدأ من منتصف المصفوفة",
  "end": "أوقف عند العثور على العنصر",
  "tagId": 1,
  "exampleTags": [
    {
      "id": 1,
      "title": "Java Implementation",
      "code": "public int binarySearch(int[] arr, int target) { ... }",
      "explaineTagId": 1
    },
    {
      "id": 2,
      "title": "Python Implementation",
      "code": "def binary_search(arr, target): ...",
      "explaineTagId": 1
    }
  ],
  "youTubeLinks": [
    {
      "id": 1,
      "url": "https://www.youtube.com/watch?v=example",
      "explaineTagId": 1
    }
  ],
  "videos": [
    {
      "id": 1,
      "title": "Binary Search Explained",
      "description": "شرح مفصل للبحث الثنائي",
      "url": "https://example.com/video.mp4",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "explaineTagId": 1
    }
  ]
}
```

### **كود التطبيق المستخدم:**
```typescript
// في AlgorithmDetailScreen.tsx
const loadAlgorithmDetail = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/api/explained-tags/${algorithmId}`);
    setAlgorithm(response.data);
  } catch (error: any) {
    console.error('Error loading algorithm detail:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 📝 ملاحظات مهمة (Important Notes):

1. **Authentication (التوثيق):**
   - جميع الطلبات تحتاج إلى Token في Header
   - يتم إضافة Token تلقائياً عبر axios interceptor
   - إذا انتهت صلاحية Token، يتم تجديده تلقائياً

2. **Error Handling (معالجة الأخطاء):**
   - في حالة خطأ 401 (غير مصرح)، يتم محاولة تجديد Token تلقائياً
   - إذا فشل تجديد Token، يتم مسح بيانات المصادقة

3. **Data Validation (التحقق من البيانات):**
   - يتم التحقق من أن البيانات هي arrays قبل استخدامها
   - يتم التحقق من وجود `explaineTags` لكل tag

4. **Search & Filter (البحث والفلترة):**
   - البحث يتم في `tagName`, `shortDescription`, `description`
   - البحث أيضاً في `title` و `shortDescription` للخوارزميات
   - يمكن فلترة الخوارزميات حسب الفئة (`selectedTagId`)

---

## 🔄 ملخص سريع (Quick Summary):

| العملية | Endpoint | Method | Parameters | Response |
|---------|----------|--------|------------|----------|
| جلب جميع الخوارزميات مع الفئات | `/api/explained-tags/with-tags` | GET | لا يوجد | `AlgorithmTag[]` |
| جلب تفاصيل خوارزمية | `/api/explained-tags/{id}` | GET | `id` (path param) | `AlgorithmDetail` |

---

## 💻 مثال استخدام كامل (Full Usage Example):

```typescript
import api from '@/services/api';

// 1. جلب جميع الخوارزميات
const fetchAllAlgorithms = async () => {
  try {
    const response = await api.get('/api/explained-tags/with-tags');
    const tags: AlgorithmTag[] = response.data;
    
    // معالجة البيانات
    tags.forEach(tag => {
      console.log(`Tag: ${tag.tagName}`);
      tag.explaineTags.forEach(alg => {
        console.log(`  - Algorithm: ${alg.title}`);
      });
    });
    
    return tags;
  } catch (error) {
    console.error('Error fetching algorithms:', error);
    throw error;
  }
};

// 2. جلب تفاصيل خوارزمية محددة
const fetchAlgorithmDetails = async (algorithmId: number) => {
  try {
    const response = await api.get(`/api/explained-tags/${algorithmId}`);
    const algorithm: AlgorithmDetail = response.data;
    
    console.log(`Title: ${algorithm.title}`);
    console.log(`Complexity: ${algorithm.complexity}`);
    console.log(`Examples: ${algorithm.exampleTags.length}`);
    
    return algorithm;
  } catch (error) {
    console.error('Error fetching algorithm details:', error);
    throw error;
  }
};

// استخدام
const loadData = async () => {
  // جلب جميع الخوارزميات
  const allAlgorithms = await fetchAllAlgorithms();
  
  // جلب تفاصيل أول خوارزمية
  if (allAlgorithms[0]?.explaineTags[0]) {
    const firstAlgorithmId = allAlgorithms[0].explaineTags[0].id;
    const details = await fetchAlgorithmDetails(firstAlgorithmId);
  }
};
```

