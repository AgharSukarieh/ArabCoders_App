import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getContestById, Contest, ContestProblem } from '@/services/contestService';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ContestDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State للأقسام القابلة للطي
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [prizesExpanded, setPrizesExpanded] = useState(true);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  
  // State للشروط والأحكام والجوائز (إذا لم تكن موجودة في API)
  const [termsAndConditions, setTermsAndConditions] = useState<string>('');
  const [prizes, setPrizes] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const htmlToText = (html?: string, fallback: string = '') => {
    if (!html) return fallback;
    // استبدال فواصل الأسطر
    const withNewLines = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n');
    const stripped = withNewLines.replace(/<[^>]+>/g, '').replace(/\n{2,}/g, '\n').trim();
    return stripped || fallback;
  };

  useEffect(() => {
    if (id) {
      fetchContest();
    }
  }, [id]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      setError(null);
      const contestId = parseInt(id || '0', 10);
      const data = await getContestById(contestId);
      setContest(data);
      
      // إذا كانت الشروط والأحكام موجودة في API، استخدمها
      if (data.termsAndConditions) {
        setTermsAndConditions(htmlToText(data.termsAndConditions, ''));
      }
      
      // إذا كانت الجوائز موجودة في API، استخدمها
      if (data.prizes) {
        setPrizes(htmlToText(data.prizes, ''));
      }

      if (data.location) {
        setLocation(data.location);
      }
    } catch (err: any) {
      console.error('Error fetching contest:', err);
      setError(err.message || 'حدث خطأ في جلب تفاصيل المسابقة');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getDifficultyColor = (difficultyValue?: number | string, difficultyText?: string) => {
    if (typeof difficultyValue === 'number') {
      switch (difficultyValue) {
        case 0: return '#4CAF50';
        case 1: return '#FF9800';
        case 2: return '#F44336';
        case 3: return '#9C27B0';
        default: return '#4CAF50';
      }
    }
    const diff = (typeof difficultyValue === 'string' ? difficultyValue : difficultyText)?.toLowerCase() || '';
    if (diff.includes('easy') || diff.includes('سهل')) return '#4CAF50';
    if (diff.includes('medium') || diff.includes('متوسط')) return '#FF9800';
    if (diff.includes('hard') || diff.includes('صعب')) return '#F44336';
    return '#4CAF50';
  };

  const getDifficultyLabel = (difficultyValue?: number | string, difficultyText?: string) => {
    if (typeof difficultyValue === 'number') {
      switch (difficultyValue) {
        case 0: return 'سهل';
        case 1: return 'متوسط';
        case 2: return 'صعب';
        case 3: return 'متقدم';
        default: return 'غير محدد';
      }
    }
    if (typeof difficultyValue === 'string') return difficultyValue;
    return difficultyText || 'غير محدد';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#085173" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  if (error || !contest) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'المسابقة غير موجودة'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-forward" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{contest.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Banner Image */}
        <ExpoImage
          source={{ uri: contest.imageURL }}
          style={styles.bannerImage}
          contentFit="cover"
        />

        {/* Competition Information Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setInfoExpanded(!infoExpanded)}>
            <Text style={styles.sectionTitle}>معلومات المسابقة</Text>
            <Ionicons
              name={infoExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          
          {infoExpanded && (
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>اسم المسابقة :</Text>
                <Text style={styles.infoValue}>{contest.name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>مكان المسابقة :</Text>
                <Text style={styles.infoValue}>{location || contest.location || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الراعي الرسمي للمسابقة :</Text>
                <Text style={styles.infoValue}>{contest.nameUserCreateContest}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>عدد الاسئلة :</Text>
                <Text style={styles.infoValue}>{contest.problems.length}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>تاريخ المسابقة</Text>
                <Text style={styles.infoValue}>{formatDate(contest.endTime)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>مستوى المسابقة :</Text>
                <View style={styles.difficultyContainer}>
                  <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(contest.difficultyLevel, contest.problems[0]?.difficulty) }]} />
                  <Text style={styles.infoValue}>{getDifficultyLabel(contest.difficultyLevel, contest.problems[0]?.difficulty)}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>التصنيفات</Text>
                <View style={styles.tagsContainer}>
                  {contest.problems.length > 0 && contest.problems[0].tags.length > 0 ? (
                    contest.problems[0].tags.map((tag) => (
                      <View key={tag.id} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag.tagName}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.infoValue}>لا توجد تصنيفات</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Prizes Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setPrizesExpanded(!prizesExpanded)}>
            <Text style={styles.sectionTitle}>الجوائز</Text>
            <Ionicons
              name={prizesExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          
          {prizesExpanded && (
            <View style={styles.sectionContent}>
              <Text style={styles.prizesText}>
                {prizes || 'لم يتم تحديد الجوائز بعد'}
              </Text>
            </View>
          )}
        </View>

        {/* Terms and Conditions Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setTermsExpanded(!termsExpanded)}>
            <Text style={styles.sectionTitle}>الأحكام والشروط</Text>
            <Ionicons
              name={termsExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          
          {termsExpanded && (
            <View style={styles.sectionContent}>
              {termsAndConditions ? (
                <Text style={styles.termsText}>{termsAndConditions}</Text>
              ) : (
                <Text style={styles.termsText}>
                  سيتم إضافة الشروط والأحكام قريباً من قبل الباك إند.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Competition Questions Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setQuestionsExpanded(!questionsExpanded)}>
            <Text style={styles.sectionTitle}>أسئلة المسابقة</Text>
            <Ionicons
              name={questionsExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          
          {questionsExpanded && (
            <View style={styles.sectionContent}>
              {contest.problems.map((problem: ContestProblem, index: number) => (
                <View key={problem.id} style={styles.problemItem}>
                  <Text style={styles.problemTitle}>{problem.title}</Text>
                  
                  <View style={styles.problemInfoRow}>
                    <Text style={styles.problemLabel}>مستوى السؤال .</Text>
                    <View style={styles.difficultyContainer}>
                      <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(problem.difficulty) }]} />
                      <Text style={styles.problemDifficulty}>{problem.difficulty}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.problemInfoRow}>
                    <Text style={styles.problemLabel}>التصنيفات</Text>
                    <View style={styles.tagsContainer}>
                      {problem.tags.map((tag) => (
                        <View key={tag.id} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag.tagName}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>سجل الآن</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerImage: {
    width: SCREEN_WIDTH,
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  sectionContent: {
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    textAlign: 'right',
  },
  difficultyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  commentsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  commentBadge: {
    backgroundColor: '#FFE0E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#C2185B',
  },
  prizesText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'right',
  },
  termsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'right',
  },
  registerButton: {
    backgroundColor: '#085173',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  problemItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'right',
  },
  problemInfoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    marginLeft: 8,
  },
  problemDifficulty: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#FFE0E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#C2185B',
  },
  backButton: {
    backgroundColor: '#085173',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

