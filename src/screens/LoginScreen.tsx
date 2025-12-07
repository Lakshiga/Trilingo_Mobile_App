import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useResponsive } from '../utils/responsive';

type LoginScreenProps = {
  onLogin: (userData: any) => void;
  onRegister: () => void;
  onGuest: () => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister, onGuest }) => {
  const responsive = useResponsive();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvalidCredentialModal, setShowInvalidCredentialModal] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        // Scroll to top when keyboard opens
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Handle modal animation when it becomes visible
  useEffect(() => {
    if (showInvalidCredentialModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      modalScaleAnim.setValue(0);
    }
  }, [showInvalidCredentialModal]);

  const handleLogin = async () => {
    // Check for empty fields
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // Check for admin credentials
      if (username === 'Admin' && password === 'Admin@123') {
        await onLogin({ username: 'Admin', isAdmin: true });
        setIsLoading(false);
        return;
      }

      // Regular user login with backend
      await onLogin({ 
        username, 
        password,
        isAdmin: false,
        isGuest: false,
      });
      
      setIsLoading(false);
    } catch (error) {
      // Show invalid credential modal with animation
      setIsLoading(false);
      setShowInvalidCredentialModal(true);
    }
  };

  const styles = getStyles(responsive);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContainer,
            isKeyboardVisible && styles.scrollContainerKeyboardVisible
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.container,
            isKeyboardVisible && styles.containerKeyboardVisible
          ]}>
            {/* Logo/Icon Section */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../assets/LOGO.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome to Q-bit</Text>
            <Text style={styles.subtitle}>Learning Languages Made Fun</Text>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username or Email</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username or email"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={responsive.wp(5.5)}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity 
                style={styles.registerLink} 
                onPress={onRegister}
                activeOpacity={0.7}
              >
                <Text style={styles.registerText}>
                  I don't have an account - <Text style={styles.registerHighlight}>Register</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Invalid Credential Modal with Lottie Animation */}
      <Modal
        visible={showInvalidCredentialModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(modalScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowInvalidCredentialModal(false);
            modalScaleAnim.setValue(0);
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
            >
              {/* Error Message - Red Heading */}
              <Text style={styles.errorTitle}>Oops invalid credentials</Text>

              {/* Lottie Animation */}
              <View style={styles.lottieContainer}>
                <LottieView
                  source={require('../../assets/animations/Login.json')}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                Animated.timing(modalScaleAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setShowInvalidCredentialModal(false);
                  modalScaleAnim.setValue(0);
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: responsive.width,
    height: responsive.height,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollContainerKeyboardVisible: {
    justifyContent: 'flex-start',
    paddingTop: responsive.hp(3),
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: responsive.wp(8),
    paddingVertical: responsive.hp(5),
  },
  containerKeyboardVisible: {
    justifyContent: 'flex-start',
    paddingTop: responsive.hp(2),
    paddingBottom: responsive.hp(10),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: responsive.hp(3),
  },
  logoCircle: {
    width: responsive.wp(20),
    height: responsive.wp(20),
    borderRadius: responsive.wp(10),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.hp(2),
  },
  logoImage: {
    width: responsive.wp(18),
    height: responsive.wp(18),
  },
  title: {
    fontSize: responsive.wp(9),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsive.hp(1),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: responsive.hp(0.2) },
    textShadowRadius: responsive.wp(1.5),
  },
  subtitle: {
    fontSize: responsive.wp(4.5),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsive.hp(5),
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: responsive.hp(0.1) },
    textShadowRadius: responsive.wp(0.5),
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: responsive.wp(6),
    padding: responsive.wp(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(1.5) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(6),
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputContainer: {
    marginBottom: responsive.hp(2.5),
  },
  label: {
    fontSize: responsive.wp(4),
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: responsive.hp(1.2),
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: responsive.wp(3.5),
    padding: responsive.wp(4.5),
    fontSize: responsive.wp(4.5),
    color: '#2C3E50',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: responsive.wp(3.5),
    paddingRight: responsive.wp(2),
  },
  passwordInput: {
    flex: 1,
    padding: responsive.wp(4.5),
    fontSize: responsive.wp(4.5),
    color: '#2C3E50',
  },
  eyeIcon: {
    padding: responsive.wp(2),
  },
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: responsive.wp(3.5),
    padding: responsive.wp(5),
    alignItems: 'center',
    marginTop: responsive.hp(1.5),
    marginBottom: responsive.hp(2.5),
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: responsive.hp(0.5) },
    shadowOpacity: 0.4,
    shadowRadius: responsive.wp(2),
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.wp(5.5),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: responsive.hp(1),
    paddingVertical: responsive.hp(1),
  },
  registerText: {
    fontSize: responsive.wp(4),
    color: '#666',
  },
  registerHighlight: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.wp(5),
  },
  modalContainer: {
    width: '85%',
    maxWidth: responsive.wp(80),
    backgroundColor: '#FFFFFF',
    borderRadius: responsive.wp(5),
    padding: responsive.wp(6),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.5) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(3),
  },
  errorTitle: {
    fontSize: responsive.wp(5.5),
    fontWeight: 'bold',
    color: '#FF0000',
    textAlign: 'center',
    marginTop: responsive.hp(1),
    marginBottom: responsive.hp(2),
  },
  lottieContainer: {
    width: responsive.wp(60),
    height: responsive.wp(60),
    marginBottom: responsive.hp(2),
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  modalButton: {
    backgroundColor: '#667eea',
    borderRadius: responsive.wp(3),
    paddingVertical: responsive.hp(1.5),
    paddingHorizontal: responsive.wp(10),
    minWidth: responsive.wp(30),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.2) },
    shadowOpacity: 0.2,
    shadowRadius: responsive.wp(1),
  },
  modalButtonText: {
    fontSize: responsive.wp(4.5),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LoginScreen;
