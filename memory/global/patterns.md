# Global Patterns

Cross-project patterns and learnings.

## Code Patterns

### Error Handling
- Always use try-catch for async operations
- Log errors with context (file, function, input)
- Return structured error objects, not strings

### File Operations
- Check existence before read/write
- Use path.join for cross-platform compatibility
- Handle encoding explicitly (utf-8)

## Workflow Patterns

### Before Major Changes
1. Read existing file first
2. Validate changes won't break functionality
3. Create backup if destructive

### Debugging
1. Check logs first
2. Isolate the issue
3. Test fix in isolation before applying

## Project-Specific Notes

### Studiokook (WordPress)
- Never use wp_update_post() in snippets
- Always use $wpdb->update() for database operations
- Test on local n8n before deploying to VPS

---

*Last updated: Auto-generated*
