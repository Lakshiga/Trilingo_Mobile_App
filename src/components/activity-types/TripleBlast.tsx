import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, Language, MultiLingualText, ImageUrl } from './types';
import { useTheme } from '../../theme/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { getCloudFrontUrl, getImageUrl } from '../../utils/awsUrlHelper';
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
  activityId?: string;
  title: MultiLingualText;
  instruction: MultiLingualText;
  contentType: string;
  data: Tile[];
  answers: AnswerGroup[];
}

interface GameTile extends Tile {
  status: 'default' | 'selected' | 'hidden' | 'matched_temp' | 'incorrect_temp';
}

const TripleBlast: React.FC<ActivityComponentProps> = ({
  content: initialContent,
  currentLang = 'ta',
  onComplete,
  activityId,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [content, setContent] = useState<any>(initialContent);
  const [loading, setLoading] = useState<boolean>(!!activityId);
  const [tiles, setTiles] = useState<GameTile[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute timer
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const confettiRef = useRef<LottieView>(null);
  const failRef = useRef<LottieView>(null);

  const tripleBlastData = content as TripleBlastContent;

  // Fetch exercises data if activityId is provided
  useEffect(() => {
    const fetchTripleBlastData = async () => {
      if (!activityId) return;
      
      try {
        setLoading(true);
        
        const exercises = await apiService.getExercisesByActivityId(activityId);
        
        if (exercises && exercises.length > 0) {
          const sortedExercises = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          
          const tiles: Tile[] = [];
          const answerGroups: AnswerGroup[] = [];
          let title = { ta: '', en: '', si: '' };
          let instruction = { ta: '', en: '', si: '' };
          let contentType = 'text';
          
          sortedExercises.forEach((exercise, index) => {
            try {
              if (exercise.jsonData) {
                const parsedData = JSON.parse(exercise.jsonData);
                
                if (index === 0) {
                  if (parsedData.title) title = parsedData.title;
                  if (parsedData.instruction) instruction = parsedData.instruction;
                  if (parsedData.contentType) contentType = parsedData.contentType;
                }
                
                // Parse tiles and answers from exercise
                if (parsedData.data && Array.isArray(parsedData.data)) {
                  tiles.push(...parsedData.data);
                } else if (parsedData.tiles && Array.isArray(parsedData.tiles)) {
                  tiles.push(...parsedData.tiles);
                } else if (parsedData.tile) {
                  tiles.push(parsedData.tile);
                }
                
                if (parsedData.answers && Array.isArray(parsedData.answers)) {
                  answerGroups.push(...parsedData.answers);
                } else if (parsedData.answerGroups && Array.isArray(parsedData.answerGroups)) {
                  answerGroups.push(...parsedData.answerGroups);
                }
              }
            } catch (parseError) {
              // Silently skip invalid exercise data
            }
          });
          
          if (tiles.length > 0) {
            const combinedContent: TripleBlastContent = {
              activityId: activityId.toString(),
              title: title,
              instruction: instruction,
              contentType: contentType,
              data: tiles,
              answers: answerGroups,
            };
            setContent(combinedContent);
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchTripleBlastData();
  }, [activityId]);

  // Parse content - handle multiple content structures
  const getContent = (): TripleBlastContent | null => {
    if (!content) return null;
    
    // Case 1: Content has data array directly
    if (content.data && Array.isArray(content.data) && content.data.length > 0) {
      return {
        activityId: content.activityId || '',
        title: content.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || { ta: '', en: '', si: '' },
        contentType: content.contentType || 'text',
        data: content.data,
        answers: content.answers || content.answerGroups || [],
      } as TripleBlastContent;
    }
    
    // Case 2: Content has tiles array
    if (content.tiles && Array.isArray(content.tiles)) {
      return {
        activityId: content.activityId || '',
        title: content.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || { ta: '', en: '', si: '' },
        contentType: content.contentType || 'text',
        data: content.tiles,
        answers: content.answers || content.answerGroups || [],
      } as TripleBlastContent;
    }
    
    return content as TripleBlastContent;
  };

  const getText = (content: { [key: string]: string | null } | MultiLingualText | undefined | null): string => {
    if (!content) return 'N/A';
    if (typeof content === 'object') {
      return content[currentLang] || content.en || content.ta || content.si || 'N/A';
    }
    return String(content);
  };

  const getTileImageUrl = (tile: Tile): string | null => {
    if (!tile.imageUrl) return null;
    
    // Handle ImageUrl type - could be multilingual object or string
    let relativePath: string | null = null;
    
    if (typeof tile.imageUrl === 'string') {
      relativePath = tile.imageUrl;
    } else if (typeof tile.imageUrl === 'object') {
      // Try to get path for current language
      const langKey = currentLang === 'ta' ? 'ta' : currentLang === 'si' ? 'si' : 'en';
      relativePath = tile.imageUrl[langKey] || 
                     tile.imageUrl.default ||
                     tile.imageUrl.en || 
                     tile.imageUrl.ta || 
                     tile.imageUrl.si ||
                     null;
      
      // If still no path, try to find any string value
      if (!relativePath) {
        const values = Object.values(tile.imageUrl);
        relativePath = values.find((v): v is string => typeof v === 'string' && v !== null && v.trim().length > 0) || null;
      }
    }
    
    if (!relativePath) return null;
    
    // Convert relative path to full CloudFront URL
    return getCloudFrontUrl(relativePath);
  };

  const shuffle = (array: GameTile[]): GameTile[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const parsedContent = useMemo(() => getContent(), [content, currentLang]);

  const resetGame = () => {
    if (!parsedContent?.data) return;
    
    const initialTiles: GameTile[] = parsedContent.data.map(tile => ({
      ...tile,
      status: 'default',
    }));

    setTiles(shuffle(initialTiles));
    setSelectedTileIds([]);
    setScore(0);
    setTimeRemaining(60);
    setFeedbackMessage('Select three tiles to form a group.');
    
    // Restart timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          Alert.alert(
            'Time Up!',
            'Your time has run out!',
            [
              {
                text: 'Retry',
                onPress: () => resetGame(),
                style: 'default',
              },
              {
                text: 'Close',
                onPress: () => {
                  if (onComplete) onComplete();
                },
                style: 'cancel',
              },
            ]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Timer effect
  useEffect(() => {
    if (parsedContent?.data && parsedContent.data.length > 0) {
      // Start timer
      setTimeRemaining(60);
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            Alert.alert(
              'Time Up!',
              'Your time has run out!',
              [
                {
                  text: 'Retry',
                  onPress: () => resetGame(),
                  style: 'default',
                },
                {
                  text: 'Close',
                  onPress: () => {
                    if (onComplete) onComplete();
                  },
                  style: 'cancel',
                },
              ]
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [parsedContent]);

  // Initialize game when content loads
  useEffect(() => {
    if (parsedContent?.data && parsedContent.data.length > 0) {
      const initialTiles: GameTile[] = parsedContent.data.map(tile => ({
        ...tile,
        status: 'default',
      }));

      setTiles(shuffle(initialTiles));
      setSelectedTileIds([]);
      setScore(0);
      setFeedbackMessage('Select three tiles to form a group.');
    }
  }, [parsedContent]);


  const selectTile = (tile: GameTile) => {
    if (tile.status === 'hidden' || selectedTileIds.length >= 3) return;

    if (tile.status === 'selected') {
      setSelectedTileIds(selectedTileIds.filter(id => id !== tile.id));
      setTiles(tiles.map(t => (t.id === tile.id ? { ...t, status: 'default' } : t)));
    } else {
      setSelectedTileIds([...selectedTileIds, tile.id]);
      setTiles(tiles.map(t => (t.id === tile.id ? { ...t, status: 'selected' } : t)));
      setFeedbackMessage('Tile selected...');
    }
  };

  const checkMatch = () => {
    if (!parsedContent) return;
    
    const answers = parsedContent.answers || [];
    const matchingGroup = answers.find(group =>
      selectedTileIds.every(id => group.tileIds.includes(id))
    );

    if (matchingGroup) {
      handleSuccess(selectedTileIds);
    } else {
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
  };

  // Check match when 3 tiles are selected
  useEffect(() => {
    if (selectedTileIds.length === 3) {
      checkMatch();
    }
  }, [selectedTileIds]);

  const handleSuccess = (matchedIds: string[]) => {
    // Show confetti animation
    setShowConfetti(true);
    
    // Reset and play animation
    setTimeout(() => {
      if (confettiRef.current) {
        confettiRef.current.reset();
        confettiRef.current.play();
      }
    }, 100);

    setFeedbackMessage('Blast! Group successfully removed! 🎉');

    // Mark as matched temporarily
    setTiles(prevTiles =>
      prevTiles.map(t =>
        matchedIds.includes(t.id) ? { ...t, status: 'matched_temp' } : t
      )
    );

    // Hide confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);

    // Remove tiles and rearrange after animation
    setTimeout(() => {
      setTiles(prevTiles => {
        const remainingTiles = prevTiles
          .filter(t => !matchedIds.includes(t.id))
          .map(t => ({ ...t, status: 'default' as const }));
        return shuffle(remainingTiles);
      });
      
      setScore(prevScore => prevScore + 3);
      setSelectedTileIds([]);

      // Check if all tiles are removed
      setTiles(prevTiles => {
        const visibleTiles = prevTiles.filter(t => t.status !== 'hidden');
        if (visibleTiles.length === 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          setFeedbackMessage('All done! Game won! 🏆');
          setTimeout(() => {
            Alert.alert('Congratulations!', 'You completed the game!', [
              { text: 'OK', onPress: onComplete },
            ]);
          }, 1000);
        } else {
          setFeedbackMessage('Select the next group.');
        }
        return prevTiles;
      });
    }, 1500);
  };

  const handleFailure = (selectedIds: string[]) => {
    // Show fail animation
    setShowFail(true);
    
    // Reset and play animation
    setTimeout(() => {
      if (failRef.current) {
        failRef.current.reset();
        failRef.current.play();
      }
    }, 100);

    setFeedbackMessage('Mismatch! Not the same group. Try again.');

    setTiles(prevTiles =>
      prevTiles.map(t =>
        selectedIds.includes(t.id) ? { ...t, status: 'incorrect_temp' } : t
      )
    );

    // Hide fail animation after it plays
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
      setFeedbackMessage('Select three tiles.');
    }, 1500);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading triple blast...</Text>
      </View>
    );
  }

  if (!parsedContent || !parsedContent.data || parsedContent.data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No triple blast content available</Text>
          {activityId && (
            <Text style={styles.errorSubtext}>Activity ID: {activityId}</Text>
          )}
        </View>
      </View>
    );
  }

  // Create responsive styles
  const responsiveStyles = {
    container: {
      ...styles.container,
      padding: responsive.wp(5),
    },
    header: {
      ...styles.header,
      marginBottom: responsive.hp(2.5),
    },
    instruction: {
      ...styles.instruction,
      fontSize: responsive.moderateScale(16),
      marginBottom: responsive.hp(1.2),
    },
    feedback: {
      ...styles.feedback,
      fontSize: responsive.moderateScale(16),
      marginBottom: responsive.hp(2.5),
    },
    tile: {
      ...styles.tile,
      borderRadius: responsive.moderateScale(15),
      padding: responsive.wp(2.5),
    },
    tileText: {
      ...styles.tileText,
      fontSize: responsive.moderateScale(18),
    },
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Confetti Animation Overlay */}
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

      {/* Fail Animation Overlay */}
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

      <View style={responsiveStyles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.timerText}>⏱ {formatTime(timeRemaining)}</Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <Text style={responsiveStyles.instruction}>{getText(parsedContent.instruction)}</Text>
      </View>

      <Text style={responsiveStyles.feedback}>{feedbackMessage}</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tilesGrid}>
          {tiles.map(tile => {
            if (tile.status === 'hidden') return null;

            const tileContent = getText(tile.content);
            let imageUrl = getTileImageUrl(tile);
            const isSelected = tile.status === 'selected';
            const isMatched = tile.status === 'matched_temp';
            const isIncorrect = tile.status === 'incorrect_temp';
            
            // Strictly follow contentType from JSON
            const contentType = parsedContent.contentType?.toLowerCase();
            
            // If contentType is 'image', try to get image URL from tile.imageUrl or from content
            if (contentType === 'image' && !imageUrl) {
              // If imageUrl not found, try to get from content field (might contain image path)
              const contentStr = typeof tile.content === 'string' 
                ? tile.content 
                : (typeof tile.content === 'object' 
                    ? (tile.content[currentLang] || tile.content.en || tile.content.ta || tile.content.si || '')
                    : '');
              
              // If content looks like an image path, use it
              if (contentStr && (contentStr.includes('.png') || contentStr.includes('.jpg') || contentStr.includes('.jpeg') || contentStr.includes('/img/'))) {
                imageUrl = getCloudFrontUrl(contentStr);
              }
            }
            
            // If contentType is 'image', show image; if 'word' or anything else, show word
            const shouldShowImage = contentType === 'image' && !!imageUrl;

            return (
              <TouchableOpacity
                key={tile.id}
                style={[
                  responsiveStyles.tile,
                  isSelected && styles.tileSelected,
                  isMatched && styles.tileMatched,
                  isIncorrect && styles.tileIncorrect,
                ]}
                onPress={() => selectTile(tile)}
              >
                {shouldShowImage ? (
                  <Image 
                    source={{ uri: imageUrl! }} 
                    style={styles.tileImage} 
                    resizeMode="contain" 
                  />
                ) : (
                  <Text style={responsiveStyles.tileText}>{tileContent}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    color: '#374151',
    textAlign: 'center',
    fontSize: 16,
  },
  feedback: {
    color: '#4B5563',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  tile: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
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
    fontSize: 16,
  },
  tileImage: {
    width: '90%',
    height: '90%',
    borderRadius: 10,
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
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TripleBlast;

