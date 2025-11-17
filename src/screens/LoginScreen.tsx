import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

type LoginScreenProps = {
  onLogin: (userData: any) => void;
  onRegister: () => void;
  onGuest: () => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister, onGuest }) => {
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
              <Text style={styles.title}>Welcome to Trilingo</Text>
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

                {/* Try Now Button */}
                <TouchableOpacity 
                  style={[styles.guestButton, isLoading && styles.guestButtonDisabled]} 
                  onPress={onGuest}
                  disabled={isLoading}
                >
                  <Text style={styles.guestButtonText}>Try Now</Text>
                  <Text style={styles.guestSubtext}>Continue as a guest</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
  },
  loginButton: {
    backgroundColor: '#43BCCD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  registerText: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#43BCCD',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
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
