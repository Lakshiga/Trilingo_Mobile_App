import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  ScrollView,
  Dimensions
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { ActivityComponentProps, Language } from './types';

interface Tile {
  id: string;
  content: { [key: string]: string };
}

interface AnswerGroup {
  groupId: string;
  tileIds: string[];
}

interface ActivityContent {
  title: { [key: string]: string };
  instruction: { [key: string]: string };
  data: Tile[];
  answers: AnswerGroup[];
}

const LetterTracking: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
}) => {
  // Guard: ensure content exists and has data/answers
  const letterContent = content as ActivityContent | undefined;
  const hasData = !!letterContent?.data && letterContent.data.length > 0;
  const hasAnswers = !!letterContent?.answers && letterContent.answers.length > 0;
  if (!letterContent || !hasData || !hasAnswers) {
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>Letter tracking content not available</Text>
      </View>
    );
  }

  // --- State Management ---
  const [paths, setPaths] = useState<string[]>([]); // வரைந்த கோடுகள்
  const [currentPath, setCurrentPath] = useState<string>(''); // தற்போது வரையும் கோடு
  const [score, setScore] = useState<number>(0);
  const [strokeLength, setStrokeLength] = useState<number>(0);
  const [resultMessage, setResultMessage] = useState<string>('');
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // --- Logic 1: Filter to learner language only ---
  const currentTiles = useMemo(() => {
    const group = letterContent.answers.find(g => g.groupId === currentLang) || letterContent.answers[0];
    if (!group) return [];
    return letterContent.data.filter(tile => group.tileIds.includes(tile.id));
  }, [letterContent, currentLang]);

  // Active Tile-ஐ எடுத்தல்
  const activeTile = useMemo(() => {
    return currentTiles.length > 0 ? currentTiles[0] : null;
  }, [currentTiles]);

  // எழுத்தை எடுத்தல் (Helper)
  const getGlyph = (tile: Tile | null | undefined) => {
    if (!tile) return '';
    // Show only learner language; fallback to English
    return tile.content[currentLang] || tile.content['en'] || '';
  };

  // --- Logic 2: Drawing Handling (PanResponder) ---
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // தொடும்போது (Start)
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
        lastPointRef.current = { x: locationX, y: locationY };
      },
      onPanResponderMove: (evt, gestureState) => {
        // நகர்த்தும்போது (Move)
        const { locationX, locationY } = evt.nativeEvent;
        const point = ` L${locationX},${locationY}`;
        setCurrentPath((prev) => prev + point);

        // Accumulate actual distance moved
        const last = lastPointRef.current;
        if (last) {
          const dx = locationX - last.x;
          const dy = locationY - last.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          setStrokeLength((prev) => prev + distance);
        }
        lastPointRef.current = { x: locationX, y: locationY };
      },
      onPanResponderRelease: () => {
        // விரலை எடுக்கும்போது (End)
        if (currentPath) {
          setPaths((prev) => [...prev, currentPath]);
          setCurrentPath('');
        }
        lastPointRef.current = null;
      },
    })
  ).current;

  // --- Handlers ---
  
  const handleTabSelect = (code: string) => {
    setSelectedGroupId(code);
    setSelectedTileId(null);
    clearCanvas();
  };

  const handleTileSelect = (id: string) => {
    setSelectedTileId(id);
    clearCanvas();
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath('');
    setScore(0);
    setStrokeLength(0);
    setResultMessage('');
  };

  const handleCheck = () => {
    if ((paths.length === 0 && !currentPath) || !activeTile) {
      setResultMessage('Draw on the pad first.');
      return;
    }
    // Compute a simple "accuracy" based on total stroke length vs. expected target
    const targetLength = 80; // lower target so shorter letters can score
    const computed = Math.max(1, Math.min(10, Math.round((strokeLength / targetLength) * 10)));
    setScore(computed);
    setResultMessage(`Score: ${computed} / 10`);
  };

  // --- Render ---

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.bigLetter}>{getGlyph(activeTile)}</Text>
      </View>

      <View 
        style={styles.svgWrapper}
        {...panResponder.panHandlers}
      >
        <Svg height="100%" width="100%" style={styles.svg}>
          <SvgText
            x="50%"
            y="60%"
            fontSize="180"
            fontWeight="bold"
            fill="#e0e0e0"
            opacity={0.5}
            textAnchor="middle"
          >
            {getGlyph(activeTile)}
          </SvgText>

          {paths.map((p, i) => (
            <Path
              key={i}
              d={p}
              stroke="#4a8cff"
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {currentPath ? (
            <Path
              d={currentPath}
              stroke="#4a8cff"
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>

      {resultMessage ? <Text style={styles.resultText}>{resultMessage}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity onPress={clearCanvas} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCheck} style={styles.checkBtn}>
          <Text style={styles.checkBtnText}>Check</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  top: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bigLetter: {
    fontSize: 72,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  subText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: '#ffd45f',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetBtnText: {
    fontWeight: 'bold',
    color: '#3a2f0c',
  },
  checkBtn: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkBtnText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  svgWrapper: {
    flex: 1,
    minHeight: 320,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  resultText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
});

export default LetterTracking;