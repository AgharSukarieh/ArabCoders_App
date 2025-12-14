import api from './api';

export interface PostTag {
  id: number;
  tagName: string;
  shortDescription: string;
  description: string;
  imageURL: string;
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

