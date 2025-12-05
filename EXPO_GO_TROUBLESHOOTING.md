# 🔧 Expo Go Troubleshooting Guide

## Issue: App Not Loading in Expo Go

### Common Causes & Solutions

## 1. ✅ Check Expo SDK Compatibility

Your project uses Expo SDK `~54.0.20`, but Expo Go app version might be different.

**Solution:**
```bash
# Update Expo packages
npm install expo@latest
npm install
```

## 2. ✅ Disable New Architecture (if causing issues)

The `app.json` has `newArchEnabled: true` which might not be compatible with Expo Go.

**Temporary Fix:**
Edit `app.json`:
```json
{
  "expo": {
    "newArchEnabled": false,  // Change to false
    ...
  }
}
```

## 3. ✅ Check Network Connection

**Verify backend is accessible:**
1. Open phone browser
2. Go to: `http://10.207.178.68:5166/api/health`
3. Should show response (not error)

**If not accessible:**
- Check both devices on same WiFi
- Check firewall allows port 5166
- Verify IP address: `ipconfig` (Windows)

## 4. ✅ Clear Cache and Restart

```bash
# Clear Metro bundler cache
npm run start:local -- --clear

# Or manually
npx expo start --clear
```

## 5. ✅ Check Console Logs

When app loads in Expo Go, check:
- **Metro bundler terminal** - Look for errors
- **Expo Go app** - Shake device → "Show Dev Menu" → Check logs
- **Network tab** - Check if API calls are being made

## 6. ✅ Verify API Configuration

Check what URL is being used:
1. In Expo Go, shake device
2. Open Dev Menu
3. Check console logs
4. Should see: `Initializing API Service with base URL: http://10.207.178.68:5166/api`

**If seeing CloudFront URL instead:**
```bash
# Force localhost
$env:EXPO_PUBLIC_API_URL="http://10.207.178.68:5166/api"
npm run start:local
```

## 7. ✅ Check for Error Messages

Common errors and fixes:

### "Network request failed"
- Backend not running
- Wrong IP address
- Firewall blocking
- Not on same network

### "Unable to resolve module"
- Clear cache: `npm run start:local -- --clear`
- Reinstall: `rm -rf node_modules && npm install`

### "Expo Go version mismatch"
- Update Expo Go app from App Store/Play Store
- Or update project: `npm install expo@latest`

### "Connection refused"
- Backend not running: Start with `dotnet run`
- Wrong IP: Check with `ipconfig`
- Port blocked: Check firewall

## 8. ✅ Test with Web First

Before testing on Expo Go, verify it works on web:
```bash
npm run web:local
```

If web works but Expo Go doesn't, it's likely a network/configuration issue.

## 9. ✅ Force Localhost Configuration

Create/update `.env` file (if not blocked):
```
EXPO_PUBLIC_ENABLE_LOCAL=true
EXPO_PUBLIC_API_URL=http://10.207.178.68:5166/api
```

Or set in terminal:
```bash
# Windows PowerShell
$env:EXPO_PUBLIC_ENABLE_LOCAL="true"
$env:EXPO_PUBLIC_API_URL="http://10.207.178.68:5166/api"
npm start
```

## 10. ✅ Check Backend CORS

Make sure backend allows requests from your phone's IP.

Check `Program.cs` - should have:
```csharp
app.UseCors("AllowAll");  // In development
```

## Quick Diagnostic Commands

```bash
# 1. Check backend is running
curl http://localhost:5166/api/health

# 2. Check IP is correct
ipconfig  # Windows
ifconfig  # Mac/Linux

# 3. Test from phone browser
# Open: http://10.207.178.68:5166/api/health

# 4. Start with clear cache
npm run start:local -- --clear

# 5. Check Expo version
npx expo --version
```

## Still Not Working?

1. **Check Expo Go app version** - Update to latest
2. **Try web version first** - `npm run web:local`
3. **Check Metro bundler logs** - Look for specific errors
4. **Verify network** - Both devices on same WiFi
5. **Test backend directly** - Phone browser → `http://10.207.178.68:5166/api/health`

## Success Indicators

✅ App loads in Expo Go  
✅ No red error screen  
✅ Console shows: `Initializing API Service with base URL: http://10.207.178.68:5166/api`  
✅ Can navigate through app  
✅ API calls work (login, data loading)


