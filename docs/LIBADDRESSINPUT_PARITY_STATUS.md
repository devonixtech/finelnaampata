# libaddressinput Full Parity Status

## Requirement
Full country-specific address config parity using Google `libaddressinput`.

## Implemented

- `AddressConfigService` fetches country data from official libaddressinput source at runtime.
- Postal code validation uses country regex when available.
- Fallback config exists for resilience.

## Evidence

- `backend/src/modules/address/address-config.service.ts`

## Remaining Gap for "full mirror proof"

1. No committed full mirror snapshot artifact of all countries in this repo.
2. No generated parity report that compares served config vs official dataset for all countries.
3. Runtime fetch dependency means proof is environment/time dependent unless snapshot is pinned.

## Closure Checklist

1. Add snapshot builder script for full country dataset mirror.
2. Commit snapshot version metadata.
3. Add parity validator report (all countries, all fields/order/required/postal regex).
