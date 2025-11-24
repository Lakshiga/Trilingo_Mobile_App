import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveDimensions {
  width: number;
  height: number;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  wp: (percentage: number) => number; // width percentage
  hp: (percentage: number) => number; // height percentage
}

// Base dimensions for reference (typical mobile device)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

/**
 * Get responsive dimensions and utilities
 * Updates automatically on screen size/orientation changes
 */
export const useResponsive = (): ResponsiveDimensions => {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const scale = (size: number): number => {
    return (dimensions.width / BASE_WIDTH) * size;
  };

  const verticalScale = (size: number): number => {
    return (dimensions.height / BASE_HEIGHT) * size;
  };

  const moderateScale = (size: number, factor: number = 0.5): number => {
    return size + (scale(size) - size) * factor;
  };

  const wp = (percentage: number): number => {
    return (dimensions.width * percentage) / 100;
  };

  const hp = (percentage: number): number => {
    return (dimensions.height * percentage) / 100;
  };

  return {
    width: dimensions.width,
    height: dimensions.height,
    scale,
    verticalScale,
    moderateScale,
    wp,
    hp,
  };
};

/**
 * Get responsive font size based on screen width
 */
export const getResponsiveFontSize = (baseSize: number, width: number): number => {
  const scale = width / BASE_WIDTH;
  return Math.max(baseSize * 0.8, Math.min(baseSize * scale, baseSize * 1.2));
};

/**
 * Get responsive dimensions without hook (for StyleSheet.create)
 * Note: This won't update on dimension changes, use useResponsive hook for dynamic updates
 */
export const getResponsiveDimensions = (): { width: number; height: number } => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

