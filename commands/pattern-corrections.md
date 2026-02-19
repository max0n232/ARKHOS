# /pattern-corrections

Show pending corrections requiring approval.

## Usage

```
/pattern-corrections
```

Displays corrections with severity=critical or auto_apply=false.

## Approval

```
/pattern-approve <analysis_id> <correction_index>
```

## Implementation

Runs: `node ~/.claude/patterns/corrections.js`
