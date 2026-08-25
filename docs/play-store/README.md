# Google Play release guide

## Current Android release configuration

- Application ID: `online.lzplima1212.pawconnection`
- Release version: `1.0.3`
- Expo SDK 54 / Android target API 36
- Production artifact: Android App Bundle
- EAS production version code: remote and automatically incremented
- Initial automated submission: internal track, draft status
- Production API, app and storage endpoints: HTTPS
- Cleartext traffic: disabled in production builds

## Required EAS secrets

Configure these outside GitHub:

- `GOOGLE_MAPS_ANDROID_API_KEY`
- Google Play service-account credentials for EAS Submit

Restrict the Maps key to the Android package and the SHA-1/SHA-256 certificate fingerprints used by Google Play App Signing.

## Validation

From `apps/app`:

```bash
npm ci
npm run lint
npx expo-doctor
npm run build:apk:preview
npm run build:aab:production
```

Validate the preview APK on a physical Android device before uploading the AAB.

## First submission

Google Play requires the first application upload to be performed manually before API-based submissions can be used. Upload the production AAB to the internal testing track, finish the app-content declarations, and invite testers.

After the first manual upload and service-account setup:

```bash
npm run submit:android:production
```

## Publication blockers

Do not promote beyond internal testing until all items are complete:

- in-app account deletion and an external deletion-request URL;
- public privacy-policy URL and in-app link;
- reviewed Data safety declarations;
- content rating and target-audience declarations;
- support email and developer identity verification;
- phone screenshots, 512x512 store icon and 1024x500 feature graphic;
- end-to-end tests against the production API;
- Google Maps key restricted to the Play signing certificate.
