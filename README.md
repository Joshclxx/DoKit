# DoKit

DoKit is a browser-native productivity toolkit with 40 tools for documents, text, developer workflows, calculations, and media. Most tools process data locally. The API tester, QR renderer, and YouTube preview explicitly disclose when data or assets use the network.

## Run locally

Requirements: Node.js 22.6 or newer and Yarn.

```bash
yarn install
yarn dev
```

Open `http://localhost:3000`.

## Mobile web and Android app

The mobile website provides the responsive toolkit. Its Settings screen links to the current Android APK. The link defaults to `/downloads/dokit-android-v1.0.3-debug.apk`; to serve an APK from another location, set the URL at build time:

```bash
NEXT_PUBLIC_ANDROID_APK_URL=https://example.com/dokit.apk yarn build
```

The installed app uses the `DoKitApp` user-agent marker. Standalone display mode and native Capacitor runtimes are also recognized.

The `/settings` screen manages theme, reusable business defaults, default currency, local JSON export, and saved-draft cleanup.

## Quality checks

```bash
yarn test
yarn lint
yarn build
```

The automated tests guard catalog/route consistency, kit references, launch metadata assets, network disclosures, and Regex Builder security and zero-width matching behavior. See `docs/QA_REPORT.md` for the latest full regression report and known limitations.

## Android app

DoKit is packaged with Capacitor using a mobile-only static Next.js export in `out/`; regular web builds continue using the normal Next.js server output. The provisional Android application ID is `app.dokit.mobile`.

Android builds require JDK 21, Android SDK Platform 36, and Build-Tools 35. The build helper uses `JAVA_HOME` when it points to Java 21 and can discover common Windows JDK 21 installations automatically.

```bash
yarn android:sync
yarn android:apk
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk` and copied to `public/downloads/dokit-android-v1.0.3-debug.apk` for the mobile website download button. Use `yarn android:open` to open the native project in Android Studio. The Capacitor WebView appends `DoKitApp/1.0.3` to its user agent.

## Product limits

- Currency conversion uses approximate offline reference rates.
- PDF text tools require selectable text; scanned documents are not OCRed.
- PDF-to-Word exports a Word-compatible `.doc`, not `.docx`.
- Image Print Layout exports a single page as PNG or opens a multi-page browser print layout.
- File-processing output depends on browser support for Canvas, Blob downloads, printing, and PDF.js.
