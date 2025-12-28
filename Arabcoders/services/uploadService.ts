import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://arabcodetest.runasp.net/api';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * رفع صورة
 * @param imageFile - ملف الصورة { uri, type, name }
 * @param onProgress - دالة callback لتتبع التقدم (اختياري)
 * @returns Promise<string> - رابط الصورة المرفوعة
 */
export const uploadImage = async (
  imageFile: { uri: string; type?: string; name?: string },
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('لا يوجد token - يرجى تسجيل الدخول');
    }

    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.name || `image-${Date.now()}.jpg`,
    } as any);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const url = typeof response === 'string' ? response : (response.url || response);
            resolve(url);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('POST', `${BASE_URL}/uploads/images`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    throw new Error(error?.message || 'فشل رفع الصورة');
  }
};

/**
 * رفع فيديو
 * @param videoFile - ملف الفيديو { uri, type, name }
 * @param onProgress - دالة callback لتتبع التقدم (اختياري)
 * @returns Promise<string> - رابط الفيديو المرفوع
 */
export const uploadVideo = async (
  videoFile: { uri: string; type?: string; name?: string },
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('لا يوجد token - يرجى تسجيل الدخول');
    }

    const formData = new FormData();
    formData.append('video', {
      uri: videoFile.uri,
      type: videoFile.type || 'video/mp4',
      name: videoFile.name || `video-${Date.now()}.mp4`,
    } as any);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const url = typeof response === 'string' ? response : (response.url || response);
            resolve(url);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

      xhr.open('POST', `${BASE_URL}/uploads/videos`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error('❌ Error uploading video:', error);
    throw new Error(error?.message || 'فشل رفع الفيديو');
  }
};

