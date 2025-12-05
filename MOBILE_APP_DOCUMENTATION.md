# Trilingo Learning App - Mobile App Documentation

## Overview

The Trilingo Learning App mobile application is a cross-platform React Native application built with Expo, designed to provide an engaging language learning experience for children. The app supports multiple languages (English, Tamil, Sinhala), features various interactive learning activities, and integrates seamlessly with the backend API for authentication, content delivery, and progress tracking.

---

## 1. Technologies Used and Why

### Core Framework
- **React Native 0.81.5** with **Expo SDK ~54.0.20**
  - **Why**: Cross-platform development (iOS, Android, Web) with a single codebase. Expo provides excellent tooling, over-the-air updates, and simplifies native module management.

### Language & Type Safety
- **TypeScript 5.9.2**
  - **Why**: Type safety catches errors at compile time, improves code maintainability, and provides better IDE support and autocomplete.

### React Version
- **React 19.1.0**
  - **Why**: Latest React features including improved hooks, better performance, and modern development patterns.

### Navigation
- **React Navigation 7.x** (Stack Navigator)
  - **Why**: Industry-standard navigation library for React Native. Stack navigator provides hierarchical navigation suitable for learning app flows.

### State Management
- **React Context API** (UserContext, ThemeContext)
  - **Why**: Built-in React solution for global state. Lightweight and sufficient for app's state management needs without external dependencies.

### API Communication
- **Axios 1.13.2**
  - **Why**: Robust HTTP client with interceptors, request/response transformation, and excellent error handling. Better than fetch for complex API interactions.

### Local Storage
- **@react-native-async-storage/async-storage 2.2.0**
  - **Why**: Persistent key-value storage for user data, authentication tokens, and preferences. Cross-platform and reliable.

### UI & Styling
- **Expo Linear Gradient** - Beautiful gradient backgrounds
- **Expo Blur** - Blur effects for modern UI
- **React Native SVG** - Vector graphics and icons
- **Expo Vector Icons** - Icon library (MaterialIcons)
- **React Native Safe Area Context** - Handle notches and safe areas

### Media & Media Handling
- **Expo AV** - Audio/video playback
- **Expo Camera** - Camera access for profile images
- **Expo Image Picker** - Image selection from gallery

### Fonts
- **Expo Font** - Custom font loading
- **Spicy Rice** - Custom decorative font for kid-friendly UI

### Development Tools
- **Babel** - JavaScript transpiler
- **Metro Bundler** - React Native bundler (included with Expo)
- **TypeScript** - Type checking and compilation

---

## 2. Responsibilities of the Mobile App

### Primary Responsibilities

#### 2.1 User Authentication & Management
- User registration and login
- Guest mode support
- Admin user support
- Profile management (view/edit)
- Profile image upload
- Session persistence (token storage)
- Automatic token refresh handling

#### 2.2 Content Display & Navigation
- **Home Screen**: Main navigation hub with learning categories
- **Levels Screen**: Display learning levels
- **Lessons Screen**: Show lessons within a level
- **Activities Screen**: Display activities within a lesson
- **Exercise Screen**: Show exercises within an activity
- **Dynamic Activity Screen**: Render interactive learning activities

#### 2.3 Interactive Learning Activities
The app supports multiple activity types:
- **Flashcard**: Card-based learning
- **MCQ (Multiple Choice Questions)**: Quiz activities
- **Fill in the Blanks**: Text completion exercises
- **Matching**: Pair matching games
- **Memory Pair**: Memory card games
- **True/False**: True/false questions
- **Scramble**: Word unscrambling
- **Pronunciation**: Speech practice
- **Bubble Blast**: Game-based learning
- **Triple Blast**: Advanced game activity
- **Group Sorter**: Categorization activities
- **Song Player**: Audio playback with lyrics
- **Story Player**: Interactive story reading
- **Video Player**: Video content playback
- **Conversation Player**: Dialogue practice

#### 2.4 Media Content
- **Songs Screen**: Browse and play songs
- **Videos Screen**: Browse and watch videos
- **Stories Screen**: Read/listen to stories
- **Conversation Screen**: Practice conversations

#### 2.5 User Experience
- **Theme Management**: Light/dark mode with user-specific preferences
- **Multi-language Support**: English, Tamil, Sinhala translations
- **Responsive Design**: Adapts to different screen sizes
- **Splash Screen**: Branded app launch
- **Loading States**: User feedback during data fetching
- **Error Handling**: User-friendly error messages

#### 2.6 Data Management
- API integration with backend
- Offline data caching (via AsyncStorage)
- Network error handling and retry logic
- Automatic fallback to public API for guest users

---

## 3. Request/Response Flow

### 3.1 High-Level Flow

```
User Action (Button Press, Navigation)
    ↓
Screen Component
    ↓
Context Hook (useUser, useTheme)
    ↓
Service Layer (apiService)
    ↓
API Interceptor (Adds JWT Token)
    ↓
HTTP Request (Axios)
    ↓
Backend API
    ↓
Response Processing
    ↓
Update Context/State
    ↓
UI Re-render
```

### 3.2 Detailed Request Flow Example: User Login

1. **User enters credentials** in `LoginScreen`
2. **User taps "Login" button**
3. **LoginScreen** calls `UserContext.login()`
4. **UserContext** calls `UserStorage.loginUser()`
5. **UserStorage** calls `apiService.login()`
6. **API Service**:
   - Creates `LoginRequest` object
   - Uses `publicApi` instance (no auth token needed)
   - Sends POST request to `/auth/login`
   - Handles retry logic for network errors
7. **Axios Interceptor**:
   - Adds `Content-Type: application/json` header
   - Sends request to backend
8. **Backend Response**:
   - Success: Returns `AuthResponse` with JWT token
   - Error: Returns error message
9. **API Service**:
   - Stores token in AsyncStorage
   - Returns `AuthResponse` to UserStorage
10. **UserStorage**:
    - Creates `UserData` object
    - Saves to AsyncStorage
    - Restores language preferences
    - Returns user data
11. **UserContext**:
    - Updates `currentUser` state
    - Triggers re-render
12. **Navigation**:
    - Automatically navigates to `HomeScreen`
    - User sees home screen with personalized content

### 3.3 API Service Architecture

#### Dual API Instances
- **`publicApi`**: For unauthenticated requests (login, register, public content)
- **`api`**: For authenticated requests (protected endpoints)

#### Request Interceptors
```typescript
// Authenticated API - adds JWT token
this.api.interceptors.request.use(async (config) => {
  const token = await this.getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Response Interceptors
```typescript
// Handles 401 errors (token expired)
this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await this.clearAuthToken();
      // Could trigger logout here
    }
    return Promise.reject(error);
  }
);
```

#### Retry Logic
- Automatic retry for network errors (504, 503, 502, timeouts)
- Exponential backoff (1s, 2s, 4s delays)
- Maximum 3 retries for POST requests
- Maximum 2 retries for GET requests

### 3.4 Error Handling Flow

1. **Network Error**: Retry with exponential backoff
2. **401 Unauthorized**: Clear token, potentially logout
3. **403 Forbidden**: Permission denied error
4. **404 Not Found**: Resource not found
5. **500 Server Error**: Server-side error message
6. **Timeout**: Request timeout error
7. **Connection Error**: Network diagnostics run

### 3.5 Data Flow for Content Loading

```
Screen Mounts (e.g., LevelsScreen)
    ↓
useEffect Hook Triggers
    ↓
apiService.getAllLevels()
    ↓
API Call with Retry Logic
    ↓
Response: LevelDto[]
    ↓
Update Component State
    ↓
Render Levels List
    ↓
User Taps Level
    ↓
Navigate to LessonsScreen with levelId
    ↓
LessonsScreen fetches stages for levelId
    ↓
... (continues for nested navigation)
```

---

## 4. Authentication, Authorization, and Data Storage

### 4.1 Authentication Flow

#### Registration
1. User fills registration form (username, email, password, language preferences)
2. **RegisterScreen** calls `UserContext.register()`
3. **UserContext** calls `UserStorage.registerUser()`
4. **UserStorage** calls `apiService.register()`
5. **Backend** creates user account and returns JWT token
6. **Token stored** in AsyncStorage (`authToken` key)
7. **User data saved** to AsyncStorage (`@trilingo_user_data` key)
8. **Language preferences** saved separately (`@trilingo_user_prefs_{username}`)
9. **UserContext** updates state
10. **Navigation** to HomeScreen

#### Login
1. User enters identifier (username/email) and password
2. **LoginScreen** calls `UserContext.login()`
3. **Special Cases**:
   - **Admin**: Hardcoded credentials (`Admin` / `Admin@123`)
   - **Guest**: Creates guest user without backend call
4. **Regular User**: Backend login via `apiService.login()`
5. **Token Management**:
   - Token stored in AsyncStorage
   - Token added to all subsequent API requests
   - Token cleared on logout
6. **User Data Restoration**:
   - Fetches user profile from backend
   - Restores saved language preferences
   - Loads profile image URL

#### Guest Mode
- No backend authentication required
- Limited access to content
- User data stored locally only
- Can upgrade to full account via registration

#### Logout
1. User taps logout button
2. **UserContext** calls `UserStorage.logout()`
3. **UserStorage**:
   - Calls `apiService.logout()` (optional backend call)
   - Removes token from AsyncStorage
   - Removes user data from AsyncStorage
4. **UserContext** sets `currentUser` to `null`
5. **Navigation** to Welcome/Login screen

### 4.2 Token Management

#### Token Storage
```typescript
// Stored in AsyncStorage
const token = await AsyncStorage.getItem('authToken');
await AsyncStorage.setItem('authToken', token);
await AsyncStorage.removeItem('authToken');
```

#### Token Usage
- Automatically added to authenticated API requests via interceptor
- Format: `Authorization: Bearer {token}`
- Validated by backend on each request
- Cleared on 401 response (expired/invalid)

#### Token Lifecycle
1. **Obtained**: During login/registration
2. **Stored**: In AsyncStorage
3. **Attached**: To all authenticated requests
4. **Validated**: By backend on each request
5. **Refreshed**: Not implemented (tokens expire after 7 days)
6. **Cleared**: On logout or 401 error

### 4.3 Authorization

#### Role-Based Access
- **Parent**: Regular user, full access to learning content
- **Admin**: Special admin features (if implemented)
- **Guest**: Limited access, no backend authentication

#### Permission Handling
- API returns 403 for unauthorized endpoints
- App gracefully handles permission errors
- Guest users use public API endpoints
- Authenticated users use authenticated API endpoints

### 4.4 Data Storage

#### AsyncStorage Structure

**User Data** (`@trilingo_user_data`):
```typescript
{
  username: string;
  name: string;
  email: string;
  age: string;
  nativeLanguage: string;
  learningLanguage: string;
  isAdmin: boolean;
  isGuest: boolean;
  profileImageUrl?: string;
}
```

**Language Preferences** (`@trilingo_user_prefs_{username}`):
```typescript
{
  nativeLanguage: string;
  learningLanguage: string;
}
```

**Theme Preferences** (`theme_preference_{username}`):
```typescript
'dark' | 'light'
```

**Admin Profile Image** (`admin_profile_image`):
```typescript
string // URL to profile image
```

**Auth Token** (`authToken`):
```typescript
string // JWT token
```

#### Storage Operations
- **Save**: `AsyncStorage.setItem(key, JSON.stringify(data))`
- **Read**: `JSON.parse(await AsyncStorage.getItem(key))`
- **Delete**: `AsyncStorage.removeItem(key)`
- **All operations are async** and wrapped in try-catch

#### Data Persistence
- User data persists across app restarts
- Language preferences persist across logouts
- Theme preferences are user-specific
- Token persists until logout or expiration

---

## 5. Developer Workflow and Tools

### 5.1 Project Structure

```
Trilingo_Mobile_App/
├── App.tsx                    # Application entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
├── babel.config.js            # Babel configuration
├── metro.config.js            # Metro bundler config
│
├── assets/                    # Static assets
│   ├── fonts/                 # Custom fonts
│   ├── images/                # Images, GIFs, icons
│   └── videos/                 # Video files
│
└── src/
    ├── components/            # Reusable components
    │   ├── activity-types/   # Activity components
    │   └── BrandHeader.tsx   # Brand header component
    │
    ├── config/                # Configuration
    │   └── apiConfig.ts      # API configuration
    │
    ├── context/               # React Context providers
    │   └── UserContext.tsx  # User state management
    │
    ├── navigation/            # Navigation setup
    │   ├── AppNavigation.tsx # Main navigator
    │   └── AppNavigator.tsx  # Stack navigator config
    │
    ├── screens/               # Screen components
    │   ├── HomeScreen.tsx
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── ProfileScreen.tsx
    │   └── ... (other screens)
    │
    ├── services/              # API services
    │   └── api.ts            # API service (Axios)
    │
    ├── theme/                 # Theming
    │   ├── ThemeContext.tsx  # Theme provider
    │   └── designSystem.ts   # Design tokens
    │
    └── utils/                 # Utility functions
        ├── UserStorage.ts    # Storage utilities
        ├── activityMappings.ts
        ├── imageUtils.ts
        ├── languageUtils.ts
        ├── translations.ts
        └── ... (other utilities)
```

### 5.2 Development Tools

#### Required Tools
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go App** (for testing on physical devices)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

#### Recommended IDE
- **Visual Studio Code** with extensions:
  - ESLint
  - Prettier
  - React Native Tools
  - TypeScript and JavaScript Language Features

### 5.3 Development Workflow

#### 1. Setting Up the Project
```bash
# Navigate to mobile app directory
cd Trilingo_Mobile_App

# Install dependencies
npm install

# Or with yarn
yarn install
```

#### 2. Running the Application

**Development Mode**:
```bash
# Start Expo development server
npm start
# or
expo start

# Options:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Press 'w' for web
# - Scan QR code with Expo Go app
```

**Platform-Specific**:
```bash
# Android
npm run android
# or
expo start --android

# iOS
npm run ios
# or
expo start --ios

# Web
npm run web
# or
expo start --web
```

#### 3. Configuration

**API Configuration** (`src/config/apiConfig.ts`):
- Update `API_CONFIG` object with your backend URLs
- For local development: Use `http://localhost:5166/api` or `http://10.0.2.2:5166/api` (Android emulator)
- For production: Use CloudFront URL

**Environment Variables**:
```bash
# Set API URL
export EXPO_PUBLIC_API_URL=http://localhost:5166/api

# Enable local development
export EXPO_PUBLIC_ENABLE_LOCAL=true

# Force production
export EXPO_PUBLIC_FORCE_PROD=true
```

**Expo Configuration** (`app.json`):
- Update `extra.apiBaseUrl` for default API URL
- Configure app name, version, icons, splash screen

#### 4. Adding New Features

**Example: Adding a New Screen**

1. **Create Screen Component** (`src/screens/NewScreen.tsx`):
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NewScreen: React.FC = () => {
  const navigation = useNavigation();
  
  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
};

export default NewScreen;
```

2. **Add to Navigator** (`src/navigation/AppNavigator.tsx`):
```typescript
import NewScreen from '../screens/NewScreen';

// In Stack.Navigator:
<Stack.Screen name="NewScreen" component={NewScreen} />
```

3. **Navigate to Screen**:
```typescript
navigation.navigate('NewScreen');
```

**Example: Adding a New Activity Type**

1. **Create Activity Component** (`src/components/activity-types/NewActivity.tsx`):
```typescript
import React from 'react';
import { View, Text } from 'react-native';

interface NewActivityProps {
  activityData: any;
  onComplete: () => void;
}

const NewActivity: React.FC<NewActivityProps> = ({ activityData, onComplete }) => {
  return (
    <View>
      <Text>New Activity</Text>
    </View>
  );
};

export default NewActivity;
```

2. **Register in Activity Mappings** (`src/utils/activityMappings.ts`):
```typescript
export const ACTIVITY_TYPE_MAP = {
  // ... existing mappings
  'new-activity': NewActivity,
};
```

3. **Update Activity Type Names**:
```typescript
export const NEW_ACTIVITY_TYPE_NAMES = ['new activity'];
```

#### 5. Testing

**Manual Testing**:
- Use Expo Go app on physical device
- Test on Android emulator
- Test on iOS simulator
- Test on web browser

**Network Testing**:
- Test with local backend
- Test with CloudFront (production)
- Test offline behavior
- Test error scenarios (network failures, timeouts)

**User Flow Testing**:
- Registration → Login → Home
- Guest mode → Content access
- Profile update → Image upload
- Navigation between screens
- Activity completion

#### 6. Debugging

**React Native Debugger**:
- Enable remote debugging in Expo Go
- Use Chrome DevTools
- Inspect network requests
- View console logs

**Console Logging**:
```typescript
console.log('Debug message');
console.error('Error message');
console.warn('Warning message');
```

**React DevTools**:
- Install React DevTools browser extension
- Inspect component tree
- View props and state

**Network Debugging**:
- Check API requests in Network tab
- Verify request headers (Authorization token)
- Check response data
- Test with different API URLs

#### 7. Building for Production

**Android APK**:
```bash
expo build:android
# or
eas build --platform android
```

**iOS IPA**:
```bash
expo build:ios
# or
eas build --platform ios
```

**Web Build**:
```bash
expo export:web
```

#### 8. Code Quality

**TypeScript**:
- Strict type checking enabled
- All components typed
- API responses typed
- Utility functions typed

**Code Organization**:
- Components in `components/` folder
- Screens in `screens/` folder
- Utilities in `utils/` folder
- Services in `services/` folder
- Context providers in `context/` folder

**Best Practices**:
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components small and focused
- Use TypeScript for type safety
- Handle errors gracefully
- Provide loading states
- Optimize images and assets

---

## 6. Key Features

### 6.1 Multi-Language Support
- **Supported Languages**: English, Tamil, Sinhala
- **Translation System**: `src/utils/translations.ts`
- **User Preferences**: Stored per user
- **Dynamic Switching**: Changes based on user's native language

### 6.2 Theme System
- **Light/Dark Mode**: User-specific preferences
- **Theme Context**: Global theme management
- **Persistent Preferences**: Saved per user
- **Gradient Backgrounds**: Beautiful UI with gradients

### 6.3 Responsive Design
- **Responsive Hook**: `useResponsive()` for screen size detection
- **Adaptive Layouts**: Adjusts to different screen sizes
- **Safe Area Handling**: Respects notches and safe areas

### 6.4 Activity System
- **Dynamic Activity Loading**: Activities loaded from backend
- **Activity Type Mapping**: Maps backend activity types to components
- **JSON Data Parsing**: Parses activity data from backend
- **Interactive Components**: Rich, engaging learning activities

### 6.5 Image Handling
- **Image Resolution**: `resolveImageUri()` for CloudFront URLs
- **Emoji Detection**: `isEmojiLike()` for emoji handling
- **Profile Images**: Upload and display user profile images
- **Asset Management**: Local and remote image support

### 6.6 Network Resilience
- **Retry Logic**: Automatic retry for failed requests
- **Fallback URLs**: Multiple API URL fallbacks
- **Network Diagnostics**: Connection testing
- **Error Messages**: User-friendly error handling

---

## 7. API Integration

### 7.1 API Service Methods

#### Authentication
- `login(credentials)`: User login
- `register(userData)`: User registration
- `logout()`: User logout
- `getUserProfile()`: Get user profile
- `updateProfile(data)`: Update user profile
- `uploadProfileImage(imageUri)`: Upload profile image

#### Content
- `getAllLevels()`: Get all learning levels
- `getLevelById(id)`: Get specific level
- `getAllStages()`: Get all stages/lessons
- `getStagesByLevelId(levelId)`: Get stages for a level
- `getAllActivities()`: Get all activities
- `getActivitiesByStage(stageId)`: Get activities for a stage
- `getAllExercises()`: Get all exercises
- `getExercisesByActivityId(activityId)`: Get exercises for an activity

#### Main Activities
- `getAllMainActivities()`: Get main activities (Songs, Videos, etc.)
- `getMainActivityById(id)`: Get specific main activity

#### Activity Types
- `getAllActivityTypes()`: Get all activity types
- `getActivityTypeById(id)`: Get specific activity type

### 7.2 API Configuration

**Base URL Resolution**:
1. Environment variable (`EXPO_PUBLIC_API_URL`)
2. Expo config (`app.json` → `extra.apiBaseUrl`)
3. Runtime host detection
4. Platform-specific defaults
5. Fallback to CloudFront production URL

**URL Priority**:
```
EXPO_PUBLIC_API_URL > 
app.json extra.apiBaseUrl > 
Runtime host detection > 
Platform defaults > 
CloudFront production
```

### 7.3 Request/Response Format

**Request Format**:
```typescript
// GET request
apiService.get<ResponseType>('/endpoint');

// POST request
apiService.post<ResponseType>('/endpoint', data);

// PUT request
apiService.put<ResponseType>('/endpoint', data);

// DELETE request
apiService.delete<ResponseType>('/endpoint');
```

**Response Format**:
```typescript
interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
```

---

## 8. Navigation Structure

### 8.1 Navigation Hierarchy

```
Welcome (Initial Route)
  ↓
Home
  ├── Levels
  │   └── Lessons
  │       └── Lesson Activities
  │           └── Dynamic Activity
  │               └── Exercise
  │                   └── Exercise Detail
  ├── Songs
  │   └── Song Player
  ├── Videos
  │   └── Video Player
  ├── Stories
  │   └── Story Player
  ├── Conversation
  │   └── Conversation Player
  └── Profile
      ├── Edit Profile
      └── (Back to Home)
```

### 8.2 Navigation Implementation

**Stack Navigator**:
- Uses `@react-navigation/stack`
- All screens in a single stack
- No bottom tabs (simplified navigation)
- Header can be hidden per screen

**Navigation Methods**:
```typescript
// Navigate to screen
navigation.navigate('ScreenName', { params });

// Go back
navigation.goBack();

// Replace current screen
navigation.replace('ScreenName');
```

---

## 9. State Management

### 9.1 Context Providers

**UserContext**:
- Manages current user state
- Provides login/logout/register functions
- Handles user data persistence
- Syncs with UserStorage

**ThemeContext**:
- Manages theme state (light/dark)
- Provides theme toggle function
- Persists theme preferences per user
- Syncs with current username

### 9.2 Local State

**Component State**:
- Uses `useState` hook for component-specific state
- Examples: form inputs, loading states, selected items

**Screen State**:
- Each screen manages its own data fetching
- Uses `useEffect` for data loading
- Handles loading and error states

---

## 10. Error Handling

### 10.1 Error Types

**Network Errors**:
- Connection failures
- Timeouts
- Server errors (500, 502, 503, 504)

**Authentication Errors**:
- Invalid credentials (401)
- Token expiration (401)
- Permission denied (403)

**Validation Errors**:
- Invalid input data
- Missing required fields
- Backend validation failures

### 10.2 Error Handling Strategy

**API Errors**:
- Caught in API service
- Transformed to user-friendly messages
- Retried automatically (for network errors)
- Displayed to user via alerts or error states

**Component Errors**:
- Try-catch blocks in async functions
- Error boundaries (if implemented)
- Fallback UI for error states
- User-friendly error messages

---

## 11. Performance Optimization

### 11.1 Image Optimization
- Use CloudFront CDN for remote images
- Optimize local image sizes
- Lazy load images where possible
- Cache images appropriately

### 11.2 API Optimization
- Batch API calls where possible
- Cache API responses in AsyncStorage
- Use pagination for large datasets
- Implement request debouncing

### 11.3 Component Optimization
- Use `React.memo` for expensive components
- Use `useMemo` for computed values
- Use `useCallback` for function references
- Avoid unnecessary re-renders

---

## 12. Security Considerations

### 12.1 Token Security
- Tokens stored in AsyncStorage (encrypted on device)
- Tokens not logged or exposed
- Automatic token clearing on 401 errors
- No token in URLs or logs

### 12.2 Data Security
- Sensitive data not stored in plain text
- User passwords never stored locally
- Profile images stored securely
- API credentials in environment variables

### 12.3 Network Security
- HTTPS for all API calls (production)
- Certificate pinning (if implemented)
- Secure token transmission
- No sensitive data in URLs

---

## 13. Troubleshooting

### 13.1 Common Issues

**API Connection Failed**:
- Check backend server is running
- Verify API URL in `apiConfig.ts`
- Check network connectivity
- Test with CloudFront URL

**Token Expired**:
- User needs to login again
- Token cleared automatically on 401
- Check token expiration (7 days)

**Image Upload Failed**:
- Check file size and format
- Verify backend upload endpoint
- Check network connection
- Ensure proper FormData format

**Navigation Issues**:
- Verify screen name matches navigator
- Check navigation params
- Ensure screen is registered in navigator

**Theme Not Persisting**:
- Check AsyncStorage permissions
- Verify username is set
- Check theme preference key format

### 13.2 Debugging Tips

**Enable Logging**:
```typescript
console.log('Debug info:', data);
console.error('Error:', error);
```

**Network Debugging**:
- Use React Native Debugger
- Check Network tab in Chrome DevTools
- Verify request headers and payloads
- Test API endpoints with Postman

**State Debugging**:
- Use React DevTools
- Log context values
- Check AsyncStorage contents
- Verify component props

---

## 14. Future Enhancements

### Recommended Improvements
- [ ] Implement token refresh mechanism
- [ ] Add offline mode with data caching
- [ ] Implement push notifications
- [ ] Add analytics tracking
- [ ] Implement deep linking
- [ ] Add unit and integration tests
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Add accessibility features
- [ ] Implement app update mechanism
- [ ] Add crash reporting (Sentry, etc.)

---

## Conclusion

The Trilingo Learning App mobile application is a comprehensive, cross-platform learning solution built with modern React Native and Expo technologies. It provides an engaging user experience with robust authentication, rich interactive activities, and seamless backend integration.

The app follows best practices for React Native development, uses TypeScript for type safety, and implements a clean architecture with separation of concerns. The modular design makes it easy to extend with new features and maintain over time.

For questions or contributions, refer to the project repository or contact the development team.

