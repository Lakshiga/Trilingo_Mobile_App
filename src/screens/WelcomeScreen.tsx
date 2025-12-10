import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
// If useResponsive is in a different path, adjust accordingly
import { useResponsive } from '../utils/responsive'; 

const { width, height } = Dimensions.get('window');

const TERMS_LINKS = {
  privacy: 'https://example.com/privacy',
  terms: 'https://example.com/terms',
  subscription: 'https://example.com/subscription-terms',
};

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const responsive = useResponsive();
  const styles = getStyles(responsive);

  // Blue curve animation (slide up from bottom)
  // Start from below the screen (positive value pushes it down)
  const curveTranslateY = useRef(new Animated.Value(width * 1.5)).current;
  
  // Lottie animation ref
  const familyLottieRef = useRef<LottieView>(null);

  const animateCircleUp = () => {
    // Reset to bottom position first
    curveTranslateY.setValue(width * 1.5);
    
    // Animate curve sliding up from bottom
    Animated.timing(curveTranslateY, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    
    // Start Lottie animation
    familyLottieRef.current?.play();
  };

  useFocusEffect(
    useCallback(() => {
      // Animate when screen comes into focus (including when navigating back)
      animateCircleUp();
    }, [])
  );

  const openLink = (url: string) => {
    Linking.openURL(url).catch(console.warn);
  };

  const handleGetStarted = () => {
    // Animate curve sliding down before navigation
    Animated.timing(curveTranslateY, {
      toValue: width * 1.5,
      duration: 500,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('StepsAnimation');
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* --- TOP SECTION (White Background) --- */}
      <View style={styles.topSection}>
        
        {/* Title & Description */}
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Welcome to <Text style={styles.brandColor}>Q-bit</Text></Text>
          <Text style={styles.description}>
            We help parents around the world raise children with ease
          </Text>
        </View>

        {/* Family Lottie Animation */}
        <View style={styles.imageContainer}>
          <LottieView
            ref={familyLottieRef}
            source={require('../../assets/animations/family.json')}
            style={styles.character}
            autoPlay={true}
            loop={true}
            speed={1}
          />
        </View>
      </View>

      {/* --- BOTTOM SECTION (Blue Curve Background) --- */}
      <View style={styles.bottomSectionContainer}>
        {/* The Blue Curved Background */}
        <Animated.View 
          style={[
            styles.blueCurveBackground,
            {
              transform: [{ translateY: curveTranslateY }],
            },
          ]} 
        />

        {/* Content inside the Blue Section */}
        <View style={styles.bottomContent}>
          
          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>

          {/* Login Option */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>
              I already have an account? <Text style={styles.registerHighlight}>Log in</Text>
            </Text>
          </TouchableOpacity>

          {/* Terms and Links */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>By continuing you accept our:</Text>
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => openLink(TERMS_LINKS.privacy)}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>, </Text>
              <TouchableOpacity onPress={() => openLink(TERMS_LINKS.terms)}>
                <Text style={styles.linkText}>Terms</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> & </Text>
              <TouchableOpacity onPress={() => openLink(TERMS_LINKS.subscription)}>
                <Text style={styles.linkText}>Subscription</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF', // Top half base color
    },
    
    // --- TOP SECTION STYLES ---
    topSection: {
      flex: 0.6, // Occupies top 60%
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: responsive.hp(8),
      zIndex: 1,
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: responsive.wp(8),
      marginBottom: responsive.hp(1.5),
    },
    heading: {
      fontSize: responsive.wp(9), // slightly smaller for elegance
      color: '#1A202C', // Dark Slate
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: responsive.hp(0.5),
    },
    brandColor: {
      color: '#002D62', // Matches Splash Screen Blue
    },
    description: {
      fontSize: responsive.wp(4),
      color: '#718096', // Cool Gray
      textAlign: 'center',
      lineHeight: responsive.wp(6),
    },
    imageContainer: {
      width: responsive.wp(90),
      height: responsive.wp(90),
      justifyContent: 'center',
      alignItems: 'center',
    },
    character: {
      width: '100%',
      height: '100%',
    },

    // --- BOTTOM SECTION STYLES ---
    bottomSectionContainer: {
      flex: 0.4, // Occupies bottom 40%
      justifyContent: 'flex-end',
      alignItems: 'center',
      position: 'relative',
    },
    // The Curve Shape
    blueCurveBackground: {
      position: 'absolute',
      backgroundColor: '#002D62', // Professional Deep Royal Blue
      width: width * 1.5, // Wider than screen to create gentle curve
      height: width * 1.5,
      borderRadius: width * 0.75, // Perfect circle
      top: 0, // Starts at the beginning of this section container
      alignSelf: 'center',
      // Shadow for depth
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
    },
    bottomContent: {
      width: '100%',
      height: '100%',
      justifyContent: 'center', // Centers buttons vertically in the blue area
      alignItems: 'center',
      paddingHorizontal: responsive.wp(8),
      paddingTop: responsive.hp(4), // Push content down a bit into the curve
    },

    // --- BUTTONS & LINKS ---
    primaryButton: {
      backgroundColor: '#FFFFFF', // White button stands out on Blue bg
      width: '100%',
      paddingVertical: responsive.hp(2),
      borderRadius: responsive.wp(4),
      alignItems: 'center',
      marginBottom: responsive.hp(2),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    primaryButtonText: {
      color: '#002D62', // Blue text
      fontWeight: '800',
      fontSize: responsive.wp(4.5),
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: responsive.hp(1),
      marginBottom: responsive.hp(3),
    },
    secondaryButtonText: {
      color: '#A0AEC0', // Light Gray
      fontSize: responsive.wp(3.8),
      fontWeight: '500',
    },
    registerHighlight: {
      color: '#43BCCD', // Cyan/Teal for "Log in" pop
      fontWeight: 'bold',
      textDecorationLine: 'underline',
    },

    // --- FOOTER LINKS ---
    termsContainer: {
      alignItems: 'center',
      position: 'absolute',
      bottom: responsive.hp(3), // Stick to very bottom
    },
    termsText: {
      color: 'rgba(255,255,255,0.6)', // Semi-transparent white
      fontSize: responsive.wp(3),
      textAlign: 'center',
    },
    linksRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: responsive.hp(0.5),
    },
    linkText: {
      color: '#FFFFFF',
      fontSize: responsive.wp(3),
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });

export default WelcomeScreen;