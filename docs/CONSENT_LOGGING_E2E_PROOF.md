# Consent Logging E2E Proof (Legal Flows)

## Requirement
Capture and retain legal consent metadata: timestamp, IP, device ID, session ID, doc version (and keep for legal retention policy).

## Backend Data Model

Business entity stores:

- `legalConsentAccepted`
- `legalConsentAcceptedAt`
- `legalConsentIp`
- `legalConsentSessionId`
- `legalConsentDeviceId`
- `termsVersion`
- `privacyVersion`

Source: `backend/src/entities/business.entity.ts`

## DTO + Service Enforcement

- Create DTO accepts consent metadata fields:
  - `legalConsentAccepted`, `legalConsentAcceptedAt`, `legalConsentSessionId`, `legalConsentDeviceId`, `termsVersion`, `privacyVersion`
- Service enforces legal consent for non-admin listing creation.
- Service persists consent metadata into listing record.

Source:
- `backend/src/modules/businesses/dto/create-business.dto.ts`
- `backend/src/modules/businesses/businesses.service.ts`

## UI Capture Paths

- Register flow has agreement checkbox.
- Add Listing flow sends legal consent acceptance + timestamp/session/device fields.
- Subscription/upgrade/offer flows include agreement UI checks.

Source examples:
- `apps/web/app/register/page.tsx`
- `apps/web/app/(dashboard)/add-listing/page.tsx`
- `apps/web/app/(dashboard)/subscription/page.tsx`
- `apps/web/app/(dashboard)/offers/page.tsx`

## Remaining Gap for strict legal parity

1. Single unified "doc version" strategy across every legal flow not fully centralized.
2. Retention policy enforcement/audit job (e.g., 7-year proof process) not documented in code-level scheduler artifact.
3. Payment provider final step (external hosted page) requires platform-level legal event reconciliation proof.
