# Paw Connection — Agent Instructions

This repository uses **project rules** in [`.cursor/rules/`](.cursor/rules/). The agent MUST read applicable rules before coding or reviewing.

## Quick reference

| Rule | Topic |
|------|--------|
| [00-project-context](.cursor/rules/00-project-context.mdc) | Monorepo layout, precedence |
| [01-engineering-constitution](.cursor/rules/01-engineering-constitution.mdc) | SDD, DDD, TDD, DoR/DoD |
| [02-ddd-guidelines](.cursor/rules/02-ddd-guidelines.mdc) | Domain modeling |
| [03-testing-guidelines](.cursor/rules/03-testing-guidelines.mdc) | Tests & coverage |
| [04-api-guidelines](.cursor/rules/04-api-guidelines.mdc) | NestJS API (`apps/api`) |
| [05-event-driven-guidelines](.cursor/rules/05-event-driven-guidelines.mdc) | Domain events |
| [06-clean-architecture-guidelines](.cursor/rules/06-clean-architecture-guidelines.mdc) | Layer boundaries |
| [07-database-guidelines](.cursor/rules/07-database-guidelines.mdc) | Prisma / migrations |
| [08-security-guidelines](.cursor/rules/08-security-guidelines.mdc) | Security |
| [09-git-flow](.cursor/rules/09-git-flow.mdc) | **Git, commits, PRs (canonical)** |
| [10-mobile-app-guidelines](.cursor/rules/10-mobile-app-guidelines.mdc) | Expo app (`apps/app`) |

## Commits

Use **Conventional Commits** only:

```
type(scope): imperative summary [Refs #ID]
```

The agent commits **only when explicitly requested**. See `09-git-flow.mdc` for the full protocol.

## ADRs

See [docs/adr/README.md](docs/adr/README.md).
