import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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

  const questions = [
    {
      key: 'name',
      question: 'What is your name?',
      placeholder: 'Enter your full name',
      keyboardType: 'default',
    },
    {
      key: 'age',
      question: 'What is your age?',
      placeholder: 'Enter your age',
      keyboardType: 'numeric',
    },
    {
      key: 'email',
      question: 'What is your email address?',
      placeholder: 'Enter your email',
      keyboardType: 'email-address',
    },
    {
      key: 'username',
      question: 'Create an account — please enter:',
      subquestion: 'Username',
      placeholder: 'Choose a username',
      keyboardType: 'default',
    },
    {
      key: 'password',
      question: 'Create an account — please enter:',
      subquestion: 'Password',
      placeholder: 'Choose a password',
      keyboardType: 'default',
      secure: true,
    },
    {
      key: 'nativeLanguage',
      question: 'What is your native language?',
      placeholder: '',
      keyboardType: 'default',
      isLanguageSelection: true,
      options: ['English', 'Tamil', 'Sinhala'],
    },
    {
      key: 'learningLanguage',
      question: 'Which language would you like to learn?',
      placeholder: '',
      keyboardType: 'default',
      isLanguageSelection: true,
      options: ['Tamil', 'Sinhala', 'English'],
    },
  ];

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
      Alert.alert('Error', 'Please answer the question');
      return;
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

  return (
    <ImageBackground
      source={require('../../assets/BDnamed.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <BlurView intensity={40} style={styles.blurContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Step {currentStep + 1} of {questions.length}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${((currentStep + 1) / questions.length) * 100}%` }
                    ]} 
                  />
                </View>
              </View>

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
                  <TextInput
                    style={styles.input}
                    value={userData[currentQuestion.key as keyof UserData]}
                    onChangeText={(text) =>
                      setUserData({
                        ...userData,
                        [currentQuestion.key]: text,
                      })
                    }
                    placeholder={currentQuestion.placeholder}
                    placeholderTextColor="#999"
                    keyboardType={currentQuestion.keyboardType as any}
                    secureTextEntry={currentQuestion.secure}
                    autoCapitalize="none"
                  />
                )}
              </Animated.View>

              {/* Navigation Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.backButton, isLoading && styles.buttonDisabled]} 
                  onPress={handleBack}
                  disabled={isLoading}
                >
                  <Text style={styles.backButtonText}>Back</Text>
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
                      {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subquestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#43BCCD',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
    marginTop: 10,
  },
  languageContainer: {
    marginTop: 20,
  },
  languageButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  languageButtonSelected: {
    backgroundColor: '#43BCCD',
    borderColor: '#43BCCD',
  },
  languageButtonText: {
    fontSize: 16,
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
    paddingHorizontal: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#43BCCD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default RegisterScreen;
