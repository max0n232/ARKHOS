Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c node C:/Users/sorte/.claude/hooks/maintenance/qmd-refresh.js", 0, True
