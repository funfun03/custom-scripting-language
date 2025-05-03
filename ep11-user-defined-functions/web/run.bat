@echo off
echo Starting custom scripting language server...

REM Check if port 8000 is already in use and kill the process
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') DO (
    echo Port 8000 is in use by process %%P, attempting to kill it...
    taskkill /F /PID %%P
    timeout /t 1
)

REM Run the server
deno run --allow-net --allow-read --allow-env --allow-write web/server.js 