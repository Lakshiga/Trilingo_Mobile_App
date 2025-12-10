import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive'; // Ensure path is correct

const { width } = Dimensions.get('window');

const StepsAnimationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const responsive = useResponsive();
  const styles = getStyles(responsive);

  // Blue curve animation (slide down from top)
  const curveTranslateY = useRef(new Animated.Value(-responsive.hp(55))).current;
  
  // Rocket Lottie animation ref
  const rocketLottieRef = useRef<LottieView>(null);

  useEffect(() => {
    // Animate curve sliding down from top
    Animated.timing(curveTranslateY, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    
    // Start Rocket Lottie animation
    rocketLottieRef.current?.play();
  }, []);

  const handleContinue = () => {
    navigation.replace('Register');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />

      {/* --- TOP SECTION: BLUE CURVE HEADER --- */}
      <View style={styles.headerContainer}>
        <Animated.View 
          style={[
            styles.blueCurve,
            {
              transform: [{ translateY: curveTranslateY }],
            },
          ]} 
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Title Text inside the Blue Header */}
        <View style={styles.headerContent}>
          <Text style={styles.topText}>Just a Few Taps to Begin</Text>
        </View>
      </View>

      {/* --- MAIN CONTENT (Elephant & Text) --- */}
      <View style={styles.contentContainer}>
        
        {/* Rocket Lottie Animation Container */}
        <View style={styles.gifContainer}>
          <LottieView
            ref={rocketLottieRef}
            source={require('../../assets/animations/Rocket Lunch.json')}
            style={styles.gif}
            autoPlay={true}
            loop={true}
            speed={1}
          />
        </View>

        {/* Subtitle / Encouragement Text */}
        <Text style={styles.messageText}>
          We're Excited to Have You Onboard!
        </Text>

        {/* --- BOTTOM BUTTON --- */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF', // Clean White Background
    },

    // --- HEADER STYLES ---
    headerContainer: {
      height: responsive.hp(35), // Top 35% of the screen
      width: '100%',
      position: 'relative',
      zIndex: 1,
    },
    blueCurve: {
      position: 'absolute',
      top: -responsive.hp(20), // Pull up to create the curve shape from a big circle
      left: -width * 0.25,     // Center it
      width: width * 1.5,
      height: responsive.hp(55),
      backgroundColor: '#002D62', // Brand Royal Blue
      borderRadius: width,        // Makes it circular
      // Shadow for depth over the white bg
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 10,
    },
    backButton: {
      position: 'absolute',
      top: responsive.hp(6), // Below status bar
      left: responsive.wp(5),
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    headerContent: {
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.wp(10),
      paddingTop: responsive.hp(5), // Adjust based on status bar
    },
    topText: {
      fontSize: responsive.wp(9),
      color: '#FFFFFF', // White text on Blue bg looks premium
      textAlign: 'center',
      lineHeight: responsive.wp(12),
      fontFamily: 'SpicyRice-Regular', // Keeping your font preference
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
    },

    // --- CONTENT STYLES ---
    contentContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start', // Stack from top down
      paddingTop: responsive.hp(2),
    },
    gifContainer: {
      width: responsive.wp(80),
      height: responsive.wp(80),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -responsive.hp(5), // Pull slightly up into the blue area overlap
      zIndex: 2,
    },
    gif: {
      width: '100%',
      height: '100%',
    },
    messageText: {
      fontSize: responsive.wp(4.5),
      color: '#718096', // Cool Gray (Professional)
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: responsive.hp(2),
      marginTop: responsive.hp(8),
      width: '80%',
    },

    // --- BUTTON STYLES ---
    continueButton: {
      backgroundColor: '#002D62', // Brand Blue (Replacing the pink)
      width: responsive.wp(70),
      paddingVertical: responsive.hp(2),
      borderRadius: responsive.wp(8),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#002D62',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
      marginBottom: responsive.hp(2),
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: responsive.wp(5),
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });

export default StepsAnimationScreen;