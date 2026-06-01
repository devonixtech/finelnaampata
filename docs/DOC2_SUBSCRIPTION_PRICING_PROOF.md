# DOC2 Subscription & Pricing Proof

## Scope
This file documents Doc2 parity for paid/free enforcement and admin-driven pricing controls.
Last updated: 2026-05-25

## Feature Mapping

| Doc2 requirement | Config key / source | Backend enforcement | UI touchpoint |
|---|---|---|---|
| Monthly + Yearly paid plans | `subscription_plans.billing_cycle` | `SubscriptionsSeederService` keeps `Business Monthly` and `Business Yearly` active with preserved admin price/name | Pricing + subscription pages read plan payload |
| Keywords cap (10) | `dashboardFeatures.maxKeywords` | `BusinessesService.create/update` rejects over-cap | Add Listing form limit and error display |
| FAQs cap (10) | `dashboardFeatures.maxFaqs` | `BusinessesService.create/update` rejects over-cap | Add Listing FAQ controls |
| Subcategories cap (3) | `dashboardFeatures.maxSubCategories` | `BusinessesService.create/update` rejects over-cap | Add Listing subcategory UI |
| Named phones cap (5) | `dashboardFeatures.maxNamedPhoneNumbers` | `BusinessesService.create/update` rejects over-cap + E.164 normalization | Add Listing + AddBusinessModal named phones managers |
| Albums paid-only | `dashboardFeatures.canCreateAlbums` | `BusinessesService` album CRUD endpoints block free plans | Vendor listing management consumes albums endpoints |
| Customer notes paid-only | `dashboardFeatures.showCustomerNotes` | `ChatService.createNote` blocks non-paid vendors (admin bypass) | Dashboard chat private notes panel |
| Offers/Events publish add-on gate | ActivePlan entitlement by `targetId` + non-subscription pricing type | `OffersService.publish` requires active add-on entitlement | Publish flow should call `POST /offers/:id/publish` |

## Pricing Source of Truth

1. `subscription_plans` table (admin editable).
2. `pricing_plans` table (admin editable for add-ons/boosts).
3. No deployment is required to change pricing values if admin updates plan rows via admin APIs/UI.

## No-hardcode Audit Notes

- Doc2-critical caps are enforced from plan features, not hardcoded in frontend only.
- Plan listing responses are normalized in backend (`billingCycle`, `dashboardFeatures`) to avoid client fallback ambiguity.
- Any temporary UI fallback values must be removed/ignored in favor of API payload.

## Verification Checklist

1. Seed/reseed and verify:
   - `Business Monthly` exists with `billingCycle=monthly`
   - `Business Yearly` exists with `billingCycle=yearly`
2. Create listing with >10 keywords => backend reject.
3. Create listing with >10 FAQs => backend reject.
4. Create listing with >3 subcategories => backend reject.
5. Create listing with >5 named numbers => backend reject.
6. Free-plan album create => blocked.
7. Paid-plan album create/update/delete => allowed.
8. Free-plan note create => blocked.
9. Paid-plan note create => allowed.
10. Create event/offer draft, publish before add-on => blocked.
11. After add-on entitlement for same `targetId`, publish => allowed.

## Useful Commands

```bash
npm run build --workspace=backend
npm run build --workspace=@apps/web
```
