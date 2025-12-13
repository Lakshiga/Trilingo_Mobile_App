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
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface SplashProps {
  onFinish: () => void;
}

const CURVE_HEIGHT = height * 0.45;
const LOGO_SIZE = 160;

const Splash = ({ onFinish }: SplashProps) => {
  // --- ANIMATION VALUES ---
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;

  const lottieRef = useRef<LottieView>(null);
  const lottieOpacity = useRef(new Animated.Value(0)).current;

  const circleTranslateY = useRef(new Animated.Value(-CURVE_HEIGHT)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(circleTranslateY, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(lottieOpacity, {
          toValue: 1,
          duration: 500,
          delay: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      lottieRef.current?.play();
      setTimeout(() => exitAnimation(), 3000);
    });
  }, []);

  const exitAnimation = () => {
    lottieRef.current?.pause();
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(lottieOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(circleTranslateY, {
        toValue: -CURVE_HEIGHT,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(onFinish);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- SOFT CURVED HEADER --- */}
      <Animated.View
        style={[styles.headerContainer, { transform: [{ translateY: circleTranslateY }] }]}
      >
        <LinearGradient
          colors={["#59A4C6", "#4289BA", "#2D4F9C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCurve}
        />
      </Animated.View>

      {/* --- MAIN CONTENT --- */}
      <View style={styles.contentWrapper}>
        {/* LOGO */}
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoCircleBg}>
            <Image
              source={require("../../assets/animations/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* TEXT */}
        <Animated.View
          style={{
            opacity: textOpacity,
            alignItems: "center",
            transform: [{ translateY: textTranslateY }],
            marginTop: 30,
          }}
        >
          <Text style={styles.brand}>Q-bit</Text>
          <Text style={styles.slogan}>LEARN BIT BY BIT</Text>
        </Animated.View>
      </View>

      {/* LOTTIE LOADING */}
      <Animated.View style={[styles.lottieContainer, { opacity: lottieOpacity }]}>
        <LottieView
          ref={lottieRef}
          source={require("../../assets/animations/loading.json")} // Child-friendly rainbow
          style={styles.lottieAnimation}
          autoPlay={false}
          loop={true}
        />
      </Animated.View>
    </View>
  );
};

export default Splash;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D3846",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CURVE_HEIGHT,
    overflow: "visible",
    zIndex: 1,
    alignItems: "center",
  },
  gradientCurve: {
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: width * 0.9,
    position: "absolute",
    bottom: 0,
    shadowColor: "rgba(66,137,186,0.25)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  contentWrapper: {
    flex: 1,
    zIndex: 2,
    alignItems: "center",
    paddingTop: CURVE_HEIGHT - LOGO_SIZE / 1.8,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoCircleBg: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    backgroundColor: "#ffffffff",
    borderRadius: LOGO_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    borderWidth: 4,
    borderColor: "#2D4F9C",
  },
  logo: {
    width: "200%",
    height: "200%",
  },
  brand: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    fontFamily: "System",
  },
  slogan: {
    fontSize: 14,
    color: "#59A4C6",
    marginTop: 5,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  lottieContainer: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
    zIndex: 3,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
});
