import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, MultiLingualText, ImageUrl } from './types';
import { useResponsive } from '../../utils/responsive';
import { getCloudFrontUrl, getImageUrl as getImageUrlHelper } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

interface Tile {
  id: string;
  content: MultiLingualText | { [key: string]: string | null };
  imageUrl?: ImageUrl | null;
}

interface AnswerGroup {
  groupId: string;
  tileIds: string[];
}

interface TripleBlastContent {
  contentType: 'word' | 'image';
  instruction: MultiLingualText;
  tiles: Tile[];
  answers: AnswerGroup[];
}

interface GameTile extends Tile {
  status: 'default' | 'selected' | 'hidden' | 'matched_temp' | 'incorrect_temp';
}

const TripleBlast: React.FC<ActivityComponentProps> = ({
  currentLang = 'ta',
  activityId,
  onComplete,
}) => {
  const responsive = useResponsive();
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<TripleBlastContent[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [tiles, setTiles] = useState<GameTile[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showTimeout, setShowTimeout] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const confettiRef = useRef<LottieView>(null);
  const failRef = useRef<LottieView>(null);
  const congratulationsRef = useRef<LottieView>(null);

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
        const exerciseContents: TripleBlastContent[] = [];

        // Get contentType from first exercise
        let globalContentType: 'word' | 'image' = 'word';
        if (sortedExercises.length > 0 && sortedExercises[0].jsonData) {
          try {
            const firstExerciseData = JSON.parse(sortedExercises[0].jsonData);
            if (firstExerciseData.contentType) {
              const ctLower = firstExerciseData.contentType.toLowerCase();
              globalContentType = ctLower === 'image' ? 'image' : 'word';
            }
          } catch (e) {
            // Use default 'word'
          }
        }

        sortedExercises.forEach((exercise) => {
          try {
            if (exercise.jsonData) {
              const parsedData = JSON.parse(exercise.jsonData);

              let contentType: 'word' | 'image' = globalContentType;
              if (parsedData.contentType) {
                const ctLower = parsedData.contentType.toLowerCase();
                contentType = ctLower === 'image' ? 'image' : 'word';
              }

              const tiles: Tile[] = [];
              if (parsedData.data && Array.isArray(parsedData.data)) {
                tiles.push(...parsedData.data);
              } else if (parsedData.tiles && Array.isArray(parsedData.tiles)) {
                tiles.push(...parsedData.tiles);
              }

              const answers: AnswerGroup[] = [];
              if (parsedData.answers && Array.isArray(parsedData.answers)) {
                answers.push(...parsedData.answers);
              } else if (parsedData.answerGroups && Array.isArray(parsedData.answerGroups)) {
                answers.push(...parsedData.answerGroups);
              }

              const instruction: MultiLingualText = parsedData.instruction || {
                ta: '',
                en: '',
                si: '',
              };

              if (tiles.length > 0) {
                exerciseContents.push({
                  contentType,
                  instruction,
                  tiles,
                  answers,
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
        // Error fetching
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [activityId]);

  const getText = (content: MultiLingualText | { [key: string]: string | null } | undefined | null): string => {
    if (!content) return '';
    if (typeof content === 'object') {
      return content[currentLang] || content.en || content.ta || content.si || '';
    }
    return String(content);
  };

  const getTileImageUrl = (tile: Tile): string | null => {
    // First try to get from imageUrl field
    if (tile.imageUrl) {
      // Convert ImageUrl to the format expected by getImageUrlHelper
      const imageUrlData = typeof tile.imageUrl === 'string'
        ? tile.imageUrl
        : (tile.imageUrl as any);
      
      const imageUrl = getImageUrlHelper(imageUrlData, currentLang);
      if (imageUrl) return imageUrl;
    }

    // If no imageUrl, check if content field contains image path
    const contentStr = typeof tile.content === 'string'
      ? tile.content
      : (typeof tile.content === 'object'
        ? (tile.content[currentLang] || tile.content.en || tile.content.ta || tile.content.si || '')
        : '');

    // Check if content looks like an image path
    if (contentStr && (
      contentStr.includes('.png') ||
      contentStr.includes('.jpg') ||
      contentStr.includes('.jpeg') ||
      contentStr.includes('.gif') ||
      contentStr.includes('.webp') ||
      contentStr.includes('/img/') ||
      contentStr.includes('level-') ||
      contentStr.includes('image')
    )) {
      return getCloudFrontUrl(contentStr);
    }

    // Try to extract from content if it's an object with image paths
    if (typeof tile.content === 'object' && tile.content) {
      const contentObj = tile.content as any;
      
      // Check common image path keys
      if (contentObj.url || contentObj.uri || contentObj.path || contentObj.image || contentObj.imageUrl) {
        const imagePath = contentObj.url || contentObj.uri || contentObj.path || contentObj.image || contentObj.imageUrl;
        if (typeof imagePath === 'string') {
          return getCloudFrontUrl(imagePath);
        }
      }
      
      // Try getImageUrl helper on content object
      const imageFromContent = getImageUrlHelper(contentObj, currentLang);
      if (imageFromContent) return imageFromContent;
    }

    return null;
  };

  const shuffle = (array: GameTile[]): GameTile[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const currentContent = allExercises[currentExerciseIndex];

  // Initialize game when exercise changes
  useEffect(() => {
    if (!currentContent || !currentContent.tiles || currentContent.tiles.length === 0) return;

    const initialTiles: GameTile[] = currentContent.tiles.map((tile, index) => ({
      ...tile,
      id: `${tile.id || `tile-${index}`}-${currentExerciseIndex}`,
      status: 'default',
    }));

    setTiles(shuffle(initialTiles));
    setSelectedTileIds([]);
    setScore(0);
    setFeedbackMessage('Select three tiles to form a group');
    setTimeRemaining(60);

    // Clear existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          setShowTimeout(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentExerciseIndex, currentContent]);

  const selectTile = (tile: GameTile) => {
    if (tile.status === 'hidden' || selectedTileIds.length >= 3) return;

    if (tile.status === 'selected') {
      setSelectedTileIds(selectedTileIds.filter(id => id !== tile.id));
      setTiles(tiles.map(t => (t.id === tile.id ? { ...t, status: 'default' } : t)));
    } else {
      setSelectedTileIds([...selectedTileIds, tile.id]);
      setTiles(tiles.map(t => (t.id === tile.id ? { ...t, status: 'selected' } : t)));
    }
  };

  const checkMatch = () => {
    if (!currentContent) return;

    const answers = currentContent.answers || [];
    const matchingGroup = answers.find(group =>
      selectedTileIds.every(id => group.tileIds.includes(id))
    );

    if (matchingGroup) {
      handleSuccess(selectedTileIds);
    } else {
      const isImage = currentContent.contentType === 'image';
      
      if (isImage) {
        // For images, compare by imageUrl
        const firstTile = tiles.find(t => t.id === selectedTileIds[0]);
        if (!firstTile) {
          handleFailure(selectedTileIds);
          return;
        }
        
        const firstImageUrl = getTileImageUrl(firstTile);
        if (!firstImageUrl) {
          handleFailure(selectedTileIds);
          return;
        }
        
        const imageMatch = selectedTileIds.every(id => {
          const tile = tiles.find(t => t.id === id);
          if (!tile) return false;
          const tileImageUrl = getTileImageUrl(tile);
          return tileImageUrl === firstImageUrl;
        });

        if (imageMatch) {
          handleSuccess(selectedTileIds);
        } else {
          handleFailure(selectedTileIds);
        }
      } else {
        // For words, compare by text content
        const firstTileContent = getText(tiles.find(t => t.id === selectedTileIds[0])?.content);
        const contentMatch = selectedTileIds.every(id => {
          const tile = tiles.find(t => t.id === id);
          return getText(tile?.content) === firstTileContent;
        });

        if (contentMatch) {
          handleSuccess(selectedTileIds);
        } else {
          handleFailure(selectedTileIds);
        }
      }
    }
  };

  // Check match when 3 tiles are selected
  useEffect(() => {
    if (selectedTileIds.length === 3) {
      checkMatch();
    }
  }, [selectedTileIds]);

  const handleSuccess = (matchedIds: string[]) => {
    setShowConfetti(true);

    setTimeout(() => {
      if (confettiRef.current) {
        confettiRef.current.reset();
        confettiRef.current.play();
      }
    }, 100);

    setTiles(prevTiles =>
      prevTiles.map(t =>
        matchedIds.includes(t.id) ? { ...t, status: 'matched_temp' } : t
      )
    );

    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);

    setTimeout(() => {
      setTiles(prevTiles => {
        const remainingTiles = prevTiles
          .filter(t => !matchedIds.includes(t.id))
          .map(t => ({ ...t, status: 'default' as const }));
        return shuffle(remainingTiles);
      });

      setScore(prevScore => prevScore + 3);
      setSelectedTileIds([]);

      setTiles(prevTiles => {
        const visibleTiles = prevTiles.filter(t => t.status !== 'hidden');
        if (visibleTiles.length === 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          
          // Hide content and show congratulations popup
          setExerciseCompleted(true);
          setShowCongratulations(true);
          setTimeout(() => {
            if (congratulationsRef.current) {
              congratulationsRef.current.reset();
              congratulationsRef.current.play();
            }
          }, 100);

          // Auto navigate after animation
          if (allExercises.length > 1 && currentExerciseIndex < allExercises.length - 1) {
            setTimeout(() => {
              setShowCongratulations(false);
              setExerciseCompleted(false);
              goToNextExercise();
            }, 3000);
          } else {
            setTimeout(() => {
              setShowCongratulations(false);
              setExerciseCompleted(false);
              if (onComplete) onComplete();
            }, 3000);
          }
        }
        return prevTiles;
      });
    }, 1500);
  };

  const handleFailure = (selectedIds: string[]) => {
    setShowFail(true);

    setTimeout(() => {
      if (failRef.current) {
        failRef.current.reset();
        failRef.current.play();
      }
    }, 100);

    setFeedbackMessage('Mismatch! Not the same group. Try again');

    setTiles(prevTiles =>
      prevTiles.map(t =>
        selectedIds.includes(t.id) ? { ...t, status: 'incorrect_temp' } : t
      )
    );

    setTimeout(() => {
      setShowFail(false);
    }, 3000);

    setTimeout(() => {
      setTiles(prevTiles =>
        prevTiles.map(t =>
          t.status === 'incorrect_temp' ? { ...t, status: 'default' } : t
        )
      );
      setSelectedTileIds([]);
      setFeedbackMessage('Select three tiles');
    }, 1500);
  };

  const resetGame = () => {
    if (!currentContent || !currentContent.tiles) return;

    const initialTiles: GameTile[] = currentContent.tiles.map((tile, index) => ({
      ...tile,
      id: `${tile.id || `tile-${index}`}-${currentExerciseIndex}`,
      status: 'default',
    }));

    setTiles(shuffle(initialTiles));
    setSelectedTileIds([]);
    setScore(0);
    setTimeRemaining(60);
    setFeedbackMessage('Select three tiles to form a group');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          setShowTimeout(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < allExercises.length - 1) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const goToPrevExercise = () => {
    if (currentExerciseIndex > 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading triple blast...</Text>
      </View>
    );
  }

  if (!currentContent || !currentContent.tiles || currentContent.tiles.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No triple blast content available</Text>
      </View>
    );
  }

  const instructionText = getText(currentContent.instruction);
  const isImage = currentContent.contentType === 'image';

  return (
    <View style={styles.container}>
      {/* Confetti Animation */}
      {showConfetti && (
        <View style={styles.animationOverlay}>
          <LottieView
            ref={confettiRef}
            source={require('../../../assets/animations/Confetti.json')}
            autoPlay={false}
            loop={false}
            style={styles.animation}
          />
        </View>
      )}

      {/* Fail Animation */}
      {showFail && (
        <View style={styles.animationOverlay}>
          <LottieView
            ref={failRef}
            source={require('../../../assets/animations/Paul R. Bear Fail.json')}
            autoPlay={false}
            loop={false}
            style={styles.failAnimation}
          />
        </View>
      )}

      {/* Congratulations Popup Modal */}
      <Modal
        visible={showCongratulations}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCongratulations(false);
          setExerciseCompleted(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.congratulationsModalContainer}>
            <LottieView
              ref={congratulationsRef}
              source={require('../../../assets/animations/Happy boy.json')}
              autoPlay={false}
              loop={false}
              style={styles.congratulationsAnimation}
            />
            <Text style={styles.congratulationsTitle}>Congratulations! 🎉</Text>
            <Text style={styles.congratulationsScore}>Score: {String(score || 0)}</Text>
          </View>
        </View>
      </Modal>

      {/* Hide content when exercise is completed */}
      {!exerciseCompleted && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.timerText}>⏱ {formatTime(timeRemaining)}</Text>
              <Text style={styles.scoreText}>Score: {String(score || 0)}</Text>
            </View>
            {instructionText && instructionText.trim() ? (
              <Text style={styles.instruction}>{instructionText}</Text>
            ) : null}
          </View>

          {feedbackMessage ? (
            <Text style={styles.feedback}>{feedbackMessage}</Text>
          ) : null}

          {/* Tiles Grid */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.tilesGrid}>
              {tiles.map((tile) => {
                if (tile.status === 'hidden') return null;

            const imageUrl = isImage ? getTileImageUrl(tile) : null;
            const tileContent = isImage ? null : getText(tile.content);
            const isSelected = tile.status === 'selected';
            const isMatched = tile.status === 'matched_temp';
            const isIncorrect = tile.status === 'incorrect_temp';

            return (
              <TouchableOpacity
                key={tile.id}
                style={styles.tileTouchable}
                activeOpacity={0.8}
                onPress={() => selectTile(tile)}
              >
                <View
                  style={[
                    styles.tile,
                    isImage && styles.tileImageContainer,
                    !isImage && isSelected && styles.tileSelected,
                    !isImage && isMatched && styles.tileMatched,
                    !isImage && isIncorrect && styles.tileIncorrect,
                    isImage && isSelected && styles.tileImageSelected,
                  ]}
                >
                  {isImage && imageUrl ? (
                    <Image
                      key={`${tile.id}-${imageUrl}-${currentExerciseIndex}`}
                      source={{ uri: imageUrl }}
                      style={styles.tileImage}
                      resizeMode="contain"
                      onError={() => {
                        // Image failed to load
                      }}
                    />
                  ) : tileContent && tileContent.trim() ? (
                    <Text style={styles.tileText}>{tileContent}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
            </View>
          </ScrollView>

          {/* Navigation Buttons */}
          {allExercises.length > 1 && (
            <View style={styles.navigationFooter}>
          <TouchableOpacity
            style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrevExercise}
            disabled={currentExerciseIndex === 0}
          >
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={currentExerciseIndex === 0 ? '#CCCCCC' : '#1976D2'}
            />
            <View style={{ width: 8 }} />
            <Text style={[styles.navButtonText, currentExerciseIndex === 0 && styles.navButtonTextDisabled]}>
              Back
            </Text>
          </TouchableOpacity>

          <Text style={styles.exerciseCounter}>
            {String(currentExerciseIndex + 1)} / {String(allExercises.length)}
          </Text>

          <TouchableOpacity
            style={[styles.navButton, currentExerciseIndex === allExercises.length - 1 && styles.navButtonDisabled]}
            onPress={goToNextExercise}
            disabled={currentExerciseIndex === allExercises.length - 1}
          >
            <Text style={[styles.navButtonText, currentExerciseIndex === allExercises.length - 1 && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <View style={{ width: 8 }} />
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={currentExerciseIndex === allExercises.length - 1 ? '#CCCCCC' : '#1976D2'}
            />
          </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Timeout Modal */}
      <Modal
        visible={showTimeout}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimeout(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#FF6B6B', '#FFD93D', '#6BCF7F', '#4ECDC4']}
            style={styles.modalContainer}
          >
            <Text style={styles.modalEmoji}>⏰😅</Text>
            <Text style={styles.modalTitle}>Time Up!</Text>
            <Text style={styles.modalMessage}>
              Your time has run out!{'\n'}Don't worry, try again! 💪
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowTimeout(false);
                  resetGame();
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowTimeout(false);
                  if (onComplete) onComplete();
                }}
              >
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  instruction: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  feedback: {
    color: '#4B5563',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  animation: {
    width: 400,
    height: 400,
  },
  failAnimation: {
    width: 250,
    height: 250,
  },
  congratulationsAnimation: {
    width: 300,
    height: 300,
  },
  congratulationsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '85%',
  },
  congratulationsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  congratulationsScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  tileTouchable: {
    width: '30%',
    aspectRatio: 1,
  },
  tile: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  tileSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 2,
  },
  tileImageContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tileImageSelected: {
    backgroundColor: '#ffcc00',
    borderColor: '#ffcc00',
    borderWidth: 2,
  },
  tileMatched: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  tileIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  tileText: {
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    fontSize: 18,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4B5563',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#1F2937',
    fontSize: 16,
    textAlign: 'center',
  },
  navigationFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E0E0E0',
  },
  navButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navButtonTextDisabled: {
    color: '#CCCCCC',
  },
  exerciseCounter: {
    color: '#6B7280',
    fontWeight: 'bold',
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  modalMessage: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  modalButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonSecondary: {
    backgroundColor: '#FFD700',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  modalButtonTextSecondary: {
    color: '#FF6347',
  },
});

export default TripleBlast;
