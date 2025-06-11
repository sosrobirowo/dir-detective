@echo off
title Stop Dir-Detective (Background)
echo Stopping Dir Detective process...
pm2 stop dir-detective
echo.
echo The application has been stopped.
pause