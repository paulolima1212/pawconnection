# Google Play release guide

## Current Android release configuration

- Application ID: `com.plima1212.pawconnection`
- Release version: `1.0.7`
- Android versionCode: `10` (EAS production autoIncrement; Play already has `10` from 1.0.6)
- iOS buildNumber: `10`
- Expo SDK 54 / Android target API 36
- Production artifact: Android App Bundle
- EAS production version code: remote and automatically incremented (next expected: 11)
- Initial automated submission: internal track, draft status
- Production API, app and storage endpoints: HTTPS
- Cleartext traffic: disabled in production builds

## Android signing certificate fingerprints

Package: `com.plima1212.pawconnection`

These are the fingerprints of the **upload / release keystore** used by EAS and local release builds
(`apps/app/credentials/android/keystore.jks`). Verified against `paw-connection-1.0.5.aab` on 2026-09-25.

| Field | Value |
|-------|-------|
| SHA-256 (with colons) | `A0:11:3F:D3:12:B3:60:78:1D:F7:EF:57:DB:5F:4C:7A:8E:2E:4D:8E:C9:D0:46:94:F3:58:C8:4F:07:93:81:57` |
| SHA-256 (no colons) | `A0113FD312B360781DF7EF57DB5F4C7A8E2E4D8EC9D04694F358C84F07938157` |
| SHA-1 | `11:70:E6:7B:06:1D:23:EE:DB:8B:94:8A:7D:EB:60:6D:1B:2F:E5:4F` |
| Algorithm | SHA256withRSA |

Use the SHA-256 value in Play Console when the form asks for *impressão digital do certificado SHA-256*.

### Play App Signing vs upload key

After the first AAB upload with **Google Play App Signing** enabled, Play Console shows two certificates:

1. **App signing key** — signs what users install from the Play Store. Use this SHA-1/SHA-256 for Maps / Firebase / API key restrictions in production.
2. **Upload key** — the fingerprints above. Used only to sign AABs you upload to Play.

Copy Play’s app-signing fingerprints from:
`Play Console → Protected with Google Play → Play Store protection → Manage Play App Signing`
(or `Release → Setup → App integrity` on older Console layouts).

### Re-extract from keystore or AAB

```bash
# From keystore (requires store password from apps/app/android/keystore.properties)
keytool -list -v \
  -keystore apps/app/credentials/android/keystore.jks \
  -alias <keyAlias from keystore.properties>

# From a signed AAB / APK
keytool -printcert -jarfile apps/app/paw-connection-1.0.5.aab
```

Do **not** use fingerprints from `paw-connection-test.apk` — that APK is signed with the Android Debug keystore.

## Required EAS secrets

Configure these outside GitHub:

- `GOOGLE_MAPS_ANDROID_API_KEY`
- Google Play service-account credentials for EAS Submit

Restrict the Maps key to the Android package and the SHA-1/SHA-256 fingerprints above (upload key) **and**, after the first Play upload, the **app signing key** certificates shown in Play Console.

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

