import api from './api';

export interface PostTag {
  id: number;
  tagName: string;
  shortDescription: string;
  description: string;
  imageURL: string;
}

export const getTags = async (): Promise<PostTag[]> => {
  try {
    const response = await api.get('/api/tags');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب التاغات');
  }
};

export interface CreatePostData {
  title: string;
  content: string;
  userId: number;
  videos: Array<{
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
  }>;
  images: string[];
  tags: number[];
}

/**
 * إنشاء منشور جديد
 * @param {CreatePostData} postData بيانات المنشور
 * @returns {Promise<Post>} المنشور المُنشأ
 */
export const createPost = async (postData: CreatePostData): Promise<Post> => {
  try {
    console.log('📤 Creating post...', {
      title: postData.title?.substring(0, 50),
      userId: postData.userId,
      imagesCount: postData.images?.length || 0,
      videosCount: postData.videos?.length || 0,
      tagsCount: postData.tags?.length || 0,
    });

    console.log('📤 Post data being sent:', JSON.stringify(postData, null, 2));

    // التأكد من أن userId رقم صحيح وأكبر من 0
    if (!postData.userId || postData.userId <= 0 || !Number.isInteger(postData.userId)) {
      throw new Error(`معرف المستخدم غير صحيح: ${postData.userId}. يجب أن يكون رقماً صحيحاً أكبر من 0`);
    }

    // إرسال الطلب بنفس الطريقة كما في curl command
    const response = await api.post('/api/posts', postData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    });
    
    console.log('✅ Post created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    // تسجيل تفاصيل الخطأ الكاملة
    const errorDetails: any = {
      message: error?.message,
    };

    if (error?.response) {
      errorDetails.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else {
      errorDetails.response = 'No response object';
    }

    if (error?.request) {
      errorDetails.request = 'Request made but no response received';
    }

    if (error?.config) {
      errorDetails.config = {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        headers: {
          Authorization: error.config.headers?.Authorization ? 'Bearer ***' : 'Not set',
          'Content-Type': error.config.headers?.['Content-Type'],
          Accept: error.config.headers?.Accept,
        },
      };
    }

    console.error('❌ Error creating post - Full error:', JSON.stringify(errorDetails, null, 2));

    // معالجة خطأ 403 بشكل خاص
    if (error?.response?.status === 403) {
      // الخطأ 403 مع data فارغ يعني أن الـ API رفض الطلب بدون رسالة
      // هذا عادة يعني مشكلة في الصلاحيات أو الـ token
      const errorData = error.response.data;
      let errorMessage = 'خطأ في الصلاحيات (403 Forbidden)';
      
      if (errorData) {
        if (typeof errorData === 'string' && errorData.trim()) {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object') {
          errorMessage = JSON.stringify(errorData);
        }
      } else {
        // إذا كانت data فارغة، قد يكون السبب:
        // 1. الـ token منتهي الصلاحية
        // 2. المستخدم لا يملك صلاحيات إنشاء منشورات
        // 3. الـ userId غير صحيح
        errorMessage = 'الطلب مرفوض (403). يرجى التحقق من:\n' +
                      '1. صلاحيات المستخدم في الـ backend\n' +
                      '2. صحة الـ token (قد يكون منتهي الصلاحية)\n' +
                      '3. معرف المستخدم (userId: ' + postData.userId + ')';
      }
      
      throw new Error(errorMessage);
    }

    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في إنشاء المنشور');
  }
};

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  userId: number;
  userName: string;
  imageURL: string;
  postId: number;
  parentCommentId?: number;
  replies?: Comment[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  userName: string;
  imageURL: string;
  numberLike: number;
  isLikedIt: boolean | null;
  mostCommonType: number;
  secondCommonType: number;
  thirdCommonType: number;
  videos: string[];
  images: string[];
  postTags: PostTag[];
  numberComment?: number;
  comments?: Comment[];
}

/**
 * جلب جميع المنشورات
 * @returns {Promise<Post[]>} قائمة المنشورات
 */
export const getPosts = async (): Promise<Post[]> => {
  try {
    console.log('📤 Fetching posts...');
    const response = await api.get('/api/posts');
    
    if (Array.isArray(response.data)) {
      console.log('✅ Posts fetched:', response.data.length);
      return response.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching posts:', error?.response?.data || error);
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب المنشورات');
  }
};

/**
 * جلب منشور معين مع التعليقات
 * @param {number} postId - معرف المنشور
 * @returns {Promise<Post>} المنشور مع التعليقات
 */
export const getPostWithComments = async (postId: number): Promise<Post> => {
  try {
    console.log('📤 Fetching post with comments:', postId);
    
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      throw new Error('معرف المنشور غير صحيح');
    }
    
    const response = await api.get(`/api/posts/${numericPostId}`);
    console.log('✅ Post with comments fetched:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching post with comments:', error?.response?.data || error);
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب المنشور والتعليقات');
  }
};

/**
 * إعجاب بمنشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<any>} نتيجة العملية
 */
export const addLike = async (postId: number): Promise<any> => {
  try {
    console.log('📤 Adding like for post:', postId);
    console.log('📤 PostId type:', typeof postId, 'Value:', postId);
    
    // Ensure postId is a number and is an integer
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      console.error('❌ Invalid postId:', postId, 'Converted to:', numericPostId);
      throw new Error('معرف المنشور غير صحيح');
    }
    
    // POST /api/post-likes?postId=1
    // According to Swagger: curl -X 'POST' 'http://arabcodetest.runasp.net/api/post-likes?postId=1' -H 'accept: */*' -d ''
    const url = `/api/post-likes?postId=${numericPostId}`;
    console.log('📤 Request URL:', url);
    console.log('📤 PostId being sent:', numericPostId, 'Type:', typeof numericPostId, 'IsInteger:', Number.isInteger(numericPostId));
    
    const response = await api.post(
      url,
      null, // Empty body as per API documentation
      {
        headers: {
          'accept': '*/*',
          // Don't set Content-Type for empty body
        },
      }
    );
    console.log('✅ Like added:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error adding like:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      postId: postId,
    });
    
    // Handle 401 Unauthorized
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    // Handle 400 Bad Request
    if (error?.response?.status === 400) {
      const errorData = error?.response?.data;
      let errorMessage = 'خطأ في البيانات المرسلة';
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData) {
        errorMessage = JSON.stringify(errorData);
      }
      
      // Handle specific error messages
      if (errorMessage.toLowerCase().includes('context id') || 
          errorMessage.toLowerCase().includes('invalid')) {
        errorMessage = 'معرف المنشور غير صحيح أو غير موجود';
      }
      
      throw new Error(errorMessage);
    }
    
    const errorMessage =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : null) ||
      error?.message ||
      'خطأ في الإعجاب بالمنشور';
    
    // Handle specific error messages
    const finalErrorMessage = errorMessage.toLowerCase().includes('context id') || 
                              errorMessage.toLowerCase().includes('invalid')
      ? 'معرف المنشور غير صحيح أو غير موجود'
      : errorMessage;
    
    throw new Error(finalErrorMessage);
  }
};

/**
 * إزالة الإعجاب من منشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<any>} نتيجة العملية
 */
export const removeLike = async (postId: number): Promise<any> => {
  try {
    console.log('📤 Removing like for post:', postId);
    console.log('📤 PostId type:', typeof postId, 'Value:', postId);
    
    // Ensure postId is a number and is an integer
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      console.error('❌ Invalid postId:', postId, 'Converted to:', numericPostId);
      throw new Error('معرف المنشور غير صحيح');
    }
    
    // DELETE /api/post-likes?postId=1
    const url = `/api/post-likes?postId=${numericPostId}`;
    console.log('📤 Request URL:', url);
    console.log('📤 PostId being sent:', numericPostId, 'Type:', typeof numericPostId, 'IsInteger:', Number.isInteger(numericPostId));
    
    const response = await api.delete(
      url,
      {
        headers: {
          'accept': '*/*',
        },
      }
    );
    console.log('✅ Like removed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error removing like:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      postId: postId,
    });
    
    // Handle 401 Unauthorized
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    // Handle 400 Bad Request
    if (error?.response?.status === 400) {
      const errorData = error?.response?.data;
      let errorMessage = 'خطأ في البيانات المرسلة';
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData) {
        errorMessage = JSON.stringify(errorData);
      }
      
      // Handle specific error messages
      if (errorMessage.toLowerCase().includes('context id') || 
          errorMessage.toLowerCase().includes('invalid')) {
        errorMessage = 'معرف المنشور غير صحيح أو غير موجود';
      }
      
      throw new Error(errorMessage);
    }
    
    const errorMessage =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : null) ||
      error?.message ||
      'خطأ في إزالة الإعجاب من المنشور';
    
    // Handle specific error messages
    const finalErrorMessage = errorMessage.toLowerCase().includes('context id') || 
                              errorMessage.toLowerCase().includes('invalid')
      ? 'معرف المنشور غير صحيح أو غير موجود'
      : errorMessage;
    
    throw new Error(finalErrorMessage);
  }
};

/**
 * التحقق من حالة الإعجاب بمنشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<boolean>} true إذا كان معجب به، false إذا لم يكن
 */
export const getLikeStatus = async (postId: number): Promise<boolean> => {
  try {
    console.log('📤 Checking like status for post:', postId);
    
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      console.error('❌ Invalid postId:', postId);
      throw new Error('معرف المنشور غير صحيح');
    }
    
    const url = `/api/post-likes/status?postId=${numericPostId}`;
    console.log('📤 Request URL:', url);
    
    const response = await api.get(url);
    console.log('✅ Like status:', response.data);
    
    // API يرجع true أو false
    return response.data === true || response.data === 'true';
  } catch (error: any) {
    console.error('❌ Error checking like status:', error);
    
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    // إذا كان الخطأ 404 أو لم يكن هناك لايك، نرجع false
    if (error?.response?.status === 404) {
      return false;
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في التحقق من حالة الإعجاب');
  }
};

/**
 * إعجاب/إلغاء إعجاب بمنشور (Toggle)
 * @param {number} postId - معرف المنشور
 * @param {boolean} isLiked - هل المنشور معجب به حالياً
 * @returns {Promise<any>} نتيجة العملية
 */
export const toggleLike = async (postId: number, isLiked: boolean): Promise<any> => {
  if (isLiked) {
    // إذا كان معجب به، أزل الإعجاب
    return await removeLike(postId);
  } else {
    // إذا لم يكن معجب به، أضف الإعجاب
    return await addLike(postId);
  }
};

/**
 * جلب قائمة المعجبين بمنشور
 * @param {number} postId - معرف المنشور
 * @returns {Promise<Array<{userId: number, userName: string, imageURL: string}>>} قائمة المعجبين
 */
export const getPostLikes = async (postId: number): Promise<Array<{userId: number, userName: string, imageURL: string}>> => {
  try {
    console.log('📤 Fetching likes for post:', postId);
    
    const numericPostId = parseInt(String(postId), 10);
    if (isNaN(numericPostId) || numericPostId <= 0 || !Number.isInteger(numericPostId)) {
      console.error('❌ Invalid postId:', postId);
      throw new Error('معرف المنشور غير صحيح');
    }
    
    const url = `/api/post-likes/posts/${numericPostId}`;
    console.log('📤 Request URL:', url);
    
    const response = await api.get(url);
    console.log('✅ Likes fetched:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching likes:', error);
    
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب المعجبين');
  }
};

export interface SearchUser {
  id: number;
  userName: string;
  imageURL: string;
}

export interface SearchResult {
  posts: Post[];
  users: SearchUser[];
}

export interface SearchPostsParams {
  text: string;
  from?: string | Date;
  to?: string | Date;
  userId?: number;
}

const normalizePost = (post: any): Post => ({
  ...post,
  postTags: Array.isArray(post?.postTags)
    ? post.postTags
    : Array.isArray(post?.tags)
      ? post.tags
      : [],
  images: Array.isArray(post?.images) ? post.images : [],
  videos: Array.isArray(post?.videos) ? post.videos : [],
  numberLike: typeof post?.numberLike === 'number' ? post.numberLike : 0,
  isLikedIt: typeof post?.isLikedIt === 'boolean' ? post.isLikedIt : false,
});

/**
 * البحث عن المنشورات والحسابات
 * @param {string} query - نص البحث
 * @returns {Promise<SearchResult>} نتائج البحث
 */
export const searchPostsAndUsers = async (query: string): Promise<SearchResult> => {
  try {
    console.log('📤 Searching for:', query);
    
    if (!query || query.trim().length === 0) {
      return { posts: [], users: [] };
    }
    
    const response = await api.get(`/api/search?query=${encodeURIComponent(query.trim())}`);
    console.log('✅ Search results:', response.data);
    
    return {
      posts: Array.isArray(response.data.posts) ? response.data.posts : [],
      users: Array.isArray(response.data.users) ? response.data.users : [],
    };
  } catch (error: any) {
    console.error('❌ Error searching:', error);
    
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    // إذا لم يكن هناك endpoint للبحث، نرجع نتائج فارغة
    if (error?.response?.status === 404) {
      return { posts: [], users: [] };
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في البحث');
  }
};

/**
 * البحث عن المنشورات فقط
 * @param {string} query - نص البحث
 * @returns {Promise<Post[]>} قائمة المنشورات
 */
export const searchPosts = async (query: string): Promise<Post[]> => {
  try {
    const results = await searchPostsAndUsers(query);
    return results.posts;
  } catch (error: any) {
    console.error('❌ Error searching posts:', error);
    throw error;
  }
};

/**
 * البحث عن المنشورات من الـ API الرسمي /api/posts/search
 * @param {SearchPostsParams} params - بارامترات البحث
 * @returns {Promise<Post[]>} قائمة المنشورات المطابقة
 */
export const searchPostsRemote = async (params: SearchPostsParams): Promise<Post[]> => {
  try {
    const { text, from, to, userId } = params;
    if (!text || !text.trim()) {
      return [];
    }

    const formatDateParam = (value?: string | Date) => {
      if (!value) return undefined;
      return value instanceof Date ? value.toISOString() : String(value);
    };

    const queryParams: Record<string, string | number> = {
      text: text.trim(),
    };

    const fromValue = formatDateParam(from);
    const toValue = formatDateParam(to);
    if (fromValue) queryParams.from = fromValue;
    if (toValue) queryParams.to = toValue;
    if (userId && Number.isFinite(userId)) {
      queryParams.userId = Number(userId);
    }

    const response = await api.get('/api/posts/search', {
      params: queryParams,
      headers: {
        accept: '*/*',
      },
    });

    const data = response.data;
    const posts = Array.isArray(data)
      ? data
      : Array.isArray(data?.posts)
        ? data.posts
        : [];

    return posts.map(normalizePost);
  } catch (error: any) {
    console.error('❌ Error searching posts remotely:', error?.response?.data || error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'خطأ في البحث عن المنشورات'
    );
  }
};

