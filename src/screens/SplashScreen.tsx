import React, { useEffect, useRef, useState } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface SplashProps {
  onFinish: () => void;
}

const Splash = ({ onFinish }: SplashProps) => {
  // Flag to show the loader after logo animation finishes
  const [loaderVisible, setLoaderVisible] = useState(false);

  // Logo animation values (Scale and Opacity)
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Line Loader animation value (controls the width of the bar)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Configuration
  const logoDuration = 1500;
  const loaderDuration = 2500; // Time the progress bar takes to fill

  // Logo animation (Scale In)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: logoDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: logoDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Show loader only AFTER logo animation finishes
      setLoaderVisible(true);
      startLoaderAnimation();
    });
  }, []);

  // Loader Animation (Line Fill)
  const startLoaderAnimation = () => {
    // Animate the progress value from 0 to 1
    Animated.timing(progressAnim, {
      toValue: 1, // 1 represents 100% of the width
      duration: loaderDuration,
      useNativeDriver: false, // Must be false for interpolation/width update
    }).start();

    // Finish after the loading duration
    setTimeout(() => {
      onFinish();
    }, loaderDuration);
  };

  // Map the 0-1 progress value to the dynamic width percentage
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.Image
        source={require("../../assets/LOGO.png")}
        style={{
          width: 200,
          height: 200,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
        resizeMode="contain"
      />

      {/* Line Loading Bar */}
      {loaderVisible && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFiller,
              { width: progressWidth },
            ]}
          />
        </View>
      )}
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarContainer: {
    marginTop: 35, // Increased margin for better separation from logo
    width: '70%',
    height: 6, // Thin line loader
    backgroundColor: '#e0e0e0', // Light gray track
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFiller: {
    height: '100%',
    // Blue color for the fill
    backgroundColor: "#007bff", 
    borderRadius: 3,
  },
});