# Backlog — Pet birthday notifications

Status: Planned (not implemented)  
Date: 2026-08-03  
Related: pet `birthDate` on profile / onboarding

## Goal

When it is a pet’s birthday, notify:

1. **The owner** — visible on their profile (badge / banner / toast).
2. **Friends / connections** — push or in-app notification so they can congratulate.

## Acceptance criteria (future)

- [ ] Job or scheduled check runs daily (timezone-aware) for pets with `birthDate`
- [ ] Owner sees a birthday highlight on Profile on the anniversary day
- [ ] Connected users receive a notification (“It’s {petName}’s birthday!”)
- [ ] Opt-out / privacy settings considered
- [ ] No duplicate spam if user opens the app multiple times the same day

## Notes

- Source of truth: `Pet.birthDate` (API). Derived `age` remains for filters/display.
- Do not rely on free-text age strings in the mobile draft.
