import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useTheme } from '../../theme/ThemeContext';
import apiService from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Bubble {
  id: string;
  content: MultiLingualText;
}

interface FixedBubble extends Bubble {
  isExploded: boolean;
  position: Animated.ValueXY;
  currentPos: { x: number; y: number }; // Track actual position
  velocity: { x: number; y: number };
  scaleAnim: Animated.Value;
  shakeAnim: Animated.Value;
}

interface ShootableBubble extends Bubble {
  isAvailable: boolean;
  isDecoy?: boolean; // Decoy bubbles that don't match
}

interface ShootingBubble {
  bubble: ShootableBubble;
  position: Animated.ValueXY;
  isTraveling: boolean;
  targetId?: string;
}

interface AnswerPair {
  shootableId: string;
  fixedId: string;
}

interface BubbleBlastContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  contentType: 'word' | 'letter' | 'image';
  fixedBubbles: Bubble[];
  shootableBubbles: Bubble[];
  answerPairs: AnswerPair[];
}

const BubbleBlast: React.FC<ActivityComponentProps> = ({
  content: initialContent,
  currentLang = 'ta',
  onComplete,
  activityId,
  currentExerciseIndex: propExerciseIndex = 0,
  onExerciseComplete,
}) => {
  const { theme } = useTheme();
  const [allExercises, setAllExercises] = useState<BubbleBlastContent[]>([]);
  const [loading, setLoading] = useState<boolean>(!!activityId);
  const [fixedBubbles, setFixedBubbles] = useState<FixedBubble[]>([]);
  const [shootableBubbles, setShootableBubbles] = useState<ShootableBubble[]>([]);
  const [selectedBubbleIndex, setSelectedBubbleIndex] = useState<number>(0);
  const [shootingBubble, setShootingBubble] = useState<ShootingBubble | null>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [aimLineEnd, setAimLineEnd] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);
  
  // Sound effects
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound | null }>({});
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fixedBubblesRef = useRef<FixedBubble[]>([]);

  // Fetch all exercises for the activity
  useEffect(() => {
    const fetchExercises = async () => {
      if (!activityId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const exercises = await apiService.getExercisesByActivityId(activityId);

        if (!exercises || exercises.length === 0) {
          setLoading(false);
          return;
        }

        const sortedExercises = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const exerciseContents: BubbleBlastContent[] = [];

        // Get global contentType from first exercise
        let globalContentType: 'word' | 'letter' | 'image' = 'word';
        if (sortedExercises.length > 0 && sortedExercises[0].jsonData) {
          try {
            const firstExerciseData = JSON.parse(sortedExercises[0].jsonData);
            if (firstExerciseData.contentType) {
              const ct = firstExerciseData.contentType.toLowerCase();
              globalContentType = ct === 'image' ? 'image' : ct === 'letter' ? 'letter' : 'word';
            }
          } catch (e) {
            // Use default
          }
        }

        sortedExercises.forEach((exercise) => {
          try {
            if (exercise.jsonData) {
              const parsedData = JSON.parse(exercise.jsonData);

              let contentType: 'word' | 'letter' | 'image' = globalContentType;
              if (parsedData.contentType) {
                const ct = parsedData.contentType.toLowerCase();
                contentType = ct === 'image' ? 'image' : ct === 'letter' ? 'letter' : 'word';
              }

              const title: MultiLingualText = parsedData.title || { ta: '', en: '', si: '' };
              const instruction: MultiLingualText = parsedData.instruction || { ta: '', en: '', si: '' };
              const fixedBubblesList: Bubble[] = [];
              const shootableBubblesList: Bubble[] = [];
              const answerPairsList: AnswerPair[] = [];

              // Extract bubbles and answer pairs
              if (parsedData.fixedBubbles && Array.isArray(parsedData.fixedBubbles)) {
                fixedBubblesList.push(...parsedData.fixedBubbles);
              } else if (parsedData.fixedBubble) {
                fixedBubblesList.push(parsedData.fixedBubble);
              }

              if (parsedData.shootableBubbles && Array.isArray(parsedData.shootableBubbles)) {
                shootableBubblesList.push(...parsedData.shootableBubbles);
              } else if (parsedData.shootableBubble) {
                shootableBubblesList.push(parsedData.shootableBubble);
              }

              if (parsedData.answerPairs && Array.isArray(parsedData.answerPairs)) {
                answerPairsList.push(...parsedData.answerPairs);
              } else if (parsedData.answerPair) {
                answerPairsList.push(parsedData.answerPair);
              }

              // Check if exercise itself is a bubble
              if (parsedData.id && parsedData.content) {
                if (parsedData.isFixed || parsedData.type === 'fixed') {
                  fixedBubblesList.push({
                    id: parsedData.id,
                    content: parsedData.content,
                  });
                } else {
                  shootableBubblesList.push({
                    id: parsedData.id,
                    content: parsedData.content,
                  });
                }
              }

              if (fixedBubblesList.length > 0 || shootableBubblesList.length > 0) {
                exerciseContents.push({
                  title,
                  instruction,
                  contentType,
                  fixedBubbles: fixedBubblesList,
                  shootableBubbles: shootableBubblesList,
                  answerPairs: answerPairsList,
                });
              }
            }
          } catch (parseError) {
            // Skip invalid exercise
          }
        });

        if (exerciseContents.length > 0) {
          setAllExercises(exerciseContents);
        }
      } catch (error) {
        console.error('Error fetching BubbleBlast exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [activityId]);

  const bubbleBlastData = allExercises[propExerciseIndex] || null;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return 'N/A';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };


  // Initialize game when exercise changes
  useEffect(() => {
    if (bubbleBlastData?.fixedBubbles && !loading) {
      initializeGame();
      setExerciseCompleted(false);
      setScore(0);
      setIsGameActive(true);
    }
  }, [bubbleBlastData, propExerciseIndex, loading]);

  // Start continuous movement for fixed bubbles using animation loop
  const startFixedBubbleMovement = (bubbles: FixedBubble[]) => {
    bubbles.forEach((bubble) => {
      if (bubble.isExploded) return;

      const animateBubble = () => {
        if (bubble.isExploded) return;

        // Use tracked position
        let newX = bubble.currentPos.x + bubble.velocity.x;
        let newY = bubble.currentPos.y + bubble.velocity.y;

        // Bounce off walls
        if (newX <= 40 || newX >= SCREEN_WIDTH - 40) {
          bubble.velocity.x *= -1;
          newX = Math.max(40, Math.min(SCREEN_WIDTH - 40, newX));
        }
        if (newY <= 100 || newY >= SCREEN_HEIGHT / 2) {
          bubble.velocity.y *= -1;
          newY = Math.max(100, Math.min(SCREEN_HEIGHT / 2, newY));
        }

        // Update tracked position
        bubble.currentPos = { x: newX, y: newY };

        // Animate to new position
        Animated.timing(bubble.position, {
          toValue: { x: newX, y: newY },
          duration: 100,
          useNativeDriver: false,
          easing: Easing.linear,
        }).start(() => {
          if (!bubble.isExploded) {
            animateBubble();
          }
        });
      };

      // Start animation with delay for each bubble
      setTimeout(() => animateBubble(), Math.random() * 500);
    });
  };

  const initializeGame = () => {
    if (!bubbleBlastData) return;
    
    // Get fixed bubbles (targets)
    const fixedBubblesData = bubbleBlastData.fixedBubbles.slice(0, 5);
    
    // Get shootable bubbles (matching ones)
    const matchingShootable = bubbleBlastData.shootableBubbles.slice(0, 5);
    
    // Create 3 decoy bubbles (don't match any fixed bubble)
    const decoyBubbles: ShootableBubble[] = [];
    const allFixedContents = fixedBubblesData.map(b => getText(b.content));
    const allShootableContents = matchingShootable.map(b => getText(b.content));
    
    // Generate decoys with unique content
    for (let i = 0; i < 3; i++) {
      let decoyContent = '';
      const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      do {
        decoyContent = possibleChars[Math.floor(Math.random() * possibleChars.length)];
      } while (allFixedContents.includes(decoyContent) || allShootableContents.includes(decoyContent));
      
      decoyBubbles.push({
        id: `decoy-${i}`,
        content: { [currentLang]: decoyContent, en: decoyContent, ta: decoyContent, si: decoyContent },
        isAvailable: true,
        isDecoy: true,
      });
    }
    
    // Combine matching and decoy bubbles
    const allShootable = [...matchingShootable, ...decoyBubbles];
    
    // Initialize fixed bubbles with velocity and animated position
    const initialFixed: FixedBubble[] = fixedBubblesData.map((b, index) => {
      const startX = (SCREEN_WIDTH / 6) * (index + 1) - 40;
      const startY = 120 + Math.random() * 60;
      
      return {
        ...b,
        isExploded: false,
        position: new Animated.ValueXY({ x: startX, y: startY }),
        currentPos: { x: startX, y: startY },
        velocity: {
          x: (Math.random() - 0.5) * 2, // Random velocity between -1 and 1
          y: (Math.random() - 0.5) * 2,
        },
        scaleAnim: new Animated.Value(1),
        shakeAnim: new Animated.Value(0),
      };
    });

    const initialShootable: ShootableBubble[] = allShootable.map(b => ({
      ...b,
      isAvailable: true,
    }));

    setFixedBubbles(initialFixed);
    fixedBubblesRef.current = initialFixed;
    setShootableBubbles(initialShootable);
    setSelectedBubbleIndex(0);
    setShootingBubble(null);
    setScore(0);
    setIsGameActive(true);
    setIsAiming(false);
    setShowCongratulations(false);
    setExerciseCompleted(false);
    
    // Start fixed bubble movement
    startFixedBubbleMovement(initialFixed);
  };

  // Handle scroll to update selected bubble index
  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const bubbleWidth = 85;
    const centerIndex = Math.round(scrollX / bubbleWidth);
    setSelectedBubbleIndex(Math.max(0, Math.min(centerIndex, shootableBubbles.length - 1)));
  };

  // Play sound effect
  const playSound = async (soundName: string) => {
    try {
      // For now, we'll use system sounds or skip if not available
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Handle shoot button press
  const handleShoot = () => {
    if (!isGameActive || shootingBubble) return;
    
    const selectedBubble = shootableBubbles[selectedBubbleIndex];
    if (!selectedBubble || !selectedBubble.isAvailable) return;

    setIsAiming(true);
    playSound('aim');
    
    // Show aim line
    const centerY = SCREEN_HEIGHT - 200;
    setAimLineEnd({ x: SCREEN_WIDTH / 2, y: centerY - 100 });
  };

  // Handle aim release to shoot
  const handleAimRelease = (event: any) => {
    if (!isAiming) return;
    
    const { pageX, pageY } = event.nativeEvent;
    setAimLineEnd({ x: pageX, y: pageY });
    
    // Find target
    const target = findClosestFixedBubble(pageX, pageY);
    const selectedBubble = shootableBubbles[selectedBubbleIndex];
    
    if (target && selectedBubble) {
      shootBubble(selectedBubble, target);
    } else {
      setIsAiming(false);
    }
  };

  const findClosestFixedBubble = (x: number, y: number): FixedBubble | null => {
    let closest: FixedBubble | null = null;
    let minDistance = Infinity;
    const maxHitDistance = 100;

    fixedBubblesRef.current.forEach(bubble => {
      if (bubble.isExploded) return;
      
      const currentX = bubble.currentPos.x;
      const currentY = bubble.currentPos.y;
      
      const distance = Math.sqrt(
        Math.pow(currentX - x, 2) + Math.pow(currentY - y, 2)
      );
      
      if (distance < minDistance && distance < maxHitDistance) {
        minDistance = distance;
        closest = bubble;
      }
    });

    return closest;
  };

  const shootBubble = (shootable: ShootableBubble, target: FixedBubble) => {
    if (!bubbleBlastData) return;

    setIsAiming(false);
    setIsGameActive(false); // Pause game during shot
    
    const targetX = target.currentPos.x;
    const targetY = target.currentPos.y;
    const startX = SCREEN_WIDTH / 2 - 35; // Center minus bubble radius
    const startY = SCREEN_HEIGHT - 200;

    // Create shooting bubble animation
    const shootingPos = new Animated.ValueXY({ x: startX, y: startY });
    const shootingBubbleState: ShootingBubble = {
      bubble: shootable,
      position: shootingPos,
      isTraveling: true,
      targetId: target.id,
    };

    setShootingBubble(shootingBubbleState);
    playSound('shoot');

    // Animate bubble travel to target
    Animated.timing(shootingPos, {
      toValue: { x: targetX, y: targetY },
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      // Check if match
      const fixedContent = getText(target.content);
      const shootableContent = getText(shootable.content);
      const isAnswerPair = bubbleBlastData.answerPairs.some(
        pair => pair.shootableId === shootable.id && pair.fixedId === target.id
      );

      if (fixedContent === shootableContent && isAnswerPair && !shootable.isDecoy) {
        handleMatch(target, shootable);
      } else {
        handleMiss(target, shootable);
      }

      setShootingBubble(null);
      setIsGameActive(true);
    });
  };

  const handleMatch = (target: FixedBubble, shooter: ShootableBubble) => {
    playSound('match');
    
    // Explosion animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(target.scaleAnim, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(target.scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFixedBubbles(bubbles =>
        bubbles.map(b => (b.id === target.id ? { ...b, isExploded: true } : b))
      );
      fixedBubblesRef.current = fixedBubblesRef.current.map(b => 
        b.id === target.id ? { ...b, isExploded: true } : b
      );

      // Remove matched bubble
      setShootableBubbles(bubbles => bubbles.filter(b => b.id !== shooter.id));
      setScore(prev => prev + 1);

      // Check if all bubbles cleared
      const remaining = fixedBubblesRef.current.filter(b => !b.isExploded);
      if (remaining.length === 0) {
        handleLevelComplete();
      }
    });
  };

  const handleMiss = (target: FixedBubble, shooter: ShootableBubble) => {
    playSound('error');
    
    // Shake animation for wrong answer
    Animated.sequence([
      Animated.timing(target.shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(target.shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(target.shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(target.shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Red flash effect
    Animated.sequence([
      Animated.timing(target.scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(target.scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Return bubble to end of list
    setShootableBubbles(bubbles => {
      const filtered = bubbles.filter(b => b.id !== shooter.id);
      return [...filtered, shooter];
    });
  };

  const handleLevelComplete = () => {
    setIsGameActive(false);
    setExerciseCompleted(true);
    setShowCongratulations(true);
    playSound('success');
    
    if (onExerciseComplete) {
      onExerciseComplete();
    }
  };



  // Show loading indicator
  if (loading) {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!bubbleBlastData || !bubbleBlastData.fixedBubbles) {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No bubble blast content available</Text>
        </View>
      </LinearGradient>
    );
  }

  const aimPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isAiming,
    onMoveShouldSetPanResponder: () => isAiming,
    onPanResponderMove: (event) => {
      if (!isAiming) return;
      const { pageX, pageY } = event.nativeEvent;
      setAimLineEnd({ x: pageX, y: pageY });
    },
    onPanResponderRelease: handleAimRelease,
  });

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{getText(bubbleBlastData.title)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.score}>Score: {score}</Text>
        </View>
      </View>

      {/* Fixed Bubbles at Top with Movement */}
      <View style={styles.fixedBubblesContainer}>
        {fixedBubbles.map(bubble => {
          if (bubble.isExploded) return null;

          const content = getText(bubble.content);
          const shakeX = bubble.shakeAnim;
          
          const shakeTranslateX = shakeX.interpolate({
            inputRange: [-10, 0, 10],
            outputRange: [-10, 0, 10],
          });

          return (
            <Animated.View
              key={bubble.id}
              style={[
                styles.fixedBubble,
                {
                  transform: [
                    { translateX: bubble.position.x },
                    { translateY: bubble.position.y },
                    { scale: bubble.scaleAnim },
                    { translateX: shakeTranslateX },
                  ],
                },
              ]}
            >
              {bubbleBlastData.contentType === 'image' && content ? (
                <Image source={{ uri: content }} style={styles.bubbleImage} resizeMode="cover" />
              ) : (
                <Text style={styles.bubbleText}>{content}</Text>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Shooting Bubble Animation */}
      {shootingBubble && (
        <Animated.View
          style={[
            styles.shootingBubble,
            {
              transform: [
                { translateX: shootingBubble.position.x },
                { translateY: shootingBubble.position.y },
              ],
            },
          ]}
        >
          {bubbleBlastData.contentType === 'image' ? (
            <Image
              source={{ uri: getText(shootingBubble.bubble.content) }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.bubbleText}>{getText(shootingBubble.bubble.content)}</Text>
          )}
        </Animated.View>
      )}

      {/* Aim Line */}
      {isAiming && (
        <View style={styles.aimLineContainer} {...aimPanResponder.panHandlers}>
          <View
            style={[
              styles.aimLine,
              {
                transform: [
                  {
                    rotate: Math.atan2(
                      aimLineEnd.y - (SCREEN_HEIGHT - 200),
                      aimLineEnd.x - SCREEN_WIDTH / 2
                    ) + 'rad',
                  },
                ],
                width: Math.min(
                  Math.sqrt(
                    Math.pow(aimLineEnd.x - SCREEN_WIDTH / 2, 2) +
                    Math.pow(aimLineEnd.y - (SCREEN_HEIGHT - 200), 2)
                  ),
                  SCREEN_WIDTH
                ),
              },
            ]}
          />
        </View>
      )}

      {/* Shootable Bubbles Arc Carousel */}
      <View style={styles.shootableBubblesContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shootableBubblesScrollContent}
          snapToInterval={85}
          decelerationRate="fast"
          snapToAlignment="center"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {shootableBubbles.map((bubble, index) => {
            const isCenter = selectedBubbleIndex === index;
            const distanceFromCenter = Math.abs(index - selectedBubbleIndex);
            const arcY = distanceFromCenter * 15; // Arc height
            
            return (
              <Animated.View
                key={bubble.id}
                style={[
                  styles.shootableBubbleArc,
                  {
                    marginTop: arcY,
                    transform: [{ scale: isCenter ? 1.2 : 1 - distanceFromCenter * 0.1 }],
                    opacity: bubble.isAvailable ? 1 : 0.5,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shootableBubble,
                    isCenter && styles.shootableBubbleCenter,
                    bubble.isDecoy && styles.shootableBubbleDecoy,
                  ]}
                >
                  {bubbleBlastData.contentType === 'image' ? (
                    <Image
                      source={{ uri: getText(bubble.content) }}
                      style={styles.bubbleImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.bubbleText}>{getText(bubble.content)}</Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Shoot Button */}
      {shootableBubbles[selectedBubbleIndex]?.isAvailable && !shootingBubble && (
        <View style={styles.shootButtonContainer}>
          <TouchableOpacity
            style={styles.shootButton}
            onPress={handleShoot}
            onPressIn={() => setIsAiming(true)}
            onPressOut={handleAimRelease}
            disabled={!isGameActive || !!shootingBubble}
          >
            <MaterialIcons name="my-location" size={32} color="#FFFFFF" />
            <Text style={styles.shootButtonText}>SHOOT</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Congratulations Modal */}
      {showCongratulations && (
        <View style={styles.congratulationsOverlay}>
          <View style={styles.congratulationsModal}>
            <Text style={styles.congratulationsEmoji}>🎉</Text>
            <Text style={styles.congratulationsTitle}>Great job!</Text>
            <Text style={styles.congratulationsMessage}>
              You completed the exercise!
            </Text>
            <View style={styles.congratulationsButtons}>
              {propExerciseIndex < allExercises.length - 1 ? (
                <TouchableOpacity
                  style={styles.nextLevelButton}
                  onPress={() => {
                    setShowCongratulations(false);
                    if (onExerciseComplete) onExerciseComplete();
                  }}
                >
                  <Text style={styles.nextLevelButtonText}>Next Level</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={onComplete}
                >
                  <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTop: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  fixedBubblesContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 200,
  },
  fixedBubble: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 4,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  shooterArea: {
    position: 'absolute',
    bottom: 120,
    left: SCREEN_WIDTH / 2 - 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shooterBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,215,0,0.4)',
    borderWidth: 4,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  aimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  shootableBubblesContainer: {
    height: 120,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  shootableBubblesScrollContent: {
    paddingHorizontal: SCREEN_WIDTH / 2 - 40,
    alignItems: 'center',
  },
  shootableBubble: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(76,175,80,0.9)',
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  shootableBubbleArc: {
    // Half-circle arc positioning - bubbles will be arranged in arc
    marginTop: 10,
  },
  shootableBubbleSelected: {
    backgroundColor: 'rgba(255,215,0,0.6)',
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  shootableBubbleCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,193,7,0.95)',
    borderColor: '#FFC107',
    borderWidth: 5,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  shootableBubbleDisabled: {
    opacity: 0.3,
  },
  bubbleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'System',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  shootingBubble: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,215,0,0.8)',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 10,
  },
  aimLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    pointerEvents: 'box-none',
  },
  aimLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#FFD700',
    top: SCREEN_HEIGHT - 200,
    left: SCREEN_WIDTH / 2,
    transformOrigin: 'left center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 15,
    borderRadius: 2,
  },
  shootableBubbleDecoy: {
    backgroundColor: 'rgba(156,39,176,0.6)',
    borderColor: '#9C27B0',
  },
  shootButtonContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  shootButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shootButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  congratulationsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  congratulationsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  congratulationsEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  congratulationsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  congratulationsMessage: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  congratulationsButtons: {
    width: '100%',
    gap: 15,
  },
  nextLevelButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextLevelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BubbleBlast;

