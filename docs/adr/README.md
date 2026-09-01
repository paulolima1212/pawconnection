# Architecture Decision Records (ADR)

Significant architectural decisions for Paw Connection are documented here.

## When to write an ADR
- New bounded context or module
- Change to event bus, auth, or storage strategy
- Navigation architecture changes affecting the whole app
- Breaking API contracts

## Format
Create `docs/adr/NNNN-short-title.md`:

```markdown
# NNNN. Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated

## Context
What problem or constraint led to this decision?

## Decision
What we chose.

## Consequences
Positive, negative, and follow-up work.
```

## Index
| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-moderation-bounded-context.md) | Moderation bounded context for reports and blocks | Accepted |

## Related backlog

- [Pet birthday notifications](../backlog/pet-birthday-notifications.md) — planned; depends on `Pet.birthDate`

