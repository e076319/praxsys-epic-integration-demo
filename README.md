# praxsys-epic-integration-demo
PraxSys Epic Integration Demonstration


## V1.3.5 - 2026-08-27
Controlled Epic OAuth diagnostic build.

Changes from V1.3.4:
- Added `assets/epic-integration.v135.js` while preserving all prior files.
- Updated `index.html` to load V1.3.5.
- Standalone OAuth scope changed from `openid fhirUser` to the minimal Epic-documented `openid` scope.
- Client ID, redirect URI, FHIR base/audience, PKCE, EHR launch scope, and all PraxSys clinical/pathway logic remain unchanged.

Purpose: isolate whether the `fhirUser` scope is contributing to the Epic sandbox authorize error. The `aud` parameter is intentionally retained because current Epic troubleshooting documentation calls for a proper audience parameter.
