import api from './api';

/**
 * التحقق من حالة الإعجاب بتعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<boolean>} true إذا كان معجب به، false إذا لم يكن
 */
export const getCommentLikeStatus = async (commentId: number): Promise<boolean> => {
  try {
    console.log('📤 Checking like status for comment:', commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0 || !Number.isInteger(numericCommentId)) {
      console.error('❌ Invalid commentId:', commentId);
      throw new Error('معرف التعليق غير صحيح');
    }
    
    const url = `/api/comment-likes/${numericCommentId}/status`;
    console.log('📤 Request URL:', url);
    
    const response = await api.get(url, {
      headers: {
        'accept': '*/*',
      },
    });
    
    console.log('✅ Comment like status:', response.data);
    
    // API يرجع true أو false
    return response.data === true || response.data === 'true';
  } catch (error: any) {
    const errorStatus = error?.response?.status;
    const errorMessage = error?.message || '';
    
    // إذا كان الخطأ 401 (Unauthorized)، نرمي خطأ
    if (errorStatus === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    // إذا كان الخطأ 404 (Not Found) أو 503 (Service Unavailable) أو 500 (Server Error)
    // نرجع false بدون إزعاج المستخدم (الخادم مشغول أو غير متاح)
    if (errorStatus === 404 || 
        errorStatus === 503 || 
        errorStatus === 500 || 
        errorStatus === 502 ||
        errorStatus === 504 ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Timeout')) {
      console.log('⚠️ Comment like status check failed (server unavailable or timeout), returning false for comment:', commentId);
      return false; // نرجع false كقيمة افتراضية
    }
    
    // للأخطاء الأخرى، نرمي خطأ فقط إذا لم تكن network error
    if (!error?.response) {
      // Network error - نرجع false
      console.log('⚠️ Network error checking comment like status, returning false for comment:', commentId);
      return false;
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في التحقق من حالة الإعجاب');
  }
};

/**
 * إعجاب بتعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<any>} نتيجة العملية (يرجع نفس commentId إذا كان معجب به مسبقاً)
 */
export const addCommentLike = async (commentId: number): Promise<any> => {
  try {
    console.log('📤 Adding like for comment:', commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0 || !Number.isInteger(numericCommentId)) {
      console.error('❌ Invalid commentId:', commentId);
      throw new Error('معرف التعليق غير صحيح');
    }
    
    // POST /api/comment-likes?commentId=75
    const url = `/api/comment-likes?commentId=${numericCommentId}`;
    console.log('📤 Request URL:', url);
    
    const response = await api.post(
      url,
      null, // Empty body as per API documentation
      {
        headers: {
          'accept': '*/*',
        },
      }
    );
    console.log('✅ Comment like added:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error adding comment like:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      commentId: commentId,
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
      
      throw new Error(errorMessage);
    }
    
    const errorMessage =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : null) ||
      error?.message ||
      'خطأ في الإعجاب بالتعليق';
    
    throw new Error(errorMessage);
  }
};

/**
 * إزالة الإعجاب من تعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<any>} نتيجة العملية
 */
export const removeCommentLike = async (commentId: number): Promise<any> => {
  try {
    console.log('📤 Removing like for comment:', commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0 || !Number.isInteger(numericCommentId)) {
      console.error('❌ Invalid commentId:', commentId);
      throw new Error('معرف التعليق غير صحيح');
    }
    
    // DELETE /api/comment-likes/75
    const url = `/api/comment-likes/${numericCommentId}`;
    console.log('📤 Request URL:', url);
    
    const response = await api.delete(
      url,
      {
        headers: {
          'accept': '*/*',
        },
      }
    );
    console.log('✅ Comment like removed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error removing comment like:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
      commentId: commentId,
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
      
      throw new Error(errorMessage);
    }
    
    const errorMessage =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error?.response?.data : null) ||
      error?.message ||
      'خطأ في إزالة الإعجاب من التعليق';
    
    throw new Error(errorMessage);
  }
};

/**
 * إعجاب/إلغاء إعجاب بتعليق (Toggle)
 * @param {number} commentId - معرف التعليق
 * @param {boolean} isLiked - هل التعليق معجب به حالياً
 * @returns {Promise<any>} نتيجة العملية
 */
export const toggleCommentLike = async (commentId: number, isLiked: boolean): Promise<any> => {
  if (isLiked) {
    // إذا كان معجب به، أزل الإعجاب
    return await removeCommentLike(commentId);
  } else {
    // إذا لم يكن معجب به، أضف الإعجاب
    return await addCommentLike(commentId);
  }
};

/**
 * جلب قائمة المعجبين بتعليق
 * @param {number} commentId - معرف التعليق
 * @returns {Promise<Array<{userId: number, userName: string, imageURL: string}>>} قائمة المعجبين
 */
export const getCommentLikes = async (commentId: number): Promise<Array<{userId: number, userName: string, imageURL: string}>> => {
  try {
    console.log('📤 Fetching likes for comment:', commentId);
    
    const numericCommentId = parseInt(String(commentId), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0 || !Number.isInteger(numericCommentId)) {
      console.error('❌ Invalid commentId:', commentId);
      throw new Error('معرف التعليق غير صحيح');
    }
    
    const url = `/api/comment-likes/${numericCommentId}/users`;
    console.log('📤 Request URL:', url);
    
    const response = await api.get(url, {
      headers: {
        'accept': '*/*',
      },
    });
    console.log('✅ Comment likes fetched:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching comment likes:', error);
    
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب المعجبين');
  }
};

