import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../utils/responsive';

const StepsAnimationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const responsive = useResponsive();
  const [isReversing, setIsReversing] = useState(false);
  const [showReverseGif, setShowReverseGif] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const reverseScaleAnim = useRef(new Animated.Value(0)).current;
  const reverseOpacityAnim = useRef(new Animated.Value(0)).current;

  // Timer refs for GIF durations
  const firstGifTimer = useRef<NodeJS.Timeout | null>(null);
  const reverseGifTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-trigger continue after 4.5 seconds for the first GIF
  useEffect(() => {
    firstGifTimer.current = setTimeout(() => {
      // After 4.5 seconds, enable the continue button but don't auto-trigger
      // The user must click the continue button to proceed
    }, 4500);

    return () => {
      if (firstGifTimer.current) {
        clearTimeout(firstGifTimer.current);
      }
    };
  }, []);

  const handleContinue = () => {
    // Clear the first timer if it's still running
    if (firstGifTimer.current) {
      clearTimeout(firstGifTimer.current);
    }

    // Start reverse animation for the first GIF
    setIsReversing(true);
    
    // Animate first GIF out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Show reverse GIF after first animation completes
      setShowReverseGif(true);
      
      // Animate reverse GIF in
      Animated.parallel([
        Animated.timing(reverseScaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(reverseOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After reverse GIF is shown, wait 4 seconds then navigate
        reverseGifTimer.current = setTimeout(() => {
          navigation.replace('Register');
        }, 4000); // Show reverse GIF for 4 seconds
      });
    });
  };

  // Clean up timers
  useEffect(() => {
    return () => {
      if (firstGifTimer.current) {
        clearTimeout(firstGifTimer.current);
      }
      if (reverseGifTimer.current) {
        clearTimeout(reverseGifTimer.current);
      }
    };
  }, []);

  const styles = getStyles(responsive);

  const firstGifStyle = {
    transform: [
      { scale: scaleAnim },
    ],
    opacity: opacityAnim,
  };

  const reverseGifStyle = {
    transform: [
      { scale: reverseScaleAnim },
    ],
    opacity: reverseOpacityAnim,
  };

  return (
    <LinearGradient colors={['#1c2e3c', '#1c2e3c']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {!showReverseGif ? (
            <Animated.View style={[styles.gifContainer, firstGifStyle]}>
              <Image
                source={require('../../assets/5steps screen.gif')}
                resizeMode="contain"
                style={styles.gif}
              />
            </Animated.View>
          ) : (
            <Animated.View style={[styles.gifContainer, reverseGifStyle]}>
              <Image
                source={require('../../assets/reverse gif.gif')}
                resizeMode="contain"
                style={styles.gif}
              />
            </Animated.View>
          )}

          {/* Show continue button after 4.5 seconds or always available */}
          {!isReversing && !showReverseGif && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
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
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.wp(10),
      paddingVertical: responsive.hp(10),
    },
    gifContainer: {
      width: '100%',
      height: responsive.hp(60),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: responsive.hp(5),
    },
    gif: {
      width: '100%',
      height: '100%',
    },
    continueButton: {
      backgroundColor: '#47C268',
      paddingVertical: responsive.hp(2),
      paddingHorizontal: responsive.wp(12),
      borderRadius: responsive.wp(7),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.6) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(2),
      elevation: 5,
      minWidth: responsive.wp(60),
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: responsive.wp(5),
    },
  });

export default StepsAnimationScreen;