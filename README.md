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


## V1.3.6 - 2026-08-27
- Preserves the V1.3.5 Epic OAuth configuration that successfully reached login, consent, and redirect.
- Adds a versioned copy of the existing PraxSys application script (`app.86a9de1a1e.v136.js`) without changing pathway logic.
- Adds retry and visible error handling if GitHub Pages fails to load the PraxSys application script after Epic authorization.
- Updates `index.html` to load `epic-integration.v136.js`.


## V1.3.7 - 2026-08-27
- Restores the exact V1.3.5 OAuth/SMART authorization configuration that successfully reached Epic login, Grant Access, and redirect back to PraxSys.
- Keeps the original PraxSys application script (`app.86a9de1a1e.v12.js`) as the application payload; no pathway logic is changed.
- Adds cache-busting, up to three load attempts, and a visible load-error message for the post-authorization PraxSys script load that previously received HTTP 503.
- Updates `index.html` to load `epic-integration.v137.js`.
- All existing files are retained in this complete deployment package.


## V1.3.8 - 2026-08-28
- Preserves the exact V1.3.5 Epic OAuth configuration that first passed Epic login, Grant Access, and redirect.
- Does not change Epic registration, client ID, redirect URI, FHIR base/audience, PKCE, or standalone scope.
- Makes the post-authentication Patient FHIR read non-blocking, matching the existing optional handling already used for Encounter and LDA reads.
- If Patient read is unavailable to the returned token, PraxSys continues loading instead of treating that data-read failure as an OAuth failure.
- Adds visible post-authentication stage messages to distinguish authorization, FHIR context processing, and PraxSys application loading.
- Retains the original app.86a9de1a1e.v12.js clinical application payload and the V1.3.7 three-attempt loader.
- All prior files remain in this complete deployment package.

Purpose: isolate whether the post-Grant-Access stall is caused by an unprotected Patient read under the successful minimal OAuth scope.
