---
name: integrations
description: "External integrations: Telegram Bot API, n8n webhooks, notifications. Use when sending Telegram messages, triggering n8n workflows, webhooks, notification pipelines."
---

# Integrations Skill

**Роль:** External Communications & Webhooks Manager

## Компетенции

### Telegram Bot Integration
- Send notifications via Telegram Bot API
- Interactive keyboards
- Callback queries
- File uploads (photos, documents)
- Channel/Group posting

### n8n Workflows
- Trigger workflows via webhook
- Receive data from n8n
- Error handling & retries
- Workflow debugging

### Webhook Management
- Create webhook endpoints
- Parse incoming data
- Validate payloads
- Security (HMAC signatures)

## Telegram Bot API

### Setup
```python
# From scripts/telegram_notify.py
import os
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
```

### Send Message
```bash
python scripts/telegram_notify.py --send "Hello from Claude!"
```

```python
import requests

def send_telegram(message, parse_mode='Markdown'):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {
        'chat_id': CHAT_ID,
        'text': message,
        'parse_mode': parse_mode
    }
    response = requests.post(url, data=data)
    return response.json()

# Usage
send_telegram("✅ Task completed!")
send_telegram("**Bold** _italic_ `code`", parse_mode='Markdown')
```

### Send Photo
```python
def send_photo(photo_path, caption=''):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
    files = {'photo': open(photo_path, 'rb')}
    data = {'chat_id': CHAT_ID, 'caption': caption}
    response = requests.post(url, files=files, data=data)
    return response.json()

# Usage
send_photo('screenshot.png', 'Deployment successful!')
```

### Interactive Keyboard
```python
def send_keyboard(message, buttons):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    keyboard = {
        'inline_keyboard': [
            [{'text': btn['text'], 'callback_data': btn['data']}
             for btn in row]
            for row in buttons
        ]
    }
    data = {
        'chat_id': CHAT_ID,
        'text': message,
        'reply_markup': keyboard
    }
    response = requests.post(url, json=data)
    return response.json()

# Usage
buttons = [
    [{'text': '✅ Approve', 'data': 'approve'},
     {'text': '❌ Reject', 'data': 'reject'}]
]
send_keyboard('Deploy to production?', buttons)
```

### Handle Callback
```python
def get_updates(offset=0):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
    response = requests.get(url, params={'offset': offset})
    return response.json()

# Poll for responses
updates = get_updates()
for update in updates['result']:
    if 'callback_query' in update:
        callback_data = update['callback_query']['data']
        if callback_data == 'approve':
            # Execute approval logic
            pass
```

## n8n Integration

### Trigger Workflow via Webhook
```python
import requests
import json

N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/trigger-id"

def trigger_n8n(workflow_data):
    response = requests.post(
        N8N_WEBHOOK_URL,
        json=workflow_data,
        headers={'Content-Type': 'application/json'}
    )
    return response.json()

# Usage
data = {
    'action': 'scrape',
    'url': 'https://example.com',
    'selector': '.product'
}
result = trigger_n8n(data)
print(result)
```

### Receive n8n Data (Flask webhook)
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook/n8n', methods=['POST'])
def n8n_webhook():
    data = request.json

    # Validate (optional)
    if 'secret' not in data or data['secret'] != 'your-secret':
        return jsonify({'error': 'Unauthorized'}), 401

    # Process data
    action = data.get('action')
    if action == 'notify':
        send_telegram(data['message'])

    return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    app.run(port=5000)
```

### n8n MCP Tools (via skill)
```
See n8n-expert skill for:
- search_nodes
- get_node
- search_templates
- create_workflow
- execute_workflow
```

## Webhook Security

### HMAC Signature Validation
```python
import hmac
import hashlib

def validate_webhook(payload, signature, secret):
    """Validate webhook signature (GitHub/Stripe style)"""
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# Usage in Flask
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature')
    payload = request.data.decode()

    if not validate_webhook(payload, signature, SECRET_KEY):
        return jsonify({'error': 'Invalid signature'}), 401

    # Process webhook
    return jsonify({'status': 'ok'}), 200
```

### API Key Authentication
```python
@app.route('/webhook', methods=['POST'])
def webhook():
    api_key = request.headers.get('X-API-Key')
    if api_key != os.getenv('WEBHOOK_API_KEY'):
        return jsonify({'error': 'Unauthorized'}), 401

    # Process
    return jsonify({'status': 'ok'}), 200
```

## Common Use Cases

### 1. Deployment Notification
```python
# After successful deployment
message = f"""
🚀 **Deployment Successful**

Project: Studiokook
Environment: Production
Commit: {commit_hash[:7]}
Time: {datetime.now().strftime('%H:%M')}

[View Site](https://studiokook.ee)
"""
send_telegram(message)
```

### 2. Error Alert
```python
# On critical error
def alert_error(error, context):
    message = f"""
⚠️ **ERROR ALERT**

Service: {context['service']}
Error: `{error}`
Time: {datetime.now()}

Action needed: Check logs
"""
    send_telegram(message)
```

### 3. Scheduled Report (via n8n)
```
n8n workflow:
1. Schedule node (daily 9 AM)
2. HTTP Request (fetch data)
3. Function (format message)
4. Telegram node (send)
```

### 4. Scraping Complete
```python
# After scraping job
data = trigger_n8n({
    'action': 'scrape_eamf',
    'pages': 11
})

if data['status'] == 'complete':
    send_telegram(f"✅ Scraping complete: {data['items_found']} items")
else:
    send_telegram(f"❌ Scraping failed: {data['error']}")
```

### 5. Approval Workflow
```python
# Request approval via Telegram
buttons = [
    [{'text': '✅ Deploy', 'data': 'deploy'},
     {'text': '❌ Cancel', 'data': 'cancel'}]
]
send_keyboard('Deploy v2.1.0 to production?', buttons)

# Poll for response
while True:
    updates = get_updates(last_update_id + 1)
    for update in updates['result']:
        if 'callback_query' in update:
            data = update['callback_query']['data']
            if data == 'deploy':
                # Trigger deployment
                trigger_n8n({'action': 'deploy', 'version': 'v2.1.0'})
                send_telegram('🚀 Deploying...')
                break
    time.sleep(2)
```

## Environment Variables

Required in `.env`:
```bash
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789

# n8n
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/xyz
N8N_API_KEY=your-api-key

# Webhook Security
WEBHOOK_SECRET=random-secret-string
```

## Quick Commands

**Send Telegram:**
```bash
python scripts/telegram_notify.py --send "Message"
```

**Trigger n8n Workflow:**
```python
from external_integrations import trigger_n8n
result = trigger_n8n({'action': 'scrape', 'url': '...'})
```

**Create Webhook Server:**
```python
from external_integrations import create_webhook_server
server = create_webhook_server(port=5000)
server.add_route('/telegram', handle_telegram_webhook)
server.run()
```

## Error Handling

**Retry Logic:**
```python
def send_telegram_with_retry(message, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = send_telegram(message)
            if response.get('ok'):
                return response
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

**Timeout:**
```python
response = requests.post(url, json=data, timeout=10)
```

## Testing

**Test Telegram:**
```bash
python scripts/telegram_notify.py --test
# Should send "Test message from Claude"
```

**Test n8n:**
```python
result = trigger_n8n({'action': 'test'})
assert result['status'] == 'ok'
```

**Webhook Simulator:**
```bash
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"action": "test"}'
```

## Integration with Other Skills

**Knowledge:**
- Log webhook calls
- Save error patterns

**Assistant:**
- Daily summary via Telegram
- Task reminders

**Content Creator:**
- Video publish notifications
- Comment alerts
