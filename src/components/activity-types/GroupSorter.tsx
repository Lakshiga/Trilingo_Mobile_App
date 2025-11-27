import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useTheme } from '../../theme/ThemeContext';

interface Group {
  groupId: string;
  groupName: MultiLingualText;
}

interface Item {
  id: string;
  content: MultiLingualText;
  groupId: string;
}

interface GroupSorterContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  contentType: 'word' | 'letter' | 'image';
  groups: Group[];
  items: Item[];
}

interface GameItem extends Item {
  status: 'default' | 'correct' | 'incorrect';
}

const GroupSorter: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const { theme } = useTheme();
  const [unassignedItems, setUnassignedItems] = useState<GameItem[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<Map<string, GameItem[]>>(new Map());
  const [isChecking, setIsChecking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const groupSorterData = content as GroupSorterContent;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return 'N/A';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const shuffle = (array: GameItem[]): GameItem[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (groupSorterData?.items) {
      initializeGame();
    }
  }, [groupSorterData, currentLang]);

  const initializeGame = () => {
    const initialItems: GameItem[] = shuffle(
      groupSorterData.items.map(item => ({
        ...item,
        status: 'default',
      }))
    );

    setUnassignedItems(initialItems);

    const initialGroupsMap = new Map<string, GameItem[]>();
    groupSorterData.groups.forEach(group => {
      initialGroupsMap.set(group.groupId, []);
    });
    setAssignedGroups(initialGroupsMap);
    setIsFinished(false);
    setIsChecking(false);
  };

  const moveToGroup = (item: GameItem, groupId: string) => {
    if (isFinished) return;

    // Remove from unassigned
    setUnassignedItems(unassignedItems.filter(i => i.id !== item.id));

    // Add to group
    setAssignedGroups(prev => {
      const newMap = new Map(prev);
      const groupItems = newMap.get(groupId) || [];
      newMap.set(groupId, [...groupItems, item]);
      return newMap;
    });
  };

  const removeFromGroup = (item: GameItem, groupId: string) => {
    if (isFinished) return;

    // Remove from group
    setAssignedGroups(prev => {
      const newMap = new Map(prev);
      const groupItems = newMap.get(groupId) || [];
      newMap.set(groupId, groupItems.filter(i => i.id !== item.id));
      return newMap;
    });

    // Add back to unassigned
    setUnassignedItems([...unassignedItems, item]);
  };

  const checkAnswers = () => {
    if (isChecking || unassignedItems.length > 0) return;

    setIsChecking(true);
    let allCorrect = true;

    const newAssignedGroups = new Map<string, GameItem[]>();

    assignedGroups.forEach((items, groupId) => {
      const checkedItems = items.map(item => {
        const isCorrect = item.groupId === groupId;
        if (!isCorrect) allCorrect = false;
        return {
          ...item,
          status: isCorrect ? 'correct' : 'incorrect',
        } as GameItem;
      });
      newAssignedGroups.set(groupId, checkedItems);
    });

    setAssignedGroups(newAssignedGroups);
    setIsFinished(true);
    setIsChecking(false);

    if (allCorrect) {
      setTimeout(() => {
        Alert.alert('Congratulations!', 'All items are correctly sorted!', [
          { text: 'OK', onPress: onComplete },
        ]);
      }, 500);
    }
  };

  if (!groupSorterData || !groupSorterData.items) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No group sorter content available</Text>
      </View>
    );
  }

  const isComplete = unassignedItems.length === 0;

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(groupSorterData.title)}</Text>
        <Text style={styles.instruction}>{getText(groupSorterData.instruction)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Unassigned Items */}
        {unassignedItems.length > 0 && (
          <View style={styles.unassignedContainer}>
            <Text style={styles.sectionTitle}>Items to Sort:</Text>
            <View style={styles.itemsGrid}>
              {unassignedItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.item}
                  onPress={() => {
                    // Show group selection
                    Alert.alert(
                      'Select Group',
                      'Choose a group:',
                      groupSorterData.groups.map(group => ({
                        text: getText(group.groupName),
                        onPress: () => moveToGroup(item, group.groupId),
                      }))
                    );
                  }}
                >
                  {groupSorterData.contentType === 'image' ? (
                    <Image
                      source={{ uri: getText(item.content) }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.itemText}>{getText(item.content)}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Groups */}
        {groupSorterData.groups.map(group => {
          const groupItems = assignedGroups.get(group.groupId) || [];
          return (
            <View key={group.groupId} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{getText(group.groupName)}</Text>
              <View style={styles.groupItems}>
                {groupItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.groupItem,
                      item.status === 'correct' && styles.groupItemCorrect,
                      item.status === 'incorrect' && styles.groupItemIncorrect,
                    ]}
                    onPress={() => !isFinished && removeFromGroup(item, group.groupId)}
                    disabled={isFinished}
                  >
                    {groupSorterData.contentType === 'image' ? (
                      <Image
                        source={{ uri: getText(item.content) }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.itemText}>{getText(item.content)}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Check Button */}
        {isComplete && !isFinished && (
          <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
            <Text style={styles.checkButtonText}>Check Answers</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  unassignedContainer: {
    marginBottom: 30,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  item: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  groupContainer: {
    marginBottom: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  groupItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  groupItem: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  groupItemCorrect: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderColor: '#4CAF50',
  },
  groupItemIncorrect: {
    backgroundColor: 'rgba(244,67,54,0.3)',
    borderColor: '#F44336',
  },
  itemText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  checkButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default GroupSorter;

