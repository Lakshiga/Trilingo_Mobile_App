import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useUser } from '../context/UserContext';
import { getTranslation, Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';
import { Video,ResizeMode } from 'expo-av';

// Age options for adult selection
const ADULT_AGE_OPTIONS = ['0-1', '2', '3', '4', '5', '6+'];

type RegisterScreenProps = {
  onRegisterComplete: (userData: any) => void;
  onBack: () => void;
};

interface UserData {
  name: string;
  age: string;
  email: string;
  username: string;
  password: string;
  nativeLanguage: string;
  learningLanguage: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterComplete, onBack }) => {
  const { currentUser } = useUser();
  const responsive = useResponsive();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    age: '',
    email: '',
    username: '',
    password: '',
    nativeLanguage: '',
    learningLanguage: '',
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  

  // Get current language - use selected native language if available, otherwise default to English
  const getCurrentLanguage = (): Language => {
    if (userData.nativeLanguage) {
      return userData.nativeLanguage as Language;
    }
    return (currentUser?.nativeLanguage as Language) || 'English';
  };

  const currentLanguage = getCurrentLanguage();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push(getTranslation(currentLanguage, 'passwordMinLength'));
    }
    if (!/[A-Z]/.test(password)) {
      errors.push(getTranslation(currentLanguage, 'passwordUppercase'));
    }
    if (!/[a-z]/.test(password)) {
      errors.push(getTranslation(currentLanguage, 'passwordLowercase'));
    }
    if (!/[0-9]/.test(password)) {
      errors.push(getTranslation(currentLanguage, 'passwordNumber'));
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push(getTranslation(currentLanguage, 'passwordSpecialChar'));
    }
    return errors;
  };

  const questions = React.useMemo(() => [
    {
      key: 'nativeLanguage',
      question: getTranslation(currentLanguage, 'whatIsYourNativeLanguage'),
      placeholder: '',
      keyboardType: 'default',
      isLanguageSelection: true,
      options: ['English', 'Tamil', 'Sinhala'],
    },
    {
      key: 'learningLanguage',
      question: getTranslation(currentLanguage, 'whichLanguageToLearn'),
      placeholder: '',
      keyboardType: 'default',
      isLanguageSelection: true,
      options: ['Tamil', 'Sinhala', 'English'],
    },
    {
      key: 'name',
      question: getTranslation(currentLanguage, 'whatIsYourName'),
      placeholder: getTranslation('English', 'enterYourFullName'),
      keyboardType: 'default',
    },
    {
      key: 'age',
      question: getTranslation(currentLanguage, 'whatIsYourAge'),
      placeholder: getTranslation('English', 'enterYourAge'),
      keyboardType: 'numeric',
    },
    {
      key: 'email',
      question: getTranslation(currentLanguage, 'whatIsYourEmail'),
      placeholder: getTranslation('English', 'enterYourEmail'),
      keyboardType: 'email-address',
    },
    {
      key: 'username',
      question: getTranslation(currentLanguage, 'createAccount'),
      subquestion: getTranslation(currentLanguage, 'username'),
      placeholder: getTranslation('English', 'chooseUsername'),
      keyboardType: 'default',
    },
    {
      key: 'password',
      question: getTranslation(currentLanguage, 'createAccount'),
      subquestion: getTranslation(currentLanguage, 'password'),
      placeholder: getTranslation('English', 'choosePassword'),
      keyboardType: 'default',
      secure: true,
    },
  ], [currentLanguage]);

  useEffect(() => {
    // Fade in animation for each question
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep, fadeAnim]);

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    // Validation
    if (!userData[currentQuestion.key as keyof UserData]) {
      Alert.alert(getTranslation(currentLanguage, 'error'), getTranslation(currentLanguage, 'pleaseAnswer'));
      return;
    }

    // Password validation
    if (currentQuestion.key === 'password') {
      const errors = validatePassword(userData.password);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        Alert.alert(getTranslation(currentLanguage, 'error'), getTranslation(currentLanguage, 'pleaseAnswer'));
        return;
      }
    }

    // Check if it's the last question
    if (currentStep === questions.length - 1) {
      handleRegisterComplete();
    } else {
      // Fade out and move to next question
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        fadeAnim.setValue(0);
      });
    }
  };

  const handleRegisterComplete = async () => {
    setIsLoading(true);
    
    try {
      // Register user with backend
      await onRegisterComplete({
        ...userData,
        isAdmin: false,
        isGuest: false,
      });
      
      // Show success message - if we get here, registration succeeded
      Alert.alert(
        'Registration Successful!',
        'Your account has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigation handled by parent component
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Don't show error if it's actually a success message
      if (error.message && (
        error.message.includes('successful') || 
        error.message.includes('Login successful') ||
        error.message.includes('Registration successful')
      )) {
        // This is actually a success, show success message instead
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation handled by parent component
              },
            },
          ]
        );
      } else {
        // Genuine error - show error message
        Alert.alert(
          'Registration Failed',
          error.message || 'Failed to create account. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        fadeAnim.setValue(0);
      });
    } else {
      onBack();
    }
  };

  const handleLanguageSelect = (language: string) => {
    setUserData({
      ...userData,
      [questions[currentStep].key]: language,
    });
  };

  const handleAgeSelect = (age: string) => {
    setUserData({
      ...userData,
      age: age,
    });
  };

  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length;
  const progress = (currentStep + 1) / totalSteps;
  const styles = getStyles(responsive);
  const isPurpleScreen = currentQuestion.key === 'name' || currentQuestion.key === 'age' || currentQuestion.key === 'email' || currentQuestion.key === 'nativeLanguage' || currentQuestion.key === 'learningLanguage' || currentQuestion.key === 'username' || currentQuestion.key === 'password';
  const showTopBarAndGif = true; // Show on all screens

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backgroundContainer}>
      <Video
        source={require('../../assets/register.mp4')}
        style={StyleSheet.absoluteFill}
        shouldPlay
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
      />

      <BlurView intensity={40} style={styles.blurContainer}>
        <View style={styles.container}>
          {/* Top Navigation Bar: Shown on All Screens */}
          {showTopBarAndGif && (
            <View style={styles.purpleTopBar}>
              <TouchableOpacity onPress={handleBack} style={styles.purpleBackButton}>
                <MaterialCommunityIcons name="chevron-left" size={responsive.wp(10)} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.purpleProgressBarWrapper}>
                <View style={styles.purpleProgressBar}>
                  <Animated.View
                    style={[
                      styles.purpleProgressFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Character + Speech Bubble: Shown on All Screens */}
          {showTopBarAndGif && (
            <View style={styles.purpleCharacterBubbleRow}>
              <Image
                source={
                  (currentQuestion.key === 'name' && userData.name && userData.name.length > 0) ||
                  (currentQuestion.key === 'age' && userData.age && userData.age.length > 0) ||
                  (currentQuestion.key === 'email' && userData.email && userData.email.length > 0)||
                  (currentQuestion.key === 'nativeLanguage' && userData.nativeLanguage && userData.nativeLanguage.length > 0) ||
                  (currentQuestion.key === 'learningLanguage' && userData.learningLanguage && userData.learningLanguage.length > 0) ||
                  (currentQuestion.key === 'username' && userData.username && userData.username.length > 0) ||
                  (currentQuestion.key === 'password' && userData.password && userData.password.length > 0) ?
                    require('../../assets/type.gif')
                    : require('../../assets/phonesee.gif')
                }
                style={styles.purpleCharacterImage}
                resizeMode="contain"
              />
              <View style={styles.purpleSpeechBubble}>
                <Text style={styles.purpleSpeechBubbleText}>{currentQuestion.question}</Text>
              </View>
            </View>
          )}

          {/* NAME Screen: Purple Design with Auto-focused Input */}
          {currentQuestion.key === 'name' && (
            <View style={styles.purpleInputContainer}>
              <TextInput
                autoFocus={true}
                style={styles.purpleNameInput}
                value={userData.name}
                onChangeText={(text) => setUserData({ ...userData, name: text })}
                placeholder={currentQuestion.placeholder}
                placeholderTextColor="rgba(173, 197, 216, 0.62)"
                keyboardType={currentQuestion.keyboardType as any}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* EMAIL Screen: Purple Design with Auto-focused Input */}
          {currentQuestion.key === 'email' && (
            <View style={styles.purpleInputContainer}>
              <TextInput
                autoFocus={true}
                style={styles.purpleNameInput}
                value={userData.email}
                onChangeText={(text) => setUserData({ ...userData, email: text })}
                placeholder={currentQuestion.placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType={currentQuestion.keyboardType as any}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* AGE Screen: Purple Design with Grid Selection */}
          {currentQuestion.key === 'age' && (
            <View style={styles.purpleAgeContainer}>
              <View style={styles.ageGridContainer}>
                {ADULT_AGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.ageButton,
                      userData.age === option && styles.ageButtonSelected,
                    ]}
                    onPress={() => handleAgeSelect(option)}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        userData.age === option && styles.ageButtonTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
             
          )}

          {/* LANGUAGE SELECTION Screens: Grid Layout with Top Bar */}
          {(currentQuestion.key === 'nativeLanguage' || currentQuestion.key === 'learningLanguage') && (
            <View style={styles.purpleAgeContainer}>
              <View style={styles.ageGridContainer}>
                {currentQuestion.options?.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.ageButton,
                      userData[currentQuestion.key as keyof UserData] === option &&
                      styles.ageButtonSelected,
                    ]}
                    onPress={() => handleLanguageSelect(option)}
                  >
                    <Text
                      style={[
                        styles.ageButtonText,
                        userData[currentQuestion.key as keyof UserData] === option &&
                        styles.ageButtonTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* USERNAME Screen: Purple Design with Auto-focused Input */}
          {currentQuestion.key === 'username' && (
            <View style={styles.purpleInputContainer}>
              <TextInput
                autoFocus={true}
                style={styles.purpleNameInput}
                value={userData.username}
                onChangeText={(text) => setUserData({ ...userData, username: text })}
                placeholder={currentQuestion.placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType={currentQuestion.keyboardType as any}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* PASSWORD Screen: Purple Design with Auto-focused Input */}
          {currentQuestion.key === 'password' && (
            <View style={styles.purpleInputContainer}>
              <TextInput
                autoFocus={true}
                style={styles.purpleNameInput}
                value={userData.password}
                onChangeText={(text) => {
                  setUserData({ ...userData, password: text });
                  const errors = validatePassword(text);
                  setPasswordErrors(errors);
                }}
                placeholder={currentQuestion.placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType={currentQuestion.keyboardType as any}
                autoCapitalize="none"
                secureTextEntry={true}
              />
              {passwordErrors.length > 0 && (
                <View style={styles.purpleErrorContainer}>
                  {passwordErrors.map((error, index) => (
                    <Text key={index} style={styles.purpleErrorText}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          {currentQuestion.key !== 'name' && currentQuestion.key !== 'age' && currentQuestion.key !== 'email' && currentQuestion.key !== 'nativeLanguage' && currentQuestion.key !== 'learningLanguage' && currentQuestion.key !== 'username' && currentQuestion.key !== 'password' && (
            <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
              <Text style={styles.question}>{currentQuestion.question}</Text>
              {currentQuestion.subquestion && (
                <Text style={styles.subquestion}>{currentQuestion.subquestion}</Text>
              )}

              {/* Input or Language Selection */}
              {currentQuestion.isLanguageSelection ? (
                <View style={styles.languageContainer}>
                  {currentQuestion.options?.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.ageButton,
                        userData[currentQuestion.key as keyof UserData] === option &&
                        styles.ageButtonSelected,
                      ]}
                      onPress={() => handleLanguageSelect(option)}
                    >
                      <Text
                        style={[
                          styles.ageButtonText,
                          userData[currentQuestion.key as keyof UserData] === option &&
                          styles.ageButtonTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      currentQuestion.key === 'password' && passwordErrors.length > 0 && styles.inputError
                    ]}
                    value={userData[currentQuestion.key as keyof UserData]}
                    onChangeText={(text) => {
                      setUserData({
                        ...userData,
                        [currentQuestion.key]: text,
                      });
                      if (currentQuestion.key === 'password') {
                        const errors = validatePassword(text);
                        setPasswordErrors(errors);
                      }
                    }}
                    placeholder={currentQuestion.placeholder}
                    placeholderTextColor="#999"
                    keyboardType={currentQuestion.keyboardType as any}
                    secureTextEntry={currentQuestion.secure}
                    autoCapitalize="none"
                  />
                  {currentQuestion.key === 'password' && passwordErrors.length > 0 && (
                    <View style={styles.errorContainer}>
                      {passwordErrors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>
                          • {error}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          )}

          {/* Navigation Buttons */}
          <View style={[styles.buttonContainer, isPurpleScreen && styles.purpleButtonContainer]}>
            {/* Back Button (Hidden on Purple Screens, shown on others) */}
            {!isPurpleScreen && (
              <TouchableOpacity 
                style={[styles.backButton, isLoading && styles.buttonDisabled]} 
                onPress={handleBack}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>{getTranslation(currentLanguage, 'back')}</Text>
              </TouchableOpacity>
            )}

            {/* Continue/Next Button */}
            <TouchableOpacity 
              style={[
                styles.nextButton,
                isPurpleScreen && styles.nextButtonFullWidth,
                isPurpleScreen && styles.purpleNextButton,
                isLoading && styles.buttonDisabled
              ]} 
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.nextButtonText, isPurpleScreen && styles.purpleNextButtonText]}>
                  {isPurpleScreen ? getTranslation(currentLanguage, 'continue') : (currentStep === questions.length - 1 ? getTranslation(currentLanguage, 'complete') : getTranslation(currentLanguage, 'next'))}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </KeyboardAvoidingView>

  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    width: responsive.width,
    height: responsive.height,
    overflow: 'hidden',
    position: 'relative',
  },
  blurContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    paddingTop: responsive.hp(2),
    paddingHorizontal: responsive.wp(6),
    position: 'relative',
    justifyContent: 'space-between',
  },
  
  // ===== PURPLE THEME: TOP BAR =====
  purpleTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive.hp(2),
    paddingVertical: responsive.hp(1),
  },
  purpleBackButton: {
    padding: responsive.wp(2),
    marginRight: responsive.wp(3),
  },
  purpleProgressBarWrapper: {
    flex: 1,
  },
  purpleProgressBar: {
    height: responsive.hp(1),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: responsive.wp(1.5),
    overflow: 'hidden',
  },
  purpleProgressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: responsive.wp(1.5),
  },
  // ===== PURPLE THEME: CHARACTER + BUBBLE =====
  purpleCharacterBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsive.hp(3),
    marginTop: responsive.hp(1),
  },
  purpleCharacterImage: {
    width: responsive.wp(28),
    height: responsive.wp(28),
    marginRight: responsive.wp(2),
    flexShrink: 0,
  },
  purpleSpeechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: responsive.wp(5),
    padding: responsive.wp(4),
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  purpleSpeechBubbleText: {
    fontSize: responsive.wp(4.2),
    fontWeight: '700',
    color: '#0062ffff',
    textAlign: 'center',
  },
  // ===== PURPLE THEME: NAME INPUT =====
  purpleInputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purpleNameInput: {
    fontSize: responsive.wp(8.5),
    color: '#0a0ab8ff',
    textAlign: 'center',
    fontWeight: '700',
    paddingHorizontal: responsive.wp(4),
    paddingVertical: responsive.hp(1),
  },
  // ===== PURPLE THEME: AGE GRID =====
  purpleAgeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: responsive.wp(3),
    marginBottom: responsive.hp(3),
    paddingHorizontal: responsive.wp(2),
  },
  ageButton: {
    width: '30%',
    paddingVertical: responsive.hp(2),
    paddingHorizontal: responsive.wp(3),
    backgroundColor: 'rgba(46, 126, 192, 0.78)',
    borderWidth: 2,
    borderColor: 'rgba(29, 175, 223, 0.3)',
    borderRadius: responsive.wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageButtonSelected: {
    backgroundColor: 'rgba(102, 164, 206, 0.6)',
    borderColor: '#ffffffff',
    borderWidth: 3,
  },
  ageButtonText: {
    fontSize: responsive.wp(4.5),
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
  },
  ageButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // ===== STANDARD QUESTION CONTAINER (Non-Purple) =====
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: responsive.wp(5),
    padding: responsive.wp(8),
    marginBottom: responsive.hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(1.2) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(5),
    elevation: 10,
  },
  question: {
    fontSize: responsive.wp(6.4),
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: responsive.hp(1.2),
    textAlign: 'center',
  },
  subquestion: {
    fontSize: responsive.wp(4.8),
    fontWeight: '600',
    color: '#43BCCD',
    marginBottom: responsive.hp(2.5),
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4),
    fontSize: responsive.wp(4.2),
    color: '#2C3E50',
    marginTop: responsive.hp(1.2),
  },
  languageContainer: {
    marginTop: responsive.hp(2.5),
  },
  
  // ===== BUTTON STYLES =====
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: responsive.wp(2),
    paddingBottom: responsive.hp(2),
    gap: responsive.wp(2),
  },
  purpleButtonContainer: {
    backgroundColor: 'transparent',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4.2),
    alignItems: 'center',
    flex: 1,
  },
  backButtonText: {
    color: '#2C3E50',
    fontSize: responsive.wp(4.2),
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4),
    alignItems: 'center',
    flex: 1,
  },
  purpleNextButton: {
    backgroundColor: '#2196F3',
    paddingVertical: responsive.hp(2),
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.wp(5),
    fontWeight: 'bold',
  },
  purpleNextButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.wp(5.2),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorContainer: {
    marginTop: responsive.hp(1),
    padding: responsive.wp(2),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: responsive.wp(2),
  },
  errorText: {
    color: '#EF4444',
    fontSize: responsive.wp(3.2),
    marginBottom: responsive.hp(0.5),
  },
  // ===== PURPLE THEME: ERROR STYLES =====
  purpleErrorContainer: {
    marginTop: responsive.hp(1.5),
    padding: responsive.wp(3),
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderRadius: responsive.wp(2),
  },
  purpleErrorText: {
    color: '#FF6B6B',
    fontSize: responsive.wp(3),
    marginBottom: responsive.hp(0.4),
  },
});


export default RegisterScreen;
