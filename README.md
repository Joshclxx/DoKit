# DoKit

DoKit is a browser-native productivity toolkit with 44 tools for documents, text, developer workflows, calculations, and media. Most tools process data locally. The API tester, QR renderer, and YouTube preview explicitly disclose when data or assets use the network.

## Run locally

Requirements: Node.js 22.6 or newer and Yarn.

```bash
yarn install
yarn dev
```

Open `http://localhost:3000`.

## Mobile Android handoff

Every phone-sized browser visit shows a single Android download page instead of the web tool system. The full responsive mobile interface is reserved for the installed app. To enable the APK download button, provide the signed build URL at build time:

```bash
NEXT_PUBLIC_ANDROID_APK_URL=https://example.com/dokit.apk yarn build
```

Without that value, the download control remains disabled instead of linking to a missing file.

The installed app can expose the full mobile system by using the `DoKitApp` user-agent marker. Standalone display mode and native Capacitor runtimes are also recognized.

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

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk` and copied to `public/downloads/dokit-android-v1.0.2-debug.apk` for the mobile website download button. Use `yarn android:open` to open the native project in Android Studio. The Capacitor WebView appends `DoKitApp/1.0.2` to its user agent so the installed app receives the full mobile system instead of the browser download handoff.

## Product limits

- Currency conversion uses approximate offline reference rates.
- PDF text tools require selectable text; scanned documents are not OCRed.
- PDF-to-Word exports a Word-compatible `.doc`, not `.docx`.
- Image Print Layout exports a single page as PNG or opens a multi-page browser print layout.
- File-processing output depends on browser support for Canvas, Blob downloads, printing, and PDF.js.
