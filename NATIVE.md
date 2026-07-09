# Vitality Health — Native Companion App 📱⌚

This wraps the exact same web app in **Capacitor** so it can do the two things a
browser can't:

- **Background step counting** — your phone (and any paired watch: Apple Watch,
  Fitbit*, Garmin*, Samsung, etc.) records steps 24/7 into the OS health store
  (**Apple Health** on iOS, **Health Connect** on Android). The native app reads
  today's total whenever you open it and syncs it into your journal — the "⌚
  Phone & watch sync" card appears automatically in the Steps section.
- **Watch data** — anything your watch writes into Apple Health / Health Connect
  (steps today; the plugin also supports workouts, heart rate, calories,
  distance if you want to extend the bridge in `script.js`).

\* Fitbit and Garmin sync into Health Connect / Apple Health via their own apps —
enable that in the Fitbit/Garmin app settings, and the data flows through.

The web bridge is already wired in `script.js` (search for "Native health
sync") against the [`capacitor-health`](https://www.npmjs.com/package/capacitor-health)
plugin — `READ_STEPS` permission, `queryAggregated({ dataType: "steps", bucket: "day" })`.

---

## Prerequisites

- **Node.js 20+**
- **Android:** Android Studio (free). A phone with Android 9+ (Health Connect is
  built into Android 14+; older versions install it from Play).
- **iOS:** a Mac with Xcode, plus an Apple Developer account ($99/yr) to run on
  a real device / publish.

## Build it

```bash
# 1. Install dependencies
npm install

# 2. Copy the web app into www/ and generate the native projects
npm run build
npx cap add android     # and/or:
npx cap add ios
npx cap sync

# 3. Open in the IDE
npx cap open android    # or: npx cap open ios
```

## One-time platform setup

### Android (`android/app/src/main/AndroidManifest.xml`)

Inside the **root `<manifest>`** tag add:

```xml
<queries>
  <package android:name="com.google.android.apps.healthdata" />
</queries>

<uses-permission android:name="android.permission.health.READ_STEPS" />
```

Inside the **`<application>`** tag add (required by Health Connect's
permission-rationale flow):

```xml
<activity
    android:name="com.fit_up.health.capacitor.PermissionsRationaleActivity"
    android:exported="true">
  <intent-filter>
    <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
  </intent-filter>
</activity>

<activity-alias
    android:name="ViewPermissionUsageActivity"
    android:exported="true"
    android:targetActivity="com.fit_up.health.capacitor.PermissionsRationaleActivity"
    android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
  <intent-filter>
    <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
    <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
  </intent-filter>
</activity-alias>
```

### iOS (in Xcode)

1. Target → *Signing & Capabilities* → add the **HealthKit** capability.
2. In `Info.plist` add:
   - `NSHealthShareUsageDescription` — "Vitality Health reads your step count to
     show your daily activity."
   - `NSHealthUpdateUsageDescription` — "Vitality Health does not write health
     data." (key must exist even if unused)

## Run it

Plug in your phone, press ▶ in Android Studio / Xcode. On first sync the OS
will ask the user to grant step access — after that, opening the app pulls
today's steps automatically (also on every app resume).

## How the sync works (and why this is the right way)

The app itself never runs in the background — it doesn't need to. The **OS**
counts steps continuously at almost zero battery cost (and merges in watch
data). When Vitality opens, the bridge reads today's aggregate from the health
store and mirrors it into your local journal (marked ⌚, deduped per day). This
is the same architecture Strava, MyFitnessPal, etc. use.

## Publishing (optional)

- **Google Play:** one-time $25 fee. Health Connect apps must fill in Play
  Console's Health apps declaration.
- **App Store:** Apple review requires the HealthKit strings above and a
  privacy policy URL. All data stays on-device, which makes that easy.

## Keeping it updated

The native shell rarely changes. When the web app changes:

```bash
npm run sync   # rebuild www/ and copy into the native projects
```
