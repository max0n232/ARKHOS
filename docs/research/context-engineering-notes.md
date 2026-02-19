# Context Engineering Notes for ARKHOS

Extracted from muratcankoylan/Agent-Skills-for-Context-Engineering.

## Actionable Patterns

### 1. Anchored Iterative Summarization (context-compression)
Define explicit summary sections (Session Intent, Files Modified, Decisions, Current State, Next Steps). On each compression, summarize ONLY new truncated content and merge into existing sections. Prevents artifact trail drift.

### 2. Tokens-per-Task (context-compression)
Optimize for total tokens to complete a task, not tokens per API call. Aggressive compression saves 0.5% but causes 20% more re-fetching.

### 3. 5-Layer Memory (memory-systems)
ARKHOS knowledge-manager covers layers 1-3 (working, short-term, long-term). Layers 4-5 (entity tracking, temporal knowledge graph) are theoretical.

### 4. Context Isolation (multi-agent-patterns)
Sub-agents exist to isolate context, not to role-play. Validates ARKHOS Solo-first approach.

### 5. Observation Masking (context-optimization)
Tool outputs consume 80%+ of context. Replace with compact references after use.

### 6. KV-Cache Optimization (context-optimization)
Place stable content first, dynamic content last for cache efficiency.

## Conflicts Analysis
No conflicts. All community skills complement existing ARKHOS skills.
- memory-systems + knowledge-manager: Complementary (theory vs DAL practice)
- context-compression + pattern-tracker: No overlap (different domains)
- multi-agent-patterns + Delegation Defaults: Validates approach
- context-optimization: New capability
- supabase-postgres: New capability
