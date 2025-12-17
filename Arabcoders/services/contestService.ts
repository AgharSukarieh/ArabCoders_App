import api from './api';

export interface ContestTag {
  id: number;
  tagName: string;
  shortDescription: string | null;
  description: string | null;
  imageURL: string | null;
}

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

/**
 * جلب تفاصيل مسابقة معينة
 * @param {number} contestId - معرف المسابقة
 * @returns {Promise<Contest>} تفاصيل المسابقة
 */
export const getContestById = async (contestId: number): Promise<Contest> => {
  try {
    console.log('📤 Fetching contest:', contestId);
    
    const numericContestId = parseInt(String(contestId), 10);
    if (isNaN(numericContestId) || numericContestId <= 0 || !Number.isInteger(numericContestId)) {
      throw new Error('معرف المسابقة غير صحيح');
    }
    
    const response = await api.get(`/api/contests/${numericContestId}`, {
      headers: {
        'accept': 'text/plain',
      },
    });
    
    console.log('✅ Contest fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching contest:', error?.response?.data || error);
    
    if (error?.response?.status === 404) {
      throw new Error('المسابقة غير موجودة');
    }
    
    if (error?.response?.status === 401) {
      throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'خطأ في جلب تفاصيل المسابقة');
  }
};

