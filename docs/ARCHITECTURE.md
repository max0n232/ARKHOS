# Claude CLI Architecture

Multi-layer system with security, memory, and skills on each level.

## Structure Overview

```
.claude/                          ← GLOBAL LAYER
├── CLAUDE.md                     ← Router rules
├── ARCHITECTURE.md               ← This file
├── projects.json                 ← Project mapping
├── settings.json                 ← Hooks config
│
├── security/                     ← Security Layer
│   ├── rules.toml               ← Deny/Allow patterns
│   ├── validate-command.js      ← PreToolUse: Bash
│   ├── validate-file-access.js  ← PreToolUse: Write/Edit
│   ├── audit-log.js             ← PostToolUse: logging
│   └── audit/                   ← Daily JSONL logs
│
├── memory/                       ← Memory Layer
│   ├── session/
│   │   └── capsule.json         ← Session state
│   ├── global/
│   │   ├── patterns.md          ← Cross-project patterns
│   │   └── troubleshooting.md   ← Problem solutions
│   └── session-init.js          ← SessionStart hook
│
├── skills/                       ← Global Skills
│   ├── REGISTRY.md              ← Skills index
│   └── {skill}/                 ← Skill folders
│
└── n8n-hub/                      ← Shared n8n templates
    └── templates/

Studiokook/                       ← PROJECT LAYER
├── CLAUDE.md                     ← Project rules
├── .claude/
│   ├── security.toml            ← Project security overrides
│   ├── hooks.json               ← Project hooks
│   ├── context-loader.js        ← Load project context
│   ├── route-skill.js           ← Skill router
│   └── validate-wordpress.js    ← WordPress safety
│
├── credentials/                  ← API keys (read-only ref)
├── knowledge/                    ← SQLite database
├── skills/                       ← Project skills
│   ├── REGISTRY.md
│   ├── _triggers.json           ← Skill triggers
│   ├── seo-aeo/
│   ├── marketing/               ← 25+ skills
│   └── wp-*/                    ← WordPress skills
│
└── n8n/                          ← Workflows
    ├── dev/
    └── prod/
```

## Data Flows

### Session Flow
```
SessionStart
    ↓
[Global] session-init.js → capsule.json
    ↓
[Project] context-loader.js → load decisions
    ↓
Ready
```

### Security Flow
```
PreToolUse (Bash/Write/Edit)
    ↓
[Global] validate-*.js
    ↓
Check rules.toml [deny] → BLOCK
    ↓
Check [project] security.toml → BLOCK
    ↓
Check [allow] → ALLOW
    ↓
Passthrough

PostToolUse
    ↓
audit-log.js → audit/{date}.jsonl
```

### Skill Flow
```
UserPrompt
    ↓
[Project] route-skill.js
    ↓
Match _triggers.json
    ↓
Load SKILL.md
    ↓
Update capsule.json (loaded_skills)
```

## Key Files

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Central hooks config |
| `.claude/security/rules.toml` | Global security patterns |
| `Studiokook/.claude/security.toml` | WordPress protections |
| `Studiokook/skills/_triggers.json` | Skill routing |
| `.claude/memory/session/capsule.json` | Session state |

## Token Budget

Tracked in capsule.json:
- **Total**: 200,000 tokens
- **30%** (60k): Notify
- **50%** (100k): Stop
- **70%** (140k): Emergency

## Known Limitations

### settings.json Paths Are Platform-Specific

Hook commands in `settings.json` use absolute Windows paths (e.g., `C:\\Users\\sorte\\.claude\\...`).

**Why not portable paths?**
- `~` (tilde): Does NOT work on Windows - becomes `cwd\~\.claude\...`
- `$HOME`: Works in bash but Node.js receives `/c/Users/...` format which fails
- `%HOME%`: Works on Windows only, fails on Linux/macOS
- `$CLAUDE_PROJECT_DIR`: Only available for project-level hooks, not user settings

**Cross-platform solution**: None exists. Different path syntaxes are mutually exclusive.

**Recommendation**: Keep absolute paths. If migrating to another machine:
1. Find/replace username in `settings.json`
2. Or regenerate hooks via `/hooks` menu

See: [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks)

## Adding New Components

### New Security Rule
1. Edit `.claude/security/rules.toml`
2. Add to [deny] or [allow] section

### New Skill
1. Create `skills/{name}/SKILL.md`
2. Add triggers to `_triggers.json`
3. Update `REGISTRY.md`

### New Project
1. Add to `projects.json`
2. Create `{project}/.claude/` structure
3. Copy security.toml template
