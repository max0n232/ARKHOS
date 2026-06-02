@echo off
REM Firecrawl MCP launcher — reads the API key from the credentials FILE at spawn time
REM and exports it into the env before launching firecrawl-mcp. The secret value never
REM lives in a tracked config file (.claude.json references this launcher by path only,
REM per constitution § Credentials "reference by filename, never hardcode" + canon A4).
REM Consumer: .claude.json mcpServers.firecrawl.command points here.
setlocal
REM Read the key file (single line). /p strips the trailing CRLF.
set "KEYFILE=%USERPROFILE%\.claude\credentials\firecrawl-api.key"
if not exist "%KEYFILE%" (
  echo firecrawl-launch: key file missing: %KEYFILE% 1>&2
  exit /b 1
)
set /p FIRECRAWL_API_KEY=<"%KEYFILE%"
if "%FIRECRAWL_API_KEY%"=="" (
  echo firecrawl-launch: key file empty 1>&2
  exit /b 1
)
REM Hand off to the actual MCP server, inheriting the exported key.
call npx -y firecrawl-mcp
endlocal
