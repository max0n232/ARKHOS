---
name: n8n-debug
domain: n8n
preset: debug
teammates: 2
---

# n8n Debug Team

## Spawn
1. **analyzer** — collects execution logs, error patterns, data flow
2. **debugger** — checks Code nodes, expressions, connections

## Coordination
- Lead in Delegate mode (Shift+Tab)
- Teammates exchange findings via mailbox
- analyzer:findings → blocks → debugger:verify_fix
- Parallel work during investigation phase

## Context for each teammate
- Workflow number/name
- Problem description from user
- Reference to n8n skills (skills/n8n.md, skills/n8n-expert/)
