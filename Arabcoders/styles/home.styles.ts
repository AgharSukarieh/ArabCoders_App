import { StyleSheet, Dimensions, Platform } from 'react-native';

const SCREEN = Dimensions.get('window');
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// دالة لإنشاء الأنماط بناءً على الوضع (فاتح/داكن)
export const getHomeStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  postsListContainer: {
    paddingBottom: 20,
  },
  postSkeletonCard: {
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postSkeletonUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postSkeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#333333' : '#E5E5E5',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: isDark ? '#CCCCCC' : '#999',
  },
});

// للتوافق مع الكود القديم - الأنماط الافتراضية (فاتح)
export const homeStyles = getHomeStyles(false);

