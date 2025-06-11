@echo off
title Start Dir-Detective (Background)
echo Starting the watcher in the background with PM2...
pm2 start index.js --name "dir-detective"
echo.
echo Dir Detective is now running in the background.
echo You can close this window.
pause