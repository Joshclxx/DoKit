import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const androidRoot = join(root, "android");
const appVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function isJava21(home) {
  if (!home) return false;
  const executable = join(home, "bin", process.platform === "win32" ? "java.exe" : "java");
  if (!existsSync(executable)) return false;
  const result = spawnSync(executable, ["-version"], { encoding: "utf8" });
  return /version "21(?:\.|\")/.test(`${result.stdout}${result.stderr}`);
}

function findJava21() {
  const candidates = [process.env.JAVA_HOME];

  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
    const adoptium = join(programFiles, "Eclipse Adoptium");
    if (existsSync(adoptium)) {
      candidates.push(
        ...readdirSync(adoptium)
          .filter((name) => name.startsWith("jdk-21"))
          .sort()
          .reverse()
          .map((name) => join(adoptium, name)),
      );
    }
    candidates.push(join(programFiles, "Android", "Android Studio", "jbr"));
  }

  return candidates.find(isJava21);
}

run(process.execPath, [join(root, "scripts", "sync-capacitor.mjs")]);
run(process.execPath, [join(root, "scripts", "generate-android-assets.mjs")]);

const javaHome = findJava21();
if (!javaHome) {
  console.error("Java 21 is required to build the Capacitor Android app. Set JAVA_HOME to a JDK 21 installation.");
  process.exit(1);
}

if (process.platform === "win32") {
  run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "gradlew.bat assembleDebug"], {
    cwd: androidRoot,
    env: { ...process.env, JAVA_HOME: javaHome },
  });
} else {
  run("./gradlew", ["assembleDebug"], {
    cwd: androidRoot,
    env: { ...process.env, JAVA_HOME: javaHome },
  });
}

const apk = join(androidRoot, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const downloads = join(root, "public", "downloads");
const publicApk = join(downloads, `dokit-android-v${appVersion}-debug.apk`);
mkdirSync(downloads, { recursive: true });
copyFileSync(apk, publicApk);
console.log(`APK copied to ${publicApk}`);
