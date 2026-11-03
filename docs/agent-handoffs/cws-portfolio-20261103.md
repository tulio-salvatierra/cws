# Portfolio refresh — 2026-11-03

Implemented locally on `codex/portfolio-refresh`, based on `654cf9c` (the current GitHub main at inspection). No commit, push, merge, or deployment.

- Removed TAMM and the Chicago community-resources entry. No separate Social project exists in the current portfolio data.
- Added Clean and Shiny, Upholstery of Chicago, and Dominó de Barrio; refreshed Kike Vivaldy (the spelling used by the actual artist site).
- Preserved Carolina’s Skin Center, Tulio’s Portfolio Website, Intermezzo Sound Studio, and Ecclection.
- Added Drum Chart AI as Upcoming, with explicit not-yet-launched copy and no outbound link on desktop or mobile. Changed the section label to Selected Projects to include work in development without implying success/launched status.
- Preserved the existing styling, media frames, animations, desktop list, and mobile carousel. Added four current homepage screenshots as local JPEG assets.

## Evidence

Clean and Shiny: https://www.cleanandshinychicago.com/ — canonical URL and service/quote information in `tulio-salvatierra/clean-and-shiny/index.html`; live homepage inspected and captured.

Kike Vivaldy: https://www.kikevivaldy.com/ — metadata URL and artist description in `tulio-salvatierra/kikevivaldi/app/layout.tsx`; live redesigned homepage captured after the entrance screen. Replaces the incorrect Intermezzo link.

Upholstery of Chicago: https://upholsteryofchicago.com/ — live homepage inspected and captured; explicitly offers bed building and quote requests, with full store coming soon. Portfolio copy does not imply checkout.

Dominó de Barrio: https://domino-de-barrio.tulio1749.chatgpt.site/ — published address verified in the browser and captured. No game or account was created.

Drum Chart AI: name/status supplied by owner. No confirmed launch URL or artwork; uses a styled text panel. A final logo or screenshot is optional before release, not required for this honest upcoming presentation.

## Verification

- npm ci using the repository lockfile (shared dependencies had stalled).
- npm run lint: passed.
- npm run build: passed with dummy local-only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Import casing and prerender steps passed. Existing bundle-size warning remains.
- npm run test:run: 857 tests across 85 files passed. No new test files for this reversible content change.
- Browser: 1440×900 desktop and 390×844 mobile; nine projects, Upcoming visible in both render paths, no Upcoming anchor, mobile last-slide navigation and no page overflow. Portfolio screenshots reviewed visually.
- No production credentials, business writes, or external publishing.

## Scope and release

Only portfolio code/assets and required project handoff/log/ledger changed. Existing TAMM references in service landing-page client lists are outside the requested portfolio list and remain untouched. Gallery data is photography, not a second project list.

The original `/Users/tuliosalvatierra/Documents/Codex/cws` checkout had a deleted `workspace.jpg` and untracked `contractor.jpg`; neither was changed. Implementation is in the separate `work/cws-portfolio` checkout. Release requires the user’s approval.
