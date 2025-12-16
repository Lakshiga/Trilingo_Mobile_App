import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { PaymentSessionResponse } from '../services/api';
import { getLanguageTextStyle } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { loadStudentLanguagePreference, languageCodeToLanguage } from '../utils/studentLanguage';

interface RouteParams {
  levelId: number;
  levelName?: string;
  nextLevelId?: number;
}

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const { currentUser } = useUser();
  
  const params = route.params as RouteParams;
  const levelId = params?.levelId || 2;
  const levelName = params?.levelName || `Level ${levelId}`;
  const nextLevelId = params?.nextLevelId || levelId;

  const [nativeLanguage, setNativeLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expiryDate, setExpiryDate] = useState('12/25');
  const [cvv, setCvv] = useState('123');
  const [cardholderName, setCardholderName] = useState('Test User');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const successScaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadLang = async () => {
      const pref = await loadStudentLanguagePreference();
      const native = languageCodeToLanguage(pref.nativeLanguageCode);
      setNativeLanguage(native);
    };
    loadLang();
  }, []);

  useEffect(() => {
    if (showSuccessModal) {
      successScaleAnim.setValue(0);
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuccessModal]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to Lessons screen which will refresh and show unlocked lessons
    navigation.navigate('Lessons', { levelId: nextLevelId, levelName });
  };

  const handleCreateSession = async () => {
    if (!currentUser) {
      Alert.alert('Error', String('Please login to continue'));
      return;
    }

    setLoading(true);
    try {
      // Create success and cancel URLs
      const baseUrl = 'trilingo://payment';
      const successUrl = `${baseUrl}/success?levelId=${nextLevelId}`;
      const cancelUrl = `${baseUrl}/cancel`;

      const response: PaymentSessionResponse = await apiService.createPaymentSession(
        nextLevelId,
        successUrl,
        cancelUrl
      );

      if (response.isSuccess && response.sessionUrl) {
        setSessionUrl(response.sessionUrl);
        setShowWebView(true);
      } else if (response.isSuccess && response.message?.includes('already have access')) {
        // User already has access
        Alert.alert('Success', String(response.message || 'You already have access to this level'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', String(response.error || response.message || 'Failed to create payment session'));
      }
    } catch (error: any) {
      console.error('Payment session error:', error);
      Alert.alert('Error', String(error.message || 'Failed to create payment session'));
    } finally {
      setLoading(false);
    }
  };

  const handleDummyPayment = async () => {
    if (!currentUser) {
      Alert.alert('Error', String('Please login to continue'));
      return;
    }

    // Validate card details
    const cleanCardNumber = String(cardNumber || '').replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      Alert.alert('Error', String('Please enter a valid card number'));
      return;
    }

    const expiryStr = String(expiryDate || '');
    if (!expiryStr || expiryStr.length !== 5) {
      Alert.alert('Error', String('Please enter a valid expiry date (MM/YY)'));
      return;
    }

    const cvvStr = String(cvv || '');
    if (!cvvStr || cvvStr.length < 3) {
      Alert.alert('Error', String('Please enter a valid CVV'));
      return;
    }

    const nameStr = String(cardholderName || '').trim();
    if (!nameStr || nameStr.length === 0) {
      Alert.alert('Error', String('Please enter cardholder name'));
      return;
    }

    setProcessing(true);
    try {
      // Create session first
      const baseUrl = 'trilingo://payment';
      const successUrl = `${baseUrl}/success?levelId=${nextLevelId}`;
      const cancelUrl = `${baseUrl}/cancel`;

      const response: PaymentSessionResponse = await apiService.createPaymentSession(
        nextLevelId,
        successUrl,
        cancelUrl
      );

      if (!response.isSuccess) {
        const errorMsg = String(response.error || response.message || 'Failed to create payment session');
        Alert.alert('Error', errorMsg);
        setProcessing(false);
        return;
      }

      if (!response.sessionId) {
        Alert.alert('Error', String('Payment session ID not received'));
        setProcessing(false);
        return;
      }

      // For dummy payment, we'll directly mark as completed
      // Since this is a test payment, we skip Stripe verification
      // The session is created but we'll treat it as successful for dummy payments
      try {
        // For dummy payment with test card, we simulate success
        // In a real scenario, this would go through Stripe checkout
        // For now, we'll directly grant access after a short delay
        setTimeout(() => {
          setProcessing(false);
          setShowSuccessModal(true);
          // Animate success modal
          Animated.spring(successScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }, 1500);
      } catch (error: any) {
        console.error('Dummy payment processing error:', error);
        Alert.alert('Error', String('Payment processing failed'));
        setProcessing(false);
      }
    } catch (error: any) {
      console.error('Dummy payment error:', error);
      const errorMsg = String(error.response?.data?.error || error.response?.data?.message || error.message || 'Payment failed');
      Alert.alert('Error', errorMsg);
      setProcessing(false);
    }
  };

  const handleWebViewNavigation = (navState: any) => {
    const { url } = navState;
    
    // Check if payment was successful
    if (url.includes('/success') || url.includes('payment_status=paid')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const sessionId = urlParams.get('session_id') || urlParams.get('sessionId');
      
      if (sessionId) {
        verifyPaymentAndNavigate(sessionId);
      } else {
        // Try to extract from URL
        const match = url.match(/session_id=([^&]+)/);
        if (match && match[1]) {
          verifyPaymentAndNavigate(match[1]);
        }
      }
    } else if (url.includes('/cancel')) {
      setShowWebView(false);
      setSessionUrl(null);
    }
  };

  const verifyPaymentAndNavigate = async (sessionId: string) => {
    setProcessing(true);
    try {
      const response = await apiService.verifyPayment(sessionId);
      if (response.isSuccess && response.hasAccess) {
        setShowWebView(false);
        setSessionUrl(null);
        setProcessing(false);
        setShowSuccessModal(true);
        // Animate success modal
        Animated.spring(successScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();
      } else {
        Alert.alert('Error', String(response.error || 'Payment verification failed'));
        setProcessing(false);
      }
    } catch (error: any) {
      Alert.alert('Error', String(error.message || 'Payment verification failed'));
      setProcessing(false);
    }
  };

  if (showWebView && sessionUrl) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0284C7" />
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowWebView(false);
              setSessionUrl(null);
            }}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.webViewHeaderText}>Complete Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          source={{ uri: sessionUrl }}
          onNavigationStateChange={handleWebViewNavigation}
          style={styles.webView}
        />
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <>
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.successModalOverlay}>
          <Animated.View
            style={[
              styles.successModalCard,
              {
                transform: [{ scale: successScaleAnim }],
              },
            ]}
          >
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
            </View>

            {/* Success Title */}
            <Text style={[styles.successTitle, getLanguageTextStyle(nativeLanguage, 28)]}>
              Payment Successful! 🎉
            </Text>

            {/* Success Message */}
            <Text style={[styles.successMessage, getLanguageTextStyle(nativeLanguage, 16)]}>
              Your payment has been completed successfully! All lessons in {String(levelName || `Level ${nextLevelId}`)} are now unlocked.
            </Text>

            {/* Confetti Animation Placeholder */}
            <View style={styles.confettiContainer}>
              <Text style={styles.confettiEmoji}>🎊 🎉 🎈 ✨ 🎁</Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessModalClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successButtonGradient}
              >
                <MaterialCommunityIcons name="lock-open" size={24} color="#fff" />
                <Text style={[styles.successButtonText, getLanguageTextStyle(nativeLanguage, 18)]}>
                  Start Learning
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Main Payment Screen */}
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0284C7" />
      
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#0284C7', '#0EA5E9']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, getLanguageTextStyle(nativeLanguage, 20)]}>
          Unlock {String(levelName || `Level ${levelId}`)}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock" size={60} color="#0284C7" />
          </View>
          
          <Text style={[styles.title, getLanguageTextStyle(nativeLanguage, 24)]}>
            Unlock {String(levelName || `Level ${levelId}`)}
          </Text>
          
          <Text style={[styles.description, getLanguageTextStyle(nativeLanguage, 16)]}>
            Complete your payment to access all lessons in {String(levelName || `Level ${levelId}`)}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, getLanguageTextStyle(nativeLanguage, 14)]}>
              Price
            </Text>
            <Text style={[styles.price, getLanguageTextStyle(nativeLanguage, 32)]}>
              350 LKR
            </Text>
          </View>

          {/* Card Details Input */}
          <View style={styles.cardInfoContainer}>
            <Text style={[styles.cardInfoTitle, getLanguageTextStyle(nativeLanguage, 16)]}>
              Card Details
            </Text>
            
            {/* Card Number */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, getLanguageTextStyle(nativeLanguage, 14)]}>
                Card Number
              </Text>
              <TextInput
                style={[styles.textInput, getLanguageTextStyle(nativeLanguage, 16)]}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor="#9CA3AF"
                value={cardNumber}
                onChangeText={(text) => {
                  // Format card number with spaces
                  const formatted = text.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                  setCardNumber(formatted);
                }}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, getLanguageTextStyle(nativeLanguage, 14)]}>
                Cardholder Name
              </Text>
              <TextInput
                style={[styles.textInput, getLanguageTextStyle(nativeLanguage, 16)]}
                placeholder="Test User"
                placeholderTextColor="#9CA3AF"
                value={cardholderName}
                onChangeText={setCardholderName}
              />
            </View>

            {/* Expiry and CVV Row */}
            <View style={styles.rowInputContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, getLanguageTextStyle(nativeLanguage, 14)]}>
                  Expiry Date
                </Text>
                <TextInput
                  style={[styles.textInput, getLanguageTextStyle(nativeLanguage, 16)]}
                  placeholder="12/25"
                  placeholderTextColor="#9CA3AF"
                  value={expiryDate}
                  onChangeText={(text) => {
                    // Format expiry date MM/YY
                    let formatted = text.replace(/\D/g, '');
                    if (formatted.length >= 2) {
                      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
                    }
                    setExpiryDate(formatted);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, getLanguageTextStyle(nativeLanguage, 14)]}>
                  CVV
                </Text>
                <TextInput
                  style={[styles.textInput, getLanguageTextStyle(nativeLanguage, 16)]}
                  placeholder="123"
                  placeholderTextColor="#9CA3AF"
                  value={cvv}
                  onChangeText={(text) => {
                    const formatted = text.replace(/\D/g, '').substring(0, 3);
                    setCvv(formatted);
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payButton, (loading || processing) && styles.payButtonDisabled]}
            onPress={handleDummyPayment}
            disabled={loading || processing}
          >
            <LinearGradient
              colors={loading || processing ? ['#9CA3AF', '#6B7280'] : ['#43BCCD', '#FF6B9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              {loading || processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="payment" size={24} color="#fff" />
                  <Text style={[styles.payButtonText, getLanguageTextStyle(nativeLanguage, 18)]}>
                    Pay 350 LKR
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handleCreateSession}
            disabled={loading || processing}
          >
            <Text style={[styles.alternativeButtonText, getLanguageTextStyle(nativeLanguage, 14)]}>
              Use Stripe Checkout
            </Text>
          </TouchableOpacity>

          <Text style={[styles.note, getLanguageTextStyle(nativeLanguage, 12)]}>
            * This is a test payment. No real charges will be made.
          </Text>
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  cardInfoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  cardInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  cardInfoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  cardInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalCard: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 20,
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  confettiContainer: {
    marginVertical: 15,
  },
  confettiEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  successButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 10,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  payButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alternativeButton: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
  },
  alternativeButtonText: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0284C7',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 8,
  },
  webViewHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

