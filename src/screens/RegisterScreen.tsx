import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useUser } from '../context/UserContext';
import { getTranslation, Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';
import { Video,ResizeMode } from 'expo-av';


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
  const nameInputRef = useRef<TextInput | null>(null);
  const [nameInputVisible, setNameInputVisible] = useState(false);

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
      key: 'name',
      question: getTranslation(currentLanguage, 'whatIsYourName'),
      placeholder: getTranslation(currentLanguage, 'enterYourFullName'),
      keyboardType: 'default',
    },
    {
      key: 'age',
      question: getTranslation(currentLanguage, 'whatIsYourAge'),
      placeholder: getTranslation(currentLanguage, 'enterYourAge'),
      keyboardType: 'numeric',
    },
    {
      key: 'email',
      question: getTranslation(currentLanguage, 'whatIsYourEmail'),
      placeholder: getTranslation(currentLanguage, 'enterYourEmail'),
      keyboardType: 'email-address',
    },
    {
      key: 'username',
      question: getTranslation(currentLanguage, 'createAccount'),
      subquestion: getTranslation(currentLanguage, 'username'),
      placeholder: getTranslation(currentLanguage, 'chooseUsername'),
      keyboardType: 'default',
    },
    {
      key: 'password',
      question: getTranslation(currentLanguage, 'createAccount'),
      subquestion: getTranslation(currentLanguage, 'password'),
      placeholder: getTranslation(currentLanguage, 'choosePassword'),
      keyboardType: 'default',
      secure: true,
    },
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

  const currentQuestion = questions[currentStep];
  const styles = getStyles(responsive);

  return (
    <View style={styles.backgroundContainer}>
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
      {currentQuestion.key === 'name' && (
        <Image
          source={
            userData.name && userData.name.length > 0
              ? require('../../assets/type.gif')
              : require('../../assets/phonesee.gif')
          }
          style={styles.topRightGif}
          resizeMode="contain"
        />
      )}
    
        {/* Question */}
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
                  styles.languageButton,
                  userData[currentQuestion.key as keyof UserData] === option &&
                  styles.languageButtonSelected,
                ]}
                onPress={() => handleLanguageSelect(option)}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    userData[currentQuestion.key as keyof UserData] === option &&
                    styles.languageButtonTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            {currentQuestion.key === 'name' ? (
              // For name step: no visible input initially. Tap to show and focus.
              <TouchableOpacity
                activeOpacity={1}
                style={styles.nameTapArea}
                onPress={() => {
                  setNameInputVisible(true);
                  setTimeout(() => nameInputRef.current?.focus(), 50);
                }}
              >
                {!nameInputVisible && (
                  <Text style={styles.namePlaceholder}>Tap to enter your first name</Text>
                )}

                {nameInputVisible && (
                  <TextInput
                    ref={(r) => { nameInputRef.current = r; }}
                    style={[styles.inputCentered]}
                    value={userData.name}
                    onChangeText={(text) => setUserData({ ...userData, name: text })}
                    placeholder={currentQuestion.placeholder}
                    placeholderTextColor="#999"
                    keyboardType={currentQuestion.keyboardType as any}
                    autoCapitalize="words"
                  />
                )}
              </TouchableOpacity>
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
          </View>
        )}
      </Animated.View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.backButton, isLoading && styles.buttonDisabled]} 
          onPress={handleBack}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>{getTranslation(currentLanguage, 'back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.nextButton, isLoading && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === questions.length - 1 ? getTranslation(currentLanguage, 'complete') : getTranslation(currentLanguage, 'next')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </BlurView>
</View>

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
    paddingTop: responsive.hp(10),
    paddingHorizontal: responsive.wp(8),
    position: 'relative',
  },
  progressContainer: {
    marginBottom: responsive.hp(3.5),
  },
  progressText: {
    fontSize: responsive.wp(3.7),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsive.hp(1.2),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
  },
  progressBar: {
    height: responsive.hp(0.5),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: responsive.wp(0.5),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: responsive.wp(0.5),
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: responsive.wp(5),
    padding: responsive.wp(8),
    marginBottom: responsive.hp(3.5),
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
  // Centered input shown after tapping the screen for name entry
  nameTapArea: {
    width: '100%',
    height: responsive.hp(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  namePlaceholder: {
    fontSize: responsive.wp(4.6),
    color: '#666',
  },
  inputCentered: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4),
    fontSize: responsive.wp(5),
    color: '#2C3E50',
    width: '80%',
    textAlign: 'center',
  },
  topRightGif: {
    position: 'absolute',
    top: responsive.hp(2),
    right: responsive.wp(4),
    width: responsive.wp(18),
    height: responsive.wp(18),
    zIndex: 20,
  },
  languageContainer: {
    marginTop: responsive.hp(2.5),
  },
  languageButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4),
    marginBottom: responsive.hp(1.2),
    alignItems: 'center',
  },
  languageButtonSelected: {
    backgroundColor: '#43BCCD',
    borderColor: '#43BCCD',
  },
  languageButtonText: {
    fontSize: responsive.wp(4.2),
    color: '#2C3E50',
    fontWeight: '500',
  },
  languageButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.wp(2.5),
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4.2),
    alignItems: 'center',
    flex: 1,
    marginRight: responsive.wp(2.5),
  },
  backButtonText: {
    color: '#2C3E50',
    fontSize: responsive.wp(4.2),
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#43BCCD',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4.2),
    alignItems: 'center',
    flex: 1,
    marginLeft: responsive.wp(2.5),
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.wp(4.2),
    fontWeight: 'bold',
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
});


export default RegisterScreen;
