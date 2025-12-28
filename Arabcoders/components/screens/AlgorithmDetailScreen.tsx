import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import api from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface ExampleTag {
  id: number;
  title: string;
  code: string;
  explanation: string;
  input: string;
  output: string;
  stepByStep: string;
  priority: number;
  explaineTagId: number;
}

export interface YouTubeLink {
  id: number;
  title: string;
  url: string;
  description: string;
  explaineTagId: number;
}

export interface AlgorithmVideo {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  explaineTagId: number;
}

export interface AlgorithmDetail {
  id: number;
  title: string;
  overview: string;
  complexity: string;
  steps: string;
  shortDescription: string;
  imageURL: string;
  start: string;
  end: string;
  tagId: number;
  exampleTags: ExampleTag[];
  youTubeLinks: YouTubeLink[];
  videos: AlgorithmVideo[];
}

export interface AlgorithmDetailScreenProps {
  algorithmId: number;
  onBack: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  content: string;
  sectionKey: string;
  index: number;
  icon?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps & { isDark?: boolean }> = ({
  title,
  content,
  sectionKey,
  index,
  icon,
  isExpanded,
  onToggle,
  isDark = false,
}) => {
  const rotation = useSharedValue(isExpanded ? 180 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 300 });
  }, [isExpanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const renderHtmlContent = (html: string) => {
    if (!html) return null;
    return (
      <View style={styles.htmlContent}>
        <Text style={styles.htmlText}>{stripHtmlTags(html)}</Text>
      </View>
    );
  };

  const iconColor = isDark ? '#0C85C1' : '#085173';
  const textColor = isDark ? '#FFFFFF' : '#333';
  const sectionBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const sectionBorder = isDark ? '#333' : '#E5E5E5';

  return (
    <AnimatedReanimated.View
      key={sectionKey}
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}>
        <View style={styles.sectionHeaderContent}>
          {icon && (
            <View style={[styles.sectionIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
              <Ionicons name={icon as any} size={24} color={iconColor} />
            </View>
          )}
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        </View>
        <AnimatedReanimated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={24} color={iconColor} />
        </AnimatedReanimated.View>
      </TouchableOpacity>

      {isExpanded && (
        <AnimatedReanimated.View
          entering={FadeIn.duration(300)}
          style={styles.sectionContent}>
          {renderHtmlContent(content)}
        </AnimatedReanimated.View>
      )}
    </AnimatedReanimated.View>
  );
};

export function AlgorithmDetailScreen({ algorithmId, onBack }: AlgorithmDetailScreenProps) {
  const { isDark } = useTheme();
  const [algorithm, setAlgorithm] = useState<AlgorithmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  useEffect(() => {
    loadAlgorithmDetail();
  }, [algorithmId]);

  const loadAlgorithmDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/explained-tags/${algorithmId}`);
      setAlgorithm(response.data);
      // فتح قسم overview افتراضياً
      setExpandedSections(new Set(['overview']));
    } catch (error: any) {
      console.error('Error loading algorithm detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const openYouTubeLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening YouTube:', err));
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const renderHtmlContent = (html: string) => {
    if (!html) return null;
    return (
      <View style={styles.htmlContent}>
        <Text style={styles.htmlText}>{stripHtmlTags(html)}</Text>
      </View>
    );
  };

  const renderCodeBlock = (code: string) => {
    if (!code) return null;
    return (
      <AnimatedReanimated.View
        entering={FadeIn.duration(300)}
        style={dynamicStyles.codeBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <Text style={dynamicStyles.codeText}>{code}</Text>
        </ScrollView>
      </AnimatedReanimated.View>
    );
  };


  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: isDark ? '#121212' : '#FFFFFF' },
    loadingText: { ...styles.loadingText, color: isDark ? '#CCCCCC' : '#666' },
    emptyText: { color: isDark ? '#CCCCCC' : '#333' },
    codeBlock: { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' },
    codeText: { color: isDark ? '#FFFFFF' : '#333' },
    exampleCard: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#333' : '#E5E5E5' },
    exampleTitle: { color: isDark ? '#FFFFFF' : '#085173' },
    exampleText: { color: isDark ? '#CCCCCC' : '#333' },
    youtubeCard: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#333' : '#E5E5E5' },
    youtubeTitle: { color: isDark ? '#FFFFFF' : '#085173' },
    youtubeDescription: { color: isDark ? '#CCCCCC' : '#666' },
  };

  const iconColor = isDark ? '#FFFFFF' : '#085173';
  const emptyIconColor = isDark ? '#666' : '#CCCCCC';

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.headerTitle, { color: iconColor }]}>تفاصيل الخوارزمية</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#0C85C1' : '#085173'} />
          <Text style={dynamicStyles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!algorithm) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={[styles.headerTitle, { color: iconColor }]}>تفاصيل الخوارزمية</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={emptyIconColor} />
          <Text style={dynamicStyles.emptyText}>لم يتم العثور على الخوارزمية</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <LinearGradient
        colors={['#085173', '#063D52']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle} numberOfLines={2}>
            {algorithm.title}
          </Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Complexity Badge */}
        {algorithm.complexity && (
          <AnimatedReanimated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.complexityContainer}>
            <LinearGradient
              colors={['#085173', '#063D52']}
              style={styles.complexityBadge}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <Text style={styles.complexityText}>التعقيد: {algorithm.complexity}</Text>
            </LinearGradient>
          </AnimatedReanimated.View>
        )}

        {/* Overview Section */}
        {algorithm.overview && (
          <CollapsibleSection
            title="نظرة عامة"
            content={algorithm.overview}
            sectionKey="overview"
            index={0}
            icon="information-circle-outline"
            isExpanded={expandedSections.has('overview')}
            onToggle={() => toggleSection('overview')}
            isDark={isDark}
          />
        )}

        {/* Start Section */}
        {algorithm.start && (
          <CollapsibleSection
            title="البداية"
            content={algorithm.start}
            sectionKey="start"
            index={1}
            icon="play-circle-outline"
            isExpanded={expandedSections.has('start')}
            onToggle={() => toggleSection('start')}
            isDark={isDark}
          />
        )}

        {/* Steps Section */}
        {algorithm.steps && (
          <CollapsibleSection
            title="الخطوات"
            content={algorithm.steps}
            sectionKey="steps"
            index={2}
            icon="list-outline"
            isExpanded={expandedSections.has('steps')}
            onToggle={() => toggleSection('steps')}
            isDark={isDark}
          />
        )}

        {/* End Section */}
        {algorithm.end && (
          <CollapsibleSection
            title="النهاية"
            content={algorithm.end}
            sectionKey="end"
            index={3}
            icon="checkmark-circle-outline"
            isExpanded={expandedSections.has('end')}
            onToggle={() => toggleSection('end')}
            isDark={isDark}
          />
        )}

        {/* Examples Section */}
        {algorithm.exampleTags && algorithm.exampleTags.length > 0 && (
          <AnimatedReanimated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.section, isDark && { backgroundColor: '#1E1E1E', borderColor: '#333' }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <View style={[styles.sectionIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                  <Ionicons name="code-slash-outline" size={24} color={iconColor} />
                </View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#333' }]}>الأمثلة</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {algorithm.exampleTags.map((example, index) => (
                <TouchableOpacity
                  key={example.id}
                  style={[
                    dynamicStyles.exampleCard,
                    selectedExample === example.id && styles.exampleCardActive,
                  ]}
                  onPress={() => setSelectedExample(selectedExample === example.id ? null : example.id)}
                  activeOpacity={0.8}>
                  <View style={styles.exampleHeader}>
                    <Text style={dynamicStyles.exampleTitle}>{example.title}</Text>
                    <Ionicons
                      name={selectedExample === example.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={iconColor}
                    />
                  </View>
                  
                  {selectedExample === example.id && (
                    <AnimatedReanimated.View
                      entering={FadeIn.duration(300)}
                      style={styles.exampleDetails}>
                      {example.input && (
                        <View style={styles.exampleDetailRow}>
                          <Text style={[styles.exampleDetailLabel, { color: isDark ? '#AAAAAA' : '#666' }]}>المدخلات:</Text>
                          <Text style={[styles.exampleDetailValue, { color: isDark ? '#FFFFFF' : '#333' }]}>{example.input}</Text>
                        </View>
                      )}
                      {example.output && (
                        <View style={styles.exampleDetailRow}>
                          <Text style={[styles.exampleDetailLabel, { color: isDark ? '#AAAAAA' : '#666' }]}>المخرجات:</Text>
                          <Text style={[styles.exampleDetailValue, { color: isDark ? '#FFFFFF' : '#333' }]}>{example.output}</Text>
                        </View>
                      )}
                      {example.code && renderCodeBlock(example.code)}
                      {example.explanation && renderHtmlContent(example.explanation)}
                      {example.stepByStep && renderHtmlContent(example.stepByStep)}
                    </AnimatedReanimated.View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedReanimated.View>
        )}

        {/* YouTube Links Section */}
        {algorithm.youTubeLinks && algorithm.youTubeLinks.length > 0 && (
          <AnimatedReanimated.View
            entering={FadeInDown.delay(300).springify()}
            style={[styles.section, isDark && { backgroundColor: '#1E1E1E', borderColor: '#333' }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <View style={[styles.sectionIconContainer, isDark && { backgroundColor: '#2E2E2E' }]}>
                  <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                </View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#333' }]}>فيديوهات YouTube</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {algorithm.youTubeLinks.map((link, index) => (
                <TouchableOpacity
                  key={link.id}
                  style={dynamicStyles.youtubeCard}
                  onPress={() => openYouTubeLink(link.url)}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#FF0000', '#CC0000']}
                    style={styles.youtubeCardGradient}>
                    <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                    <View style={styles.youtubeCardContent}>
                      <Text style={styles.youtubeCardTitle} numberOfLines={2}>
                        {link.title}
                      </Text>
                      {link.description && (
                        <Text style={styles.youtubeCardDescription} numberOfLines={2}>
                          {stripHtmlTags(link.description)}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedReanimated.View>
        )}

        {/* Videos Section */}
        {algorithm.videos && algorithm.videos.length > 0 && algorithm.videos.some(v => v.url) && (
          <AnimatedReanimated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="videocam-outline" size={24} color="#085173" />
                </View>
                <Text style={styles.sectionTitle}>فيديوهات</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {algorithm.videos
                .filter(v => v.url)
                .map((video, index) => (
                  <View key={index} style={[styles.videoCard, isDark && { backgroundColor: '#2E2E2E', borderColor: '#444' }]}>
                    {video.thumbnailUrl ? (
                      <Image
                        source={{ uri: video.thumbnailUrl }}
                        style={styles.videoThumbnail}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.videoThumbnailPlaceholder, isDark && { backgroundColor: '#1E1E1E' }]}>
                        <Ionicons name="play-circle" size={48} color={iconColor} />
                      </View>
                    )}
                    <View style={styles.videoInfo}>
                      <Text style={[styles.videoTitle, { color: isDark ? '#FFFFFF' : '#085173' }]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      {video.description && (
                        <Text style={[styles.videoDescription, { color: isDark ? '#AAAAAA' : '#666' }]} numberOfLines={3}>
                          {stripHtmlTags(video.description)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          </AnimatedReanimated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerGradient: {
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  complexityContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  complexityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#085173',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  complexityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FBFF',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#085173',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  htmlContent: {
    marginTop: 8,
  },
  htmlText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    textAlign: 'right',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#D4D4D4',
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  exampleCardActive: {
    borderColor: '#085173',
    backgroundColor: '#FFFFFF',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#085173',
    flex: 1,
  },
  exampleDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  exampleDetailRow: {
    marginBottom: 12,
  },
  exampleDetailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 4,
  },
  exampleDetailValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  youtubeCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  youtubeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  youtubeCardContent: {
    flex: 1,
  },
  youtubeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  youtubeCardDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  videoThumbnail: {
    width: 120,
    height: 90,
    backgroundColor: '#E5E5E5',
  },
  videoThumbnailPlaceholder: {
    width: 120,
    height: 90,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#085173',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

