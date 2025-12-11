import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, 
  Dimensions, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { useResponsive } from '../utils/responsive';
// import apiService from '../services/api'; 

// --- TYPES ---
// Mission Data-வை நீக்கிவிட்டேன். Category மட்டும் போதும்.
interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'learning' | 'videos' | 'songs' | 'letters' | 'stories' | 'conversation';
}

interface DashboardData {
  categories: CategoryItem[];
}

// --- UI CONFIGURATION ---
const CATEGORY_STYLES: Record<string, { 
  icon: any; 
  colors: readonly [string, string]; 
  size: 'large' | 'medium' | 'small'; 
}> = {
  learning: { icon: 'map-legend', colors: ['#FF9F43', '#FF6B6B'], size: 'large' },
  videos: { icon: 'youtube-tv', colors: ['#4FACFE', '#00F2FE'], size: 'medium' },
  songs: { icon: 'music-circle', colors: ['#fa709a', '#fee140'], size: 'medium' },
  letters: { icon: 'alphabetical-variant', colors: ['#43E97B', '#38F9D7'], size: 'small' },
  stories: { icon: 'book-open-variant', colors: ['#a18cd1', '#fbc2eb'], size: 'small' },
  conversation: { icon: 'microphone-variant', colors: ['#8fd3f4', '#84fab0'], size: 'small' },
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const isGuest = currentUser?.isGuest || !currentUser;
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Progress Data தேவையில்லை, Categories மட்டும் போதும்
        const mockApiResponse: DashboardData = {
          categories: [
            { id: 'learning', title: 'Adventure Map', subtitle: 'Start your journey', type: 'learning' },
            { id: 'videos', title: 'Watch & Learn', subtitle: 'Fun cartoons', type: 'videos' },
            { id: 'songs', title: 'Music Party', subtitle: 'Sing along', type: 'songs' },
            { id: 'letters', title: 'ABC & 123', subtitle: 'The basics', type: 'letters' },
            { id: 'stories', title: 'Story Time', subtitle: 'Read stories', type: 'stories' },
            { id: 'conversation', title: 'Speak Up', subtitle: 'Talk nicely', type: 'conversation' },
          ]
        };

        setTimeout(() => {
          setDashboardData(mockApiResponse);
          setLoading(false);
        }, 800);

      } catch (error) {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigation = (categoryType: string) => {
    if (isGuest && categoryType !== 'learning') {
      Alert.alert('Locked!', 'Ask your parents to log in!');
      return;
    }
    const routeMap: Record<string, string> = {
      learning: 'Levels',
      letters: 'LetterSelection',
      songs: 'Songs',
      videos: 'Videos',
      stories: 'Stories',
      conversation: 'Conversation',
    };
    const routeName = routeMap[categoryType];
    if (routeName) navigation.navigate(routeName as never);
  };

  const styles = getStyles(responsive);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#4FACFE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Q-bit Kids</Text>
        </View>
        <TouchableOpacity onPress={() => (navigation as any).navigate(isGuest ? 'Login' : 'Profile')}>
          {renderProfileImage(currentUser, styles)}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- NON-CLICKABLE WELCOME BANNER (New Requirement) --- */}
        {/* Progress Bar-க்கு பதில் இந்த "Hero Badge" டிசைன் */}
        <View style={styles.heroBanner}>
          <LinearGradient 
            colors={['#6A11CB', '#2575FC']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}} 
            style={styles.heroGradient}
          >
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroWelcome}>Welcome Back,</Text>
              <Text style={styles.heroName}>
                {isGuest ? 'Little Explorer!' : (currentUser?.name || currentUser?.username || 'Super Hero!')}
              </Text>
              <View style={styles.heroTag}>
                 <MaterialCommunityIcons name="star-face" size={14} color="#FFF" />
                 <Text style={styles.heroTagText}>Ready to learn?</Text>
              </View>
            </View>
            
            <View style={styles.heroIconContainer}>
               {/* 3D looking icon */}
               <MaterialCommunityIcons name="rocket-launch" size={60} color="#FFD700" style={styles.rocketIcon} />
               <View style={styles.cloudDecor} />
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Pick an Activity</Text>

        {/* --- CARDS CONTAINER --- */}
        <View style={styles.cardsContainer}>
          {dashboardData?.categories.map((item) => {
            const styleConfig = CATEGORY_STYLES[item.id] || CATEGORY_STYLES['learning'];

            // 1. LARGE CARD
            if (styleConfig.size === 'large') {
              return (
                <TouchableOpacity key={item.id} onPress={() => handleNavigation(item.type)} activeOpacity={0.9}>
                  <LinearGradient colors={styleConfig.colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.largeCard}>
                    <View style={styles.largeCardContent}>
                       <View>
                         <Text style={styles.cardTitleLarge}>{item.title}</Text>
                         <Text style={styles.cardSubtitleLarge}>{item.subtitle}</Text>
                         <View style={styles.playButton}>
                           <Text style={styles.playButtonText}>PLAY</Text>
                           <MaterialIcons name="play-arrow" size={20} color="#333" />
                         </View>
                       </View>
                       <MaterialCommunityIcons name={styleConfig.icon} size={70} color="#FFF" style={styles.fgIconLarge} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }
            return null;
          })}

          {/* 2. MEDIUM CARDS */}
          <View style={styles.mediumRow}>
            {dashboardData?.categories.map((item) => {
               const styleConfig = CATEGORY_STYLES[item.id];
               if (styleConfig?.size === 'medium') {
                 return (
                  <TouchableOpacity key={item.id} style={styles.mediumCardWrapper} onPress={() => handleNavigation(item.type)} activeOpacity={0.9}>
                     <LinearGradient colors={styleConfig.colors} style={styles.mediumCard}>
                        <MaterialCommunityIcons name={styleConfig.icon} size={32} color="#FFF" />
                        <Text style={styles.cardTitleMedium}>{item.title}</Text>
                     </LinearGradient>
                  </TouchableOpacity>
                 );
               }
               return null;
            })}
          </View>

          {/* 3. SMALL CARDS */}
          <View style={styles.smallListContainer}>
            {dashboardData?.categories.map((item) => {
               const styleConfig = CATEGORY_STYLES[item.id];
               if (styleConfig?.size === 'small') {
                 return (
                   <TouchableOpacity key={item.id} onPress={() => handleNavigation(item.type)} activeOpacity={0.8}>
                     <View style={styles.smallListItem}>
                        <LinearGradient colors={styleConfig.colors} style={styles.smallIconBox}>
                           <MaterialCommunityIcons name={styleConfig.icon} size={24} color="#FFF" />
                        </LinearGradient>
                        <View style={styles.smallListText}>
                           <Text style={styles.smallListTitle}>{item.title}</Text>
                           <Text style={styles.smallListSubtitle}>{item.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                     </View>
                   </TouchableOpacity>
                 );
               }
               return null;
            })}
          </View>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const renderProfileImage = (currentUser: any, styles: any) => {
  if (!currentUser || currentUser.isGuest) {
    return <View style={styles.guestBadge}><Text style={styles.guestText}>Guest</Text></View>;
  }
  const imageUri = resolveImageUri(currentUser.profileImageUrl);
  if (imageUri) return <Image source={{ uri: imageUri }} style={styles.profileImage} />;
  if (isEmojiLike(currentUser.profileImageUrl)) {
    return <View style={[styles.profileImage, styles.emojiContainer]}><Text style={{fontSize: 20}}>{currentUser.profileImageUrl}</Text></View>;
  }
  return <View style={[styles.profileImage, styles.defaultAvatar]}><MaterialIcons name="person" size={24} color="#FFF" /></View>;
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: responsive.hp(6),
    paddingBottom: 10,
  },
  appName: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: 1 },
  profileImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },
  emojiContainer: { backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  defaultAvatar: { backgroundColor: '#64748B', justifyContent: 'center', alignItems: 'center' },
  guestBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  guestText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },

  // --- NEW HERO BANNER (Non-Clickable) ---
  heroBanner: {
    marginBottom: 25,
    borderRadius: 24,
    // No elevation or shadow to make it look "flat" and non-clickable if desired, 
    // or keep shadow for aesthetics but use View instead of TouchableOpacity
    shadowColor: "#2575FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6, 
  },
  heroGradient: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  heroTextContainer: { flex: 1, zIndex: 2 },
  heroWelcome: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 2 },
  heroName: { fontSize: 22, color: '#FFF', fontWeight: 'bold', marginBottom: 12 },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroTagText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  heroIconContainer: { alignItems: 'center', justifyContent: 'center' },
  rocketIcon: { zIndex: 2 },
  cloudDecor: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: 10,
    right: -10,
  },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#334155', marginBottom: 15, marginLeft: 5 },
  cardsContainer: { gap: 15 },

  // LARGE CARD
  largeCard: { height: 170, borderRadius: 24, padding: 25, elevation: 8 },
  largeCardContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleLarge: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 5 },
  cardSubtitleLarge: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 20 },
  playButton: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'flex-start' },
  playButtonText: { fontWeight: '800', color: '#333', marginRight: 4, fontSize: 12 },
  fgIconLarge: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },

  // MEDIUM CARDS
  mediumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  mediumCardWrapper: { width: '48%' },
  mediumCard: { height: 130, borderRadius: 20, padding: 15, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  cardTitleMedium: { fontSize: 16, fontWeight: '800', color: '#FFF', marginTop: 10 },

  // SMALL LIST
  smallListContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 10 },
  smallListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  smallIconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  smallListText: { flex: 1 },
  smallListTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  smallListSubtitle: { fontSize: 13, color: '#94A3B8' },
});

export default HomeScreen;