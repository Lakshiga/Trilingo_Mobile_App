import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

type LoginScreenProps = {
  onLogin: (userData: any) => void;
  onRegister: () => void;
  onGuest: () => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister, onGuest }) => {
  const responsive = useResponsive();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const curveTranslateY = useRef(new Animated.Value(-width * 2.5)).current;
  const logoCircleTranslateY = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const topLogoCircleTranslateY = useRef(new Animated.Value(-150)).current; // Initially hidden higher up
  const topLogoOpacity = useRef(new Animated.Value(0)).current;
  const formBottomPadding = useRef(new Animated.Value(responsive.hp(2))).current;

  // Initial entry animation
  useEffect(() => {
    curveTranslateY.setValue(-width * 2.5);
    Animated.timing(curveTranslateY, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = () => {
      setIsKeyboardVisible(true);
      
      Animated.parallel([
        // Hide bottom huge circle
        Animated.timing(logoCircleTranslateY, {
          toValue: -width * 2,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        // Show top logo circle
        Animated.timing(topLogoCircleTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(topLogoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Reduce padding when keyboard opens to prevent overlap
        // We set it to 0 because KeyboardAvoidingView adds the necessary height
        Animated.timing(formBottomPadding, {
          toValue: 0, 
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);

      Animated.parallel([
        // Show bottom huge circle
        Animated.timing(logoCircleTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Hide top logo circle
        Animated.timing(topLogoCircleTranslateY, {
          toValue: -150,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(topLogoOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Add padding back when keyboard closes
        Animated.timing(formBottomPadding, {
          toValue: responsive.hp(2),
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    };

    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    const trimmedUsername = username?.trim() || '';
    const trimmedPassword = password?.trim() || '';
    
    if (!trimmedUsername || !trimmedPassword) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);
    try {
      if (trimmedUsername === 'Admin' && trimmedPassword === 'Admin@123') {
        await onLogin({ username: 'Admin', isAdmin: true });
        setIsLoading(false);
        return;
      }
      await onLogin({ username: trimmedUsername, password: trimmedPassword, isAdmin: false, isGuest: false });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  const styles = getStyles(responsive, isKeyboardVisible);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />
      
      {/* Half Circle - Slides down from top */}
      <Animated.View 
        style={[
          styles.halfCircleContainer,
          { transform: [{ translateY: logoCircleTranslateY }] },
        ]}
      >
        <Animated.View 
          style={[
            styles.blueCurveBackground,
            { transform: [{ translateY: curveTranslateY }] },
          ]} 
        />
        
        <Animated.View 
          style={[styles.contentInsideCircle, { opacity: logoOpacity }]}
        >
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/animations/Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Welcome to <Text style={styles.brandColor}>Q-bit</Text>
            </Text>
            <Text style={styles.subtitle}>Learning Languages Made Fun</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Login Form with Logo - Single Scrollable Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View style={[styles.formContainer, { paddingBottom: formBottomPadding }]}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Logo Circle - Shows when keyboard opens */}
            <Animated.View
              style={[
                styles.topLogoContainer,
                {
                  transform: [{ translateY: topLogoCircleTranslateY }],
                  opacity: topLogoOpacity,
                  marginBottom: responsive.hp(3),
                },
              ]}
            >
              <View style={styles.topLogoCircle}>
                <Image
                  source={require('../../assets/animations/Logo.png')}
                  style={styles.topLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.topLogoText}>
                Welcome to <Text style={styles.topBrandColor}>Q-bit</Text>
              </Text>
              <Text style={styles.topLogoSubtext}>Learning Languages Made Fun</Text>
            </Animated.View>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username or Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account" size={24} color="#002D62" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username or email"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock" size={24} color="#002D62" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#002D62" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onRegister} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>, isKeyboardVisible: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    // ... Logo Styles (Same as before) ...
    halfCircleContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: width * 1.5,
      overflow: 'hidden',
      zIndex: 1,
    },
    blueCurveBackground: {
      position: 'absolute',
      backgroundColor: '#002D62',
      width: width * 1.5,
      height: width * 1.7,
      borderRadius: width * 0.75,
      top: -width * 0.75,
      left: -width * 0.25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
    },
    contentInsideCircle: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: width * 0.75,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: responsive.hp(8),
      zIndex: 5,
    },
    logoWrapper: {
      alignItems: 'center',
      marginBottom: responsive.hp(2),
    },
    logoCircle: {
      width: responsive.wp(28),
      height: responsive.wp(28),
      borderRadius: responsive.wp(14),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    logoImage: {
      width: responsive.wp(25),
      height: responsive.wp(22),
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: responsive.wp(8),
    },
    title: {
      fontSize: responsive.wp(9),
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: responsive.hp(0.5),
    },
    brandColor: { color: '#FFFFFF' },
    subtitle: {
      fontSize: responsive.wp(4.5),
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontWeight: '500',
    },
    
    // ... Top Logo Styles (Fixed at top) ...
    topLogoContainer: {
      alignItems: 'center',
      width: '100%',
      paddingTop: responsive.hp(4),
    },
    topLogoCircle: {
      width: responsive.wp(16), // Slightly smaller
      height: responsive.wp(16),
      borderRadius: responsive.wp(8),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      marginBottom: responsive.hp(1),
    },
    topLogoImage: {
      width: responsive.wp(12),
      height: responsive.wp(12),
    },
    topLogoText: {
      fontSize: responsive.wp(5),
      fontWeight: '800',
      color: '#002D62',
      marginBottom: responsive.hp(0.2),
    },
    topBrandColor: { color: '#002D62' },
    topLogoSubtext: {
      fontSize: responsive.wp(3),
      color: '#64748B',
      fontWeight: '500',
    },

    // ... Form / Keyboard Styles (Updated) ...
    keyboardContainer: {
      flex: 1,
      zIndex: 10, // Ensure form is clickable
      justifyContent: 'flex-end', // Aligns children to bottom
    },
    formContainer: {
      // REMOVED: position: 'absolute', bottom: 0 etc.
      width: '100%',
      backgroundColor: 'transparent', 
      // Ensure the form has a background if it slides over the logo visually
    },
     scrollContent: {
       paddingHorizontal: responsive.wp(6),
       paddingTop: responsive.hp(2),
       paddingBottom: responsive.hp(4),
       flexGrow: 1,
     },
    inputGroup: { marginBottom: responsive.hp(2.5) },
    label: {
      fontSize: responsive.wp(4),
      fontWeight: '600',
      color: '#334155',
      marginBottom: responsive.hp(1),
      marginLeft: 5,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 15,
      paddingVertical: 14,
      width: '100%',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: responsive.wp(4.5),
      color: '#334155',
      fontWeight: '600',
    },
    eyeIcon: {
      padding: 8,
      marginLeft: 5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginButton: {
      backgroundColor: '#002D62',
      borderRadius: 16,
      padding: responsive.wp(5),
      alignItems: 'center',
      marginTop: responsive.hp(2),
      marginBottom: responsive.hp(2),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: responsive.wp(5.5),
      fontWeight: 'bold',
    },
    disabledButton: { backgroundColor: '#94A3B8', opacity: 0.7 },
    registerLink: { alignItems: 'center', paddingVertical: responsive.hp(1) },
    registerText: { fontSize: responsive.wp(4), color: '#64748B' },
    registerHighlight: { color: '#002D62', fontWeight: 'bold', textDecorationLine: 'underline' },
  });

export default LoginScreen;