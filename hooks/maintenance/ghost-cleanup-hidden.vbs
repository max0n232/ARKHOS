Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c bash -c ""node C:/Users/sorte/.claude/hooks/maintenance/ghost-cleanup.js""", 0, True
