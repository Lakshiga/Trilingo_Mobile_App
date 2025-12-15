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
import LottieView from 'lottie-react-native';
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
    const conversationName = getLearningLanguageField(learningLanguage, activity);
    (navigation as any).navigate('PlayScreen', {
      activityId: activity.id,
      activityTypeId: activity.activityTypeId,
      activityTitle: conversationName,
    });
  };

  const getConversationName = (activity: ActivityDto) => {
    return getLearningLanguageField(learningLanguage, activity);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color="#0D5B81" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Conversations</Text>
          <Text style={styles.headerSubtitle}>Practice speaking with guided chats</Text>
        </View>
      </View>

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
            conversations.map((conversation) => {
              const conversationName = getConversationName(conversation);
              
              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.card}
                  onPress={() => handleConversationPress(conversation)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.iconPill}>
                      <MaterialIcons name="chat" size={20} color="#fff" />
                    </View>
                    <View style={styles.textBlock}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{conversationName}</Text>
                      <Text style={styles.cardSubtitle}>Conversation • Guided</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={26} color="#9CA3AF" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E4EEF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#0D5B81',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  conversationsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5A8DEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default ConversationScreen;







