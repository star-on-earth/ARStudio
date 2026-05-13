# AR Studio — Complete Setup & Deployment Guide

A React Native (Expo) app with 3 AR experiences:
- 🖼️ **Marker Tracking** — 3D objects appear on a Hiro marker
- 😎 **Face Filter** — Live sunglasses, visor, and crown effects
- 📦 **World Tracking** — Place 3D objects on real surfaces (Chrome Android + ARCore)

---

## 📁 Project Structure

```
ARStudio/
├── App.js                        ← Entry point, navigation setup
├── app.json                      ← Expo config, permissions, package name
├── eas.json                      ← EAS Build config (APK / AAB)
├── package.json                  ← Dependencies
├── babel.config.js
├── assets/
│   └── icon.png                  ← App icon (replace with your own)
└── src/
    ├── screens/
    │   ├── CameraScreen.js       ← Main camera UI with 3 feature buttons
    │   └── ARScreen.js           ← WebView wrapper for AR experiences
    └── ar/
        ├── markerAR.js           ← AR.js + A-Frame marker tracking HTML
        ├── faceAR.js             ← MediaPipe face filter HTML
        └── worldAR.js            ← WebXR world tracking HTML
```

---

## ✅ Prerequisites (One-time setup — all free)

### 1. Install Node.js
Download from https://nodejs.org (use the LTS version)

Verify:
```bash
node --version   # should be v18 or higher
npm --version
```

### 2. Install Expo CLI
```bash
npm install -g expo-cli eas-cli
```

### 3. Create a free Expo account
Sign up at https://expo.dev — it's free, no credit card needed.

Then log in:
```bash
eas login
```

### 4. Install Expo Go on your Android phone
Download **Expo Go** from the Google Play Store. You'll use this to test the app instantly without building an APK.

---

## 🚀 Part 1 — Run the App for Testing (No APK needed)

This lets you test immediately on your phone.

### Step 1 — Install dependencies
Open a terminal, navigate to this folder, and run:
```bash
cd ARStudio
npm install
```

### Step 2 — Start the development server
```bash
npx expo start
```

This shows a QR code in the terminal.

### Step 3 — Open on your phone
Open **Expo Go** on your Android phone and scan the QR code.
The app loads instantly on your phone — no APK needed!

> **Note:** Your phone and computer must be on the same Wi-Fi network.

---

## 📦 Part 2 — Build a Real APK (Free, No Android Studio needed)

EAS Build compiles your APK in the cloud for free (30 builds/month on free tier).

### Step 1 — Configure EAS for your project
```bash
eas build:configure
```
When asked about the Android package name, keep `com.arstudio.app` or change it to something unique like `com.yourname.arstudio`.

### Step 2 — Build the APK
```bash
eas build --platform android --profile preview
```

This uploads your code to Expo's servers and builds the APK in the cloud.
⏱️ First build takes 10–20 minutes.

### Step 3 — Download your APK
When the build finishes, EAS gives you a download link like:
```
https://expo.dev/artifacts/eas/xxxxxxxxxxxxxxxx.apk
```

Download it and install it on your Android phone.

> **To allow APK installation:** On your phone go to Settings → Security → Unknown Sources → Enable (or "Install unknown apps" on newer Android).

---

## 🌐 Part 3 — Distribute Your APK for Free

### Option A — Share via GitHub Releases (Recommended)

This gives you a permanent download link you can share with anyone.

#### Step 1 — Create a free GitHub account
Sign up at https://github.com

#### Step 2 — Create a new repository
1. Click **New repository**
2. Name it `ar-studio`
3. Set it to **Public** (free)
4. Click **Create repository**

#### Step 3 — Push your project code
```bash
cd ARStudio
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ar-studio.git
git push -u origin main
```

#### Step 4 — Create a Release with the APK
1. On your GitHub repo page, click **Releases** → **Create a new release**
2. Tag: `v1.0.0`
3. Title: `AR Studio v1.0.0`
4. Drag and drop your downloaded `.apk` file into the attachments area
5. Click **Publish release**

Anyone can now download your APK from:
```
https://github.com/YOUR_USERNAME/ar-studio/releases
```

### Option B — Expo Hosted Link

After building with EAS, Expo also gives you a shareable link at:
```
https://expo.dev/accounts/YOUR_USERNAME/projects/ar-studio/builds
```
People with Expo Go installed can open the app directly from this link.

---

## 🔄 Part 4 — Push Updates (Two methods)

### Method A — OTA Updates (Instant, no APK rebuild needed)

For changes to JavaScript code (screens, AR effects, UI), use **EAS Update**.
This pushes the update to all installed apps without a new APK.

#### Step 1 — Add expo-updates to your project
```bash
npx expo install expo-updates
eas update:configure
```

#### Step 2 — Push an update
Make your changes to the code, then:
```bash
eas update --branch production --message "Updated face filter effects"
```

Users get the update automatically next time they open the app. ✅

> **OTA updates work for:** JS changes, new AR effects, UI changes, bug fixes.
> **Requires a new APK for:** New native dependencies, permissions changes, app icon changes.

### Method B — Build a new APK (For major updates)

If you add new features requiring new native permissions:

```bash
# Make your code changes, then:
eas build --platform android --profile preview
```

Upload the new APK to GitHub Releases as `v1.1.0`, etc.

---

## 🛠️ Part 5 — Customising the AR Experiences

All 3 AR experiences are self-contained HTML strings in `src/ar/`.
You can modify them freely without knowing React Native — just edit the HTML/JavaScript.

### Modify the face filter (add new effects)
Edit `src/ar/faceAR.js` — find the `drawSunglasses`, `drawCyberVisor`, `drawCrown` functions and add your own.

### Change the 3D objects in marker tracking
Edit `src/ar/markerAR.js` — modify the `<a-box>`, `<a-sphere>`, `<a-torus>` elements with different shapes, colors, animations.

### Add more objects in world tracking
Edit `src/ar/worldAR.js` — modify the `makeObject()` function to add different Three.js geometries.

---

## 💰 Cost Summary — Everything is FREE

| Service | What it does | Cost |
|---------|-------------|------|
| **Expo Go** | Test app instantly on phone | Free |
| **EAS Build** | Build APK in the cloud | Free (30 builds/month) |
| **EAS Update** | Push OTA updates | Free (1000 updates/month) |
| **GitHub** | Host code + distribute APK | Free |
| **expo.dev** | Project dashboard | Free |
| **AR.js / MediaPipe / Three.js** | AR libraries (CDN) | Free forever |

> There is **no backend, no database, no server** needed — all AR processing runs on the user's device.

---

## ❓ Troubleshooting

**"Camera permission denied in WebView"**
→ On your phone go to Settings → Apps → AR Studio → Permissions → Camera → Allow

**"World Tracking not working"**
→ This requires Chrome on Android with ARCore. Make sure Google Play Services for AR (ARCore) is installed. Go to Play Store and search "ARCore".

**"Marker not being detected"**
→ Print the Hiro marker or show it on a bright screen. Ensure good lighting. Keep the marker flat and fully visible.

**"Build failed on EAS"**
→ Check the build logs at https://expo.dev. Usually caused by a dependency version conflict. Run `npx expo doctor` to check for issues.

---

## 📞 Quick Command Reference

```bash
# Test on phone (no APK)
npx expo start

# Build APK
eas build --platform android --profile preview

# Push JS update (no new APK)
eas update --branch production --message "your message"

# Check project health
npx expo doctor

# Upgrade Expo SDK
npx expo upgrade
```
