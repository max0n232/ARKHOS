# System Optimization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Полная оптимизация ~/.claude/ — удаление мусора, настройка авточистки, устранение дублей, улучшение безопасности, внедрение best practices из сообщества.

**Architecture:** Трёхуровневая структура (global → project → session) с чёткими зонами ответственности. Lifecycle management через hooks + scheduled cleanup.

**Tech Stack:** Node.js (hooks), PowerShell (scheduled tasks), SQLite (metadata)

---

## Task 1: Tier 1 Cleanup — Удаление мусора (204MB)

**Files:**
- Delete: `~/.claude/mcp-gsc/venv/` (187MB)
- Delete: `~/.claude/db/node_modules/` (14MB)
- Delete: `~/.claude/nul`
- Delete: 6 файлов с битыми путями в корне

**Step 1: Создать backup список**

```powershell
# Сохранить список удаляемых файлов
$garbage = @(
    "$env:USERPROFILE\.claude\mcp-gsc\venv",
    "$env:USERPROFILE\.claude\db\node_modules",
    "$env:USERPROFILE\.claude\nul"
)
$garbage | Out-File "$env:USERPROFILE\.claude\docs\cleanup-log-$(Get-Date -Format 'yyyy-MM-dd').txt"
```

**Step 2: Удалить virtualenv и node_modules**

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\mcp-gsc\venv" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\db\node_modules" -ErrorAction SilentlyContinue
```

**Step 3: Удалить мусорные файлы с битыми путями**

```powershell
Get-ChildItem "$env:USERPROFILE\.claude" -File |
    Where-Object { $_.Name -match "^C:" -or $_.Name -match "^Users" -or $_.Name -eq "nul" } |
    Remove-Item -Force
```

**Step 4: Проверить освобождённое место**

```powershell
(Get-ChildItem "$env:USERPROFILE\.claude" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
```

Expected: ~84MB (было 288MB)

---

## Task 2: Создать auto-cleanup script

**Files:**
- Create: `~/.claude/scripts/auto-cleanup.js`
- Modify: `~/.claude/settings.json` (SessionEnd hook)

**Step 1: Написать cleanup скрипт**

```javascript
// ~/.claude/scripts/auto-cleanup.js
const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.env.USERPROFILE || process.env.HOME, '.claude');
const CONFIG = {
  debug: { maxAgeDays: 30, dir: 'debug' },
  todos: { maxAgeDays: 60, dir: 'todos' },
  shellSnapshots: { maxAgeDays: 7, dir: 'shell-snapshots' },
  pluginCache: { maxAgeDays: 30, dir: 'plugins/cache' }
};

function cleanOldFiles(config) {
  const targetDir = path.join(CLAUDE_DIR, config.dir);
  if (!fs.existsSync(targetDir)) return { deleted: 0, freed: 0 };

  const now = Date.now();
  const maxAge = config.maxAgeDays * 24 * 60 * 60 * 1000;
  let deleted = 0, freed = 0;

  const files = fs.readdirSync(targetDir);
  for (const file of files) {
    const filePath = path.join(targetDir, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtimeMs > maxAge) {
      freed += stat.size;
      fs.rmSync(filePath, { recursive: true, force: true });
      deleted++;
    }
  }
  return { deleted, freed };
}

// Run cleanup
let totalDeleted = 0, totalFreed = 0;
for (const [name, config] of Object.entries(CONFIG)) {
  const result = cleanOldFiles(config);
  totalDeleted += result.deleted;
  totalFreed += result.freed;
  if (result.deleted > 0) {
    console.log(`[cleanup] ${name}: deleted ${result.deleted} files (${(result.freed/1024).toFixed(1)}KB)`);
  }
}

if (totalDeleted > 0) {
  console.log(`[cleanup] Total: ${totalDeleted} files, ${(totalFreed/1024/1024).toFixed(2)}MB freed`);
}
```

**Step 2: Добавить в SessionEnd hook**

Добавить в `~/.claude/settings.json` → hooks.SessionEnd:

```json
{
  "type": "command",
  "command": "node C:\\Users\\sorte\\.claude\\scripts\\auto-cleanup.js",
  "timeout": 10000
}
```

**Step 3: Протестировать**

```bash
node ~/.claude/scripts/auto-cleanup.js
```

Expected: Выводит количество удалённых файлов или ничего если всё свежее

---

## Task 3: Добавить .gitignore для регенерируемых файлов

**Files:**
- Create: `~/.claude/.gitignore`

**Step 1: Создать .gitignore**

```gitignore
# Regeneratable
mcp-gsc/venv/
db/node_modules/
plugins/cache/

# Session data (local only)
projects/
debug/
todos/
shell-snapshots/

# Temp
*.tmp
nul

# Secrets
.credentials.json
**/credentials/
```

---

## Task 4: Устранить дубли в CLAUDE.md

**Files:**
- Modify: `~/Desktop/Studiokook/CLAUDE.md`

**Step 1: Удалить секцию Superpowers из проектного CLAUDE.md**

Секция уже есть в глобальном `~/.claude/CLAUDE.md`. В проектном оставить только project-specific правила.

**Step 2: Проверить что осталось**

Проектный CLAUDE.md должен содержать только:
- Credentials ссылки
- Custom REST API endpoints
- Critical Rules (WordPress-specific)
- Quick Actions
- Languages
- Agents

---

## Task 5: Оптимизировать глобальный CLAUDE.md

**Files:**
- Modify: `~/.claude/CLAUDE.md`

**Step 1: Применить best practices**

По официальной документации: "Keep it concise—for each line, ask 'Would removing this cause Claude to make mistakes?' If not, cut it."

Текущий CLAUDE.md = 85 строк. Цель: <50 строк.

Убрать:
- Structure секцию (Claude сам найдёт)
- n8n Architecture диаграмму (перенести в skill)
- Избыточные комментарии

**Step 2: Финальная структура**

```markdown
# Claude Router

## Projects
| Project | Path | Triggers |
|---------|------|----------|
| Studiokook | ~/Desktop/Studiokook | кухни, WordPress, SEO, studiokook.ee |
| Personal | ~/Desktop/Personal | личное, задачи |

## Superpowers (auto-invoke)
[таблица триггеров — оставить]

## Defaults
- Language: RU primary, EN tech
- Autonomy: <3 files, <200 lines — decide yourself
- Token: 200k. At 50% STOP.
```

---

## Task 6: Research — Trail of Bits Security Skills

**Files:**
- Read: GitHub repo

**Step 1: Изучить security skills**

```
Trail of Bits Security Skills - 12+ skills для:
- Code auditing
- Vulnerability detection
- CodeQL/Semgrep analysis
- Differential code review
```

**Step 2: Оценить применимость**

Для Studiokook (WordPress/PHP):
- Code auditing — полезно
- Semgrep PHP rules — полезно
- CodeQL — избыточно для малого проекта

**Step 3: Решение**

Добавить semgrep в security validation hook если нужен статический анализ PHP.

---

## Task 7: Создать CONSTITUTION.md

**Files:**
- Create: `~/.claude/CONSTITUTION.md`

**Step 1: Написать принципы**

```markdown
# Constitution

Фундаментальные принципы, которые НЕЛЬЗЯ нарушать.

## Core Tenets

1. **Evidence over claims** — Verify before declaring success
2. **Test-Driven** — Write tests first, always
3. **Systematic over ad-hoc** — Process over guessing
4. **Simplicity** — Minimum complexity for current task

## Security (non-negotiable)

- NEVER commit credentials
- NEVER rm -rf without explicit path
- NEVER sudo without explicit approval
- NEVER modify .env directly

## Quality Gates

Before claiming "done":
1. Tests pass
2. Linter clean
3. No console.log/print debug
4. Changes reviewed

## Escalation

If uncertain → ask user
If risky → confirm first
If destructive → require explicit approval
```

**Step 2: Подключить в CLAUDE.md**

Добавить import: `@CONSTITUTION.md`

---

## Task 8: Финальная верификация

**Step 1: Проверить размер**

```powershell
(Get-ChildItem "$env:USERPROFILE\.claude" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
```

Expected: <100MB

**Step 2: Проверить структуру**

```
~/.claude/
├── CLAUDE.md           (<50 lines)
├── CONSTITUTION.md     (principles)
├── settings.json       (hooks + permissions)
├── .gitignore          (excludes regeneratable)
├── scripts/
│   └── auto-cleanup.js
├── skills/
├── agents/
├── docs/plans/
└── [data dirs excluded from git]
```

**Step 3: Тест-драйв**

Запустить новую сессию, проверить что:
- Hooks работают
- Superpowers auto-invoke при триггерах
- Cleanup работает в SessionEnd

---

## Execution Summary

| Task | Action | Impact |
|------|--------|--------|
| 1 | Delete garbage | -204MB |
| 2 | Auto-cleanup script | Ongoing maintenance |
| 3 | .gitignore | Prevent garbage in git |
| 4 | Remove CLAUDE.md dupes | Clarity |
| 5 | Optimize global CLAUDE.md | <50 lines |
| 6 | Security research | Knowledge |
| 7 | Constitution | Core principles |
| 8 | Verification | Quality gate |

**Total estimated improvement:**
- Storage: 288MB → <80MB
- CLAUDE.md: 85 lines → <50 lines
- Maintenance: Manual → Automated
