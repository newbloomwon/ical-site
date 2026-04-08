# Build Guide

Step-by-step instructions to build Cal.com locally and produce shareable artifacts.

## Prerequisites
- Node.js >= 18 (run `nvm use` in the repo root)
- Yarn 4.12+ (already enforced via `packageManager`)
- `.env` copied from `.env.example` with `NEXTAUTH_SECRET` and `CALENDSO_ENCRYPTION_KEY` set
- PostgreSQL reachable at `DATABASE_URL` in `.env`

## One-time setup
```sh
yarn install
# Optional: validate env completeness
yarn env-check:common
```

## Core build (web)
Build the primary web app and its dependencies.
```sh
yarn build
```
- Runs `turbo run build --filter=@calcom/web...`
- Outputs: `apps/web/.next` (Next.js build), `.turbo` (Turbo cache).

## Other useful targets
- App Store CLI only: `yarn app-store:build`
- API (edge) packages: `yarn turbo run build --filter=@calcom/api...`
- Clean then rebuild: `yarn clean && yarn build`

## Validate before sharing/pushing
```sh
yarn type-check:ci --force
yarn lint:fix
```
These mirror CI gates and surface build-time issues early.

## Environment tips
- Keep `.env` in sync with `.env.example`; rerun `yarn env-check:common` after edits.
- For schema changes, regenerate Prisma types: `yarn prisma generate`.
- Low-memory environments: `export NODE_OPTIONS="--max-old-space-size=16384"`.

## Troubleshooting
- Build fails with missing env: double-check `.env` keys and rerun `yarn env-check:common`.
- Type errors from generated Prisma clients: run `yarn prisma generate`.
- Suspicious cache behavior: delete `.turbo` or set `TURBO_FORCE=1` before `yarn build`.
- Native module rebuilds (e.g., after Node upgrade): reinstall deps with `yarn install --check-cache`.

## Artifacts
- `apps/web/.next`: production build for the web app
- `.turbo`: local Turbo cache (safe to delete)
- `packages/app-store-cli/dist`: App Store CLI bundle (when built)

## When to run the build
- Before drafting a PR that touches frontend/shared packages
- When validating changes to build tooling or env handling
- Prior to producing a production image or deployment bundle
