# Well-Known Files for Passkey Authentication

These files must be hosted at `https://spicy.golf/.well-known/` for passkey authentication to work.

## Files

### apple-app-site-association (iOS)

Host at: `https://spicy.golf/.well-known/apple-app-site-association`

**Before deploying:** Replace `TEAM_ID` with your Apple Developer Team ID.

Content-Type: `application/json`

### assetlinks.json (Android)

Host at: `https://spicy.golf/.well-known/assetlinks.json`

**Before deploying:** Replace `SHA256_FINGERPRINT_HERE` with your app's signing certificate SHA-256 fingerprint.

To get the fingerprint:
```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

Content-Type: `application/json`

## Verification

After hosting, verify the files are accessible:
- iOS: `curl https://spicy.golf/.well-known/apple-app-site-association`
- Android: `curl https://spicy.golf/.well-known/assetlinks.json`

Use Google's verification tool for Android:
https://developers.google.com/digital-asset-links/tools/generator
