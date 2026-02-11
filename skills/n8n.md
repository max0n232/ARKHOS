# n8n Skill

**Роль:** n8n Workflow Automation Expert (via MCP tools)

## MCP Tools Available

This skill integrates with n8n MCP server providing 16+ tools for workflow automation.

### Documentation
```
mcp__n8n-mcp__tools_documentation - Get docs for any tool
```

### Node Discovery
```
mcp__n8n-mcp__search_nodes - Search 1000+ nodes by keyword
mcp__n8n-mcp__get_node - Get detailed node configuration
mcp__n8n-mcp__validate_node - Validate node config before use
```

### Template Library
```
mcp__n8n-mcp__search_templates - Find workflow templates
mcp__n8n-mcp__get_template - Get template details
mcp__n8n-mcp__n8n_deploy_template - Deploy template to instance
```

### Workflow Management
```
mcp__n8n-mcp__n8n_create_workflow - Create new workflow
mcp__n8n-mcp__n8n_get_workflow - Fetch workflow by ID
mcp__n8n-mcp__n8n_update_full_workflow - Update entire workflow
mcp__n8n-mcp__n8n_update_partial_workflow - Patch workflow incrementally
mcp__n8n-mcp__n8n_delete_workflow - Delete workflow
mcp__n8n-mcp__n8n_list_workflows - List all workflows
```

### Validation & Testing
```
mcp__n8n-mcp__validate_workflow - Validate workflow structure
mcp__n8n-mcp__n8n_autofix_workflow - Auto-fix common errors
mcp__n8n-mcp__n8n_test_workflow - Execute workflow (webhook/form/chat)
```

### Execution Management
```
mcp__n8n-mcp__n8n_executions - Get/list/delete executions
```

### Version Control
```
mcp__n8n-mcp__n8n_workflow_versions - Version history & rollback
```

### Health Check
```
mcp__n8n-mcp__n8n_health_check - Check n8n instance status
```

## Common Patterns

### 1. Search and Use a Node

```python
# Find nodes for scraping
search_nodes(query="web scrape", limit=5)
# Returns: HTTP Request, HTML Extract, Cheerio, Puppeteer

# Get detailed info
get_node(
    nodeType="nodes-base.httpRequest",
    detail="standard"
)
# Returns: parameters, credentials, examples

# Validate before using
validate_node(
    nodeType="nodes-base.httpRequest",
    config={
        "method": "GET",
        "url": "https://example.com"
    }
)
```

### 2. Deploy Template

```python
# Search templates
search_templates(
    searchMode="keyword",
    query="scraping",
    limit=10
)

# Get template details
get_template(templateId=12345, mode="structure")

# Deploy to your instance
n8n_deploy_template(
    templateId=12345,
    name="EAMF Scraper",
    autoFix=True,
    stripCredentials=True
)
# Returns: workflow_id, required credentials, fixes applied
```

### 3. Create Workflow from Scratch

```python
n8n_create_workflow(
    name="Daily Website Scraper",
    nodes=[
        {
            "id": "1",
            "name": "Schedule",
            "type": "nodes-base.scheduleTrigger",
            "typeVersion": 1,
            "position": [100, 200],
            "parameters": {
                "rule": {"interval": [{"field": "hours", "value": 24}]}
            }
        },
        {
            "id": "2",
            "name": "HTTP Request",
            "type": "nodes-base.httpRequest",
            "typeVersion": 4,
            "position": [300, 200],
            "parameters": {
                "url": "https://example.com",
                "method": "GET"
            }
        }
    ],
    connections={
        "Schedule": {
            "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
        }
    }
)
```

### 4. Update Workflow

**Full update:**
```python
n8n_update_full_workflow(
    id="workflow-id",
    nodes=[...],  # Complete new nodes array
    connections={...}
)
```

**Partial update (safer):**
```python
n8n_update_partial_workflow(
    id="workflow-id",
    operations=[
        {
            "type": "updateNode",
            "nodeId": "2",
            "updates": {
                "parameters": {
                    "url": "https://new-url.com"
                }
            }
        }
    ]
)
```

### 5. Test and Execute

```python
# Execute webhook workflow
n8n_test_workflow(
    workflowId="workflow-id",
    triggerType="webhook",
    httpMethod="POST",
    data={"key": "value"}
)

# Execute chat workflow
n8n_test_workflow(
    workflowId="workflow-id",
    triggerType="chat",
    message="Hello, bot!",
    sessionId="user-123"
)
```

### 6. Validate and Fix

```python
# Validate
result = validate_workflow(workflow={...})
if result['errors']:
    print(f"Errors: {result['errors']}")

# Auto-fix common issues
n8n_autofix_workflow(
    id="workflow-id",
    applyFixes=True,
    confidenceThreshold="medium"
)
# Fixes: expression format, typeVersion, error config, etc.
```

### 7. Version Control

```python
# List versions
n8n_workflow_versions(mode="list", workflowId="123")

# Rollback to previous version
n8n_workflow_versions(
    mode="rollback",
    workflowId="123",
    versionId=5,
    validateBefore=True
)

# Prune old versions (keep last 10)
n8n_workflow_versions(
    mode="prune",
    workflowId="123",
    maxVersions=10
)
```

## Real-World Examples

### Example 1: EAMF Scraper (from Studiokook project)

```python
# 1. Search for scraping nodes
nodes = search_nodes(query="http cheerio", limit=5)

# 2. Create workflow
workflow = n8n_create_workflow(
    name="EAMF Egger Scraper",
    nodes=[
        {
            "id": "start",
            "name": "Manual Trigger",
            "type": "nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [100, 200],
            "parameters": {}
        },
        {
            "id": "loop",
            "name": "Loop Pages",
            "type": "nodes-base.code",
            "typeVersion": 2,
            "position": [300, 200],
            "parameters": {
                "jsCode": "return Array.from({length: 11}, (_, i) => ({page: i + 1}));"
            }
        },
        {
            "id": "http",
            "name": "Fetch Page",
            "type": "nodes-base.httpRequest",
            "typeVersion": 4,
            "position": [500, 200],
            "parameters": {
                "url": "=https://www.eamf.ee/rus/plity-i-kromki/stolesnicy?p={{$json.page}}",
                "method": "GET"
            }
        },
        {
            "id": "extract",
            "name": "Extract Products",
            "type": "nodes-base.htmlExtract",
            "typeVersion": 1,
            "position": [700, 200],
            "parameters": {
                "extractionValues": {
                    "values": [
                        {
                            "key": "title",
                            "cssSelector": ".product-title"
                        },
                        {
                            "key": "image",
                            "cssSelector": ".product-image img",
                            "attribute": "src"
                        }
                    ]
                }
            }
        }
    ],
    connections={
        "Manual Trigger": {"main": [[{"node": "Loop Pages"}]]},
        "Loop Pages": {"main": [[{"node": "Fetch Page"}]]},
        "Fetch Page": {"main": [[{"node": "Extract Products"}]]}
    }
)

print(f"Created workflow: {workflow['id']}")

# 3. Test execution
result = n8n_test_workflow(
    workflowId=workflow['id'],
    triggerType="webhook",
    waitForResponse=True
)

print(f"Scraped {len(result['data'])} products")
```

### Example 2: Daily WordPress Backup

```python
# Search for WordPress templates
templates = search_templates(
    searchMode="keyword",
    query="wordpress backup",
    limit=5
)

# Deploy template
deployed = n8n_deploy_template(
    templateId=templates[0]['id'],
    name="Studiokook Daily Backup",
    autoFix=True
)

# Update schedule
n8n_update_partial_workflow(
    id=deployed['workflow_id'],
    operations=[
        {
            "type": "updateNode",
            "nodeId": "schedule-trigger",
            "updates": {
                "parameters": {
                    "rule": {
                        "interval": [{"field": "hours", "value": 24}]
                    },
                    "trigger": {"hour": 3}  # 3 AM daily
                }
            }
        }
    ]
)
```

### Example 3: Telegram Alert on Form Submit

```python
workflow = n8n_create_workflow(
    name="Contact Form → Telegram",
    nodes=[
        {
            "id": "webhook",
            "name": "Webhook",
            "type": "nodes-base.webhook",
            "typeVersion": 1,
            "position": [100, 200],
            "parameters": {
                "path": "contact-form",
                "responseMode": "responseNode",
                "httpMethod": "POST"
            }
        },
        {
            "id": "telegram",
            "name": "Send to Telegram",
            "type": "nodes-base.telegram",
            "typeVersion": 1,
            "position": [300, 200],
            "parameters": {
                "operation": "sendMessage",
                "chatId": "123456789",
                "text": "=New contact form:\n\nName: {{$json.name}}\nEmail: {{$json.email}}\nMessage: {{$json.message}}"
            },
            "credentials": {
                "telegramApi": {"id": "cred-id"}
            }
        },
        {
            "id": "respond",
            "name": "Respond",
            "type": "nodes-base.respondToWebhook",
            "typeVersion": 1,
            "position": [500, 200],
            "parameters": {
                "respondWith": "json",
                "responseBody": "={\"status\": \"success\"}"
            }
        }
    ],
    connections={
        "Webhook": {"main": [[{"node": "Send to Telegram"}]]},
        "Send to Telegram": {"main": [[{"node": "Respond"}]]}
    }
)

# Get webhook URL
workflow_data = n8n_get_workflow(id=workflow['id'], mode="full")
webhook_url = workflow_data['nodes'][0]['webhookUrl']
print(f"Webhook URL: {webhook_url}")
```

## Best Practices

### Node Configuration
- Always use `typeVersion` (latest available)
- Validate config before creating workflow
- Use expressions for dynamic data: `={{$json.field}}`

### Error Handling
- Add error outputs to nodes
- Use `continueOnFail: true` for optional steps
- Set `maxTries` and `retryOnFail` for unstable APIs

### Performance
- Use `batchSize` for bulk operations
- Limit loops with counter
- Add `Wait` nodes between rate-limited APIs

### Security
- Strip credentials before sharing (`stripCredentials=True`)
- Use environment variables for secrets
- Validate webhook payloads

### Maintenance
- Use version control (`n8n_workflow_versions`)
- Validate after updates (`validate_workflow`)
- Monitor executions (`n8n_executions`)
- Keep max 10 versions per workflow

## Quick Reference

**Search node:**
```
search_nodes(query="keyword", limit=20)
```

**Get node details:**
```
get_node(nodeType="nodes-base.X", detail="standard")
```

**Create workflow:**
```
n8n_create_workflow(name, nodes, connections)
```

**Deploy template:**
```
n8n_deploy_template(templateId=123, autoFix=True)
```

**Test workflow:**
```
n8n_test_workflow(workflowId="X", triggerType="webhook")
```

**Validate:**
```
validate_workflow(workflow={...})
n8n_autofix_workflow(id="X", applyFixes=True)
```

**Versions:**
```
n8n_workflow_versions(mode="list", workflowId="X")
```

## Configuration

Set n8n MCP in `~/.claude/mcp.json`:
```json
{
  "n8n-mcp": {
    "command": "npx",
    "args": ["-y", "n8n-mcp"],
    "env": {
      "N8N_API_URL": "https://n8n.example.com/api/v1",
      "N8N_API_KEY": "your-api-key"
    }
  }
}
```

## Troubleshooting

**401 Unauthorized:**
- Check `N8N_API_KEY` in env
- Verify API endpoint URL

**Node not found:**
- Check node name spelling (case-sensitive)
- Use `search_nodes` to find correct name

**Validation errors:**
- Use `validate_node` before creating
- Run `n8n_autofix_workflow` after creation

**Execution fails:**
- Check `n8n_executions(action="get", id="exec-id", mode="error")`
- Review node configuration
- Test individual nodes

## Resources

- n8n Docs: https://docs.n8n.io
- Node Library: https://n8n.io/integrations
- Templates: https://n8n.io/workflows
- Community: https://community.n8n.io
