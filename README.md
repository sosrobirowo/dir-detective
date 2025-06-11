# Dir Detective: Automated Folder Watcher

An advanced and reliable Node.js script that automatically monitors multiple folders for new files based on a specific extension (e.g., `.mxf`, `.jpg`, `.pdf`). When a new file is detected and fully copied, the application can trigger a desktop notification and a sound alert, logging all activities for a permanent record.

This tool is designed for automating workflows, ensuring that you are instantly aware of new assets as they arrive in your ingest folders.

## Features

* **Multi-Folder Monitoring:** Watch several different folders and their subdirectories simultaneously.
* **Stable File Detection:** Uses a robust polling mechanism with `awaitWriteFinish` to ensure it only acts on files that have been completely written to disk, preventing errors with large, in-progress file copies.
* **Desktop Notifications:** Get instant, native desktop alerts on Windows, macOS, or Linux when a new file or folder is detected.
* **Sound Alerts:** Plays a configurable sound for new files.
* **Persistent Logging:** Creates a new log file for each day inside a `logs` folder, recording every action the watcher takes for easy auditing.
* **External Configuration:** All settings are managed in a simple `config.json` file—no need to edit the code to change settings.
* **Error Resilience:** Catches common errors (e.g., permissions issues, missing folders) and logs them without crashing the application.

## Requirements

* [Node.js](https://nodejs.org/) (v14 or newer recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup & Installation

1.  **Clone or Download:**
    Download the project files from this repository and place them in a folder on your system.

2.  **Install Dependencies:**
    Open a terminal or command prompt in the project's root directory and run the following command. This will install all the necessary libraries (`chokidar`, `node-notifier`, etc.).
    ```
    npm install
    ```

3.  **Create Watch Folders:**
    Create the folders you want to monitor on your system. For example, you might create `C:\Ingest\Camera_1` and `D:\Projects\Incoming_Media`.

4.  **Configure the Application:** See the **Configuration** section below for details on how to set it up.

## Configuration

All application settings are controlled by the `config.json` file.
```
{
	"watchFolders": [
		"./watch-area-1",
		"./watch-area-2",
		"C:/Users/YourUser/Desktop/Ingest"],
	"extToWatch": ".mxf",
	"logFolder": "./logs",
	"soundNotificationPath": "./notification.wav",
	"appIconPath": "./app-icon.png",
	"enableDebugLogging": true,
	"watcherSettings": {
		"usePolling": true,
		"pollingInterval": 2000,
		"stabilityThreshold": 5000
		}
}
```

* **`watchFolders`**: An array of strings. Each string is a path to a folder you want to monitor. You can use relative paths (like `./folder`) or absolute paths (like `C:/path/to/folder`).
* **`extToWatch`**: Specific file extension you want to watch.
* **`logFolder`**: The folder where daily log files will be stored.
* **`soundNotificationPath`**: Path to the sound file (`.mp3`, `.wav`, etc.) to play when a new `file` is detected.
* **`appIconPath`**: (Optional) Path to an icon (`.png`, `.ico`) to display in the desktop notification.
* **`enableDebugLogging`**: Set to `true` to see detailed event logs in the console and log file. Set to `false` for cleaner, production-level logging.
* **`watcherSettings`**: Advanced settings for `chokidar`.
    * `usePolling`: Set to `true` for maximum reliability, especially on network drives (NAS/SAN). It's slightly more CPU-intensive than `false`.
    * `pollingInterval`: How often (in milliseconds) to check for file changes when polling is active.
    * `stabilityThreshold`: The crucial setting. The script will wait until a file's size has been stable for this many milliseconds before declaring it "ready".

## Usage

You can run the application directly from the command line or use the provided batch files on Windows for convenience.

### Running from the Command Line
```
node index.js
```
Press `Ctrl + C` in the terminal to stop the application gracefully.

### Using Batch Files (Windows) with PM2 (Recommended)

`pm2` is a process manager for Node.js that will keep your script running 24/7 and automatically restart it if it crashes.

**Install PM2 globally** (you only need to do this once):
```
npm install -g pm2
```
* **`start_background.bat`**: Double-click to run the watcher silently in the background (no visible window).
* **`stop_background.bat`**: Double-click to stop the silent background process.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details
