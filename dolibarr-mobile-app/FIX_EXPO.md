# Fix Expo Project - Instructions

## Why the issue happened

The project had:
1. **Missing dependencies**: `expo-asset` was not in `package.json` but may be required by `@expo/vector-icons`
2. **Incorrect app.json**: Had `expo-router` plugin but project uses `react-navigation` (not expo-router)
3. **Version mismatches**: Some dependencies may not be aligned with Expo SDK 52
4. **react-test-renderer**: Should not be in dependencies (only devDependencies if needed)

## Changes Made

### package.json
- ✅ Added `expo-asset: ~11.0.0` (required by Expo SDK 52)
- ✅ Fixed `expo-font: ~13.0.0` (aligned with SDK 52)
- ✅ Removed `react-test-renderer` from dependencies (not needed at runtime)
- ✅ Fixed React version to `18.3.1` (Expo SDK 52 compatible)
- ✅ Added `private: true` to prevent accidental publishing

### app.json
- ✅ Removed `expo-router` plugin (project uses react-navigation)
- ✅ Removed `expo-font` plugin (not needed, fonts work automatically)

## Commands to Run (IN ORDER)

```bash
# 1. Navigate to project directory
cd /Users/fahd/myApp/dolibarr-mobile-app/dolibarr-mobile-app

# 2. Remove node_modules and lock files
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# 3. Clear Expo cache
npx expo start --clear

# 4. Install dependencies using Expo (this aligns versions correctly)
npx expo install --fix

# 5. Start Expo
npx expo start

# 6. Press 'i' to open iOS simulator
```

## Alternative: Manual Installation

If `expo install --fix` doesn't work, install dependencies manually:

```bash
# Install core Expo dependencies
npx expo install expo-asset expo-font expo-status-bar

# Install navigation dependencies (already compatible)
# @react-navigation packages are already correct

# Install other dependencies
npm install axios date-fns

# Start Expo
npx expo start
```

## Verification

After running the commands:
1. ✅ No red screen errors
2. ✅ App loads in Expo Go / iOS simulator
3. ✅ Icons from `@expo/vector-icons` display correctly
4. ✅ Navigation works

## Troubleshooting

If you still see errors:

1. **Clear Metro bundler cache:**
   ```bash
   npx expo start --clear
   ```

2. **Reset Expo cache:**
   ```bash
   rm -rf .expo
   npx expo start --clear
   ```

3. **Check Expo SDK version:**
   ```bash
   npx expo --version
   ```
   Should show SDK 52.x

4. **Verify dependencies:**
   ```bash
   npx expo-doctor
   ```

## Notes

- This is an **Expo Managed Workflow** project
- Do NOT eject or use bare workflow
- All dependencies are compatible with Expo SDK 52
- `@expo/vector-icons` works automatically in Expo (no font loading needed)

