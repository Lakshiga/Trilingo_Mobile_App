# 📱 Mobile App - Endpoints & Localhost Setup Guide

## 🔍 Mobile App Endpoints Summary

### Authentication Endpoints
- ✅ `/auth/login` - User login (no admin check for mobile)
- ✅ `/auth/register` - User registration
- ✅ `/auth/logout` - User logout
- ✅ `/auth/me` - Get current user profile
- ✅ `/auth/check-admin` - Check if admin user exists

### Content Endpoints
- ✅ `/Levels` - Get all levels
- ✅ `/Levels/{id}` - Get level by ID
- ✅ `/Stages` - Get all stages/lessons
- ✅ `/Stages/{id}` - Get stage by ID
- ✅ `/Stages/level/{levelId}` - Get stages by level ID
- ✅ `/Activities` - Get all activities
- ✅ `/Activities/{id}` - Get activity by ID
- ✅ `/Activities/stage/{stageId}` - Get activities by stage ID
- ✅ `/activitytypes` - Get all activity types
- ✅ `/activitytypes/{id}` - Get activity type by ID
- ✅ `/mainactivities` - Get all main activities (Songs/Videos)
- ✅ `/mainactivities/{id}` - Get main activity by ID
- ✅ `/exercises` - Get all exercises
- ✅ `/exercises/{id}` - Get exercise by ID
- ✅ `/Activities/{activityId}/exercises` - Get exercises by activity ID

## 🔧 Localhost Backend Connection Setup

### Current Configuration
The mobile app is currently configured to use **CloudFront** by default:
- `app.json` → `extra.apiBaseUrl`: `https://d3v81eez8ecmto.cloudfront.net/api`

### To Connect to Localhost Backend

#### Option 1: Environment Variable (Recommended)
```bash
# Set environment variable before running
export EXPO_PUBLIC_API_URL=http://localhost:5166/api
# or for Android emulator
export EXPO_PUBLIC_API_URL=http://10.0.2.2:5166/api

# Then start the app
npm start
```

#### Option 2: Enable Local Development Mode (✅ RECOMMENDED - Already Configured!)

**Easy Method - Use the new npm scripts:**
```bash
# Start with localhost backend (all platforms)
npm run start:local

# Or platform-specific:
npm run android:local  # Android emulator
npm run ios:local      # iOS simulator
npm run web:local      # Web browser
```

**Manual Method - Set environment variable:**
```bash
# Windows (CMD)
set EXPO_PUBLIC_ENABLE_LOCAL=true && npm start

# Windows (PowerShell)
$env:EXPO_PUBLIC_ENABLE_LOCAL="true"; npm start

# Mac/Linux
export EXPO_PUBLIC_ENABLE_LOCAL=true && npm start
```

**Note**: The `:local` scripts are now available in `package.json` and automatically set `EXPO_PUBLIC_ENABLE_LOCAL=true` for you!

#### Option 3: Update app.json (Permanent)
Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://localhost:5166/api",  // For iOS/Web
      // OR
      "apiBaseUrl": "http://10.0.2.2:5166/api"   // For Android Emulator
    }
  }
}
```

#### Option 4: Update apiConfig.ts (Direct)
Edit `src/config/apiConfig.ts`:
```typescript
export const getApiBaseUrl = (): string => {
  // Force localhost for development
  if (Platform.OS === 'android') {
    return API_CONFIG.ANDROID_EMULATOR; // http://10.0.2.2:5166/api
  } else if (Platform.OS === 'ios') {
    return API_CONFIG.IOS_SIMULATOR; // http://localhost:5166/api
  }
  return API_CONFIG.WEB; // http://localhost:5166/api
};
```

## 📋 Platform-Specific URLs

| Platform | URL | Notes |
|----------|-----|-------|
| **Android Emulator** | `http://10.0.2.2:5166/api` | Use `10.0.2.2` instead of `localhost` |
| **iOS Simulator** | `http://localhost:5166/api` | Can use `localhost` directly |
| **Physical Device** | `http://YOUR_IP:5166/api` | Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux) |
| **Web/Expo Go** | `http://localhost:5166/api` | Works with `localhost` |

## ✅ Verification Steps

### 1. Check Current API URL
The app logs the API base URL on startup. Check console for:
```
Initializing API Service with base URL: http://localhost:5166/api
```

### 2. Test Backend Connection
The app has network diagnostics. Check if backend is reachable:
- Open app
- Check console logs for API calls
- Look for connection errors

### 3. Verify Backend is Running
```bash
# Check if backend is running on port 5166
curl http://localhost:5166/api/health
# or
curl http://localhost:5166/api/auth/check-admin
```

### 4. Test Login Endpoint
```bash
# Test login endpoint
curl -X POST http://localhost:5166/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"testpass"}'
```

## 🔄 Endpoint Compatibility Check

### ✅ All Endpoints Verified
All mobile app endpoints match backend routes:
- `/auth/login` ✅ → Backend: `/api/auth/login`
- `/auth/register` ✅ → Backend: `/api/auth/register`
- `/Levels` ✅ → Backend: `/api/Levels`
- `/Stages` ✅ → Backend: `/api/Stages`
- `/Activities` ✅ → Backend: `/api/Activities`
- `/activitytypes` ✅ → Backend: `/api/ActivityTypes` (case-insensitive)
- `/mainactivities` ✅ → Backend: `/api/MainActivities` (case-insensitive)
- `/exercises` ✅ → Backend: `/api/exercises`

**Note**: ASP.NET Core routes are case-insensitive by default, so both `/activitytypes` and `/ActivityTypes` work.

## 🚀 Quick Start for Localhost

1. **Start Backend**:
   ```bash
   cd Trilingo_Backend
   dotnet run
   # Backend should run on http://localhost:5166
   ```

2. **Configure Mobile App**:
   ```bash
   cd Trilingo_Mobile_App
   export EXPO_PUBLIC_API_URL=http://localhost:5166/api
   # OR for Android:
   export EXPO_PUBLIC_API_URL=http://10.0.2.2:5166/api
   ```

3. **Start Mobile App**:
   ```bash
   npm start
   # Press 'a' for Android, 'i' for iOS, 'w' for web
   ```

4. **Verify Connection**:
   - Check console logs for API calls
   - Try logging in
   - Check if data loads correctly

## 🐛 Troubleshooting

### Issue: Cannot connect to localhost
**Solution**: 
- Android Emulator: Use `10.0.2.2` instead of `localhost`
- Physical Device: Use your computer's IP address
- Check firewall settings

### Issue: CORS errors
**Solution**: 
- Backend CORS is configured to allow all origins in development
- Check `Program.cs` CORS configuration

### Issue: 404 errors
**Solution**:
- Verify backend is running: `curl http://localhost:5166/api/health`
- Check endpoint paths match exactly
- Verify backend routes are registered

### Issue: Timeout errors
**Solution**:
- Check if backend is accessible from mobile device/emulator
- Verify network connection
- Check backend logs for errors

## 📝 Notes

- Mobile app uses **regular `/auth/login`** (no `admin=true` parameter)
- Admin panel uses `/auth/login?admin=true` for admin-only access
- All endpoints work with both localhost and CloudFront
- Backend automatically handles CORS for mobile apps

