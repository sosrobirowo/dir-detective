const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const sound = require("sound-play");
const notifier = require("node-notifier");

// --- Config Loading ---
let config;
try {
  const configPath = path.resolve(__dirname, "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("config.json not found! Please create it.");
  }
  const rawConfig = fs.readFileSync(configPath);
  config = JSON.parse(rawConfig);
} catch (error) {
  console.error(
    "[FATAL ERROR] Could not load or parse config.json:",
    error.message
  );
  process.exit(1);
}

// Resolve paths from the config file relative to the script's location
const FOLDERS_TO_WATCH = config.watchFolders.map(p => path.resolve(__dirname, p));
const NOTIFICATION_SOUND_PATH = path.resolve(
  __dirname,
  config.soundNotificationPath
);
const APP_ICON_PATH = fs.existsSync(path.resolve(__dirname, config.appIconPath))
  ? path.resolve(__dirname, config.appIconPath)
  : null;

// Log Setup
const LOG_FOLDER = path.resolve(__dirname, config.logFolder || "./logs");

// Ensure the log directory exists
if (!fs.existsSync(LOG_FOLDER)) {
  fs.mkdirSync(LOG_FOLDER, { recursive: true });
}

/**
 * Writes a message to a date-stamped log file.
 * @param {('INFO'|'ERROR'|'DEBUG')} level The log level.
 * @param {string} message The message to log.
 */

function logToFile(level, message) {
  try {
    const now = new Date();
    // Format: YYYY-MM-DD
    const dateStr =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    // Format: HH:MM:SS
    const timeStr =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    const logFileName = `${dateStr}.log`;
    const logFilePath = path.join(LOG_FOLDER, logFileName);
    const formattedMessage = `[${dateStr} ${timeStr}] [${level.toUpperCase()}] ${message}\n`;

    fs.appendFileSync(logFilePath, formattedMessage);
  } catch (err) {
    // Fallback to console if file logging fails
    console.error("CRITICAL: Failed to write to log file:", err);
  }
}

// --- Setup ---
for (const folder of FOLDERS_TO_WATCH) {
    if (!fs.existsSync(folder)) {
        const msg = `Watch folder not found at: ${folder}`;
        console.error(`[ERROR] ${msg}`);
        logToFile('ERROR', msg);
        process.exit(1);
    }
}

console.log(`[INFO] Starting watcher...`);
logToFile('INFO', 'Watcher service started.');
console.log(`[INFO] Monitoring the following folders:`);
FOLDERS_TO_WATCH.forEach(folder => {
    console.log(`  - ${folder}`);
    logToFile('INFO', `Watching target folder: ${folder}`);
});

const watcher = chokidar.watch(FOLDERS_TO_WATCH, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,

  usePolling: config.watcherSettings.usePolling,
  // Check roughly every 2 seconds.
  interval: 2000,
  binaryInterval: 3000,

  // The file size must be stable for 5 seconds before the 'add' event fires.
  awaitWriteFinish: {
    stabilityThreshold: config.watcherSettings.stabilityThreshold || 5000,
    pollInterval: config.watcherSettings.pollingInterval || 1000, // How often to check for stability once a file is detected
  },
});

/**
 * Finds which of the watched base folders a given path belongs to.
 * @param {string} filePath The full path to the file or directory.
 * @returns {string|null} The base folder path or null if not found.
 */
function getBaseFolder(filePath) {
    return FOLDERS_TO_WATCH.find(folder => filePath.startsWith(folder)) || null;
}

// --- Event Listener ---
watcher.on("add", (filePath) => {
  if (filePath.toLowerCase().endsWith(config.extToWatch)) {
    const logMessage = `New file is stable and ready: ${filePath}`;
    console.log(`[FILE READY] ${logMessage}`);
    logToFile('INFO', logMessage);
    
    const baseFolder = getBaseFolder(filePath);
    const relativePath = baseFolder ? path.relative(baseFolder, filePath) : filePath;

    notifier.notify({
      title: `New MXF File Ready on ${baseFolder}!`,
      message: `File: ${relativePath}`,
      icon: APP_ICON_PATH,
      sound: false,
      wait: true,
    });

    try {
      if (fs.existsSync(NOTIFICATION_SOUND_PATH)) {
        sound.play(NOTIFICATION_SOUND_PATH);
      }
    } catch (err) {
      console.error("[SOUND-ERROR] Could not play sound:", err);
      logToFile("ERROR", `Could not play sound: ${err.message}`);
    }
  }
});

watcher.on("addDir", (dirPath) => {
  const logMessage = `New directory detected: ${dirPath}`;
  console.log(`[FOLDER ADDED] ${logMessage}`);
  logToFile('INFO', logMessage);
  
  const baseFolder = getBaseFolder(dirPath);
  const relativePath = baseFolder ? path.relative(baseFolder, dirPath) : dirPath;

  notifier.notify({
    title: "New Folder Created",
    message: `Path: ${relativePath}`,
    icon: APP_ICON_PATH,
    sound: true,
    wait: false,
  });
});

watcher.on("ready", () => {
  const msg = "Initial scan complete. Watcher is now ready for new changes.";
  console.log(`[INFO] ${msg}`);
  logToFile("INFO", msg);
});

watcher.on("error", (error) => {
  const msg = `Watcher error: ${error.message}`;
  console.error(`[ERROR] ${msg}`);
  logToFile("ERROR", msg);

  notifier.notify({
    title: "Watcher Script Error!",
    message: `An error occurred: ${error.message}`,
  });
});

if (config.enableDebugLogging) {
  watcher.on("all", (event, filePath) => {
    const message = `Event '${event}' detected on: ${filePath}`;
    console.log(`[DEBUG] ${message}`);
    logToFile("DEBUG", message);
  });
}

// --- Shutdown ---
const shutdown = () => {
  const msg = "Shutdown signal received. Closing watcher...";
  console.log(`\n[INFO] ${msg}`);
  logToFile("INFO", msg);

  watcher.close().then(() => {
    logToFile("INFO", "Watcher closed. Exiting.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
