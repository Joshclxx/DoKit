import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { Sidebar } from "./components/sidebar";
import { MobileTabBar } from "./components/mobile-tab-bar";
import { MobileDownloadLanding } from "./components/mobile-download-landing";
import { SplashScreen } from "./components/splash-screen";
import { tools } from "@/lib/tools";

const detectInstalledApp = `
  (() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = window.navigator.standalone === true;
    const nativeUserAgent = /DoKitApp/i.test(window.navigator.userAgent);
    const capacitorNative = window.Capacitor?.isNativePlatform?.() === true;
    const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
    const ipadDesktopUserAgent =
      window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
    document.documentElement.dataset.dokitDevice =
      mobileUserAgent || ipadDesktopUserAgent ? "mobile" : "desktop";
    document.documentElement.dataset.dokitRuntime =
      standalone || iosStandalone || nativeUserAgent || capacitorNative ? "app" : "web";
  })();
`;

export const metadata: Metadata = {
  title: {
    default: "DoKit — Browser-Native Productivity Toolkit",
    template: "%s | DoKit",
  },
  description:
    `${tools.length} free browser-native tools for freelancers, developers, students, and creators. Most processing stays on your device, and online tools are clearly marked.`,
  icons: {
    icon: [{ url: "/dokit_logo.svg", type: "image/svg+xml" }],
    apple: "/dokit_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: detectInstalledApp }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SplashScreen />
          <MobileDownloadLanding />
          <div className="dokit-system-shell">
            <Sidebar />
            <Navbar />
            <div className="flex min-h-screen flex-1 flex-col md:pl-72">
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
            </div>
            <MobileTabBar />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
