# APK Size Checklist

Lessons from Costly (117 MB) and Home Manager (111 MB). Apply from day one.

## 1. Build config (the biggest lever)

In `app.json`, inside the `expo-build-properties` plugin:

```json
["expo-build-properties", {
  "android": {
    "buildArchs": ["arm64-v8a"],
    "enableMinifyInReleaseBuilds": true,
    "enableShrinkResourcesInReleaseBuilds": true
  }
}]
```

- Valid key names were verified in `node_modules/expo-build-properties/build/pluginConfig.d.ts`.
- **Wrong keys are silently ignored.** `reactNativeArchitectures` and `enableProguardInReleaseBuilds` do nothing, and the build ships all four CPU architectures.
- `expo-build-properties` must be installed (`npx expo install expo-build-properties`), not just added to `app.json`.
- Re-check the key names after every Expo SDK upgrade.

## 2. Choose ABIs by purpose

| Build | `buildArchs` | Why |
|---|---|---|
| Test APK on your own phone | `["arm64-v8a"]` | Smallest. Will not install on x86 emulators |
| Play Store AAB (production) | `["armeabi-v7a", "arm64-v8a"]` | Play sends each phone only its own ABI, so size does not grow, and 32-bit budget phones can still install |
| x86_64 emulator testing | add `"x86_64"` | Only for emulator builds |

## 3. Icon fonts

- Import per set: `import Ionicons from '@expo/vector-icons/Ionicons'`.
- Importing from `'@expo/vector-icons'` (package root) bundles every icon font.
- Measured in Home Manager: assets dropped from 46 to 28 after this change, and the Hermes bundle went from 4.5 MB to 4.1 MB.
- Measured: Ionicons.ttf is about 390 KB. `MaterialSymbols_400Regular.ttf` (about 967 KB) is pulled in by `expo-router` through `expo-symbols`. Leave it alone.

## 4. Things that did NOT help

- Compressing PNGs in `assets/`: lossless re-encoding saved about 60 KB in Costly. Android builds its own icons from the source images, so large source PNGs mostly do not ship as-is.
- Removing packages that expo-router needs. `expo-constants`, `expo-linking`, `expo-system-ui`, `@expo/ui` and `expo-glass-effect` looked unused in `src/` but are dependencies or needed by Expo Router or by config.
- JS-only packages (`react-dom`, `react-native-web`) never reach the APK. Removing them saves nothing.

## 5. Dependencies

- Add native packages only when a feature needs them. Each one adds native code.
- Before removing any package, run `npm explain <package>`.
- Never keep two storage systems. Costly kept dead SQLite code next to AsyncStorage and it only caused confusion.

## 6. Verify with measurements, not guesses

1. `npx expo export --platform android --output-dir <folder OUTSIDE the project>`
   - Check the asset list (flag anything over 300 KB) and the Hermes bundle size.
2. Build: `npx eas-cli build -p android --profile preview`
3. Download the APK, rename `.apk` to `.zip`, extract, then check:
   - `lib/` contains only the ABIs you chose.
   - List the 10 largest files with sizes.
4. Compare against the previous build. Record the numbers below.

## 7. Profile matters

- `development` builds include the dev client and are large by nature. Never judge size from them.
- Judge size from `preview` (APK) or `production` (AAB, Play shows per-device download size).

## Size log (fill in as you build)

| Date | Profile | ABIs | APK size | Notes |
|---|---|---|---|---|
| | | | | |
