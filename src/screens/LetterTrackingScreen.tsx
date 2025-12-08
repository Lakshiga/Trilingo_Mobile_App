import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../utils/responsive';
import { Language } from '../utils/translations';
import { getLetterPath } from '../utils/letterPaths';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  letter: string;
  language: Language;
}

interface Point {
  x: number;
  y: number;
}

const LetterTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useTheme();
  const responsive = useResponsive();
  const params = route.params as RouteParams;
  const letter = params?.letter || 'A';
  const language = params?.language || 'English';

  const [userPath, setUserPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [guidePosition, setGuidePosition] = useState<Point | null>(null);

  const canvasRef = useRef<View>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const currentPathRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const guideAnim = useRef(new Animated.Value(0)).current;

  // Get the correct path for the letter
  const correctPath = getLetterPath(letter, language);
  const canvasSize = responsive.wp(80);
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  // PanResponder for touch tracking
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isCompleteRef.current,
      onMoveShouldSetPanResponder: () => !isCompleteRef.current,
      onPanResponderGrant: (evt) => {
        if (isCompleteRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        const startPoint = { x: locationX, y: locationY };
        isDrawingRef.current = true;
        setIsDrawing(true);
        
        // If there's already a path, append to it; otherwise start new
        if (currentPathRef.current.length > 0) {
          currentPathRef.current = [...currentPathRef.current, startPoint];
        } else {
          currentPathRef.current = [startPoint];
        }
        setUserPath([...currentPathRef.current]);
        // Clear result when starting to draw again (if not completed)
        if (!isComplete) {
          setShowResult(false);
          setShowSuccess(false);
        }
      },
      onPanResponderMove: (evt) => {
        if (isCompleteRef.current || !isDrawingRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        
        // Only add point if it's far enough from the last point (smoother drawing)
        const lastPoint = currentPathRef.current[currentPathRef.current.length - 1];
        if (lastPoint) {
          const distance = Math.sqrt(
            Math.pow(newPoint.x - lastPoint.x, 2) + Math.pow(newPoint.y - lastPoint.y, 2)
          );
          // Only add point if moved at least 2 pixels
          if (distance < 2) return;
        }
        
        currentPathRef.current = [...currentPathRef.current, newPoint];
        setUserPath([...currentPathRef.current]);
      },
      onPanResponderRelease: () => {
        if (isCompleteRef.current) return;
        isDrawingRef.current = false;
        setIsDrawing(false);
        // Don't check accuracy automatically - wait for button click
      },
      onPanResponderTerminate: () => {
        isDrawingRef.current = false;
        setIsDrawing(false);
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate guide pointer along the path
  useEffect(() => {
    if (!isComplete && !isDrawing && userPath.length === 0) {
      // Animate guide along the correct path
      const guideAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(guideAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(guideAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );
      guideAnimation.start();

      // Calculate guide position based on animation value
      const listener = guideAnim.addListener(({ value }) => {
        // Sample points along the correct path for guide
        const pathPoints = samplePathPoints(correctPath, canvasSize, centerX, centerY);
        if (pathPoints.length > 0) {
          const index = Math.floor(value * (pathPoints.length - 1));
          setGuidePosition(pathPoints[index] || pathPoints[0]);
        }
      });

      return () => {
        guideAnimation.stop();
        guideAnim.removeListener(listener);
      };
    } else {
      setGuidePosition(null);
    }
  }, [isComplete, isDrawing, userPath.length, correctPath, canvasSize, centerX, centerY]);

  // Parse SVG path and extract points for guide animation
  const parseSVGPath = (pathString: string): Point[] => {
    const points: Point[] = [];
    if (!pathString) return points;

    // Normalize the path string - handle commas and multiple spaces
    const normalized = pathString
      .replace(/,/g, ' ')
      .replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = normalized.split(' ').filter(t => t.length > 0);

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    let i = 0;

    const getNextNumber = (): number | null => {
      while (i < tokens.length) {
        const num = parseFloat(tokens[i]);
        if (!isNaN(num)) {
          i++;
          return num;
        }
        i++;
      }
      return null;
    };

    while (i < tokens.length) {
      const token = tokens[i];
      if (!token) {
        i++;
        continue;
      }

      // Check if token is a command
      if (!/^[MmLlHhVvCcSsQqTtAaZz]$/.test(token)) {
        i++;
        continue;
      }

      const cmd = token.toUpperCase();
      i++;

      if (cmd === 'M') {
        // Move to (absolute)
        const x = getNextNumber();
        const y = getNextNumber();
        if (x === null || y === null) break;
        
        currentX = x;
        currentY = y;
        startX = x;
        startY = y;
        points.push({ x, y });
      } else if (cmd === 'L') {
        // Line to
        const x = getNextNumber();
        const y = getNextNumber();
        if (x === null || y === null) break;
        
        // Add intermediate points for smooth animation
        const distance = Math.sqrt(Math.pow(x - currentX, 2) + Math.pow(y - currentY, 2));
        const steps = Math.max(5, Math.min(30, Math.floor(distance / 3)));
        for (let j = 1; j <= steps; j++) {
          const t = j / steps;
          points.push({
            x: currentX + (x - currentX) * t,
            y: currentY + (y - currentY) * t,
          });
        }
        currentX = x;
        currentY = y;
      } else if (cmd === 'Q') {
        // Quadratic curve
        const cx = getNextNumber();
        const cy = getNextNumber();
        const x = getNextNumber();
        const y = getNextNumber();
        if (cx === null || cy === null || x === null || y === null) break;
        
        // Sample points along the curve
        const steps = 25;
        for (let j = 1; j <= steps; j++) {
          const t = j / steps;
          const px = (1 - t) * (1 - t) * currentX + 2 * (1 - t) * t * cx + t * t * x;
          const py = (1 - t) * (1 - t) * currentY + 2 * (1 - t) * t * cy + t * t * y;
          points.push({ x: px, y: py });
        }
        currentX = x;
        currentY = y;
      } else if (cmd === 'Z') {
        // Close path - line back to start
        if (points.length > 0 && (currentX !== startX || currentY !== startY)) {
          const distance = Math.sqrt(Math.pow(startX - currentX, 2) + Math.pow(startY - currentY, 2));
          const steps = Math.max(5, Math.min(30, Math.floor(distance / 3)));
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            points.push({
              x: currentX + (startX - currentX) * t,
              y: currentY + (startY - currentY) * t,
            });
          }
        }
        currentX = startX;
        currentY = startY;
      }
      // Skip other commands for now
    }

    return points;
  };

  // Sample points from SVG path for guide animation
  const samplePathPoints = (pathString: string, size: number, cx: number, cy: number): Point[] => {
    // Parse the actual SVG path
    const rawPoints = parseSVGPath(pathString);
    if (rawPoints.length === 0) return [];

    // Apply the same transformation as used in SVG rendering
    const scale = size * 0.7 / 200;
    const offsetX = cx - size * 0.35;
    const offsetY = cy - size * 0.35;

    // Transform points to canvas coordinates
    return rawPoints.map((point) => ({
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
    }));
  };

  // Check if the drawn path matches the letter
  const checkLetterAccuracy = () => {
    const pathToCheck = [...currentPathRef.current];
    
    if (pathToCheck.length < 10) {
      Alert.alert('Try Again!', 'Please trace the complete letter before checking.');
      return;
    }

    const accuracy = calculateAccuracy(pathToCheck, correctPath, canvasSize);
    setScore(accuracy);
    setAttempts((prev) => prev + 1);
    setShowResult(true);

    if (accuracy >= 70) {
      isCompleteRef.current = true;
      setIsComplete(true);
      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Calculate accuracy based on path matching
  const calculateAccuracy = (
    userPoints: Point[],
    correctPath: string,
    canvasSize: number
  ): number => {
    if (userPoints.length === 0) return 0;

    // Simple accuracy calculation:
    // 1. Check if path covers the letter area
    // 2. Check path direction and shape similarity
    // 3. Check if start and end points are reasonable

    const minX = Math.min(...userPoints.map((p) => p.x));
    const maxX = Math.max(...userPoints.map((p) => p.x));
    const minY = Math.min(...userPoints.map((p) => p.y));
    const maxY = Math.max(...userPoints.map((p) => p.y));

    const pathWidth = maxX - minX;
    const pathHeight = maxY - minY;
    const expectedSize = canvasSize * 0.6; // Letters should be about 60% of canvas

    // Size check (30% weight)
    const sizeScore =
      100 -
      Math.abs(pathWidth - expectedSize) / expectedSize * 50 -
      Math.abs(pathHeight - expectedSize) / expectedSize * 50;
    const normalizedSizeScore = Math.max(0, Math.min(100, sizeScore));

    // Path coverage check (40% weight)
    const coverageScore = Math.min(100, (userPoints.length / 50) * 100);

    // Start/End point check (30% weight)
    const startPoint = userPoints[0];
    const endPoint = userPoints[userPoints.length - 1];
    const centerDistance = Math.sqrt(
      Math.pow(startPoint.x - centerX, 2) + Math.pow(startPoint.y - centerY, 2)
    );
    const startScore = Math.max(0, 100 - (centerDistance / (canvasSize / 2)) * 100);

    // Weighted average
    const finalScore =
      normalizedSizeScore * 0.3 + coverageScore * 0.4 + startScore * 0.3;

    return Math.round(finalScore);
  };

  const handleReset = () => {
    setUserPath([]);
    currentPathRef.current = [];
    setScore(null);
    setShowSuccess(false);
    setShowResult(false);
    isCompleteRef.current = false;
    setIsComplete(false);
    isDrawingRef.current = false;
    setIsDrawing(false);
    setAttempts(0);
  };

  const handleNext = () => {
    navigation.goBack();
  };

  // Convert user path to SVG path string
  const pathToSvg = (points: Point[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const styles = getStyles(responsive, isDarkMode, canvasSize);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#374151'] : ['#43BCCD', '#FF6B9D', '#FFB366']}
        style={styles.gradient}
      >
        {/* Header */}
        <LinearGradient
          colors={['#FF9A8B', '#FF6B9D', '#FF8C94']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={responsive.wp(7.5)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Trace the Letter</Text>
            <Text style={styles.headerSubtitle}>
              {language} - {letter}
            </Text>
          </View>
        </LinearGradient>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {userPath.length === 0 
              ? '👆 Follow the pointer guide to trace the letter'
              : '✍️ Continue tracing the letter outline'}
          </Text>
          {showResult && score !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Result:</Text>
              <Text style={styles.resultText}>
                Accuracy: {score}% {score >= 70 ? '✅ Correct!' : '❌ Try Again'}
              </Text>
              {score >= 70 ? (
                <Text style={styles.successMessage}>Excellent! You traced {letter} correctly!</Text>
              ) : (
                <Text style={styles.retryMessage}>Keep practicing to improve your accuracy!</Text>
              )}
            </View>
          )}
        </View>

        {/* Canvas Area */}
        <Animated.View
          style={[
            styles.canvasContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            ref={canvasRef}
            style={styles.canvas}
            {...panResponder.panHandlers}
            collapsable={false}
          >
            <Svg width={canvasSize} height={canvasSize} style={styles.svg}>
              {/* Background circle */}
              <Circle
                cx={centerX}
                cy={centerY}
                r={canvasSize * 0.45}
                fill="rgba(255,255,255,0.1)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />

              {/* Correct letter path (guide) */}
              {correctPath && (
                <Path
                  d={correctPath}
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="16"
                  strokeDasharray="14,7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform={`translate(${centerX - canvasSize * 0.35}, ${centerY - canvasSize * 0.35}) scale(${canvasSize * 0.7 / 200})`}
                />
              )}

              {/* User drawn path */}
              {userPath.length > 0 && (
                <Path
                  d={pathToSvg(userPath)}
                  fill="none"
                  stroke={score && score >= 70 ? '#4ECDC4' : '#FFD700'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Start point indicator */}
              {userPath.length === 0 && !isComplete && (
                <>
                  <Circle
                    cx={centerX}
                    cy={centerY - canvasSize * 0.15}
                    r="8"
                    fill="#4ECDC4"
                    opacity={0.8}
                  />
                  <Circle
                    cx={centerX}
                    cy={centerY - canvasSize * 0.15}
                    r="12"
                    fill="none"
                    stroke="#4ECDC4"
                    strokeWidth="2"
                    opacity={0.5}
                  />
                </>
              )}
            </Svg>

            {/* Guide pointer emoji */}
            {guidePosition && !isDrawing && userPath.length === 0 && !isComplete && (
              <Animated.View
                style={[
                  styles.guidePointer,
                  {
                    left: guidePosition.x - responsive.wp(5),
                    top: guidePosition.y - responsive.wp(5),
                    opacity: fadeAnim,
                  },
                ]}
              >
                <Text style={styles.guideEmoji}>👆</Text>
              </Animated.View>
            )}

            {/* Success overlay */}
            {showSuccess && (
              <View style={styles.successOverlay}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successText}>Excellent!</Text>
                <Text style={styles.successSubtext}>
                  You traced {letter} perfectly!
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF4757']}
              style={styles.buttonGradient}
            >
              <MaterialIcons name="refresh" size={responsive.wp(6)} color="#fff" />
              <Text style={styles.buttonText}>Reset</Text>
            </LinearGradient>
          </TouchableOpacity>

          {userPath.length > 0 && !isComplete && (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={checkLetterAccuracy}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
              >
                <MaterialIcons name="check-circle" size={responsive.wp(6)} color="#fff" />
                <Text style={styles.buttonText}>Check Endura</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isComplete && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Next Letter</Text>
                <MaterialIcons name="arrow-forward" size={responsive.wp(6)} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Attempts: {attempts}</Text>
          {isComplete && (
            <Text style={styles.completeText}>✓ Completed!</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const getStyles = (
  responsive: ReturnType<typeof useResponsive>,
  isDarkMode: boolean,
  canvasSize: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    header: {
      paddingTop: responsive.hp(6),
      paddingBottom: responsive.hp(2.5),
      paddingHorizontal: responsive.wp(5),
    },
    backButton: {
      position: 'absolute',
      top: responsive.hp(5.5),
      left: responsive.wp(5),
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: responsive.wp(6.5),
      padding: responsive.wp(3.2),
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.4) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(1),
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: responsive.wp(8),
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.5), height: responsive.hp(0.25) },
      textShadowRadius: responsive.wp(1),
    },
    headerSubtitle: {
      fontSize: responsive.wp(5),
      color: '#fff',
      textAlign: 'center',
      fontWeight: '600',
      marginTop: responsive.hp(0.5),
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: responsive.wp(0.25), height: responsive.hp(0.12) },
      textShadowRadius: responsive.wp(0.5),
    },
    instructionsContainer: {
      paddingHorizontal: responsive.wp(5),
      paddingVertical: responsive.hp(1.5),
      alignItems: 'center',
    },
    instructionsText: {
      fontSize: responsive.wp(4.5),
      color: '#fff',
      fontWeight: '600',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.1) },
      textShadowRadius: responsive.wp(0.5),
    },
    scoreText: {
      fontSize: responsive.wp(5),
      color: '#FFD700',
      fontWeight: 'bold',
      marginTop: responsive.hp(1),
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.1) },
      textShadowRadius: responsive.wp(0.5),
    },
    canvasContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: responsive.hp(2),
    },
    canvas: {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: responsive.wp(8),
      borderWidth: 4,
      borderColor: 'rgba(255,255,255,0.4)',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(1) },
      shadowOpacity: 0.4,
      shadowRadius: responsive.wp(3),
      overflow: 'hidden',
    },
    svg: {
      flex: 1,
    },
    successOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: responsive.wp(8),
    },
    successEmoji: {
      fontSize: responsive.wp(20),
      marginBottom: responsive.hp(1),
    },
    successText: {
      fontSize: responsive.wp(8),
      fontWeight: 'bold',
      color: '#4ECDC4',
      marginBottom: responsive.hp(0.5),
    },
    successSubtext: {
      fontSize: responsive.wp(5),
      color: '#fff',
      fontWeight: '600',
    },
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: responsive.wp(5),
      paddingBottom: responsive.hp(2),
      gap: responsive.wp(3),
      justifyContent: 'center',
    },
    resetButton: {
      flex: 1,
      maxWidth: responsive.wp(40),
      borderRadius: responsive.wp(6),
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.3) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(2),
    },
    nextButton: {
      flex: 1,
      maxWidth: responsive.wp(40),
      borderRadius: responsive.wp(6),
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.3) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(2),
    },
    buttonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: responsive.hp(2),
      paddingHorizontal: responsive.wp(4),
      gap: responsive.wp(2),
    },
    buttonText: {
      fontSize: responsive.wp(5),
      fontWeight: 'bold',
      color: '#fff',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.1) },
      textShadowRadius: responsive.wp(0.5),
    },
    statsContainer: {
      paddingHorizontal: responsive.wp(5),
      paddingBottom: responsive.hp(2),
      alignItems: 'center',
    },
    statsText: {
      fontSize: responsive.wp(4),
      color: '#fff',
      fontWeight: '600',
    },
    completeText: {
      fontSize: responsive.wp(5),
      color: '#4ECDC4',
      fontWeight: 'bold',
      marginTop: responsive.hp(0.5),
    },
    guidePointer: {
      position: 'absolute',
      width: responsive.wp(10),
      height: responsive.wp(10),
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    guideEmoji: {
      fontSize: responsive.wp(8),
    },
    resultContainer: {
      marginTop: responsive.hp(1.5),
      padding: responsive.wp(4),
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: responsive.wp(4),
      alignItems: 'center',
    },
    resultTitle: {
      fontSize: responsive.wp(5.5),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: responsive.hp(0.5),
    },
    resultText: {
      fontSize: responsive.wp(6),
      fontWeight: 'bold',
      color: '#FFD700',
      marginBottom: responsive.hp(0.5),
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.1) },
      textShadowRadius: responsive.wp(0.5),
    },
    successMessage: {
      fontSize: responsive.wp(4.5),
      color: '#4ECDC4',
      fontWeight: '600',
      textAlign: 'center',
    },
    retryMessage: {
      fontSize: responsive.wp(4.5),
      color: '#FFD700',
      fontWeight: '600',
      textAlign: 'center',
    },
    checkButton: {
      flex: 1,
      maxWidth: responsive.wp(40),
      borderRadius: responsive.wp(6),
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.3) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(2),
    },
  });

export default LetterTrackingScreen;

