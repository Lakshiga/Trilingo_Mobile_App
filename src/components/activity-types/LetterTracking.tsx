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
  // Guard: ensure content exists
  const letterContent = content as ActivityContent | undefined;
  if (!letterContent) {
    return (
      <View style={styles.container}>
        <Text style={styles.instruction}>Letter tracking content not available</Text>
      </View>
    );
  }

  // --- State Management ---
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ta'); // Default Tab
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [paths, setPaths] = useState<string[]>([]); // வரைந்த கோடுகள்
  const [currentPath, setCurrentPath] = useState<string>(''); // தற்போது வரையும் கோடு
  const [score, setScore] = useState<number>(0);
  const [strokeLength, setStrokeLength] = useState<number>(0);

  // --- Logic 1: Tabs & Filtering (Angular 'computed' equivalent) ---
  
  // Tabs-ஐ உருவாக்குதல்
  const languageTabs = useMemo(() => {
    return letterContent.answers.map(group => ({
      code: group.groupId,
      label: group.groupId.toUpperCase() // Or map to proper names
    }));
  }, [letterContent]);

  // Tiles-ஐ வடிகட்டுதல்
  const currentTiles = useMemo(() => {
    const group = letterContent.answers.find(g => g.groupId === selectedGroupId);
    if (!group) return [];
    return letterContent.data.filter(tile => group.tileIds.includes(tile.id));
  }, [letterContent, selectedGroupId]);

  // Active Tile-ஐ எடுத்தல்
  const activeTile = useMemo(() => {
    if (selectedTileId) {
      return currentTiles.find(t => t.id === selectedTileId) || currentTiles[0];
    }
    return currentTiles.length > 0 ? currentTiles[0] : null;
  }, [selectedTileId, currentTiles]);

  // எழுத்தை எடுத்தல் (Helper)
  const getGlyph = (tile: Tile | null | undefined) => {
    if (!tile) return '';
    // content keys: 'ta', 'en'. selectedGroupId: 'ta'. 
    // We try to match tab language first, else currentLang.
    return tile.content[selectedGroupId] || tile.content[currentLang] || '';
  };

  // --- Logic 2: Drawing Handling (PanResponder) ---
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // தொடும்போது (Start)
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt, gestureState) => {
        // நகர்த்தும்போது (Move)
        const { locationX, locationY } = evt.nativeEvent;
        const point = ` L${locationX},${locationY}`;
        setCurrentPath((prev) => prev + point);
        
        // Score calculation (rough length estimation)
        const distance = Math.sqrt(gestureState.vx * gestureState.vx + gestureState.vy * gestureState.vy);
        setStrokeLength((prev) => prev + distance);
      },
      onPanResponderRelease: () => {
        // விரலை எடுக்கும்போது (End)
        if (currentPath) {
          setPaths((prev) => [...prev, currentPath]);
          setCurrentPath('');
          
          // Simple scoring logic based on movement
          const newScore = Math.min(10, Math.floor(strokeLength / 5)); // Adjust divisor as needed
          setScore(newScore);
        }
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
  };

  // --- Render ---

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{letterContent.title[currentLang]}</Text>
        <Text style={styles.instruction}>{letterContent.instruction[currentLang]}</Text>
      </View>

      {/* Tabs (Languages) */}
      <View style={styles.tabContainer}>
        {languageTabs.map(tab => (
          <TouchableOpacity 
            key={tab.code} 
            style={[styles.tab, selectedGroupId === tab.code && styles.activeTab]}
            onPress={() => handleTabSelect(tab.code)}
          >
            <Text style={styles.tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid (Letters) */}
      <View style={styles.gridContainer}>
        {currentTiles.map(tile => (
          <TouchableOpacity
            key={tile.id}
            style={[styles.tile, activeTile?.id === tile.id && styles.activeTile]}
            onPress={() => handleTileSelect(tile.id)}
          >
            <Text style={styles.tileText}>{getGlyph(tile)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Drawing Area (Canvas) */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvasHeader}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{getGlyph(activeTile)}</Text>
          </View>
          <Text style={styles.scoreText}>Score: {score} / 10</Text>
          <TouchableOpacity onPress={clearCanvas} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View 
          style={styles.svgWrapper}
          {...panResponder.panHandlers} // Attach touch handlers here
        >
          <Svg height="300" width="100%" style={styles.svg}>
            {/* 1. Ghost Text (Background Guide) */}
            <SvgText
              x="50%"
              y="60%"
              fontSize="180"
              fontWeight="bold"
              fill="#d8c7ff"
              opacity={0.4}
              textAnchor="middle"
            >
              {getGlyph(activeTile)}
            </SvgText>

            {/* 2. Previously Drawn Paths */}
            {paths.map((p, i) => (
              <Path
                key={i}
                d={p}
                stroke="#7B5BE4"
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* 3. Current Active Path (While drawing) */}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke="#7B5BE4"
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>
      </View>

    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff0f5', // Pinkish bg like your CSS
    minHeight: '100%',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'center',
    gap: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#b4c2e5',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#1ba7b8',
  },
  tabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  tile: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7b8bf5',
    borderRadius: 12,
  },
  activeTile: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  tileText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  canvasContainer: {
    backgroundColor: '#f8f2ff',
    borderRadius: 20,
    padding: 15,
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  canvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chip: {
    width: 40,
    height: 40,
    backgroundColor: '#7b8bf5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scoreText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#2d2454',
  },
  resetBtn: {
    backgroundColor: '#ffd45f',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    fontWeight: 'bold',
    color: '#3a2f0c',
  },
  svgWrapper: {
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden', // Keeps drawing inside bounds
    borderWidth: 1,
    borderColor: '#cbb5ff',
    borderStyle: 'dashed',
  },
  svg: {
    backgroundColor: 'transparent',
  }
});

export default LetterTracking;