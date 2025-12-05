# 🚀 Localhost Backend - Quick Start Guide

## ✅ Setup Complete!

Local development mode has been configured. Follow these steps:

### 1. Install Dependencies
```bash
cd Trilingo_Mobile_App
npm install
```

This will install `cross-env` package needed for the local development scripts.

### 2. Start Backend (if not already running)
```bash
cd ../Trilingo_Backend
dotnet run
# Backend should be running on http://localhost:5166
```

### 3. Start Mobile App with Localhost Backend

**Option A: Use the new local scripts (Easiest)**
```bash
cd Trilingo_Mobile_App

# For Android Emulator
npm run android:local

# For iOS Simulator
npm run ios:local

# For Web Browser
npm run web:local

# Or just start and choose platform
npm run start:local
```

**Option B: Manual environment variable**
```bash
# Windows (PowerShell)
$env:EXPO_PUBLIC_ENABLE_LOCAL="true"; npm start

# Windows (CMD)
set EXPO_PUBLIC_ENABLE_LOCAL=true && npm start

# Mac/Linux
export EXPO_PUBLIC_ENABLE_LOCAL=true && npm start
```

### 4. Verify Connection

1. Check console logs - you should see:
   ```
   Initializing API Service with base URL: http://localhost:5166/api
   ```
   or
   ```
   Initializing API Service with base URL: http://10.0.2.2:5166/api
   ```
   (for Android emulator)

2. Try logging in - should connect to localhost backend
3. Check if data loads correctly

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo (uses CloudFront by default) |
| `npm run start:local` | Start Expo with localhost backend |
| `npm run android` | Start Android (CloudFront) |
| `npm run android:local` | Start Android (localhost) |
| `npm run ios` | Start iOS (CloudFront) |
| `npm run ios:local` | Start iOS (localhost) |
| `npm run web` | Start Web (CloudFront) |
| `npm run web:local` | Start Web (localhost) |

## 🔧 Platform-Specific URLs

When `EXPO_PUBLIC_ENABLE_LOCAL=true` is set:
- **Android Emulator**: Automatically uses `http://10.0.2.2:5166/api`
- **iOS Simulator**: Automatically uses `http://localhost:5166/api`
- **Web**: Automatically uses `http://localhost:5166/api`
- **Physical Device**: Uses your computer's IP address (find with `ipconfig` or `ifconfig`)

## 🐛 Troubleshooting

### Issue: Still connecting to CloudFront
**Solution**: Make sure you're using the `:local` scripts or environment variable is set correctly.

### Issue: Cannot connect to localhost
**Solution**: 
- Android: Make sure backend is running and use `10.0.2.2` instead of `localhost`
- Check firewall settings
- Verify backend is running on port 5166

### Issue: cross-env not found
**Solution**: Run `npm install` to install dependencies.

## 📝 Notes

- The `:local` scripts automatically set `EXPO_PUBLIC_ENABLE_LOCAL=true`
- Regular scripts (`npm start`, `npm run android`, etc.) still use CloudFront
- You can switch between localhost and CloudFront anytime by using different scripts

