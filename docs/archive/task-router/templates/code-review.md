---
name: code-review
domain: code
preset: review
teammates: 3
---

# Code Review Team

## Spawn
1. **security** — OWASP, injections, auth
2. **performance** — O(n), memory, bottlenecks
3. **quality** — DRY, patterns, readability (uses agents/code-reviewer.md)

## Coordination
- Each reviewer works independently
- Lead collects findings, removes duplicates
- Output: unified report by severity (CRITICAL → WARNING → INFO)

## Constitution compliance
- Format from agents/code-reviewer.md: severity + file:line + fix suggestion
