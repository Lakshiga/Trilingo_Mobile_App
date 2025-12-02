import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import {
  findActivityTypeIds,
  findMainActivityIds,
  CONVERSATION_MAIN_ACTIVITY_NAMES,
  CONVERSATION_PLAYER_ACTIVITY_TYPE_NAMES,
} from '../utils/activityMappings';

const ConversationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const [conversations, setConversations] = useState<ActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        // Fetch all activities, main activities, and activity types
        const [allActivities, mainActivities, activityTypes] = await Promise.all([
          apiService.getAllActivities(),
          apiService.getAllMainActivities(),
          apiService.getAllActivityTypes(),
        ]);

        const conversationMainActivityIds = findMainActivityIds(
          mainActivities,
          CONVERSATION_MAIN_ACTIVITY_NAMES
        );
        const conversationPlayerTypeIds = findActivityTypeIds(
          activityTypes,
          CONVERSATION_PLAYER_ACTIVITY_TYPE_NAMES
        );

        // Filter activities that belong to Conversation main activity and Conversation Player type
        const conversationActivities = allActivities.filter(
          (activity) =>
            (conversationMainActivityIds.size === 0 ||
              conversationMainActivityIds.has(activity.mainActivityId)) &&
            (conversationPlayerTypeIds.size === 0 ||
              conversationPlayerTypeIds.has(activity.activityTypeId))
        );
        
        // Sort by sequenceOrder
        conversationActivities.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        
        setConversations(conversationActivities);
      } catch (error: any) {
        console.error('Error fetching conversations:', error);
        Alert.alert('Error', 'Failed to load conversations. Please try again.');
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Animate header
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [learningLanguage]);

  const handleConversationPress = (activity: ActivityDto) => {
    let conversationData: any = null;

    if (activity.details_JSON) {
      try {
        const parsed = JSON.parse(activity.details_JSON);
        // Support both direct conversationData or whole JSON as conversationData
        conversationData = parsed.conversationData || parsed;
      } catch (e) {
        console.error('Error parsing conversation JSON:', e);
      }
    }

    (navigation as any).navigate('DynamicActivity', {
      activityId: activity.id,
      activityTitle: getLearningLanguageField(learningLanguage, activity),
      conversationData,
      jsonMethod: 'conversation_player',
    });
  };

  const getConversationName = (activity: ActivityDto) => {
    return getLearningLanguageField(learningLanguage, activity);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.textPrimary || '#43BCCD'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  const gradients: readonly [string, string, ...string[]][] = [
    ['#FF9A8B', '#FF6B9D'] as const,
    ['#43BCCD', '#5DD3A1'] as const,
    ['#6A8EFF', '#8A6BFF'] as const,
    ['#FFB366', '#FF8C42'] as const,
    ['#A77BCA', '#BA91DA'] as const,
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.lessonsBackground || ['#FFF9E6', '#FFE5CC', '#FFD9B3']}
        style={styles.gradient}
      >
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 || 'rgba(255, 182, 193, 0.3)' }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 || 'rgba(173, 216, 230, 0.3)' }]} />
        <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 || 'rgba(255, 218, 185, 0.3)' }]} />

        {/* Header */}
        <LinearGradient colors={theme.headerGradient || ['#FF9A8B', '#FF6B9D', '#FF8C94']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerEmoji}>💬</Text>
              <Text style={styles.headerTitle}>Conversation</Text>
              <Text style={styles.headerEmoji}>🗣️</Text>
            </View>
            <Text style={styles.headerSubtitle}>Practice your conversation skills</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.conversationsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {conversations.length > 0 ? (
              conversations.map((conversation, index) => {
                const conversationName = getConversationName(conversation);
                const gradient = gradients[index % gradients.length];
                
                return (
                  <TouchableOpacity
                    key={conversation.id}
                    style={styles.conversationCard}
                    onPress={() => handleConversationPress(conversation)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.conversationGradient}
                    >
                      <View style={styles.conversationContent}>
                        <View style={styles.conversationIconContainer}>
                          <MaterialIcons name="chat-bubble-outline" size={32} color="#fff" />
                        </View>
                        <View style={styles.conversationTextContainer}>
                          <Text style={styles.conversationTitle} numberOfLines={2}>
                            {conversationName}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={32} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No conversations available yet.</Text>
                <Text style={styles.emptySubtext}>Check back later!</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 150,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 200,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  conversationsContainer: {
    width: '100%',
  },
  conversationCard: {
    marginBottom: 18,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  conversationGradient: {
    padding: 20,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  conversationTextContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ConversationScreen;







