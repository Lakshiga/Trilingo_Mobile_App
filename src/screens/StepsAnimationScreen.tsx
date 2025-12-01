import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../utils/responsive';

const StepsAnimationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const responsive = useResponsive();

  const handleContinue = () => {
    navigation.replace('Register');
  };

  const styles = getStyles(responsive);

  return (
    <View style={styles.whiteBackground}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>

          {/* 🔥 Spicy Rice Text */}
          <Text style={styles.topText}>Just a Few Taps to Begin</Text>

          {/* GIF */}
          <Animated.View style={styles.gifContainer}>
            <Image
              source={require('../../assets/elephant2.gif')}
              resizeMode="contain"

              
              style={styles.gif}
            />
          </Animated.View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <Text style={styles.messageText}>
            We're Excited to Have You Onboard!
          </Text>

        </View>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    whiteBackground: {
      flex: 1,
      backgroundColor: '#ffffff', // White background
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.wp(5),
    },

    // 🔥 Spicy Rice Text
    topText: {
      fontSize: responsive.wp(12),   // Big size
      color: '#1e3622ff',
      marginBottom: responsive.hp(3),
      textAlign: 'center',
      letterSpacing: 1.5,
      textShadowColor: '#aaa',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 2,
      fontFamily: 'SpicyRice-Regular', // Your TTF font applied
    },

    gifContainer: {
      width: '75%',
      height: responsive.hp(50), 
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: responsive.hp(5),
    },
    gif: {
      width: '150%',
    },

    continueButton: {
      backgroundColor: '#47C268',
      paddingVertical: responsive.hp(2),
      paddingHorizontal: responsive.wp(12),
      borderRadius: responsive.wp(7),
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      minWidth: responsive.wp(60),
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: responsive.wp(5),
    },

    messageText: {
    marginTop: responsive.hp(3),
    fontSize: responsive.wp(4.5), // medium size
    color: '#6a7268ff',
    textAlign: 'center',
    marginBottom: responsive.hp(2),
    fontWeight: '600',
    },

  });

export default StepsAnimationScreen;
