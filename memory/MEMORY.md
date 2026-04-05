## credentials/ is write-protected

Hook blocks Write to `**/credentials/**`. To add new creds, user must do it manually.

## WordPress plugin configuration safety

**CRITICAL:** Never configure WordPress plugins via `wp eval` or direct `update_option()` calls.

**Why:** Plugin settings often expect specific data formats (JSON strings, serialized arrays, etc.). Direct manipulation causes Fatal Errors.

**Correct methods:**
1. WordPress admin UI (always safe)
2. Plugin's own WP-CLI commands (if documented)
3. Default settings (safest for initial install)

**Incident:** Asset Cleanup plugin crashed site (2026-02-21) when settings were set via `wp eval` instead of admin UI. Plugin expected JSON string, received PHP array → Fatal Error.

**Rule:** For ANY plugin configuration → use admin UI or leave defaults. No shortcuts.

## Claude Code: output-critic Enforcement (Stop hook)

**Status:** ✅ Working. Stop prompt hook blocks completion if generation task lacks critic phase.

**Mechanism:**
- Stop hook fires after every response
- Sonnet 4.6 evaluator checks: is this a generation task (code/text/prompt/JSON)?
- If YES and no "CRITIC PHASE" section → returns `{ok: false}`
- Claude **forced** to continue and apply output-critic skill
- `stop_hook_active` flag prevents infinite loops

**Why it works:** Uses separate model for evaluation (not instruction injection), so safety system doesn't block.

**UserPromptSubmit removed:** Soft reminder hook caused chat blocking. Stop hook enforcement is sufficient.

**Caveat:** Sonnet 4.6 evaluator must correctly identify generation vs informational tasks. More accurate than Haiku but still heuristic.

## WordPress optimization plugins — visual breakage risk

**CRITICAL:** CSS/JS optimization plugins (Asset Cleanup, Autoptimize, WP Rocket) can break site visually even with default settings.

**Symptoms:** Site returns 200 OK but CSS not loaded → plain HTML display.

**Cause:** Aggressive default rules block legitimate stylesheets, conflicts with existing cache layers.

**Required workflow:**
1. Measure baseline (PageSpeed) BEFORE install
2. Install plugin
3. **IMMEDIATE visual check** (open in browser)
4. Configure ONLY via Admin UI
5. ONE change at a time + verify

**Recovery:** Deactivate plugin + clear all caches (Seraphinite + WP object cache).

**Reference:** `patterns/wordpress-plugins.md` — full safety rules and recovery procedures.
