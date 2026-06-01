# Global Countries/Cities Dataset Parity Audit

## Scope
Doc requirement asks for globally complete countries/cities parity with proof.

## Current State (Repo Audit)

- Backend endpoints exist for country/city retrieval:
  - `GET /cities/supported-countries`
  - `GET /cities/countries`
- Source behavior is mixed (DB records + imports), not a single immutable global master snapshot in-repo.
- No pinned, versioned "global master countries+cities" artifact currently stored in repository for deterministic parity proof.

## Evidence

- Backend controllers/services:
  - `backend/src/modules/cities/cities.controller.ts`
  - `backend/src/modules/cities/cities.service.ts`

## Gap vs Requirement

1. No single authoritative global master file committed and versioned.
2. No automated parity report that proves country/city completeness against a target baseline.

## Closure Checklist

1. Introduce pinned master dataset source and commit hash/version metadata.
2. Add deterministic import job and parity report output.
3. Store generated report artifact under `docs/` for release evidence.
