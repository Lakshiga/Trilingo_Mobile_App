# 🚀 Quick Start - Expo Go with Localhost Backend

## ✅ Your Configuration

**Your IP Address:** `10.207.178.68`  
**Backend URL:** `http://10.207.178.68:5166/api`

This is already configured in `src/config/apiConfig.ts` ✅

## 📱 Steps to Run on Expo Go

### 1. Start Backend (if not running)
```bash
cd Trilingo_Backend
dotnet run
# Backend should be running on http://localhost:5166
```

### 2. Start Expo with Localhost
```bash
cd Trilingo_Mobile_App
npm run start:local
```

### 3. Connect with Expo Go

**Option A: Scan QR Code**
- Open Expo Go app on your phone
- Scan the QR code shown in terminal
- Make sure phone and computer are on **same WiFi network**

**Option B: Manual Connection**
- In Expo Go, tap "Enter URL manually"
- Enter the URL shown in terminal (usually `exp://YOUR_IP:8081`)

### 4. Verify Connection

Once app loads in Expo Go, check console logs. You should see:
```
Initializing API Service with base URL: http://10.207.178.68:5166/api
```

## 🔧 Troubleshooting

### App doesn't load?
1. **Same WiFi**: Phone and computer must be on same network
2. **Backend running**: Check `http://localhost:5166/api/health` works
3. **Test IP**: Open `http://10.207.178.68:5166/api/health` in phone browser
4. **Firewall**: Allow port 5166 in Windows Firewall

### Can't connect to backend?
1. **Verify IP**: Run `ipconfig` to confirm IP is still `10.207.178.68`
2. **Update if changed**: If IP changed, update `apiConfig.ts` or use:
   ```bash
   $env:EXPO_PUBLIC_API_URL="http://NEW_IP:5166/api"
   npm run start:local
   ```

### Metro bundler issues?
```bash
# Clear cache and restart
npm run start:local -- --clear
```

## 📝 Quick Commands

```bash
# Start with localhost (uses your IP automatically)
npm run start:local

# Or manually set IP if it changed
$env:EXPO_PUBLIC_API_URL="http://10.207.178.68:5166/api"
npm start
```

## ✅ Success Indicators

- ✅ Expo Go app loads without errors
- ✅ Console shows: `Initializing API Service with base URL: http://10.207.178.68:5166/api`
- ✅ Login/API calls work
- ✅ Data loads correctly

## 🔄 If IP Changes

If your IP address changes, update it:

**Option 1: Environment Variable (Temporary)**
```bash
$env:EXPO_PUBLIC_API_URL="http://NEW_IP:5166/api"
npm run start:local
```

**Option 2: Update Config (Permanent)**
Edit `src/config/apiConfig.ts`:
```typescript
PHYSICAL_DEVICE: 'http://NEW_IP:5166/api',
```


