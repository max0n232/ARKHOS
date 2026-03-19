# Technical Architecture Rubric

## Dimensions

### 1. Problem framing (Постановка задачи)
- 1: Vague problem statement
- 2: Problem described but no constraints
- 3: Problem + constraints + success criteria
- 4: Problem + constraints + non-goals + trade-off analysis
- 5: Full ADR format with context, decision drivers, and considered alternatives

### 2. Solution completeness (Полнота решения)
- 1: High-level idea only
- 2: Component list without integration details
- 3: Components + data flow + integration points
- 4: Full architecture with error handling, fallbacks, and edge cases
- 5: Production-ready spec with deployment strategy, rollback plan, and observability

### 3. Feasibility (Реализуемость)
- 1: Ignores current stack
- 2: Mentions current stack but adds incompatible tools
- 3: Compatible with current stack (n8n, WP, Supabase, Claude API)
- 4: Leverages existing infrastructure, realistic effort estimates
- 5: Incremental migration path with zero-downtime, phased rollout

### 4. Security & data (Безопасность и данные)
- 1: No security consideration
- 2: Mentions "needs to be secure"
- 3: Auth model + data flow security
- 4: Threat model + secrets management + GDPR compliance for EU/Estonian market
- 5: Full security review with attack surface analysis, rate limiting, audit logging

### 5. Scalability & maintenance (Масштабируемость и поддержка)
- 1: Works for today only
- 2: Mentions future growth
- 3: Identifies scaling bottlenecks
- 4: Capacity planning + monitoring + alerting strategy
- 5: Self-healing architecture with auto-scaling, chaos testing approach
