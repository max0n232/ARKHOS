Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c node C:/Users/sorte/.claude/hooks/maintenance/drift-check.js --force", 0, True
