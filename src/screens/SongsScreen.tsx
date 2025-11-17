import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import apiService, { ActivityDto } from '../services/api';
import { CLOUDFRONT_URL } from '../config/apiConfig';

// Define the song type
type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverImage?: string;
  songUrl?: string;
  emoji: string;
  gradient: readonly [string, string];
};

const SongsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to lighten a hex color
  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Fetch songs from backend (Activities with ActivityTypeId = 6 for Song Player)
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const allActivities = await apiService.getAllActivities();
        
        // Filter activities with ActivityTypeId = 6 (Song Player)
        const songActivities = allActivities.filter(activity => activity.activityTypeId === 6);
        
        // Map activities to songs
        const mappedSongs: Song[] = songActivities.map((activity, index) => {
          let songData: any = {};
          
          // Parse Details_JSON to get song data
          if (activity.details_JSON) {
            try {
              const parsed = JSON.parse(activity.details_JSON);
              songData = parsed.songData || parsed;
            } catch (e) {
              console.error('Error parsing song JSON:', e);
            }
          }

          // Get song URL from AWS (CloudFront)
          let songUrl = '';
          if (songData.audioUrl) {
            // Handle multilingual audio URL
            if (typeof songData.audioUrl === 'object') {
              songUrl = songData.audioUrl.en || songData.audioUrl.ta || songData.audioUrl.si || '';
            } else {
              songUrl = songData.audioUrl;
            }
            
            // Convert to full CloudFront URL if it's a relative path
            if (songUrl && !songUrl.startsWith('http')) {
              songUrl = songUrl.startsWith('/') 
                ? `${CLOUDFRONT_URL}${songUrl}`
                : `${CLOUDFRONT_URL}/${songUrl}`;
            }
          }

          // Get cover image URL
          let coverImage = '';
          if (songData.albumArtUrl) {
            coverImage = songData.albumArtUrl;
            if (!coverImage.startsWith('http')) {
              coverImage = coverImage.startsWith('/')
                ? `${CLOUDFRONT_URL}${coverImage}`
                : `${CLOUDFRONT_URL}/${coverImage}`;
            }
          }

          // Get title (multilingual)
          const title = songData.title 
            ? (typeof songData.title === 'object' 
                ? (songData.title.en || songData.title.ta || songData.title.si || activity.name_en)
                : songData.title)
            : activity.name_en || activity.name_ta || activity.name_si || 'Song';

          // Get artist
          const artist = songData.artist || 'Unknown Artist';

          // Gradients for songs
          const gradients: readonly [string, string][] = [
            ['#FF6B9D', '#FF8FAB'] as const,
            ['#4ECDC4', '#6EDDD8'] as const,
            ['#5B9FFF', '#7BB5FF'] as const,
            ['#A77BCA', '#BA91DA'] as const,
            ['#FFA726', '#FFB84D'] as const,
          ];

          return {
            id: activity.id.toString(),
            title: title,
            artist: artist,
            duration: '0:00', // Duration can be calculated from audio if needed
            coverImage: coverImage,
            songUrl: songUrl,
            emoji: '🎵',
            gradient: gradients[index % gradients.length],
          };
        });

        setSongs(mappedSongs);
        setFilteredSongs(mappedSongs);
      } catch (error: any) {
        console.error('Error fetching songs:', error);
        Alert.alert(
          'Error',
          'Could not load songs. Please try again.',
          [{ text: 'OK' }]
        );
        // Use empty array on error
        setSongs([]);
        setFilteredSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // Filter songs based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter(
        song =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const togglePlayPause = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(id);
    }
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isPlaying = currentlyPlaying === item.id;

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          onPress={() => togglePlayPause(item.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.songItem, isPlaying && styles.playingItem]}
          >
            {/* Emoji Icon */}
            <View style={styles.emojiContainer}>
              <Text style={styles.emojiIcon}>{item.emoji}</Text>
            </View>

            {/* Song Info */}
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
            </View>

            {/* Duration and Play Button */}
            <View style={styles.rightSection}>
              <Text style={styles.songDuration}>{item.duration}</Text>
              <View style={styles.playButtonContainer}>
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
            </View>

            {/* Decorative stars for playing song */}
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Text style={styles.starIcon}>⭐</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={theme.songsBackground}
      style={styles.container}
    >
      {/* Decorative background shapes */}
      <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 }]} />
      <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 }]} />
      <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 }]} />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Fun Header with Musical Notes */}
      <View style={styles.headerContainer}>
        <Text style={styles.musicalNote}>🎵</Text>
        <Text style={styles.header}>Songs</Text>
        <Text style={styles.musicalNote}>🎶</Text>
      </View>

      {/* Playful Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIconWrapper}>
          <MaterialIcons name="search" size={22} color="#FF6B9D" />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading songs...</Text>
        </View>
      )}

      {/* Songs List */}
      {!loading && (
        <FlatList
          data={filteredSongs}
          keyExtractor={item => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={styles.songList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No songs available yet.</Text>
              <Text style={styles.emptySubtext}>Check back later!</Text>
            </View>
          }
        />
      )}

      {/* Fun Player Controls */}
      {currentlyPlaying && (() => {
        const playerGradient = ['#FFD93D', '#FF9A3D', '#FF6B9D'] as const;
        return (
        <LinearGradient
          colors={playerGradient}
          style={styles.playerContainer}
        >
          {(() => {
            const playingSong = songs.find(song => song.id === currentlyPlaying);
            return (
              <View style={styles.playerInfo}>
                <Text style={styles.nowPlayingLabel}>🎵 Now Playing 🎵</Text>
                <Text style={styles.playerText}>
                  {playingSong ? `${playingSong.title}` : 'Unknown Song'}
                </Text>
                <Text style={styles.playerArtist}>
                  {playingSong ? playingSong.artist : ''}
                </Text>
              </View>
            );
          })()}
          <View style={styles.playerControls}>
            <TouchableOpacity style={styles.controlButton}>
              <MaterialIcons name="skip-previous" size={36} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainControl}>
              <MaterialIcons name="pause" size={44} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <MaterialIcons name="skip-next" size={36} color="#fff" />
                                                                                                                                  </TouchableOpacity>
          </View>
        </LinearGradient>
        );
      })()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -50,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: 200,
    left: -20,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 400,
    right: -30,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 107, 157, 0.8)',
    borderRadius: 25,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginBottom: 25,
  },
  musicalNote: {
    fontSize: 32,
    marginHorizontal: 10,
  },
  header: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  searchIconWrapper: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  songList: {
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playingItem: {
    elevation: 12,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emojiIcon: {
    fontSize: 36,
  },
  songInfo: {
    flex: 1,
    marginRight: 10,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  songArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  songDuration: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  playButtonContainer: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  starIcon: {
    fontSize: 24,
  },
  playerContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 25,
    padding: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  playerInfo: {
    marginBottom: 20,
  },
  nowPlayingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playerArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '600',
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  mainControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 35,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pinkItem: {
    backgroundColor: '#FF69B4',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default SongsScreen;
