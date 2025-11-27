import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  Linking,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../utils/responsive';

const TERMS_LINKS = {
  privacy: 'https://example.com/privacy',
  terms: 'https://example.com/terms',
  subscription: 'https://example.com/subscription-terms',
};

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const responsive = useResponsive();
  const headerBounce = useRef(new Animated.Value(0)).current;
  const characterFloat = useRef(new Animated.Value(0)).current;
  const sparklePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerBounce, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(headerBounce, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(characterFloat, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(characterFloat, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparklePulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(sparklePulse, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [characterFloat, headerBounce, sparklePulse]);

  const styles = getStyles(responsive);

  const headerAnimatedStyle = {
    transform: [
      {
        translateY: headerBounce.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -responsive.hp(1.5)],
        }),
      },
    ],
  };

  const characterAnimatedStyle = {
    transform: [
      {
        translateY: characterFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -responsive.hp(2)],
        }),
      },
      {
        scale: characterFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.03],
        }),
      },
    ],
  };

  const sparkleAnimatedStyle = {
    opacity: sparklePulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: sparklePulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(console.warn);
  };

  return (
    <LinearGradient colors={['#1c2e3c', '#1c2e3c']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <Animated.Text style={[styles.heading, headerAnimatedStyle]}>
          Welcome to Q-Bit
        </Animated.Text>
        <Text style={styles.description}>
          We help parents around the world raise children with ease
        </Text>

        <View style={styles.animationWrapper}>
          <Animated.View style={[styles.characterWrapper, characterAnimatedStyle]}>
            <Image
              source={require('../../assets/Lion.gif')}
              resizeMode="contain"
              style={styles.character}
            />
          </Animated.View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I have an account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>By continuing you accept our: </Text>
          <Text style={styles.linksRow}>
            <Text style={styles.linkText} onPress={() => openLink(TERMS_LINKS.privacy)}>
              Privacy policy
            </Text>
            <Text style={styles.termsText}>, </Text>
            <Text style={styles.linkText} onPress={() => openLink(TERMS_LINKS.terms)}>
              Terms of use
            </Text>
            <Text style={styles.termsText}> and </Text>
            <Text style={styles.linkText} onPress={() => openLink(TERMS_LINKS.subscription)}>
              Subscription terms
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: responsive.wp(8),
      paddingBottom: responsive.hp(4),
    },
    heading: {
      fontSize: responsive.wp(8),
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: responsive.hp(6),
      marginBottom: responsive.hp(1),
    },
    description: {
      fontSize: responsive.wp(4.2),
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      marginBottom: responsive.hp(4),
    },
    animationWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    characterWrapper: {
      width: responsive.wp(75),
      height: responsive.wp(75),
      borderRadius: responsive.wp(27.5),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    character: {
      width: '150%',
      height: '150%',
    },
    sparkle: {
      position: 'absolute',
      width: responsive.wp(4),
      height: responsive.wp(4),
      borderRadius: responsive.wp(2),
      backgroundColor: '#F8F0FF',
    },
    sparkleLeft: {
      top: responsive.hp(25),
      left: responsive.wp(18),
    },
    sparkleRight: {
      top: responsive.hp(20),
      right: responsive.wp(18),
    },
    buttonsContainer: {
      width: '100%',
      marginBottom: responsive.hp(3),
    },
    primaryButton: {
      backgroundColor: '#47C268',
      paddingVertical: responsive.hp(2),
      borderRadius: responsive.wp(7),
      alignItems: 'center',
      marginBottom: responsive.hp(2),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.6) },
      shadowOpacity: 0.2,
      shadowRadius: responsive.wp(2),
      elevation: 5,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: responsive.wp(4.8),
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: responsive.hp(1.5),
    },
    secondaryButtonText: {
      color: '#FFFFFF',
      fontSize: responsive.wp(4.4),
      fontWeight: '600',
    },
    termsContainer: {
      width: '100%',
    },
    termsText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: responsive.wp(3.4),
      textAlign: 'center',
    },
    linksRow: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: responsive.wp(3.4),
      textAlign: 'center',
      marginTop: responsive.hp(0.5),
    },
    linkText: {
      color: '#FFFFFF',
      textDecorationLine: 'underline',
      fontWeight: '600',
    },
  });

export default WelcomeScreen;


