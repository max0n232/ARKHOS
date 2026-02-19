#!/bin/bash
# Studiokook cleanup script — run from project root
# Usage: cd ~/Desktop/Studiokook && bash scripts/cleanup.sh

set -e
echo "=== Studiokook Cleanup ==="

# 1. Remove garbage files from root
echo "[1/7] Removing temp and garbage files..."
rm -f nul skills/nul
rm -f temp-ru-page.html temp-ru-page-fresh.html temp-seo-snippet.json
rm -f full_audit.json check_mu_plugins.json opcache_reset.json
rm -f blocks-6-9.txt translation-progress.txt translations-added-summary.txt
rm -f check-translation.js homepage-content.json

# 2. Remove duplicate JSON dumps (keep all_snips.json as latest)
echo "[2/7] Removing duplicate snippet dumps..."
rm -f snips.json snips_current.json current_snippets.json snippets_audit.json

# 3. Remove temp/
echo "[3/7] Removing temp/..."
rm -rf temp/

# 4. Remove __pycache__ and .venv
echo "[4/7] Removing __pycache__ and .venv..."
rm -rf agents/.venv agents/__pycache__ knowledge/__pycache__

# 5. Remove old reports from root (already copied to docs/reports/)
echo "[5/7] Removing root reports (copies in docs/reports/)..."
rm -f AUDIT_DEBUG_OPTIMIZATION_REPORT_2026-02-10.md
rm -f SEO_AUDIT_REPORT_2026.md SEO_PAGES_TO_CHECK.md
rm -f IMPLEMENTATION_PACKAGE.md SESSION_STATE.md
rm -f seo-audit-multilang.md wp-infrastructure-studiokook.md
rm -f SESSION-CHECKPOINT.md

# 6. Remove old n8n/workflows/ (moved to n8n/prod/)
echo "[6/7] Removing n8n/workflows/ (moved to n8n/prod/)..."
rm -rf n8n/workflows

# 7. Remove old seo-smm.md (now skills/seo-smm/SKILL.md)
echo "[7/7] Removing old skills/seo-smm.md..."
rm -f skills/seo-smm.md

# Remove old database/ (merged into knowledge/)
rm -rf database/

echo ""
echo "=== Done! ==="
echo "Next steps:"
echo "  1. ROTATE credentials: WP app password, Google OAuth, Anthropic API key, Telegram token"
echo "  2. Run: git add -A && git status"
echo "  3. Review and commit"
