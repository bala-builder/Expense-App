# Changelog

## 2026-07-13 — Google Sign-In on Android (EAS build)

### Added
- Google Sign-In now works end-to-end on a real EAS-built Android APK (previously only worked, partially, in Expo Go).
- `mobile/.env.example` documenting the required `EXPO_PUBLIC_*` env vars for local development.
- EAS-hosted Environment Variables (`preview` and `production`) for Firebase config and both Google OAuth client IDs, replacing values that were hardcoded in `eas.json`.

### Fixed
- **`app/(auth)/login.tsx`**: removed a manual `redirectUri: makeRedirectUri({ scheme: "trackcents" })` override passed to `Google.useAuthRequest`. It conflicted with the native redirect URI `expo-auth-session` derives automatically from the Android client ID, contributing to Google's "doesn't comply with OAuth 2.0 policy" rejection.
- **`package.json`**: added `expo-asset` as an explicit dependency. It was only pulled in transitively (via `expo-splash-screen`), which let npm nest it under `expo/node_modules/expo-asset` instead of hoisting it — breaking Expo config plugin resolution (`expo-router` plugin couldn't be found).
- **`eas.json`**: replaced hardcoded secrets and a non-functional `"$VAR"` reference syntax with a proper `"environment": "preview" | "production"` field on each build profile, so builds correctly pull from EAS-hosted Environment Variables instead of baking in literal, unresolved `$EXPO_PUBLIC_...` strings.
- Added the missing `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` EAS Environment Variable — it had never been synced from `eas.json`, so builds were sending an empty Android client ID to Google (`401 invalid_client`).
- **Google Cloud Console**: registered the EAS build's keystore SHA-1 fingerprint against the Android OAuth client, and enabled **Custom URI Scheme** under the Android OAuth client's Advanced settings — off by default, and required for the `com.trackcents.mobile:/oauthredirect` native redirect Google was rejecting with a generic `Error 400: invalid_request`.

### Security / hygiene
- Firebase config and both Google OAuth client IDs were previously committed in plaintext inside `eas.json` to this **public** repo. Moved to a gitignored `mobile/.env.local` (for local builds) and EAS-hosted Environment Variables (for cloud builds); `eas.json` no longer contains secrets.

---

## Lessons learned

1. **`eas.json`'s `env` block does not support `$VAR` interpolation against EAS-hosted Environment Variables.** That was a wrong assumption that cost a full build cycle — `"KEY": "$SOME_VAR"` is passed through *literally*, not resolved. To pull in hosted variables, the build profile needs an explicit `"environment": "<name>"` field, and any matching keys left in the profile's own `env` block will shadow (override) the hosted ones.

2. **Google's "Android" OAuth client type requires "Enable Custom URI Scheme" to be checked explicitly** (Cloud Console → Credentials → Android client → Advanced settings). It's off by default. Any native app using a custom-scheme redirect (`<package>:/path`, which is what `expo-auth-session` uses for Android) will fail with a generic, unhelpful `Error 400: invalid_request` until this is enabled.

3. **`expo-auth-session`'s `Google.useAuthRequest` auto-derives the correct native redirect URI** from `androidClientId`/the app's package name. Passing a manual `redirectUri` override breaks that contract and is a common source of Google's generic OAuth policy rejections — don't override it unless you know exactly what Google expects instead.

4. **A package used only transitively can silently fail to hoist with npm**, breaking downstream tooling (here, Expo's config plugin resolution) in a way that looks unrelated to the real cause. If something can't find a package that's clearly installed somewhere in `node_modules`, check whether it's nested under another package instead of hoisted to the top level, and add it as a direct dependency if so.

5. **EAS cloud builds never read local `.env`/`.env.local` files.** Those are only consumed by local commands (`expo start`, `expo export`). Cloud builds only see literal `eas.json` env values or EAS-hosted Environment Variables — nothing on the local filesystem.

6. **Google's OAuth error pages are generic by design, but "error details" (or the underlying network request) usually isn't.** Three different failures in this debugging session — a policy violation, an invalid client, and a missing custom-URI-scheme setting — all initially looked like variations of the same vague "doesn't comply with policy" message. Pulling the actual authorization request from `adb logcat` and tapping through to Google's "error details" panel turned each one into a concrete, single-cause fix instead of a guessing game.

7. **When creating an Android emulator for testing, pick a "Google Play" system image** (not "Google APIs" only) to get Play Services, and **avoid "16 KB Page Size" images** for now — current React Native/Hermes native libraries aren't built for 16KB page alignment yet and will fail to install on those images.
