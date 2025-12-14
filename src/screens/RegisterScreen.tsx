import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTranslation, Language } from '../utils/translations'; // Ensure this path is correct
import { useResponsive } from '../utils/responsive';

// Age options
const ADULT_AGE_OPTIONS = ['2-5', '6-8', '9-11', '12-14', '15+'];
const UNLOCKED_AGE_GROUP = '2-5'; // Only this age group is unlocked

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

// Validation Item Component - Shows validation and hides when valid
const ValidationItem: React.FC<{ label: string; isValid: boolean }> = ({ label, isValid }) => {
  if (isValid) return null; // Hide when valid (one by one hide)
  
  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '500' }}>• {label}</Text>
    </View>
  );
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterComplete, onBack }) => {
  const responsive = useResponsive();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '', age: '', email: '', username: '', password: '', nativeLanguage: '', learningLanguage: '',
  });

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Lottie Animation Refs
  const womanWorkRef = useRef<LottieView>(null);
  const lottieOpacity = useRef(new Animated.Value(0)).current; // Initially Hidden

  const [passwordValidations, setPasswordValidations] = useState<{
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  }>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [emailError, setEmailError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // --- FIX 2: DYNAMIC LANGUAGE LOGIC ---
  // If user selects Tamil in Step 0, 'activeLanguage' becomes 'Tamil' immediately.
  const activeLanguage = (userData.nativeLanguage as Language) || 'English';

  // --- QUESTIONS ARRAY (Updates when activeLanguage changes) ---
  const questions = useMemo(() => [
    { 
      key: 'nativeLanguage', 
      // Step 0 is always in English or default, or you can translate it too
      question: getTranslation('English', 'whatIsYourNativeLanguage'), 
      isLanguageSelection: true, 
      options: ['English', 'Tamil', 'Sinhala'], 
      icon: 'translate' 
    },
    { 
      key: 'learningLanguage', 
      // From Step 1 onwards, use 'activeLanguage'
      question: getTranslation(activeLanguage, 'whichLanguageToLearn'), 
      isLanguageSelection: true, 
      options: ['Tamil', 'Sinhala', 'English'], 
      icon: 'school' 
    },
    { 
      key: 'name', 
      question: getTranslation(activeLanguage, 'whatIsYourName'), 
      placeholder: getTranslation('English', 'enterYourFullName'), 
      icon: 'account' 
    },
    { 
      key: 'age', 
      question: getTranslation(activeLanguage, 'whatIsYourAge'), 
      isAgeSelection: true, 
      icon: 'cake-variant' 
    },
    { 
      key: 'email', 
      question: getTranslation(activeLanguage, 'whatIsYourEmail'), 
      placeholder: "name@example.com", 
      keyboardType: 'email-address', 
      icon: 'email' 
    },
    { 
      key: 'username', 
      question: getTranslation(activeLanguage, 'createAccount') + " - Username", // Adjust key if needed
      placeholder: "cool_user123", 
      icon: 'at' 
    },
    { 
      key: 'password', 
      question: getTranslation(activeLanguage, 'createAccount') + " - Password", // Adjust key if needed
      placeholder: "••••••••", 
      secure: true, 
      icon: 'lock' 
    },
  ], [activeLanguage]); 

  // --- VALIDATIONS ---
  const checkPasswordValidations = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const checkEmailValidation = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isPasswordValid = (validations: typeof passwordValidations) => {
    return validations.minLength && 
           validations.hasUppercase && 
           validations.hasLowercase && 
           validations.hasNumber && 
           validations.hasSpecialChar;
  };

  // --- KEYBOARD LISTENERS ---
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // --- STEP TRANSITION ANIMATION ---
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.95);
    // Reset password visibility when step changes
    setShowPassword(false);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [currentStep]);

  // --- FIX 1: ANIMATION CONTROL LOGIC ---
  const currentQ = questions[currentStep];
  // Check if the current field has data
  const hasData = !!userData[currentQ.key as keyof UserData];

  useEffect(() => {
    // Reset animation state when step changes - keep it hidden
    lottieOpacity.setValue(0);
    if (womanWorkRef.current) {
      womanWorkRef.current.pause();
      womanWorkRef.current.reset();
    }
    // Reset validations when step changes
    setPasswordValidations({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });
    setEmailError('');
  }, [currentStep]);

  // --- HANDLERS ---
  const handleNext = () => {
    // Hide keyboard when continue is clicked
    Keyboard.dismiss();

    if (!hasData) {
      Alert.alert("Required", "Please fill in the details to proceed.");
      Keyboard.dismiss(); // Hide keyboard on error
      return;
    }

    // Validate email and password on continue click
    let hasValidationErrors = false;

    if (currentQ.key === 'email') {
      const isValid = checkEmailValidation(userData.email);
      if (!isValid) { 
        setEmailError('Invalid Email');
        Keyboard.dismiss();
        hasValidationErrors = true;
      } else {
        setEmailError('');
        // Show animation only on continue click when email is valid
        Animated.timing(lottieOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (womanWorkRef.current) {
            womanWorkRef.current.play();
          }
        });
      }
    }
    
    if (currentQ.key === 'password') {
      const validations = checkPasswordValidations(userData.password);
      if (!isPasswordValid(validations)) { 
        Keyboard.dismiss();
        hasValidationErrors = true;
        return; // Don't proceed if validation fails
      }
      // Password valid - Show animation only on continue click
      Animated.timing(lottieOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (womanWorkRef.current) {
          womanWorkRef.current.play();
        }
      });
    }

    // For other fields - Show animation on continue click (if data exists)
    if (currentQ.key !== 'email' && currentQ.key !== 'password') {
      Animated.timing(lottieOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (womanWorkRef.current) {
          womanWorkRef.current.play();
        }
      });
    }

    // Only proceed if validations pass
    if (hasValidationErrors) {
      return; // Don't proceed
    }

    if (currentStep === questions.length - 1) {
      // Last step - wait 2 seconds then complete
      setTimeout(() => {
        handleRegisterComplete();
      }, 2000);
    } else {
      // Wait 2 seconds, then navigate to next step
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setCurrentStep(prev => prev + 1);
        });
      }, 2000);
    }
  };

  const handleRegisterComplete = async () => {
    setIsLoading(true);
    try {
      await onRegisterComplete({ ...userData, isAdmin: false, isGuest: false });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const progress = (currentStep + 1) / questions.length;
  const styles = getStyles(responsive);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ImageBackground
        source={require('../../assets/register.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        <View style={styles.contentSafeArea}>
          
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#0D5B81" />
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
              {/* Step Indicators (Dots) */}
              <View style={styles.stepIndicators}>
                {questions.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      index <= currentStep && styles.stepDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* INPUT AREA - Moves to top when keyboard opens */}
          <View style={[styles.inputAreaWrapper, isKeyboardVisible && styles.inputAreaWrapperKeyboard]}>
            
            {/* --- ANIMATION AREA (Hidden when keyboard is open) --- */}
            {!isKeyboardVisible && (
              <View style={styles.mascotArea}>
                  {/* Animation - Always rendered but hidden until continue click */}
                  <Animated.View style={{ 
                    opacity: lottieOpacity, 
                    transform: [{ scale: lottieOpacity }],
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                  }}>
                    <LottieView
                      ref={womanWorkRef}
                      source={require('../../assets/animations/Woman work from home with laptops.json')}
                      style={styles.lottieFile}
                      autoPlay={false} 
                      loop={true}
                      speed={1}
                    />
                  </Animated.View>
                  
                  {/* Placeholder Icon when Animation is Hidden */}
                  <Animated.View style={{ 
                    opacity: lottieOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    position: 'absolute',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%',
                  }}>
                    <MaterialCommunityIcons name={currentQ.icon as any} size={70} color="#2D4F9C" style={{ opacity: 0.15 }} />
                  </Animated.View>
              </View>
            )}

            {/* --- GLASSMORPHIC CARD --- */}
            <Animated.View 
              style={[
                styles.questionCard, 
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
              ]}
            >
              <Text style={styles.questionText}>{currentQ.question}</Text>
              
              <View style={styles.inputContainer}>
                
                {/* 1. SELECTION GRIDS */}
                {(currentQ.isLanguageSelection || currentQ.isAgeSelection) && (
                  <View style={styles.gridContainer}>
                    {(currentQ.isLanguageSelection ? currentQ.options : ADULT_AGE_OPTIONS)?.map((option) => {
                      const isSelected = userData[currentQ.key as keyof UserData] === option;
                      // Check if age option is locked (only for age selection)
                      const isLocked = currentQ.isAgeSelection && option !== UNLOCKED_AGE_GROUP;
                      
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionButton, 
                            isSelected && styles.optionButtonSelected,
                            isLocked && styles.optionButtonLocked
                          ]}
                          onPress={() => {
                            if (isLocked) {
                              Alert.alert('Not Implemented', 'This age group is not yet available.');
                              return;
                            }
                            setUserData({ ...userData, [currentQ.key]: option });
                            // No animation on selection - only on continue click
                          }}
                          activeOpacity={isLocked ? 1 : 0.7}
                          disabled={isLocked}
                        >
                          <Text style={[
                            styles.optionText, 
                            isSelected && styles.optionTextSelected,
                            isLocked && styles.optionTextLocked
                          ]}>
                            {option}
                          </Text>
                          {isSelected && !isLocked && (
                            <MaterialCommunityIcons name="check-circle" size={16} color="#FFF" style={styles.checkmark} />
                          )}
                          {isLocked && (
                            <MaterialCommunityIcons name="lock" size={16} color="#94A3B8" style={styles.lockIcon} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* 2. TEXT INPUTS */}
                {(!currentQ.isLanguageSelection && !currentQ.isAgeSelection) && (
                  <View style={styles.inputWrapperContainer}>
                    <View style={styles.textInputWrapper}>
                      <MaterialCommunityIcons name={currentQ.icon as any} size={24} color="#2D4F9C" style={styles.inputIcon} />
                      <TextInput
                        key={currentQ.key + showPassword} // Force re-render when showPassword changes
                        style={styles.modernInput}
                        value={userData[currentQ.key as keyof UserData] as string}
                        onChangeText={(text) => {
                          setUserData({ ...userData, [currentQ.key]: text });
                          
                          // Email validation - Show error only, no animation
                          if(currentQ.key === 'email') {
                            if (text.length > 0) {
                              const isValid = checkEmailValidation(text);
                              setEmailError(isValid ? '' : 'Invalid Email');
                            } else {
                              setEmailError('');
                            }
                          }
                          // Password validation - Show validations only, no animation
                          else if(currentQ.key === 'password') {
                            const validations = checkPasswordValidations(text);
                            setPasswordValidations(validations);
                          }
                          // Other fields - No animation on input
                        }}
                        placeholder={currentQ.placeholder}
                        placeholderTextColor="#94A3B8"
                        autoFocus={true}
                        keyboardType={currentQ.keyboardType as any}
                        secureTextEntry={currentQ.secure ? !showPassword : false}
                        autoCapitalize={currentQ.key === 'email' ? 'none' : 'words'}
                      />
                      {currentQ.secure && (
                        <TouchableOpacity 
                          onPress={() => {
                            setShowPassword(prev => !prev);
                          }}
                          style={styles.eyeToggleButton}
                          activeOpacity={0.6}
                          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                          onPressIn={() => {}}
                          onPressOut={() => {}}
                        >
                          <MaterialCommunityIcons 
                            name={showPassword ? "eye-off" : "eye"}
                            size={24} 
                            color="#2D4F9C" 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* VALIDATIONS - Show below text box (real-time) */}
                    {currentQ.key === 'email' && (
                      <View style={styles.validationContainer}>
                        {emailError ? (
                          <Text style={styles.validationError}>Invalid Email</Text>
                        ) : userData.email.length > 0 ? (
                          <Text style={styles.validationSuccess}>✓ Valid Email</Text>
                        ) : null}
                      </View>
                    )}
                    {currentQ.key === 'password' && (
                      <View style={styles.validationContainer}>
                        <ValidationItem 
                          label="Minimum 8 characters" 
                          isValid={passwordValidations.minLength}
                        />
                        <ValidationItem 
                          label="One uppercase letter" 
                          isValid={passwordValidations.hasUppercase}
                        />
                        <ValidationItem 
                          label="One lowercase letter" 
                          isValid={passwordValidations.hasLowercase}
                        />
                        <ValidationItem 
                          label="One number" 
                          isValid={passwordValidations.hasNumber}
                        />
                        <ValidationItem 
                          label="One special character" 
                          isValid={passwordValidations.hasSpecialChar}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>

          </View>

        </View>
        </ScrollView>
        
        {/* BOTTOM BUTTON - Stays above keyboard */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.continueButton, isLoading && styles.disabledButton]} 
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

// --- STYLES ---
const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  scrollContent: {
    flexGrow: 1,
  },
  contentSafeArea: {
    flex: 1,
    paddingTop: responsive.hp(4),
    paddingHorizontal: responsive.wp(6),
    paddingBottom: responsive.hp(1),
  },
  inputAreaWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: responsive.hp(2),
  },
  inputAreaWrapperKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: responsive.hp(1),
  },

  // Header
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backButton: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, elevation: 3 },
  progressBarContainer: { 
    flex: 1, 
    marginLeft: 15, 
  },
  progressBarBg: { 
    height: 8, 
    backgroundColor: 'rgba(89,164,198,0.1)', 
    borderRadius: 4, 
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: { height: '100%', backgroundColor: '#59A4C6', borderRadius: 4 },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(66,137,186,0.2)',
    marginHorizontal: 2,
  },
  stepDotActive: {
    backgroundColor: '#4289BA',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Animation Area
  mascotArea: {
    height: responsive.hp(18),
    width: responsive.hp(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.hp(2),
  },
  lottieFile: { width: '100%', height: '100%' },

  // Card
  questionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: responsive.hp(4),
    paddingHorizontal: responsive.wp(6),
    shadowColor: "#002D62",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  questionText: {
    fontSize: responsive.wp(5.5),
    fontWeight: '800',
    color: '#0D5B81',
    textAlign: 'center',
    marginBottom: responsive.hp(3),
    lineHeight: responsive.wp(7),
  },
  inputContainer: { width: '100%', alignItems: 'center' },

  // Inputs
  inputWrapperContainer: {
    width: '100%',
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  inputIcon: { marginRight: 10 },
  modernInput: {
    flex: 1,
    fontSize: responsive.wp(4.5),
    color: '#334155',
    fontWeight: '600',
  },
  eyeToggleButton: {
    padding: 8,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
    zIndex: 10,
    backgroundColor: 'transparent',
  },

  // Options
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  optionButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    flexDirection: 'row',
  },
  optionButtonSelected: {
    backgroundColor: '#4289BA',
    borderColor: '#4289BA',
    shadowColor: "#4289BA",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  optionButtonLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  optionText: { fontSize: responsive.wp(4), color: '#64748B', fontWeight: '600' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  optionTextLocked: { color: '#94A3B8', fontWeight: '500' },
  checkmark: { marginLeft: 6 },
  lockIcon: { marginLeft: 6 },

  // Errors
  errorContainer: { marginTop: 10, width: '100%' },
  errorText: { color: '#EF4444', fontSize: 13, marginLeft: 5 },
  errorContainerBelow: { 
    marginTop: 8, 
    width: '100%',
    paddingLeft: 5,
  },
  errorTextBelow: { 
    color: '#EF4444', 
    fontSize: 12, 
    marginTop: 4,
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 8,
    width: '100%',
    paddingLeft: 5,
  },
  validationItem: {
    marginTop: 4,
  },
  validationText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  validationError: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  validationSuccess: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Button Container - Stays above keyboard
  buttonContainer: {
    paddingHorizontal: responsive.wp(6),
    paddingBottom: responsive.hp(2),
    paddingTop: responsive.hp(1),
    backgroundColor: 'transparent',
  },
  // Continue Button
  continueButton: {
    backgroundColor: '#4289BA',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#4289BA",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: { opacity: 0.7 },
  continueText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default RegisterScreen;