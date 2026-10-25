# local-business-schema-generator — Project Memory for Claude

**Public, open-source (MIT)** tool. Anyone can read this repo, so treat every commit as published.

- Serpnetic's planning notes live in a private repo; ask the owner before changing scope.
- The live version at https://tools.serpnetic.cloud/local-business-schema-generator/ includes this repo
  as a git submodule inside a private site repo.

## What it does

Form → LocalBusiness JSON-LD (schema.org) with live errors/warnings, copy button, and links to Google's
Rich Results Test and the Schema.org validator. Browser-only: no API key, no server, nothing stored.

## Layout

- `src/schema.js` — pure logic: `buildSchema`, `buildHours`, `validate`, `toScriptTag`, `BUSINESS_TYPES`, `DAYS`. Tested in `test/`.
- `src/tool.js` — `mountSchemaTool(el)` builds the UI and updates the output on every input.
- `src/style.css` — neutral styles; host sites re-theme via `--lbs-*` variables. Rules are scoped as
  `.lbs .lbs-…` so host-site element styles (p, li, h3) can't override them.
- `index.html` — standalone demo (`npm run dev`).

## Rules (public repo)

- No Serpnetic branding inside the tool UI; a credit link in README is fine.
- No client names, real business data, secrets, hostnames or IPs. Examples use "Acme Plumbing" / example.com.
- User text is written with `textContent`/`value`, never `innerHTML`. `toScriptTag` must keep escaping `<`.
- Only valid schema.org LocalBusiness subtypes in `BUSINESS_TYPES`.
- `npm test` must pass; CI runs gitleaks + tests + build.
- Serpnetic SEO copy, FAQ and page layout live in the private site repo, not here.
