# Broccoli scheduling plan

## Goal
Create a clearer, more auditable scheduling prototype for home services dispatch.

## Decisions
- Keep the scheduling logic in one domain module under `src/features/scheduling/`.
- Keep technician, booking, and shift data strongly typed with Zod validation at the state boundary.
- Show clear availability explanations rather than opaque status badges.
- Keep the dispatcher and customer flows aligned around the same schedule logic.

## Current focus
- Clarify the language and hierarchy of the app so the UI reads like an operations tool, not a generic demo.
- Tighten the calendar and booking copy to explain capacity, job queue status, and why a slot is blocked.
- Preserve the same behavior while improving readability and maintenance.
