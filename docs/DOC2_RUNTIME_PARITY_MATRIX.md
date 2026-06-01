# DOC2 Runtime Parity Matrix

Updated: 2026-05-25

## Local Verification (Code + Build)

| # | Doc2 Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Monthly + Yearly paid plans exist with feature caps | PASS | `backend/src/modules/subscriptions/subscriptions-seeder.service.ts` |
| 2 | Keywords cap `<=10` enforced | PASS | `backend/src/modules/businesses/businesses.service.ts` create/update checks |
| 3 | FAQs cap `<=10` enforced | PASS | `backend/src/modules/businesses/businesses.service.ts` create/update checks |
| 4 | Subcategories cap `<=3` enforced | PASS | `backend/src/modules/businesses/businesses.service.ts` create/update checks |
| 5 | Named phones cap `<=5` enforced backend | PASS | `backend/src/modules/businesses/businesses.service.ts` |
| 6 | Named phones manager in Add Listing page | PASS | `apps/web/app/(dashboard)/add-listing/page.tsx` |
| 7 | Named phones manager in AddBusinessModal | PASS | `apps/web/components/vendor/AddBusinessModal.tsx` |
| 8 | Albums paid-only gate + CRUD | PASS | `backend/src/modules/businesses/businesses.controller.ts` + `businesses.service.ts` |
| 9 | Customer notes paid-only gate | PASS | `backend/src/modules/chat/chat.service.ts` |
| 10 | Offers/Events publish blocked without add-on entitlement | PASS | `backend/src/modules/offers/offers.service.ts` (`publish`) |
| 11 | Web build clean | PASS | `npm.cmd run build --workspace=@apps/web` |
| 12 | Backend build clean | PASS | `npm.cmd run build` (in `backend/`) |

## Live-Environment Dependent (Need Staging/Prod Test Data)

| # | Scenario | Status | What to run |
|---|---|---|---|
| A | Free vendor tries album create and gets upgrade block | PENDING LIVE CHECK | Call `POST /businesses/:id/albums` with free-plan vendor token |
| B | Paid vendor album full CRUD works | PENDING LIVE CHECK | Create/rename/images/delete over real listing |
| C | Free vendor note create blocked, paid vendor note create allowed | PENDING LIVE CHECK | Use chat conversation notes endpoints |
| D | Offer/Event publish before add-on fails, after add-on succeeds | PENDING LIVE CHECK | `POST /offers/:id/publish` before/after entitlement |
| E | Admin pricing updates reflect without deploy | PENDING LIVE CHECK | Update plan/price via admin UI/API and re-open pricing pages |

## Notes

- This matrix is Doc2-focused only.
- Any policy/business wording changes (e.g., promotions/ads boundary) are tracked separately.
