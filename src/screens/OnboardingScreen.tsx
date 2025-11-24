import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

interface OnboardingStep {
  id: number;
  question: string;
  type: 'text' | 'age' | 'info';
  placeholder?: string;
}

const TOTAL_STEPS = 7;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const responsive = useResponsive();
  const [currentStep, setCurrentStep] = useState(0);
  const [kidName, setKidName] = useState('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  
  const speechBubbleFade = useRef(new Animated.Value(0)).current;
  const speechBubbleSlide = useRef(new Animated.Value(30)).current;
  const characterBounce = useRef(new Animated.Value(0)).current;
  const inputFade = useRef(new Animated.Value(0)).current;

  const steps: OnboardingStep[] = [
    { id: 0, question: 'Just 7 quick questions before we begin', type: 'info' },
    { id: 1, question: "What's your kid's name?", type: 'text', placeholder: 'Enter name' },
    { id: 2, question: "How old is your kid?", type: 'age' },
    { id: 3, question: 'What language do you speak at home?', type: 'text', placeholder: 'Enter language' },
    { id: 4, question: 'What language would you like to learn?', type: 'text', placeholder: 'Enter language' },
    { id: 5, question: 'Create a username', type: 'text', placeholder: 'Enter username' },
    { id: 6, question: 'Create a password', type: 'text', placeholder: 'Enter password' },
  ];

  useEffect(() => {
    // Animate speech bubble
    Animated.parallel([
      Animated.timing(speechBubbleFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(speechBubbleSlide, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate character
    Animated.loop(
      Animated.sequence([
        Animated.timing(characterBounce, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(characterBounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate input when it appears
    if (currentStep > 0) {
      Animated.timing(inputFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 0) {
      // First step - just info, move to next
      goToNextStep();
    } else if (currentStep === 1 && !kidName.trim()) {
      // Need name
      return;
    } else if (currentStep === 2 && !selectedAge) {
      // Need age
      return;
    } else if (currentStep < TOTAL_STEPS - 1) {
      goToNextStep();
    } else {
      // Last step - complete onboarding
      handleComplete();
    }
  };

  const goToNextStep = () => {
    Animated.parallel([
      Animated.timing(speechBubbleFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(inputFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(currentStep + 1);
      speechBubbleSlide.setValue(30);
      speechBubbleFade.setValue(0);
      inputFade.setValue(0);
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(speechBubbleFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(inputFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        speechBubbleSlide.setValue(30);
        speechBubbleFade.setValue(0);
        inputFade.setValue(0);
      });
    } else {
      navigation.goBack();
    }
  };

  const handleComplete = () => {
    // Navigate to Register screen with collected data
    navigation.navigate('Register', {
      kidName,
      age: selectedAge,
      skipOnboarding: false,
    });
  };

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const currentStepData = steps[currentStep];
  const styles = getStyles(responsive);

  const speechBubbleAnimatedStyle = {
    opacity: speechBubbleFade,
    transform: [
      {
        translateY: speechBubbleSlide,
      },
    ],
  };

  const characterAnimatedStyle = {
    transform: [
      {
        translateY: characterBounce.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -responsive.hp(1)],
        }),
      },
    ],
  };

  const inputAnimatedStyle = {
    opacity: inputFade,
    transform: [
      {
        translateY: inputFade.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  const ageOptions = ['0-1', '2', '3', '4', '5', '6+'];

  return (
    <LinearGradient colors={['#5c4cf5', '#6642ff']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Back Button */}
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={responsive.wp(7)} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Speech Bubble */}
          <Animated.View style={[styles.speechBubbleContainer, speechBubbleAnimatedStyle]}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechBubbleText}>{currentStepData.question}</Text>
            </View>
            {/* Speech bubble tail pointing down */}
            <View style={styles.speechBubbleTail} />
          </Animated.View>

          {/* Character and Speech Bubble */}
          <View style={styles.characterSection}>
            {/* Character in hole */}
            <Animated.View style={[styles.characterWrapper, characterAnimatedStyle]}>
              <View style={styles.holeContainer}>
                <View style={styles.hole} />
                <View style={styles.characterContainer}>
                  <Image
                    source={require('../../assets/WhatsApp Image 2025-11-24 at 13.27.32_fab0ab7b.jpg')}
                    resizeMode="contain"
                    style={styles.character}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Input Section */}
          {currentStep > 0 && (
            <Animated.View style={[styles.inputSection, inputAnimatedStyle]}>
              {currentStep === 1 && (
                <View>
                  {kidName ? (
                    <View style={styles.displayContainer}>
                      <Text style={styles.displayText}>{kidName}</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.textInput}
                      placeholder={currentStepData.placeholder}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={kidName}
                      onChangeText={setKidName}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleNext}
                    />
                  )}
                </View>
              )}

              {currentStep === 2 && (
                <View style={styles.ageContainer}>
                  <Text style={styles.ageHelperText}>
                    We tailor the content based on your kid's age
                  </Text>
                  <View style={styles.ageGrid}>
                    {ageOptions.map((age) => (
                      <TouchableOpacity
                        key={age}
                        style={[
                          styles.ageButton,
                          selectedAge === age && styles.ageButtonSelected,
                        ]}
                        onPress={() => setSelectedAge(age)}
                      >
                        <Text
                          style={[
                            styles.ageButtonText,
                            selectedAge === age && styles.ageButtonTextSelected,
                          ]}
                        >
                          {age}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {currentStep > 2 && currentStepData.type === 'text' && (
                <TextInput
                  style={styles.textInput}
                  placeholder={currentStepData.placeholder}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  secureTextEntry={currentStep === 6}
                />
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              ((currentStep === 1 && !kidName.trim()) ||
                (currentStep === 2 && !selectedAge)) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={
              (currentStep === 1 && !kidName.trim()) || (currentStep === 2 && !selectedAge)
            }
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    backButton: {
      position: 'absolute',
      top: responsive.hp(5),
      left: responsive.wp(5),
      zIndex: 10,
      width: responsive.wp(12),
      height: responsive.wp(12),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: responsive.wp(6),
    },
    progressContainer: {
      paddingHorizontal: responsive.wp(5),
      paddingTop: responsive.hp(6),
      paddingBottom: responsive.hp(2),
    },
    progressBarBackground: {
      height: responsive.hp(0.5),
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: responsive.wp(1),
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#47C268',
      borderRadius: responsive.wp(1),
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: responsive.wp(5),
    },
    characterSection: {
      marginTop: responsive.hp(2),
      marginBottom: responsive.hp(3),
      alignItems: 'center',
    },
    characterWrapper: {
      alignItems: 'center',
      marginBottom: responsive.hp(1),
    },
    holeContainer: {
      position: 'relative',
      width: responsive.wp(50),
      height: responsive.wp(45),
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    hole: {
      position: 'absolute',
      bottom: 0,
      width: responsive.wp(38),
      height: responsive.wp(30),
      borderRadius: responsive.wp(19),
      backgroundColor: '#3d2cc5',
      borderWidth: responsive.wp(0.5),
      borderColor: '#2a1f9a',
    },
    characterContainer: {
      position: 'absolute',
      bottom: responsive.wp(-3),
      width: responsive.wp(38),
      height: responsive.wp(38),
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    character: {
      width: '100%',
      height: '100%',
    },
    speechBubbleContainer: {
      marginLeft: responsive.wp(5),
      marginTop: responsive.hp(1),
      alignItems: 'center',
    },
    speechBubble: {
      backgroundColor: '#FFFFFF',
      borderRadius: responsive.wp(6),
      paddingVertical: responsive.hp(2),
      paddingHorizontal: responsive.wp(5),
      maxWidth: responsive.wp(75),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.5) },
      shadowOpacity: 0.2,
      shadowRadius: responsive.wp(2),
      elevation: 5,
      position: 'relative',
    },
    speechBubbleTail: {
      position: 'absolute',
      bottom: responsive.hp(-1),
      left: responsive.wp(8),
      width: 0,
      height: 0,
      borderLeftWidth: responsive.wp(3),
      borderRightWidth: responsive.wp(3),
      borderTopWidth: responsive.hp(1.5),
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#FFFFFF',
    },
    speechBubbleText: {
      fontSize: responsive.wp(4.2),
      fontWeight: '600',
      color: '#2C3E50',
      lineHeight: responsive.wp(5.5),
      textAlign: 'center',
    },
    inputSection: {
      marginTop: responsive.hp(2),
      marginBottom: responsive.hp(4),
    },
    textInput: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: responsive.wp(4),
      paddingVertical: responsive.hp(2),
      paddingHorizontal: responsive.wp(5),
      fontSize: responsive.wp(4.5),
      color: '#FFFFFF',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    displayContainer: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: responsive.wp(4),
      paddingVertical: responsive.hp(2.5),
      paddingHorizontal: responsive.wp(5),
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    displayText: {
      fontSize: responsive.wp(6),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    ageContainer: {
      marginTop: responsive.hp(2),
    },
    ageHelperText: {
      fontSize: responsive.wp(4),
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginBottom: responsive.hp(3),
    },
    ageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: responsive.wp(2),
    },
    ageButton: {
      width: responsive.wp(28),
      paddingVertical: responsive.hp(2),
      borderRadius: responsive.wp(4),
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: responsive.hp(1.5),
    },
    ageButtonSelected: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
    },
    ageButtonText: {
      fontSize: responsive.wp(5),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    ageButtonTextSelected: {
      color: '#5c4cf5',
    },
    buttonContainer: {
      paddingHorizontal: responsive.wp(5),
      paddingBottom: responsive.hp(3),
      paddingTop: responsive.hp(2),
    },
    continueButton: {
      backgroundColor: '#47C268',
      borderRadius: responsive.wp(4),
      paddingVertical: responsive.hp(2.2),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.5) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(2),
      elevation: 5,
    },
    continueButtonDisabled: {
      opacity: 0.5,
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: responsive.wp(5),
      fontWeight: '700',
    },
  });

export default OnboardingScreen;

