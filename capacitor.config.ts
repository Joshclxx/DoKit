import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.dokit.mobile",
  appName: "DoKit",
  webDir: "out",
  appendUserAgent: " DoKitApp/1.0.2",
  backgroundColor: "#f4f9f7",
  android: {
    backgroundColor: "#f4f9f7",
    webContentsDebuggingEnabled: false,
  },
};

export default config;
