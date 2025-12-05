# Android Development Setup Guide

## Issues Fixed

### 1. Package Version Mismatch ✅
- **Issue**: `@react-native-community/slider@5.1.1` should be `5.0.1`
- **Fixed**: Updated `package.json` to use correct version

### 2. No Android Device/Emulator Found
Follow the steps below to set up Android development.

---

## Quick Fix Steps

### Step 1: Install Correct Package Version

Run these commands in the `Trilingo_Mobile_App` directory:

```bash
# Remove node_modules and package-lock.json (optional, but recommended)
rm -rf node_modules package-lock.json

# Install dependencies with correct version
npm install

# Or if using yarn
yarn install
```

### Step 2: Set Up Android Emulator

You have **3 options**:

#### Option A: Use Expo Go App (Easiest - Recommended for Quick Testing)

1. **Install Expo Go** on your Android phone:
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start Expo development server**:
   ```bash
   npm start
   # or
   expo start
   ```

3. **Scan QR code** with Expo Go app

**Pros**: No Android Studio needed, works on any Android phone  
**Cons**: Limited to Expo-managed features

---

#### Option B: Use Android Studio Emulator (Best for Full Development)

1. **Install Android Studio**:
   - Download from: https://developer.android.com/studio
   - Install with Android SDK and Android Virtual Device (AVD)

2. **Create Android Virtual Device (AVD)**:
   - Open Android Studio
   - Go to **Tools** → **Device Manager**
   - Click **Create Device**
   - Select a device (e.g., Pixel 5)
   - Select a system image (e.g., Android 13 - API 33)
   - Finish setup

3. **Start the Emulator**:
   - In Device Manager, click **Play** button next to your AVD
   - Wait for emulator to boot (may take a few minutes first time)

4. **Verify ADB Connection**:
   ```bash
   adb devices
   # Should show your emulator
   ```

5. **Run the App**:
   ```bash
   npm run android
   # or
   expo start --android
   ```

**Pros**: Full Android development environment, can test native features  
**Cons**: Requires Android Studio, uses more resources

---

#### Option C: Use Physical Android Device

1. **Enable Developer Options** on your Android phone:
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
   - Go back to **Settings** → **Developer Options**

2. **Enable USB Debugging**:
   - In Developer Options, enable **USB Debugging**
   - Connect phone via USB to your computer

3. **Accept Debugging Prompt**:
   - On your phone, accept the "Allow USB Debugging" prompt

4. **Verify Connection**:
   ```bash
   adb devices
   # Should show your device
   ```

5. **Run the App**:
   ```bash
   npm run android
   ```

**Pros**: Real device testing, best performance  
**Cons**: Need USB connection or same WiFi network

---

## Troubleshooting

### Error: "No Android connected device found"

**Solution 1**: Start emulator manually first
```bash
# List available emulators
emulator -list-avds

# Start specific emulator (replace with your AVD name)
emulator -avd Pixel_5_API_33

# Wait for emulator to boot, then run:
npm run android
```

**Solution 2**: Check ADB connection
```bash
# Check if devices are connected
adb devices

# If no devices, restart ADB server
adb kill-server
adb start-server
adb devices
```

**Solution 3**: Use Expo Go instead
```bash
# Just start Expo server
npm start

# Scan QR code with Expo Go app on your phone
```

### Error: "Android SDK not found"

**Solution**: Install Android SDK
- Open Android Studio
- Go to **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
- Install Android SDK Platform-Tools
- Add to PATH:
  - Windows: `%LOCALAPPDATA%\Android\Sdk\platform-tools`
  - Mac/Linux: `~/Library/Android/sdk/platform-tools` or `~/Android/Sdk/platform-tools`

### Error: "Command 'adb' not found"

**Solution**: Add Android SDK platform-tools to PATH
- Find your Android SDK location (usually in Android Studio settings)
- Add `platform-tools` directory to your system PATH
- Restart terminal/command prompt

### Error: Emulator is Slow

**Solutions**:
1. Enable Hardware Acceleration (HAXM/Intel HAXM)
2. Increase RAM allocation in AVD settings (2GB+ recommended)
3. Close other applications
4. Use a physical device instead

---

## Alternative: Use Expo Go (No Setup Required)

If you just want to test the app quickly without setting up Android Studio:

```bash
# In Trilingo_Mobile_App directory
npm start
```

Then:
1. Install **Expo Go** app on your Android phone
2. Scan the QR code shown in terminal
3. App loads on your phone instantly!

**Note**: Expo Go works for development but has limitations for production builds.

---

## Next Steps After Setup

Once you have Android working:

1. **Verify backend connection**:
   - Make sure backend is running on `http://localhost:5166`
   - For Android emulator, backend should be accessible at `http://10.0.2.2:5166`

2. **Test the app**:
   - Try login/registration
   - Test navigation
   - Verify API calls work

3. **Check logs**:
   - In terminal where you ran `npm start`, you'll see logs
   - Use `adb logcat` for Android logs

---

## Recommended Setup for Development

**Best Option**: **Android Studio Emulator** + **Physical Device**
- Use emulator for quick testing
- Use physical device for real-world testing

**Quick Testing**: **Expo Go** on phone
- Fastest way to see changes
- No setup required

---

## Commands Reference

```bash
# Start Expo dev server
npm start

# Start and launch on Android
npm run android

# Start and launch on iOS (Mac only)
npm run ios

# Start and launch on Web
npm run web

# Check connected devices
adb devices

# View Android logs
adb logcat

# Restart ADB server
adb kill-server && adb start-server
```

---

## Still Having Issues?

1. **Check Expo documentation**: https://docs.expo.dev/workflow/android-studio-emulator/
2. **Verify Android Studio installation**
3. **Check PATH environment variables**
4. **Try Expo Go as fallback**
5. **Check firewall/antivirus** isn't blocking connections

