# API Connection Issue - Quick Fix

## Problem
The app is trying to connect to `http://localhost:5166/api` but the backend is not running locally.

## Solutions

### Option 1: Use CloudFront (Production) - Recommended for Testing

Since CloudFront is reachable, the easiest fix is to use it:

1. **Create a `.env` file** in `Trilingo_Mobile_App` folder:
```env
EXPO_PUBLIC_FORCE_PROD=true
```

2. **Or** update the config directly (see Option 2 below)

3. **Restart Expo**:
   - Press `Ctrl+C` to stop the current server
   - Run `npm start` again
   - The app will now use CloudFront

---

### Option 2: Start Backend Locally

If you want to use the local backend:

1. **Start the backend server**:
```bash
cd Trilingo_Backend/TES_Learning_App.API
dotnet run
```

2. **Verify backend is running**:
   - Open browser: `http://localhost:5166/swagger`
   - Should see Swagger UI

3. **Update mobile app config**:
   - For Expo Go on physical device, update your IP in `apiConfig.ts`
   - Get your IP: Run `ipconfig` (Windows) and find your IPv4 address
   - Update `PHYSICAL_DEVICE` in `src/config/apiConfig.ts`

4. **Create `.env` file**:
```env
EXPO_PUBLIC_ENABLE_LOCAL=true
EXPO_PUBLIC_API_URL=http://YOUR_IP:5166/api
```

---

### Option 3: Quick Config Fix

Edit `src/config/apiConfig.ts` and change the return value in `getApiBaseUrl()`:

```typescript
export const getApiBaseUrl = (): string => {
  // Force CloudFront for now
  return API_CONFIG.PRODUCTION;
  
  // ... rest of the function
};
```

Then restart Expo.

---

## Current Status

- ✅ App is running (Expo server started)
- ✅ CloudFront is reachable
- ❌ Local backend is NOT running
- ❌ App is trying to use localhost

**Quickest Fix**: Create `.env` file with `EXPO_PUBLIC_FORCE_PROD=true` and restart Expo.

---

## For Physical Device (Expo Go)

If using Expo Go on your phone with IP `10.207.178.68`:

**Option A - Use CloudFront** (Easiest):
```env
EXPO_PUBLIC_FORCE_PROD=true
```

**Option B - Use Your Computer's Backend**:
1. Start backend locally
2. Update `.env`:
```env
EXPO_PUBLIC_ENABLE_LOCAL=true
EXPO_PUBLIC_API_URL=http://10.207.178.68:5166/api
```

**Note**: Make sure your computer and phone are on the same WiFi network!

