# 📱 Expo Go Physical Device - Connection Fix

## 🔴 Problem
Expo Go app on physical device can't connect to `localhost` backend because `localhost` refers to the device itself, not your computer.

## ✅ Solution: Use Your Computer's IP Address

### Step 1: Find Your Computer's IP Address

**Windows:**
```cmd
ipconfig
```
Look for `IPv4 Address` under your active network adapter (usually WiFi or Ethernet).
Example: `192.168.1.100` or `10.207.178.68`

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for `inet` address (not `127.0.0.1`).

### Step 2: Update API Configuration

**Option A: Set Environment Variable (Recommended)**
```bash
# Windows (PowerShell)
$env:EXPO_PUBLIC_API_URL="http://YOUR_IP:5166/api"
npm run start:local

# Windows (CMD)
set EXPO_PUBLIC_API_URL=http://YOUR_IP:5166/api && npm run start:local

# Mac/Linux
export EXPO_PUBLIC_API_URL=http://YOUR_IP:5166/api && npm run start:local
```

Replace `YOUR_IP` with your actual IP (e.g., `192.168.1.100`)

**Option B: Update apiConfig.ts**
Edit `src/config/apiConfig.ts`:
```typescript
PHYSICAL_DEVICE: 'http://YOUR_IP:5166/api', // Replace YOUR_IP with your actual IP
```

**Option C: Update app.json**
Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://YOUR_IP:5166/api"
    }
  }
}
```

### Step 3: Verify Network Connection

1. **Both devices on same network**: Computer and phone must be on same WiFi
2. **Backend accessible**: Test from phone's browser: `http://YOUR_IP:5166/api/health`
3. **Firewall**: Allow port 5166 in Windows Firewall

### Step 4: Start Expo

```bash
npm run start:local
```

Then scan QR code with Expo Go app.

## 🔧 Quick Fix Commands

### Windows (PowerShell)
```powershell
# Find your IP
ipconfig | Select-String "IPv4"

# Set and start (replace 192.168.1.100 with your IP)
$env:EXPO_PUBLIC_API_URL="http://192.168.1.100:5166/api"; npm run start:local
```

### Windows (CMD)
```cmd
REM Find your IP
ipconfig

REM Set and start (replace 192.168.1.100 with your IP)
set EXPO_PUBLIC_API_URL=http://192.168.1.100:5166/api && npm run start:local
```

### Mac/Linux
```bash
# Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Set and start (replace 192.168.1.100 with your IP)
export EXPO_PUBLIC_API_URL=http://192.168.1.100:5166/api && npm run start:local
```

## 🐛 Troubleshooting

### Issue: Still can't connect
1. **Check IP address**: Make sure you're using the correct IP (not 127.0.0.1)
2. **Same network**: Phone and computer must be on same WiFi
3. **Backend running**: Verify backend is running: `http://localhost:5166/api/health`
4. **Firewall**: Allow port 5166 in firewall settings
5. **Test in browser**: Open `http://YOUR_IP:5166/api/health` on your phone's browser

### Issue: IP address changes
If your IP changes frequently, use:
- **Static IP**: Set static IP on your computer
- **Environment variable**: Always set `EXPO_PUBLIC_API_URL` before starting
- **Network name**: Some routers allow you to access by computer name

### Issue: Backend not accessible
1. **Backend binding**: Make sure backend binds to `0.0.0.0:5166` (not just `localhost`)
2. **Check Program.cs**: Should have `builder.WebHost.UseUrls("http://0.0.0.0:5166");`
3. **CORS**: Backend should allow requests from your phone's IP

## 📝 Current Configuration

Your current `PHYSICAL_DEVICE` IP in `apiConfig.ts`:
```
http://10.207.178.68:5166/api
```

**Update this if your IP has changed!**

## ✅ Verification

After setting up, check console logs in Expo Go:
```
Initializing API Service with base URL: http://YOUR_IP:5166/api
```

If you see this, connection should work!


