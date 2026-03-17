---
name: n8n-expert
description: >
  Use when building, debugging, or configuring n8n workflows — node configuration,
  expressions, JavaScript/Python code nodes, validation, workflow patterns, and MCP
  tools integration. Also use when n8n workflows fail, nodes error, or expressions
  return undefined.
---

# n8n Expert

Unified guide for building and debugging n8n workflows via MCP tools.

## Reference Files (Obsidian Vault)

Read on-demand via `mcp__obsidian__read_note`:

| Domain | Vault Path | When to Read |
|--------|-----------|-------------|
| MCP Tools | `n8n/mcp-tools` | Using any n8n-mcp tool, searching nodes, managing workflows |
| Expressions | `n8n/expressions` | Writing `{{ }}` expressions, `$json`/`$node` variables |
| Code JS | `n8n/code-javascript` | JavaScript in Code nodes, `$input`, `$helpers`, DateTime |
| Code Python | `n8n/code-python` | Python in Code nodes (stdlib only, no external packages) |
| Node Config | `n8n/node-config` | Configuring node parameters, property dependencies |
| Validation | `n8n/validation` | Validation errors, profiles, auto-fix, false positives |
| Patterns | `n8n/workflow-patterns` | Designing workflow architecture, choosing patterns |

## Routing Guide

**"Build a workflow"**: Patterns → MCP Tools → Node Config → Expressions → Validation
**"Fix validation errors"**: Validation → Node Config (if config issues)
**"Write code in n8n"**: Code JS (95% cases) or Code Python (stdlib only)
**"Find a node"**: MCP Tools (tool selection, nodeType formats)
**"Workflow fails"**: Debug Procedure below → Validation → Node Config

## Critical Gotchas

1. **Webhook data** lives under `$json.body`, NOT `$json` directly
2. **nodeType format**: `nodes-base.slack` for MCP tools, `n8n-nodes-base.slack` in workflow JSON
3. **Code nodes** must return `[{json: {...}}]` format
4. **Python Code nodes** have NO external libraries (no requests, pandas, numpy)
5. **Expressions** use `{{ }}` in node fields, but **NOT** in Code nodes (use JS directly)
6. **Always validate** with `n8n_validate_workflow` before activating

## Typical Tool Flow

```
search_nodes → get_node(detail="standard") → n8n_create_workflow → n8n_validate_workflow → n8n_autofix_workflow
```

For incremental edits: `n8n_update_partial_workflow` (17 operation types, 99% success rate).

## nodeType Format Reference

| Context | Format | Example |
|---------|--------|---------|
| search_nodes, get_node, validate_node | Short prefix | `nodes-base.slack` |
| n8n_create_workflow, workflow JSON | Full prefix | `n8n-nodes-base.slack` |
| Langchain nodes (MCP tools) | Short | `nodes-langchain.agent` |
| Langchain nodes (workflow JSON) | Full | `@n8n/n8n-nodes-langchain.agent` |

`search_nodes` returns both: `nodeType` (short) and `workflowNodeType` (full).

## Debug Procedure

When a workflow fails, follow this systematic process:

### Step 1: Get Error Details
```
n8n_executions action=get id=<executionId> mode=error
```
No execution ID? List recent failures:
```
n8n_executions action=list workflowId=<id> status=error limit=5
```

### Step 2: Identify Failing Node
From execution error, extract: node name, node type, error message, error class
(NodeOperationError, NodeApiError, ExpressionError).

### Step 3: Check Configuration
```
get_node nodeType="nodes-base.<type>" detail=standard
```
Compare failing node params against schema. Look for missing required fields,
wrong resource/operation, incompatible typeVersion.

### Step 4: Validate Expressions

| Wrong | Correct | Why |
|-------|---------|-----|
| `{{ $json.field }}` | `={{ $json.field }}` | Must start with `=` in JSON values |
| `$json.name` (Webhook) | `$json.body.name` | Webhook wraps in body |
| `$json.body.name` (HTTP Request) | `$json.name` | HTTP Request unwraps body |
| `$node["Name"].json` | `$('Name').first().json` | Legacy syntax deprecated |

### Step 5: Test with Pinned Data
Pin known-good data to trigger node → re-execute → isolate downstream issues.

### Step 6: Check Credentials
- HTTP 401/403 → re-authenticate in n8n UI
- OAuth → token may need manual refresh
- Check API scopes match required permissions

### Common Error Patterns

| Error | Cause | Fix |
|-------|-------|-----|
| `NodeOperationError` | Wrong params / missing field | Check `get_node` schema |
| `NodeApiError` + 401/403 | Invalid credentials | Re-auth in n8n UI |
| `NodeApiError` + 429 | Rate limit | Add wait/retry or batch smaller |
| `ExpressionError` | Syntax error | See Step 4 table |
| Expression → `undefined` | Wrong JSON path | Log `$json` to inspect structure |
| Webhook not triggering | Workflow inactive / wrong path | Activate, verify URL |
| Execution timeout | Infinite loop / slow call | Add timeout, check loop logic |

### Debug Flowchart
```
Workflow fails
  → Get execution error (Step 1)
  → Credential error? → Re-auth in UI
  → Expression error? → Fix syntax (Step 4)
  → Node config error? → Compare with schema (Step 3)
  → Network error? → Check connectivity + timeouts
  → Webhook issue? → Verify active + correct URL
  → Still failing? → Pin known-good data (Step 5) to isolate
  → Still failing? → n8n_workflow_versions mode=rollback
```

## MCP Tools Quick Reference

| Tool | Use For |
|------|---------|
| `search_nodes` | Find nodes by keyword |
| `get_node` detail=standard | Node operations and params (95% cases) |
| `validate_node` profile=runtime | Check node config |
| `n8n_create_workflow` | Create new workflow |
| `n8n_update_partial_workflow` | Incremental edits (17 op types) |
| `n8n_validate_workflow` | Validate whole workflow |
| `n8n_autofix_workflow` | Auto-fix expressions, typeVersions |
| `n8n_test_workflow` | Test-execute with sample data |
| `n8n_executions` mode=error | Debug failed executions |
| `n8n_deploy_template` | Deploy template from n8n.io |
| `n8n_workflow_versions` | Version history + rollback |
