import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
        return;
      }

      // Regular user login with backend
      await onLogin({ 
        username, 
        password,
        isAdmin: false,
        isGuest: false,
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid username or password. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = getStyles(responsive);

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
              {/* Title */}
              <Text style={styles.title}>Welcome to Q-Bit</Text>
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
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                </View>

                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Login</Text>
                  )}
                </TouchableOpacity>

                {/* Register Link */}
                <TouchableOpacity style={styles.registerLink} onPress={onRegister}>
                  <Text style={styles.registerText}>
                    I don't have an account - <Text style={styles.registerHighlight}>Register</Text>
                  </Text>
                </TouchableOpacity>


              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurView>
    </ImageBackground>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: responsive.width,
    height: responsive.height,
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
    paddingHorizontal: responsive.wp(8),
    paddingVertical: responsive.hp(5),
  },
  title: {
    fontSize: responsive.wp(8.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsive.hp(1.2),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: responsive.hp(0.25) },
    textShadowRadius: responsive.wp(1),
  },
  subtitle: {
    fontSize: responsive.wp(4.2),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsive.hp(5),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: responsive.wp(5),
    padding: responsive.wp(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(1.2) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(5),
    elevation: 10,
  },
  inputContainer: {
    marginBottom: responsive.hp(2.5),
  },
  label: {
    fontSize: responsive.wp(3.7),
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: responsive.hp(1),
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4),
    fontSize: responsive.wp(4.2),
    color: '#2C3E50',
  },
  loginButton: {
    backgroundColor: '#43BCCD',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(4.2),
    alignItems: 'center',
    marginTop: responsive.hp(1.2),
    marginBottom: responsive.hp(2.5),
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: responsive.wp(4.8),
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
    marginBottom: responsive.hp(2.5),
  },
  registerText: {
    fontSize: responsive.wp(3.7),
    color: '#666',
  },
  registerHighlight: {
    color: '#43BCCD',
    fontWeight: 'bold',
  },
  guestButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#43BCCD',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(3.2),
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#43BCCD',
    fontSize: responsive.wp(4.2),
    fontWeight: 'bold',
  },
  guestSubtext: {
    color: '#666',
    fontSize: responsive.wp(3.2),
    marginTop: responsive.hp(0.25),
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  guestButtonDisabled: {
    opacity: 0.5,
  },
});

export default LoginScreen;
