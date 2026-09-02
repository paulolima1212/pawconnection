# Google Play release guide

## Current Android release configuration

- Application ID: `com.plima1212.pawconnection`
- Release version: `1.0.5`
- Android versionCode: `8` (previous Play build was `7`)
- iOS buildNumber: `8`
- Expo SDK 54 / Android target API 36
- Production artifact: Android App Bundle
- EAS production version code: remote and automatically incremented (next expected: 8)
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

## Public legal pages

- Privacy policy: https://paw-app.lz-plima1212.online/privacy.html
- Account deletion: https://paw-app.lz-plima1212.online/account-deletion.html
- Support: plima12121984@gmail.com

Static files live in `apps/app/public/` and are served from `/var/www/paw-app` on **port 3013** (Cloudflare Tunnel hostname `paw-app.lz-plima1212.online`).

## Publication blockers

Do not promote beyond internal testing until all items are complete:

- [x] in-app account deletion (`Profile → Delete account`, `DELETE /profile/me`) and external deletion URL;
- [x] public privacy-policy URL and in-app link;
- [x] store icon 512x512 and feature graphic 1024x500 (`docs/play-store/assets/`);
- [x] phone screenshots from seeded users (`docs/play-store/assets/screenshot-*.png`);
- [ ] reviewed Data safety declarations in Play Console;
- [ ] content rating and target-audience declarations;
- [ ] Google Play developer account, support email and identity verification;
- [x] production API smoke: health + login + feed (2026-08-27);
- [ ] Google Maps key restricted to the Play signing certificate;
- [ ] closed test with at least 12 testers for 14 days (new personal Play accounts).

## Dependency audit (issue #3)

`npx expo-doctor` passes on Expo SDK 54 (`expo@~54.0.37`, `expo-constants@~18.0.14`).

Remaining `npm audit --omit=dev` findings are transitive (PostCSS, `uuid` via `@expo/config-plugins`, Metro `ws`). Resolving them with `npm audit fix --force` would install Expo 57 and break this SDK. They are not production network/auth CVEs in app code; do not force-upgrade until the next Expo SDK bump.

