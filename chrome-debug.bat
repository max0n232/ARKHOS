@echo off
REM Launch Chrome with a dedicated debug profile + remote debugging on port 9334
REM Used by chrome-devtools MCP (--browserUrl http://127.0.0.1:9334)
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9334 --user-data-dir="C:\Users\sorte\.claude\chrome-debug-profile" --no-first-run --no-default-browser-check
