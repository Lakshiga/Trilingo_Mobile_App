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
  Keyboard,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useResponsive } from '../utils/responsive';
import apiService from '../services/api';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- OPTIONS ---
const LANGUAGE_OPTIONS = ['English', 'Tamil', 'Sinhala'];
const LEARNING_LEVEL_OPTIONS = [
  'Total Beginner (No knowledge)',
  'Familiar (Knows a few words)',
  'Conversational (Can speak basic sentences)',
  'Advanced (Fluent/School Level)',
];

// Map labels to locale codes for API
const LANGUAGE_MAP: { [key: string]: string } = {
  'English': 'en-US',
  'Tamil': 'ta-LK',
  'Sinhala': 'si-LK'
};

type RegisterScreenProps = {
  onRegisterComplete: (userData: any) => void;
  onBack: () => void;
};

// Validation Item Component
const ValidationItem: React.FC<{ label: string; isValid: boolean }> = ({ label, isValid }) => {
  if (isValid) return null;
  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '500' }}>• {label}</Text>
    </View>
  );
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterComplete, onBack }) => {
  const responsive = useResponsive();
  const navigation = useNavigation<any>();
  
  // Stages: 'parent' -> 'success' -> 'child'
  const [registrationStage, setRegistrationStage] = useState<'parent' | 'success' | 'child'>('parent');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [continueLocked, setContinueLocked] = useState(false);
  
  const [userData, setUserData] = useState({
    // Parent Data
    email: '',
    username: '',
    password: '',
    name: '', // Will default to username if not asked
    // Child Data
    studentNickname: '',
    dobDay: null as number | null,
    dobMonth: null as number | null,
    dobYear: null as number | null,
    studentNativeLanguageLabel: '',
    studentTargetLanguageLabel: '',
    studentAvatar: '😀',
    learningLevel: '',
  });

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const womanWorkRef = useRef<LottieView>(null);
  const successRef = useRef<LottieView>(null);
  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const lottieTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- VALIDATION STATE ---
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false,
  });
  const [emailError, setEmailError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // --- QUESTIONS CONFIGURATION ---
  type BaseQuestion = { key: string; question: string; icon: string };
  type InputQuestion = BaseQuestion & { placeholder: string; secure?: boolean; keyboardType?: any; isDate?: false; isSelection?: false };
  type DateQuestion = BaseQuestion & { isDate: true };
  type SelectionQuestion = BaseQuestion & { isSelection: true; options: string[] };
  type Question = InputQuestion | DateQuestion | SelectionQuestion;

  const isSelectionQuestion = (q: Question): q is SelectionQuestion => 'isSelection' in q && q.isSelection === true;
  const isDateQuestion = (q: Question): q is DateQuestion => 'isDate' in q && q.isDate === true;
  const isInputQuestion = (q: Question): q is InputQuestion => !isSelectionQuestion(q) && !isDateQuestion(q);

  const parentQuestions: Question[] = useMemo(() => [
    { 
      key: 'username', 
      question: "Choose a Username", 
      placeholder: "cool_parent123", 
      icon: 'account' 
    },
    { 
      key: 'password', 
      question: "Create a Password", 
      placeholder: "••••••••", 
      secure: true, 
      icon: 'lock' 
    },
    { 
      key: 'email', 
      question: "What is your Email?", 
      placeholder: "name@example.com", 
      keyboardType: 'email-address', 
      icon: 'email' 
    },
  ], []);

  const childQuestions: Question[] = useMemo(() => [
    {
      key: 'studentNickname',
      question: "What is your child's name?",
      placeholder: "Little Star",
      icon: 'face-man-shimmer'
    },
    {
      key: 'dateOfBirth',
      question: "What's your child's date of birth?",
      isDate: true,
      icon: 'cake-variant'
    },
    {
      key: 'studentNativeLanguageLabel',
      question: "Child's Native Language?",
      isSelection: true,
      options: LANGUAGE_OPTIONS,
      icon: 'translate'
    },
    {
      key: 'studentTargetLanguageLabel',
      question: "Language to Learn?",
      isSelection: true,
      options: LANGUAGE_OPTIONS,
      icon: 'school'
    },
    {
      key: 'learningLevel',
      question: "How much do you know already?",
      isSelection: true,
      options: LEARNING_LEVEL_OPTIONS,
      icon: 'medal'
    },
  ], []);

  // Determine current question based on stage
  const activeQuestions = registrationStage === 'child' ? childQuestions : parentQuestions;
  const currentQ = activeQuestions[currentStep] || activeQuestions[0];
  const progress = (registrationStage === 'child') 
    ? (currentStep + 1) / childQuestions.length 
    : (currentStep + 1) / parentQuestions.length;

  const emailStepIndex = parentQuestions.findIndex(q => q.key === 'email');
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 16;
    const maxYear = currentYear - 2;
    const result: number[] = [];
    for (let y = maxYear; y >= minYear; y--) result.push(y);
    return result;
  }, []);
  
  const months = useMemo(() => [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ], []);
  
  const getDaysArray = (year: number, month: number) => {
    if (!year || !month) return [];
    const count = daysInMonth(year, month);
    const daysArray = [];
    for (let i = 1; i <= count; i++) {
      daysArray.push({ label: i.toString(), value: i });
    }
    return daysArray;
  };
  
  const daysInMonth = (year: number, month: number) => {
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  };
  const days = useMemo(() => {
    const { dobYear, dobMonth } = userData;
    const count = daysInMonth(dobYear || new Date().getFullYear(), dobMonth || 1);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [userData.dobMonth, userData.dobYear]);

  // --- VALIDATION LOGIC ---
  const checkPasswordValidations = (password: string) => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  });

  const checkEmailValidation = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isPasswordValid = (v: typeof passwordValidations) => 
    v.minLength && v.hasUppercase && v.hasLowercase && v.hasNumber && v.hasSpecialChar;

  // --- EFFECTS ---
  useEffect(() => {
    const keyboardShow = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setIsKeyboardVisible(true));
    const keyboardHide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => { keyboardShow.remove(); keyboardHide.remove(); };
  }, []);

  // Step Transition Animation
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.95);
    setShowPassword(false);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    // Reset validations/animations for new step
    lottieOpacity.setValue(0);
    if (womanWorkRef.current) { womanWorkRef.current.pause(); womanWorkRef.current.reset(); }
    setContinueLocked(false);
    setPasswordValidations({ minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false });
    // Keep email error visible when we land on email step again (e.g., email already taken)
    if (currentQ.key !== 'email') {
      setEmailError('');
    }

    // Disable animation on step change
    lottieOpacity.setValue(0);
  }, [currentStep, registrationStage]);

  useEffect(() => {
    return () => {
      if (lottieTimerRef.current) {
        clearTimeout(lottieTimerRef.current);
        lottieTimerRef.current = null;
      }
    };
  }, []);

  // --- HANDLERS ---

  const handleNext = () => {
    Keyboard.dismiss();
    const val = userData[currentQ.key as keyof typeof userData];
    
    // 1. Check Empty
    if (!val && !isDateQuestion(currentQ)) {
      Alert.alert("Required", "Please fill in the details to proceed.");
      return;
    }

    // 2. Validations
    let hasError = false;
    if (currentQ.key === 'dateOfBirth') {
      const { dobDay, dobMonth, dobYear } = userData;
      if (!dobDay || !dobMonth || !dobYear) {
        Alert.alert('Validation', 'Please select day, month, and year.');
        return;
      }
      // basic validity check on days
      const maxDay = daysInMonth(dobYear, dobMonth);
      if (dobDay > maxDay) {
        Alert.alert('Validation', 'Invalid date selected.');
        return;
      }
    }
    if (currentQ.key === 'email') {
      if (!checkEmailValidation(userData.email)) {
        const message = 'Invalid Email';
        setEmailError(message);
        Alert.alert('Validation', message);
        hasError = true;
      }
      // If a duplicate-email error is already showing, block progression
      if (emailError) {
        Alert.alert('Validation', emailError);
        hasError = true;
      }
    } else if (currentQ.key === 'password') {
      const v = checkPasswordValidations(userData.password);
      if (!isPasswordValid(v)) hasError = true;
    }

    if (hasError) return;

    // Lock continue until step changes or async finishes
    setContinueLocked(true);

    const proceedToNext = () => {
      const isLastStep = currentStep === activeQuestions.length - 1;
      if (isLastStep) {
        if (registrationStage === 'parent') {
          handleParentRegistration();
        } else {
          handleChildCreation();
        }
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => setCurrentStep(p => p + 1));
      }
    };

    // Play mascot once per Continue click, then proceed after ~2s
    const delayMs = 2000;
    if (womanWorkRef.current) {
      lottieOpacity.setValue(1);
      womanWorkRef.current.reset();
      womanWorkRef.current.play();
      if (lottieTimerRef.current) clearTimeout(lottieTimerRef.current);
      lottieTimerRef.current = setTimeout(() => {
        lottieOpacity.setValue(0);
        proceedToNext();
      }, delayMs);
    } else {
      proceedToNext();
    }
  };

  const handleParentRegistration = async () => {
    setIsLoading(true);
    try {
      // Use username as name if name wasn't asked explicitly
      const payload = {
        ...userData,
        name: userData.username, 
        isAdmin: false,
        isGuest: false
      };
      
      await onRegisterComplete(payload);
      
      // Move to Success Screen
      setRegistrationStage('success');
    } catch (error: any) {
      const rawMsg = String(error?.response?.data?.message || error?.message || '');
      const msg = rawMsg.toLowerCase();
      const isEmailDup =
        msg.includes('email') &&
        (msg.includes('taken') || msg.includes('exist') || msg.includes('already') || msg.includes('duplicate'));

      if (isEmailDup) {
        const message = 'Email already taken';
        setEmailError(message);
        setRegistrationStage('parent');
        setCurrentStep(emailStepIndex >= 0 ? emailStepIndex : 0); // jump back to email step
        setContinueLocked(false);
        Alert.alert('Validation', message);
        return;
      }

      if (msg.includes('internal server error') || error?.response?.status === 500) {
        Alert.alert('Server Issue', 'Something went wrong on the server. Please try again in a moment.');
      } else {
        Alert.alert('Registration Failed', rawMsg || 'Please try again.');
      }
      setContinueLocked(false);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const startChildSetup = () => {
    setRegistrationStage('child');
    setCurrentStep(0);
  };

  const handleChildCreation = async () => {
    setIsLoading(true);
    try {
      const { dobDay, dobMonth, dobYear } = userData;
      if (!dobDay || !dobMonth || !dobYear) {
        Alert.alert('Validation', 'Please select a valid date of birth.');
        setIsLoading(false);
        return;
      }
      const dobUtc = new Date(Date.UTC(dobYear, dobMonth - 1, dobDay)).toISOString();
      const nativeCode = LANGUAGE_MAP[userData.studentNativeLanguageLabel] || 'en-US';
      const targetCode = LANGUAGE_MAP[userData.studentTargetLanguageLabel] || 'ta-LK';

      const student = await apiService.createStudent({
        nickname: userData.studentNickname,
        avatar: userData.studentAvatar,
        dateOfBirth: dobUtc,
        nativeLanguageCode: nativeCode,
        targetLanguageCode: targetCode,
      });
      
      // Cache student profile locally so home/profile can show student name
      try {
        await AsyncStorage.setItem(
          '@trilingo_student_profile',
          JSON.stringify({
            id: student?.id,
            nickname: userData.studentNickname,
            avatar: userData.studentAvatar,
            nativeLanguageCode: nativeCode,
            targetLanguageCode: targetCode,
          })
        );
      } catch (e) {
        // ignore cache errors
      }
      
      // Navigate to Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      Alert.alert('Student Creation Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (registrationStage === 'success') return; // Can't go back from success immediately
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (registrationStage === 'child') {
       // Optional: Allow going back to see success screen?
       // For now, prevent going back to parent registration to avoid duplicate API calls
       Alert.alert("Notice", "Parent account already created.");
    } else {
      onBack();
    }
  };

  const styles = getStyles(responsive);

  // --- RENDER SUCCESS SCREEN ---
  if (registrationStage === 'success') {
    return (
      <View style={styles.successContainer}>
        <LinearGradient
          colors={['#E0F2FE', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
        <LottieView
          ref={successRef}
          source={require('../../assets/animations/success-check.json')} // Make sure you have a success lottie or generic
          autoPlay
          loop={true}
          style={styles.successLottie}
        />
        <View style={styles.successFooter}>
          <Text style={styles.successTitle}>Registered Successfully!</Text>
          <Text style={styles.successSub}>Your parent account is ready.</Text>
          <Text style={styles.successSub}>Now, let's set up the profile for your child.</Text>
          
          <TouchableOpacity style={styles.continueButton} onPress={startChildSetup}>
             <Text style={styles.continueText}>Set Up Child Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDER FORM ---
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.backgroundWrapper}>
        <Video
          source={require('../../assets/register_bubble.mp4')}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted
        />
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
          
          {/* HEADER */}
          <View style={styles.topBar}>
            {(registrationStage === 'parent' || registrationStage === 'child') && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#0D5B81" />
              </TouchableOpacity>
            )}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.stageLabel}>
                {registrationStage === 'parent' ? 'Parent Details' : 'Child Profile'}
              </Text>
            </View>
          </View>

          {/* INPUT AREA */}
          <View style={[styles.inputAreaWrapper, isKeyboardVisible && styles.inputAreaWrapperKeyboard]}>
            
            <View style={styles.mascotArea}>
                <Animated.View style={{ opacity: lottieOpacity, transform: [{ scale: lottieOpacity }], position: 'absolute', width: '100%', height: '100%' }}>
                  <LottieView
                    ref={womanWorkRef}
                    source={require('../../assets/animations/Woman work from home with laptops.json')}
                    style={styles.lottieFile}
                    loop={true}
                  />
                </Animated.View>
                <Animated.View style={{ opacity: lottieOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), position: 'absolute' }}>
                  <MaterialCommunityIcons name={currentQ.icon as any} size={70} color="#2D4F9C" style={{ opacity: 0.15 }} />
                </Animated.View>
            </View>

            <Animated.View 
              style={[
                styles.questionCard, 
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
              ]}
            >
              <Text style={styles.questionText}>{currentQ.question}</Text>
              
              <View style={styles.inputContainer}>
                
                {/* SELECTION (Age / Language) */}
                {isSelectionQuestion(currentQ) ? (
                  <View style={styles.gridContainer}>
                    {currentQ.options?.map((option: string, index: number) => {
                      const isSelected = userData[currentQ.key as keyof typeof userData] === option;
                      const isDisabled = currentQ.key === 'learningLevel' && index > 0; // Only first level enabled
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionButton,
                            isSelected && styles.optionButtonSelected,
                            isDisabled && styles.optionButtonDisabled,
                          ]}
                          onPress={() => {
                            if (isDisabled) {
                              Alert.alert('Coming soon', 'This level will be available soon.');
                              return;
                            }
                            setUserData({ ...userData, [currentQ.key]: option });
                          }}
                          activeOpacity={isDisabled ? 1 : 0.7}
                          disabled={isDisabled}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                              isDisabled && styles.optionTextDisabled,
                            ]}
                          >
                            {option}
                          </Text>
                          {isSelected && <MaterialCommunityIcons name="check-circle" size={16} color="#FFF" style={styles.checkmark} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : isDateQuestion(currentQ) ? (
                  <View style={styles.dobDropdownContainer}>
                    <View style={styles.dobDropdownRow}>
                      <View style={styles.dropdownWrapper}>
                        <Text style={styles.dropdownLabel}>Day</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={userData.dobDay ? userData.dobDay.toString() : ''}
                            style={styles.picker}
                            onValueChange={(itemValue) => {
                              const day = itemValue ? parseInt(itemValue.toString()) : null;
                              setUserData({ ...userData, dobDay: day });
                            }}
                            mode="dropdown"
                          >
                            <Picker.Item label="Select Day" value="" />
                            {getDaysArray(userData.dobYear || new Date().getFullYear(), userData.dobMonth || 1).map(day => (
                              <Picker.Item key={day.value} label={day.label} value={day.value.toString()} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      
                      <View style={styles.dropdownWrapper}>
                        <Text style={styles.dropdownLabel}>Month</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={userData.dobMonth ? userData.dobMonth.toString() : ''}
                            style={styles.picker}
                            onValueChange={(itemValue) => {
                              const month = itemValue ? parseInt(itemValue.toString()) : null;
                              setUserData({ ...userData, dobMonth: month });
                            }}
                            mode="dropdown"
                          >
                            <Picker.Item label="Select Month" value="" />
                            {months.map(month => (
                              <Picker.Item key={month.value} label={month.label} value={month.value.toString()} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      
                      <View style={styles.dropdownWrapper}>
                        <Text style={styles.dropdownLabel}>Year</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={userData.dobYear ? userData.dobYear.toString() : ''}
                            style={styles.picker}
                            onValueChange={(itemValue) => {
                              const year = itemValue ? parseInt(itemValue.toString()) : null;
                              setUserData({ ...userData, dobYear: year });
                            }}
                            mode="dropdown"
                          >
                            <Picker.Item label="Select Year" value="" />
                            {years.map(year => (
                              <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* TEXT INPUT */
                  <View style={styles.inputWrapperContainer}>
                    <View style={styles.textInputWrapper}>
                      <MaterialCommunityIcons name={currentQ.icon as any} size={24} color="#2D4F9C" style={styles.inputIcon} />
                      {isInputQuestion(currentQ) && (
                        <TextInput
                          key={currentQ.key + showPassword}
                          style={styles.modernInput}
                          value={userData[currentQ.key as keyof typeof userData] as string}
                          onChangeText={(text) => {
                            setUserData({ ...userData, [currentQ.key]: text });
                            if(currentQ.key === 'email') {
                              // Clear any previous duplicate/format errors while typing
                              setEmailError(text.length > 0 && !checkEmailValidation(text) ? 'Invalid Email' : '');
                            }
                            if(currentQ.key === 'password') setPasswordValidations(checkPasswordValidations(text));
                          }}
                          placeholder={currentQ.placeholder}
                          placeholderTextColor="#94A3B8"
                          autoFocus={true}
                          keyboardType={(currentQ.keyboardType ?? 'default') as any}
                          secureTextEntry={((currentQ.secure ?? false) && !showPassword)}
                          autoCapitalize={currentQ.key === 'email' ? 'none' : 'words'}
                        />
                      )}
                      {isInputQuestion(currentQ) && (currentQ.secure ?? false) && (
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeToggleButton}>
                          <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={24} color="#2D4F9C" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {currentQ.key === 'email' && emailError ? <Text style={styles.validationError}>{emailError}</Text> : null}
                    {currentQ.key === 'password' && (
                      <View style={styles.validationContainer}>
                         <ValidationItem label="Min 8 chars" isValid={passwordValidations.minLength} />
                         <ValidationItem label="Uppercase" isValid={passwordValidations.hasUppercase} />
                         <ValidationItem label="Lowercase" isValid={passwordValidations.hasLowercase} />
                         <ValidationItem label="Number" isValid={passwordValidations.hasNumber} />
                         <ValidationItem label="Symbol" isValid={passwordValidations.hasSpecialChar} />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (isLoading || continueLocked) && styles.disabledButton
            ]} 
            onPress={handleNext}
            disabled={isLoading || continueLocked}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueText}>{currentStep === activeQuestions.length - 1 ? "Finish" : "Continue"}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- STYLES ---
const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: { flex: 1 },
  backgroundWrapper: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' },
  backgroundVideo: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  scrollContent: { flexGrow: 1 },
  contentSafeArea: { flex: 1, paddingTop: responsive.hp(4), paddingHorizontal: responsive.wp(6), paddingBottom: responsive.hp(1) },
  inputAreaWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: responsive.hp(2) },
  inputAreaWrapperKeyboard: { justifyContent: 'flex-start', paddingTop: responsive.hp(1) },

  // Success Screen
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  successLottie: { width: '65%', height: '65%', maxWidth: 360, maxHeight: 360, marginBottom: 10 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#0D5B81', marginTop: 20 },
  successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 8 },
  successFooter: { width: '100%', position: 'absolute', bottom: 40, alignItems: 'center', paddingHorizontal: 20, gap: 6 },
  
  // Header
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backButton: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, elevation: 3 },
  progressBarContainer: { flex: 1, marginLeft: 15 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(89,164,198,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#59A4C6', borderRadius: 4 },
  stageLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '600' },

  // Mascot
  mascotArea: { height: responsive.hp(18), width: responsive.hp(18), justifyContent: 'center', alignItems: 'center', marginBottom: responsive.hp(2) },
  lottieFile: { width: '100%', height: '100%' },

  // Card
  questionCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: responsive.hp(4),
    paddingHorizontal: responsive.wp(6), shadowColor: "#002D62", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, alignItems: 'center',
  },
  questionText: { fontSize: responsive.wp(5.5), fontWeight: '800', color: '#0D5B81', textAlign: 'center', marginBottom: responsive.hp(3) },
  inputContainer: { width: '100%', alignItems: 'center' },

  // Inputs
  inputWrapperContainer: { width: '100%' },
  textInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 15, paddingVertical: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  inputIcon: { marginRight: 10 },
  modernInput: { flex: 1, fontSize: responsive.wp(4.5), color: '#334155', fontWeight: '600' },
  eyeToggleButton: { padding: 8 },

  // Selection Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  optionButton: { backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', minWidth: '40%', alignItems: 'center', justifyContent: 'center', marginBottom: 5, flexDirection: 'row' },
  optionButtonSelected: { backgroundColor: '#4289BA', borderColor: '#4289BA', elevation: 5 },
  optionButtonDisabled: { opacity: 0.55 },
  optionText: { fontSize: responsive.wp(4), color: '#64748B', fontWeight: '600' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  optionTextDisabled: { color: '#94A3B8' },
  checkmark: { marginLeft: 6 },

  // Date of Birth Dropdowns
  dobDropdownContainer: { width: '100%', marginBottom: 20 },
  dobDropdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dropdownWrapper: { flex: 1, marginHorizontal: 5 },
  dropdownLabel: { fontSize: responsive.wp(4), color: '#0D5B81', fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  pickerContainer: { 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 10, 
    backgroundColor: '#F8FAFC',
    overflow: 'hidden'
  },
  picker: { 
    height: 50, 
    width: '100%',
    color: '#0F172A'
  },

  // Validation
  validationContainer: { marginTop: 8, width: '100%', paddingLeft: 5 },
  validationError: { color: '#EF4444', fontSize: 12, fontWeight: '500', marginTop: 4 },

  // Button
  buttonContainer: { paddingHorizontal: responsive.wp(6), paddingBottom: responsive.hp(2), paddingTop: responsive.hp(1) },
  continueButton: { backgroundColor: '#4289BA', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 8,marginTop:10 },
  disabledButton: { opacity: 0.7 },
  continueText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default RegisterScreen;