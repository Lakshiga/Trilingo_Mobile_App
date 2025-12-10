import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  StyleSheet,
  Text,
  Dimensions,
  Easing,
  Image,
  StatusBar,
} from "react-native";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

interface SplashProps {
  onFinish: () => void;
}

const Splash = ({ onFinish }: SplashProps) => {
  // --- ANIMATION VALUES ---
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  // Text Animations (Blur to Focus effect)
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(1.1)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  // Lottie Animation
  const lottieRef = useRef<LottieView>(null);
  const lottieOpacity = useRef(new Animated.Value(0)).current;

  // Half Circle Animation (slide down from top)
  const circleTranslateY = useRef(new Animated.Value(-CURVE_HEIGHT)).current;

  useEffect(() => {
    // START ANIMATION SEQUENCE
    Animated.sequence([
      // 0. Half Circle slides down from top
      Animated.timing(circleTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      
      // 1. Logo Pops in (Spring Effect)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      // 2. Text "Focus" Effect (Slide Up + Scale Down)
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Fade in Lottie animation
        Animated.timing(lottieOpacity, {
          toValue: 1,
          duration: 500,
          delay: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Start Lottie animation
      lottieRef.current?.play();
      
      // Wait for 3 seconds (loading duration) then exit
      setTimeout(() => {
        exitAnimation();
      }, 3000);
    });
  }, []);

  const exitAnimation = () => {
    // Stop Lottie animation
    lottieRef.current?.pause();
    
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(lottieOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      // Half Circle slides back up
      Animated.timing(circleTranslateY, {
        toValue: -CURVE_HEIGHT,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(onFinish);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />

      {/* --- PROFESSIONAL CURVED HEADER (The Blue Part) --- */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: circleTranslateY }],
          },
        ]}
      >
        <View style={styles.blueCurve} />
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <View style={styles.contentWrapper}>
        
        {/* LOGO CONTAINER (Overlapping the curve) */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* White circle behind logo to make it pop */}
          <View style={styles.logoCircleBg}>
            <Image
              source={require("../../assets/animations/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* TEXT SECTION */}
        <Animated.View
          style={{
            opacity: textOpacity,
            alignItems: "center",
            transform: [
              { scale: textScale },
              { translateY: textTranslateY }
            ],
            marginTop: 40, // Space below the logo
          }}
        >
          <Text style={styles.brand}>Q-bit</Text>
          <Text style={styles.slogan}>LEARN BIT TO BIT</Text>
        </Animated.View>

      </View>

      {/* LOTTIE LOADING ANIMATION */}
      <Animated.View style={[styles.lottieContainer, { opacity: lottieOpacity }]}>
        <LottieView
          ref={lottieRef}
          source={require("../../assets/animations/loading.json")}
          style={styles.lottieAnimation}
          autoPlay={false}
          loop={true}
          speed={1}
        />
      </Animated.View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </View>
  );
};

export default Splash;

// --- STYLES ---
const CURVE_HEIGHT = height * 0.45; // 45% of screen height
const LOGO_SIZE = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // 1. The Top Blue Curved Section
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CURVE_HEIGHT,
    overflow: "hidden", // Ensures the curve clips correctly
    zIndex: 1,
  },
  blueCurve: {
    backgroundColor: "#002D62", // Professional Deep Royal Blue
    width: width * 2, // Double width to make the curve gentle
    height: width * 2,
    borderRadius: width, // Makes it a circle
    position: "absolute",
    bottom: 0, // Align bottom of circle to container bottom
    left: -(width * 0.5), // Center it horizontally
    // Adds a subtle shadow to the curve for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },

  // 2. The Wrapper for Logo + Text
  contentWrapper: {
    flex: 1,
    zIndex: 2,
    alignItems: "center",
    // This positions the content start point relative to the curve
    paddingTop: CURVE_HEIGHT - (LOGO_SIZE / 2), 
  },

  // 3. Logo Styling
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    // Shadow for the logo container (makes it float)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  logoCircleBg: {
    width: 290,
    height: 290,
    backgroundColor: "#FFFFFF",
    borderRadius: LOGO_SIZE / 2, // Perfect Circle
    alignItems: "center",
    justifyContent: "center",
    padding: 20, // Padding inside the white circle
  },
  logo: {
    width: 290,
    height: 290,
  },

  // 4. Text Styling
  brand: {
    fontSize: 38,
    fontWeight: "800",
    color: "#002D62", // Matches the header color
    letterSpacing: 0.5,
  },
  slogan: {
    fontSize: 14,
    color: "#718096", // Cool Gray
    marginTop: 8,
    fontWeight: "600",
    letterSpacing: 2, // Wide spacing for premium look
  },

  // 5. Lottie Animation Container
  lottieContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },

  // 6. Footer
  footer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
    zIndex: 3,
  },
  footerText: {
    color: "#A0AEC0",
    fontSize: 12,
    fontWeight: "500",
  },
});