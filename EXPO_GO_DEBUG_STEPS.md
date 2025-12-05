# 🔍 Expo Go Debug Steps - App Not Working After Scan

## What to Check When App Doesn't Work

### Step 1: Check Metro Bundler Terminal

Look at the terminal where you ran `npm run start:local`. Check for:
- ❌ Red errors
- ❌ Module not found errors
- ❌ Network errors
- ✅ Should show "Bundling..." then "Bundled successfully"

### Step 2: Check Expo Go App - Dev Menu

1. **Shake your phone** (or press `Cmd+D` on iOS / `Cmd+M` on Android)
2. **Open Dev Menu**
3. **Check "Show Dev Menu"** or **"Debug Remote JS"**
4. **Look for error messages**

### Step 3: Check Console Logs

In Expo Go Dev Menu:
- **"Show Element Inspector"** - Check for UI errors
- **"Debug Remote JS"** - Opens Chrome DevTools
- **Check Console tab** - Look for errors

### Step 4: Common Issues & Fixes

#### Issue: "Unable to resolve module"
**Fix:**
```bash
# Clear cache and restart
npm run start:local -- --clear
```

#### Issue: "Network request failed"
**Fix:**
1. Check backend is running: `http://localhost:5166`
2. Check firewall: Allow port 5166
3. Test from phone browser: `http://10.207.178.68:5166/api/health`

#### Issue: App stuck on splash screen
**Possible causes:**
- Font loading issue
- API connection failing
- Network timeout

**Fix:**
- Check console logs for errors
- Verify backend is accessible
- Check network connection

#### Issue: Red error screen
**Fix:**
1. Read the error message
2. Check Metro bundler terminal
3. Common fixes:
   ```bash
   # Clear cache
   npm run start:local -- --clear
   
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

### Step 5: Verify API Connection

Check what URL the app is using:

1. **In Expo Go Dev Menu:**
   - Enable "Debug Remote JS"
   - Open Chrome DevTools
   - Check Console
   - Look for: `Initializing API Service with base URL: ...`

2. **Should see:**
   ```
   Initializing API Service with base URL: http://10.207.178.68:5166/api
   ```

3. **If seeing CloudFront URL instead:**
   ```bash
   # Force localhost
   $env:EXPO_PUBLIC_ENABLE_LOCAL="true"
   $env:EXPO_PUBLIC_API_URL="http://10.207.178.68:5166/api"
   npm start
   ```

### Step 6: Test Backend Connection

**From phone browser:**
1. Open browser on phone
2. Go to: `http://10.207.178.68:5166/api/health`
3. Should show response (not error)

**If this fails:**
- Backend not running
- Firewall blocking
- Wrong IP address
- Not on same network

### Step 7: Check Network Configuration

**Verify IP address:**
```cmd
ipconfig
```

**Check if backend is listening:**
```cmd
netstat -an | findstr :5166
```

Should show:
```
TCP    0.0.0.0:5166           0.0.0.0:0              LISTENING
```

### Step 8: Force Reload App

In Expo Go:
1. Shake device
2. Select **"Reload"**
3. Or press `R` in Metro bundler terminal

### Step 9: Check for Specific Errors

**Common error messages:**

1. **"ERR_CONNECTION_ABORTED"**
   - Firewall issue
   - Backend not running
   - Wrong IP

2. **"Network request failed"**
   - Backend not accessible
   - CORS issue
   - Network problem

3. **"Unable to resolve module"**
   - Cache issue
   - Missing dependency
   - Path error

4. **"Font not found"**
   - Font file missing
   - Asset loading issue

### Step 10: Enable Verbose Logging

Add to `App.tsx` temporarily:
```typescript
useEffect(() => {
  console.log('App mounted');
  console.log('API Base URL:', API_BASE_URL);
}, []);
```

## Quick Diagnostic Commands

```bash
# 1. Check backend
curl http://localhost:5166/api/health

# 2. Check IP
ipconfig

# 3. Check firewall
netsh advfirewall firewall show rule name="Trilingo Backend API"

# 4. Clear and restart
npm run start:local -- --clear

# 5. Check Expo version
npx expo --version
```

## What Error Are You Seeing?

Please share:
1. **Error message** (if any)
2. **What screen** you see (red error, blank, splash screen stuck)
3. **Metro bundler logs** (any errors in terminal)
4. **Console logs** (from Expo Go Dev Menu)

This will help identify the exact issue!


