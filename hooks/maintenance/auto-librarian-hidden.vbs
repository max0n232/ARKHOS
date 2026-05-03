Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c bash -c ""node C:/Users/sorte/.claude/hooks/maintenance/auto-librarian.js""", 0, True
