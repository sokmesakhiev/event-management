# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Rally" is an event registration platform (running/cycling/swimming/triathlon/etc.) with three parts:

- `backend/` — Rails 8.1 API-only app (Ruby 4.0.1, PostgreSQL, RSpec)
- `frontend/` — TanStack Start (React 19, file-based routing, Vite, Tailwind v4, shadcn/ui)
- `infrastructure/` — Terraform for AWS (ECS backend, S3+CloudFront frontend)

The backend and frontend are deployed independently; CI (`.github/workflows/ci.yml`) only runs a subproject's jobs when files under that subproject changed.

## Commands

### Backend (run from `backend/`)

```
bin/setup                          # install gems, prepare db
bin/rails server -p 3000           # run the API (default port 3000)
bin/rails db:create db:migrate db:seed

bundle exec rspec                  # run the whole test suite
bundle exec rspec spec/models/event_spec.rb        # single file
bundle exec rspec spec/models/event_spec.rb:42      # single example at a line

bin/rubocop                        # lint (Omakase Rails style)
bin/rubocop -A                     # autocorrect
bin/brakeman                       # static security scan
bin/bundler-audit                  # dependency vulnerability scan
```

RSpec is the real test suite (factories in `spec/factories`, request specs in `spec/requests`, model specs in `spec/models`). `backend/test/` is unused default Rails/Minitest scaffolding — don't add tests there.

### Frontend (run from `frontend/`)

```
bun install   (or npm install)
bun run dev          # vite dev server, default port 5173
bun run build         # production build (outputs to dist/, deployed to S3)
bun run lint          # eslint
bun run format        # prettier --write .
```

There is no configured test runner for the frontend (no `test` script, no Jest/Vitest config) despite a `jest` job existing in `ci.yml` — that CI job currently has nothing to run.

## Architecture

### Backend: Rails API, JWT auth, no sessions

- All routes are namespaced under `/api/v1` (`config/routes.rb`), controllers live in `app/controllers/api/v1/`.
- Auth is stateless JWT (`lib/json_web_token.rb`), not Rails sessions/Devise. `ApplicationController#authenticate_user!` reads `Authorization: Bearer <token>`, decodes it, and sets `@current_user`. Add `before_action :authenticate_user!` per-action (see `EventsController`) rather than app-wide, since browsing events is public.
- Authorization is manual per-controller (e.g. `EventsController#authorize_creator!` checks `@event.creator_id == current_user.id`) — there is no Pundit/CanCanCan.
- Controllers hand-build JSON response hashes (`event_json`, `user_payload`, etc.) rather than using serializers/jbuilder — follow that pattern when adding endpoints.
- File uploads (banner/logo/avatar images) go through `Api::V1::UploadsController`, which validates content-type/size and stores via Active Storage (`has_one_attached` on `Event`/`Profile`), not a custom S3 client. Storage backend is Disk locally/test, S3 (`amazon`) in production via ECS IAM role (`config/storage.yml`).

### Backend: domain model

Core relationships (see `app/models/`):

- `User` has one `Profile`, many `Event`s (as creator), many `Registration`s, many `Survey`s (as creator).
- `Event` belongs to a creator (`User`) and optionally one `Survey`; has many `EventType`s (e.g. "5K", "10K" sub-races with their own capacity/price) and many `Registration`s.
- `Registration` joins a `User` to an `Event`, and through `RegistrationEventType` to the specific `EventType`(s) chosen. Capacity enforcement happens in model validations (`Registration#event_not_full`, `RegistrationEventType#event_type_not_full`), not at the DB or controller layer.
- `Survey`/`SurveyQuestion`/`RegistrationAnswer`: an organizer attaches an optional survey to an event; `SurveyQuestion.options` and `RegistrationAnswer.answer_options` are `jsonb` arrays of `{id, label}`; validity of selected option IDs is checked in `RegistrationAnswer#valid_options_selected`.
- Money is always stored as `*_cents` integers; an `EventType#effective_price_cents` falls back to the parent event's price when the type has no price of its own.

When changing pricing/capacity logic, check both the `Event`-level and `EventType`-level paths — most events support both a single flat price/capacity and per-type overrides.

### Frontend: TanStack Start file-based routing

- Routing follows `src/routes/README.md` conventions: every file in `src/routes/` is a route, `$id` for dynamic segments, `_layout.tsx` for layout routes, `__root.tsx` is the app shell. `routeTree.gen.ts` is generated — never hand-edit it.
- `src/routes/_authenticated/` is a layout route gating dashboard pages behind auth (`route.tsx` checks auth state before rendering children).
- All backend communication goes through `src/lib/api-client.ts`, a hand-written fetch wrapper (not React Query directly, though `@tanstack/react-query`'s `QueryClient` is wired into the router context). It reads `VITE_API_URL` (defaults to `http://localhost:3001` — note this differs from the Rails default port 3000, so set `VITE_API_URL=http://localhost:3000` or run Rails on 3001 locally) and stores the JWT in `localStorage` under `rally_token`. `src/lib/use-auth.tsx` wraps this in an `AuthProvider`/`useAuth()` context.
- `src/integrations/supabase/` and `src/integrations/lovable/` are leftovers from this project's Lovable/Supabase scaffold origin (auto-generated, "do not modify" headers) and are largely vestigial — real app data and auth flow through the Rails API via `api-client.ts`/`use-auth.tsx`, not Supabase queries. Don't extend the Supabase path for new features.
- UI components in `src/components/ui/` are shadcn/ui primitives — prefer composing these over adding new UI libraries.

### Infrastructure

Terraform (`infrastructure/`) provisions: ECS (backend container), ECR, RDS-style database, S3+CloudFront (frontend static hosting), IAM, networking, secrets. Deploys are handled by `.github/workflows/deploy.yml` (frontend → S3 sync + CloudFront invalidation) and Kamal (`backend/config/deploy.yml`, `bin/kamal`) for the backend container, gated by the same path-based change detection as CI.
