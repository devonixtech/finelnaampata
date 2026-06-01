# Ads vs Paid Promotion Boundary Decision

## Client Direction
Platform monetization model is:
- subscriptions
- paid events/offers
- no ad-based monetization

## Current Code Reality

Promotion modules and pricing logic still exist for placement/boost workflows.

Examples:
- `backend/src/modules/promotions/promotions.service.ts`
- `apps/web/lib/api.ts` (`promotions.*` APIs)

Backend guard now exists:
- `PROMOTIONS_DISABLED=true` disables pricing lookup, booking, session verify, activation, and pricing updates at service layer.

## Decision Modes

### Mode A (Recommended if client treats promotion as non-ad paid feature)
- Keep promotion logic.
- Rename UI copy away from "ads/advertising" wording.
- Ensure billing separation from subscriptions remains explicit.

### Mode B (Required if client defines paid promotion as ads)
- Remove/disable promotion booking + pricing routes.
- Remove promotion admin pages and client calls.
- Ensure events/offers paid publish logic remains via add-on path only.

## Status
Final business decision not yet recorded in repository.  
Until decision is explicit, full "no ads" closure remains ambiguous.
