# Skills Audit
**Teammate:** 2
**Date:** 2026-02-10

## Summary

20+ skills available, but only 7 in routing table. 13+ skills hidden from user.

## Inventory

### Superpowers (14 skills)
- In routing: 7 (brainstorming, debugging, TDD, plans, writing-skills, verification, parallel-agents)
- Hidden: 7 (using-superpowers, executing-plans, subagent-driven, finishing-branch, worktrees, code-review x2)

### WordPress (1 skill)
- wp-performance-review: Available but not in routing

### Local (19 skills)
- Core: 6 (assistant, knowledge, content-creator, external, n8n, legal)
- Subfolders: 13 (n8n-expert x7, fal-ai x6)

## Critical Issues

1. **TDD Duplicated** - writing-skills copies 80+ lines from test-driven-development
2. **Missing Dependencies** - Skills use each other but don't declare it
3. **Incomplete Routing** - Only 7/14 superpowers visible to user
4. **WordPress Unintegrated** - Not in Studiokook context
5. **Subfolder Skills Hidden** - 13 skills not documented

## Recommendations

### Priority 1
1. Remove TDD duplication from writing-skills
2. Update CLAUDE.md with full routing table (3 sections: Auto, Conditional, Meta)
3. Add required-skills frontmatter

### Priority 2
4. Integrate wp-performance-review for Studiokook
5. Document n8n-expert and fal-ai skills

### Priority 3
6. Clarify skill boundaries (debugging vs verification)
7. Create dependency tree visualization

## Impact

Fixing routing table: 1-2 hours work, activates 13+ hidden skills, 100% improvement in user experience.
