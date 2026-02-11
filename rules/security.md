# Security Rules

Global security rules for all projects.

## Forbidden Operations

### Bash commands
- `rm -rf` without explicit path
- `sudo` commands
- `chmod 777`
- Direct database access without ORM
- `curl | bash` or `wget | sh`

### File operations
- Writing to system directories
- Modifying `.env` files directly
- Hardcoding credentials in code

## Required Practices

### Credentials
- Store in `credentials/` folder
- Reference by filename only
- Never log or output values

### Input validation
- Validate all user input
- Escape SQL queries (use prepared statements)
- Sanitize HTML output

### WordPress specific
- Never use `wp_update_post()` in snippets
- Use `$wpdb->update()` instead
- Always escape output with `esc_html()`, `esc_attr()`

## OWASP Top 10 Awareness

1. Injection - use parameterized queries
2. Broken Auth - don't store passwords in plain text
3. XSS - escape all output
4. IDOR - verify object ownership
5. Security Misconfiguration - don't expose debug info
