# Well-Known Files for Passkey Authentication

These files are hosted at `https://spicy.golf/.well-known/` for passkey authentication.

## Files

### apple-app-site-association (iOS)

- URL: `https://spicy.golf/.well-known/apple-app-site-association`
- Team ID: `CRRL9RDZ9F`
- Content-Type: `application/json`

### assetlinks.json (Android)

- URL: `https://spicy.golf/.well-known/assetlinks.json`
- Package: `golf.spicy`
- Contains both debug and release SHA256 fingerprints
- Content-Type: `application/json`

## Updating Fingerprints

If you regenerate the release keystore, update the SHA256 fingerprint:

```bash
# Get fingerprint from keystore
keytool -list -v -keystore ~/dev/admin-spicy/spicy-release.keystore -alias spicy-release -storepass spicygolf2024 | grep SHA256
```

## Verification

```bash
curl https://spicy.golf/.well-known/apple-app-site-association
curl https://spicy.golf/.well-known/assetlinks.json
```

Google's verification tool for Android:
https://developers.google.com/digital-asset-links/tools/generator
