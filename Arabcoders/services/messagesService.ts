import api from './api';

export interface MessageVideo {
  id?: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
}

export interface Message {
  id?: number;
  message: string;
  senderId: number;
  receiverId: number;
  videos?: MessageVideo[];
  images?: string[];
  createdAt?: string;
  sentAt?: string;
  senderName?: string;
  receiverName?: string;
  senderImageUrl?: string;
  receiverImageUrl?: string;
  isReadUser?: boolean;
  _optimistic?: boolean; // للرسائل المؤقتة
}

export interface CreateMessageRequest {
  message: string;
  receiverId: number;
  videos?: MessageVideo[];
  images?: string[];
}

export interface UpdateMessageRequest {
  id: number;
  message: string;
  senderId: number;
  receiverId: number;
  videos?: MessageVideo[];
  images?: string[];
}

/**
 * إرسال رسالة جديدة
 */
export const sendMessage = async (data: CreateMessageRequest): Promise<Message> => {
  try {
    console.log('📤 Sending message...', data);
    const response = await api.post('/api/messages', data, {
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
    });
    console.log('✅ Message sent:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل إرسال الرسالة');
  }
};

/**
 * جلب الرسائل مع الأدمن
 * @param userId - معرف المستخدم الحالي (لجلب جميع الرسائل التي يشارك فيها)
 * @returns Promise<Message[]> - قائمة الرسائل
 */
export const getUserMessagesWithAdmin = async (userId: number): Promise<Message[]> => {
  try {
    console.log(`📤 Fetching messages for user ${userId}...`);
    const response = await api.get(`/api/messages/users/${userId}`, {
      headers: {
        'accept': '*/*',
      },
    });
    console.log('✅ Messages fetched:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(`❌ Error fetching messages for user ${userId}:`, error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل جلب الرسائل');
  }
};

/**
 * جلب جميع الرسائل لمستخدم معين
 */
export const getMessagesByUserId = async (userId: number): Promise<Message[]> => {
  try {
    console.log(`📤 Fetching messages for user ${userId}...`);
    const response = await api.get(`/api/messages/users/${userId}`, {
      headers: {
        'accept': '*/*',
      },
    });
    console.log('✅ Messages fetched:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(`❌ Error fetching messages for user ${userId}:`, error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل جلب الرسائل');
  }
};

/**
 * تحديث رسالة
 */
export const updateMessage = async (messageId: number, data: UpdateMessageRequest): Promise<Message> => {
  try {
    console.log(`📤 Updating message ${messageId}...`, data);
    const response = await api.put(`/api/messages/${messageId}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
    });
    console.log('✅ Message updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error updating message ${messageId}:`, error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل تحديث الرسالة');
  }
};

/**
 * حذف رسالة
 */
export const deleteMessage = async (messageId: number): Promise<void> => {
  try {
    console.log(`📤 Deleting message ${messageId}...`);
    await api.delete(`/api/messages/${messageId}`, {
      headers: {
        'accept': '*/*',
      },
    });
    console.log('✅ Message deleted');
  } catch (error: any) {
    console.error(`❌ Error deleting message ${messageId}:`, error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل حذف الرسالة');
  }
};

export interface ConversationUser {
  id: number;
  email: string;
  userName: string;
  imageUrl: string;
  registerAt: string;
  country: any;
  hasUnReadMessage: boolean;
  isOnline: boolean;
}

/**
 * جلب قائمة المستخدمين الذين تم إرسال رسائل لهم
 */
export const getSentMessagesUsers = async (): Promise<ConversationUser[]> => {
  try {
    console.log('📤 Fetching sent messages users...');
    const response = await api.get('/api/messages/sent', {
      headers: {
        'accept': '*/*',
      },
    });
    console.log('✅ Sent messages users fetched:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error('❌ Error fetching sent messages users:', error);
    throw new Error(error?.response?.data?.message || error?.message || 'فشل جلب قائمة المستخدمين');
  }
};

