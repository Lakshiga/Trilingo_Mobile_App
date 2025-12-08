import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { Language } from '../utils/translations';
import { renderActivityByTypeId, isActivityTypeSupported } from '../components/activity-types';

type PlayScreenRouteParams = {
  activityId: number;
  activityTypeId: number;
  activityTitle: string;
  jsonMethod?: string;
};

const PlayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: PlayScreenRouteParams }, 'params'>>();
  const { currentUser } = useUser();
  
  const params = route.params || {};
  const activityId = params.activityId;
  const activityTypeId = params.activityTypeId;
  const activityTitle = params.activityTitle;
  
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  const currentLang: string = learningLanguage === 'English' ? 'en' : learningLanguage === 'Tamil' ? 'ta' : 'si';

  // Safe title handling - ensure it's always a string
  const displayTitle: string = (activityTitle && typeof activityTitle === 'string' && activityTitle.trim()) 
    ? activityTitle.trim() 
    : 'Activity';

  if (!activityId || !activityTypeId) {
    navigation.goBack();
    return null;
  }

  // Check if activity type is supported
  if (!isActivityTypeSupported(activityTypeId)) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle || 'Activity'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>This activity type is not supported</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar with Activity Name */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayTitle || 'Activity'}
        </Text>
        <View style={{ width: 40 }} /> {/* Spacer for balance */}
      </View>

      {/* Activity Component */}
      <View style={styles.contentContainer}>
        {(() => {
          try {
            if (!activityTypeId || !activityId) {
              return (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Missing required parameters</Text>
                </View>
              );
            }

            const activityComponent = renderActivityByTypeId(activityTypeId, {
              content: null, // Components will fetch their own data using activityId
              currentLang: currentLang as any,
              onComplete: () => navigation.goBack(),
              activityId: activityId,
            });

            if (!activityComponent) {
              return (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Unable to load activity component</Text>
                </View>
              );
            }

            return activityComponent;
          } catch (error) {
            return (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading activity</Text>
              </View>
            );
          }
        })()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1976D2',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  contentContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
});

export default PlayScreen;

