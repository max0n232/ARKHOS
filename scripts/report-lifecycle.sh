#!/bin/bash
# Report Lifecycle: classify telegram reports → route to vault → cleanup
# Runs weekly via cron on VPS

LOG="/root/arkhos/logs/telegram-reports.log"
VAULT="/root/ObsidianVault"
ARCHIVE="/root/arkhos/logs/telegram-reports.archive.log"
PYTHON="/root/mcp-servers/gsc/venv/bin/python3"
MAX_AGE_DAYS=30
API_KEY_FILE="/root/arkhos/credentials/anthropic-api.key"

# Skip if log empty or missing
[ -s "$LOG" ] || { echo "Log empty, skipping"; exit 0; }

API_KEY=$(cat "$API_KEY_FILE" 2>/dev/null | tr -d "\n")
[ -z "$API_KEY" ] && echo "No API key" && exit 1

# Classify via Anthropic API
CONTENT=$(cat "$LOG" | head -c 8000)

$PYTHON - "$API_KEY" "$CONTENT" "$VAULT" "$LOG" "$ARCHIVE" "$MAX_AGE_DAYS" << 'PYEOF'
import json, urllib.request, ssl, sys, os
from datetime import datetime, timedelta

api_key = sys.argv[1]
content = sys.argv[2]
vault = sys.argv[3]
log_file = sys.argv[4]
archive = sys.argv[5]
max_age = int(sys.argv[6])

# Classify
ctx = ssl.create_default_context()
body = json.dumps({
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 2000,
    "system": "Classify each report entry. Output JSON array: [{\"type\": \"seo\"|\"infrastructure\"|\"translation\"|\"content\"|\"skip\", \"summary\": \"<80 chars\", \"data\": \"key findings\"}]. Type skip for trivial (greetings, status). Be concise.",
    "messages": [{"role": "user", "content": content}]
}).encode()

req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body, headers={
    "x-api-key": api_key,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
})

try:
    resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    data = json.loads(resp.read())
    text = data["content"][0]["text"]
    # Extract JSON from response
    start = text.find("[")
    end = text.rfind("]") + 1
    entries = json.loads(text[start:end]) if start >= 0 else []
except Exception as e:
    print(f"API error: {e}")
    sys.exit(1)

# Route
routes = {
    "seo": "10-Projects/Studiokook/seo-strategy.md",
    "infrastructure": "10-Projects/Studiokook/infrastructure.md",
    "translation": "10-Projects/Studiokook/20-Areas/WordPress/translatepress.md",
    "content": "10-Projects/Studiokook/knowledge.md"
}

date = datetime.now().strftime("%Y-%m-%d")
routed = 0

for e in entries:
    t = e.get("type", "skip")
    if t == "skip":
        continue
    dest = routes.get(t)
    if not dest:
        continue
    path = os.path.join(vault, dest)
    if not os.path.exists(path):
        print(f"Dest missing: {dest}")
        continue

    summary = e.get("summary", "")
    data = e.get("data", "")

    # Dedup
    with open(path) as f:
        if summary in f.read():
            print(f"Dedup skip: {summary}")
            continue

    line = f"\n<!-- telegram-report:{date} -->\n- [{summary}] {data}\n"
    with open(path, "a") as f:
        f.write(line)
    routed += 1
    print(f"Routed to {dest}: {summary}")

# Archive + rotate
with open(log_file) as f:
    old = f.read()
with open(archive, "a") as f:
    f.write(old)
with open(log_file, "w") as f:
    f.write("")

# Trim archive
cutoff = (datetime.now() - timedelta(days=max_age)).strftime("%Y-%m-%d")
if os.path.exists(archive):
    with open(archive) as f:
        lines = f.readlines()
    # Keep lines with dates >= cutoff
    kept = [l for l in lines if cutoff <= l[:10] or "===" not in l[:5]]
    with open(archive, "w") as f:
        f.writelines(kept)

print(f"Lifecycle done: {routed} routed, log rotated, archive trimmed to {max_age}d")
PYEOF
