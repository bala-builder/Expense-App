# Android Build & Firebase Verification Record

## EAS Build — CONFIRMED PASSING

| Field | Value |
|-------|-------|
| Build ID | `caac7ad8-da38-4849-b6a0-7bb58865e340` |
| Platform | Android |
| Profile | preview (`buildType: apk`) |
| Status | **finished** |
| SDK Version | 52.0.0 |
| App Version | 1.0.0 (versionCode 1) |
| Finished at | 2026-07-12 03:01:19 UTC |
| Build Logs | https://expo.dev/accounts/bala-builder/projects/trackcents-mobile/builds/caac7ad8-da38-4849-b6a0-7bb58865e340 |
| APK Download | https://expo.dev/artifacts/eas/OSL22M9_Q0PR2MBc7qIq7tgrY33mi4rYkQCtKm0jD-w.apk |

## Static Verification Results

### TypeScript
- `npx tsc --noEmit` — **0 errors**

### Environment Variables in `eas.json` (preview profile)
All 7 required `EXPO_PUBLIC_*` vars confirmed present and non-empty:

| Variable | Status |
|----------|--------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | present |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | present |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | present |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | present |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | present |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | present |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | present |

`EAS_BUILD_SKIP_LOCKFILE_CHECK=1` is also set in both `preview` and `production` profiles.

### Cross-File Consistency
| Check | Result |
|-------|--------|
| Android package name (`app.json` vs `google-services.json`) | **PASS** — `com.trackcents.mobile` |
| Firebase project ID (`eas.json` vs `google-services.json`) | **PASS** — `my-first-project-fd8f6` |
| Messaging sender ID (`eas.json` vs `google-services.json`) | **PASS** — `664924566379` |
| Google OAuth client ID (`eas.json` vs `google-services.json`) | **PASS** — `664924566379-2vjhb3...` |
| App scheme (`app.json` vs `makeRedirectUri` in `login.tsx`) | **PASS** — `trackcents` |

## Manual Device Test Checklist

Download the APK from the link above and run the following on a physical Android device
(Android 10+ recommended). Record results below.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Install APK via `adb install <file>.apk` or direct download | Installs without error | |
| 2 | Launch app | Splash screen appears, no crash | |
| 3 | Navigate to Login screen | Login screen renders correctly | |
| 4 | Observe Metro/logcat for Firebase init errors | No "invalid API key" or "app not found" errors in logcat | |
| 5 | Enter valid email + password and tap Sign In | Navigates to `/(tabs)` home screen | |
| 6 | Return to Login, tap "Continue with Google" | Google account picker sheet appears | |
| 7 | Select a Google account | Sign-in completes, navigates to `/(tabs)` | |
| 8 | Kill and relaunch app while signed in | App resumes as signed-in user (AsyncStorage persistence) | |

**Tester:** ___________________  
**Device model:** ___________________  
**Android version:** ___________________  
**Date tested:** ___________________  

## Notes

- Firebase uses the JS SDK (`firebase` v10) initialized in `mobile/lib/firebase.ts` with
  `getReactNativePersistence(AsyncStorage)` for session persistence.
- Google Sign-In uses `expo-auth-session` with `scheme: "trackcents"` as the redirect URI.
  The OAuth client registered in `google-services.json` is type 3 (web client), which is
  correct for this flow.
- The Android-specific Firebase App ID in `google-services.json`
  (`1:664924566379:android:d5e3c1e36a3b8d28a2122e`) is distinct from the web App ID in
  `eas.json` (`1:664924566379:web:9488e04eef0022f2a2122e`) — this is expected and correct.
  The native SDK (via `google-services.json`) handles Android-specific initialization while
  the JS Firebase SDK uses the web credentials.
