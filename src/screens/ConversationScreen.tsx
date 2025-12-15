import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { getTranslations, Language } from '../utils/translations';
import { loadStudentLanguagePreference, languageCodeToLanguage } from '../utils/studentLanguage';
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
  const [nativeLanguage, setNativeLanguage] = useState<Language>('English');
  const t = useMemo(() => getTranslations(nativeLanguage), [nativeLanguage]);
  
  const [conversations, setConversations] = useState<ActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const loadLang = async () => {
      const pref = await loadStudentLanguagePreference();
      const native = languageCodeToLanguage(pref.nativeLanguageCode);
      setNativeLanguage(native);
    };
    loadLang();

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
  }, [learningLanguage, nativeLanguage]);

  const handleConversationPress = (activity: ActivityDto) => {
    const conversationName = getConversationName(activity);
    (navigation as any).navigate('PlayScreen', {
      activityId: activity.id,
      activityTypeId: activity.activityTypeId,
      activityTitle: conversationName,
    });
  };

  const getConversationName = (activity: ActivityDto) => {
    switch (nativeLanguage) {
      case 'Tamil':
        return activity.name_ta || activity.name_en || activity.name_si || activity.name_ta || '';
      case 'Sinhala':
        return activity.name_si || activity.name_en || activity.name_ta || activity.name_si || '';
      case 'English':
      default:
        return activity.name_en || activity.name_ta || activity.name_si || activity.name_en || '';
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#E0F2FE', '#DBEAFE', '#E0E7FF']}
        style={styles.loadingContainer}
      >
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>
          {t.conversationLoading}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#E0F2FE', '#DBEAFE', '#E0E7FF']}
      style={styles.container}
    >
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name="microphone" size={28} color="#FFFFFF" />
            <Text style={styles.headerTitle}>{t.conversationTitle} 🎤</Text>
          </View>
          <Text style={styles.headerSubtitle}>{t.conversationSubtitle}</Text>
        </View>
      </Animated.View>

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
              
              return (
                <Animated.View
                  key={conversation.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50 - (index * 10)],
                      }),
                    }],
                  }}
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleConversationPress(conversation)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardLeft}>
                      <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        style={styles.iconPill}
                      >
                        <MaterialCommunityIcons name="microphone-message" size={22} color="#fff" />
                      </LinearGradient>
                      <View style={styles.textBlock}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{conversationName}</Text>
                        <Text style={styles.cardSubtitle}>{t.conversationCardSubtitle}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={28} color="#4F46E5" />
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="microphone-off" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>{t.conversationEmptyTitle}</Text>
              <Text style={styles.emptySubtext}>{t.conversationEmptySubtitle}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
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
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#0284C7',
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#0EA5E9',
    fontWeight: '600',
  },
});

export default ConversationScreen;







