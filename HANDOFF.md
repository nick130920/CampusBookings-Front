# CampusBookings Frontend Handoff

This document is the operational handoff for continuing frontend development from the current repository state. It separates **Verified** evidence from **Not verified** runtime behavior, **Open decision** items, and **Owner action** prerequisites.

## 1. Purpose And Current Delivery Status

CampusBookings Frontend is an Angular web client for authentication, scenarios, availability, reservations, recurring reservations, feedback, notifications, administration, and Google Calendar integration.

**Current status:** **Verified** frontend tests pass 4/4 and the production build passes with budget warnings. The production dependency audit reports 0 vulnerabilities with `npm audit --omit=dev`; the full audit still reports tooling/dev vulnerabilities. End-to-end backend contract, deployed availability, CORS, OAuth, and production operations are **Not verified**.

## 2. Repository And Source Of Truth

| Fact | Status | Evidence / action |
|---|---|---|
| Repository | **Verified** | `C:\Users\namc1\WebstormProjects\CampusBookings-Front` |
| Remote | **Verified** | `origin` points to `https://github.com/nick130920/CampusBookings-Front.git` |
| Branch reference | **Verified** | `origin/master` is the delivery reference; local `master` is at `9f95eb1` |
| Delivery commit | **Verified** | `9f95eb1` (`chore(frontend): ignore local tooling state`) |
| Runtime/toolchain used for verification | **Verified** | Angular 20.3.x; Node `25.8.2` (non-LTS); use a supported Node version decision for future delivery |
| `.codegraph/` | **Verified local-only** | Present as an untracked local index. Do not commit or document it as versioned. Each checkout may generate it locally if needed. |
| Git history | **Risk** | Historical secrets may exist in the overall delivery context; history was not purged. Rotate externally. |

The backend is a separate sibling checkout at `C:\Users\namc1\WebstormProjects\CampusBookings`. No cross-repository relative link is included because it cannot reliably resolve from this repository's hosted Markdown; open that path separately.

## 3. Quick Start For A New Developer

Prerequisites: Node.js/npm compatible with Angular CLI 20, a browser/Karma launcher for tests, and access to the backend API configured in the selected environment file. The verification environment used Node `25.8.2`, which is non-LTS and should not be silently treated as the support policy.

```powershell
npm ci
npm start
```

Expected result: **Verified by repository configuration:** Angular dev server starts on its normal local URL, typically `http://localhost:4200/`. Both checked-in environment files currently point to the Railway API, so this command does not automatically use a local backend.

Production verification:

```powershell
npm test
npm run build
```

Expected result: **Verified:** 4/4 tests pass and the production build passes with warnings about configured budgets. A browser and reachable compatible backend are required for meaningful manual flow checks; deployed availability is **Not verified**.

## 4. Verification Evidence

| Command / check | Result | Status / notes |
|---|---|---|
| `npm ci` | Used for dependency installation | **Verified** prerequisite in the delivery workflow |
| `npm test` | 4/4 pass | **Verified** |
| `npm run build` | Pass with budget warnings | **Verified**; review `angular.json` budgets before release |
| `npm audit --omit=dev` | 0 vulnerabilities | **Verified** production dependency audit |
| `npm audit` | Tooling/dev vulnerabilities remain | **Verified**; remediation is a separate dependency/toolchain decision |
| Manual backend integration | No complete evidence recorded | **Not verified** |
| Railway availability, CORS, OAuth, CI/CD, rollback | No complete evidence recorded | **Not verified** |

## 5. Architecture And Main Entrypoints

| Area | Location | Responsibility |
|---|---|---|
| Bootstrap | `src/main.ts` | Angular application entrypoint |
| Providers | `src/app/app.config.ts` | Router, HTTP client, interceptors, application providers |
| Routes | `src/app/app.routes.ts` | Client-side navigation and lazy/eager feature loading |
| Shell | `src/app/app.ts` | Application shell |
| Features | `src/app/components` | Auth, scenarios, reservations, feedback, alerts, admin, Calendar UI |
| Services | `src/app/services` | REST clients, session/auth state, permissions, notifications, WebSocket |
| Guards | `src/app/guards` | Authentication boundary and optional permission checks |
| Interceptors | `src/app/interceptors` | Bearer token and 401/renewal handling |
| Compile-time config | `src/environments/environment.ts`, `environment.prod.ts` | API URL and flags selected by Angular file replacement |

The active dashboard boundary uses `AuthGuard`. `routes-with-permissions.example.ts` is an example and is not proof of active route protection.

## 6. Configuration And Environment Variables

Frontend configuration is compile-time TypeScript, not runtime secret injection.

| File / setting | Purpose | Required / optional | Status |
|---|---|---|---|
| `src/environments/environment.ts` | Development build API URL and flags | Required for build | **Verified** |
| `src/environments/environment.prod.ts` | Production build replacement | Required for production build | **Verified** |
| `apiUrl` | Backend base URL including `/api` | Required | Both files currently target Railway; availability **Not verified** |
| `authEndpoint` | Auth suffix, currently `/auth` | Required by `AuthService` | **Verified** from source |
| `enableDebug` | Development/production debug flag | Optional behavior flag | **Verified**: development true, production false |
| `defaultLanguage`, `version` | UI metadata | Optional | **Verified**: `es`, `0.0.1` |

There are no frontend runtime secret variables. Never place JWTs, passwords, OAuth secrets, or API credentials in environment files or source control. If the API target changes, update the appropriate tracked file and rebuild; do not assume a runtime `.env` file is consumed.

## 7. Integration Contract

Paths below are relative to `environment.apiUrl`, which currently ends in `/api`.

| Concern | Current evidence | Status |
|---|---|---|
| Auth | `AuthService` uses `/auth`; bearer token and 401 interceptors are active | Exact token claims, renewal header, errors, and status codes **Not verified** |
| Reservations | `/reservas`, `/reservas-recurrentes`, `/disponibilidad` | DTO, status, authorization, and error compatibility **Not verified** |
| Scenarios/feedback | `/v1/escenarios`, `/v1/feedback` and related image/permission paths | Backend has both `/api` and `/api/v1` namespaces; full compatibility **Not verified** |
| Google Calendar | `/google-calendar` for authorization/connect/disconnect/status/sync | OAuth redirect, scopes, provider setup, and end-to-end flow **Not verified** |
| Administration | `/admin/users`, `/admin/roles`, `/admin/permissions`, `/user`, `/configuracion`, `/alertas` | Backend permission annotations are authoritative; frontend examples do not prove server authorization |
| WebSocket | Client constructs `/ws/notifications` from API host | Connection/auth/scaling behavior **Not verified** |
| CORS | Browser calls require backend allowlist to include the actual frontend origin | Target environment coverage **Not verified** |
| Environments | Development and production files both point to Railway | Railway availability and parity **Not verified** |

Use [`docs/frontend/api-client-map.md`](docs/frontend/api-client-map.md) for the service map and the backend checkout's generated Swagger for live payloads. Do not invent payloads, status codes, or production URLs beyond the values already present in tracked source.

## 8. Current Risks And Blockers

| Severity | Risk / evidence | Impact | Owner action |
|---|---|---|---|
| High | Backend availability, CORS, DTOs, auth contract, and Calendar OAuth are not verified end to end | UI can build and still fail against the delivered backend | **Owner action:** run a controlled authenticated reservation and Calendar smoke flow |
| High | Both environment files target Railway, not local backend | Local development may exercise a remote or unavailable service | **Open decision:** choose a local, staging, or hosted development target and update workflow/docs accordingly |
| High | Node `25.8.2` was used and is non-LTS | Toolchain reproducibility/support may differ for successors | **Owner action:** select and record supported Node version; verify `npm ci`, tests, and build there |
| Medium | Production build passes with budget warnings | Bundle growth may become a release blocker | **Owner action:** review `angular.json` budgets and record accepted thresholds or optimize intentionally |
| Medium | Full npm audit still reports dev/tooling vulnerabilities | Developer/CI exposure remains | **Open decision:** prioritize Angular/tooling upgrades without breaking Angular 20/PrimeNG 20 compatibility |
| Critical | Historical secrets may exist in repository context; history was not purged | Credentials may be compromised | **Owner action:** coordinate external rotation; never add or reuse values here |

## 9. Out Of Scope And Unsafe Actions

- Do not reuse old secrets or put credentials/tokens in Angular environment files.
- Do not claim Git history was purged; it was not purged by this handoff.
- Do not commit `.codegraph/`; it is local generated state.
- Do not assume `environment.ts` is runtime configuration; it is compile-time file replacement.
- Do not change API prefixes, payloads, or status handling based only on assumptions; verify against backend code and generated API documentation.
- Do not expose diagnostic endpoints from the backend through a frontend feature without a security decision.
- Do not run destructive deployment, database, history-rewrite, or dependency-fix commands without an explicit recovery plan.

## 10. First-Day Checklist

- [ ] Confirm checkout is clean except intentionally local `.codegraph/` and confirm `origin/master` / `9f95eb1`.
- [ ] Read [`README.md`](README.md), [`docs/frontend/architecture.md`](docs/frontend/architecture.md), [`docs/frontend/environment-configuration.md`](docs/frontend/environment-configuration.md), and [`docs/frontend/troubleshooting.md`](docs/frontend/troubleshooting.md).
- [ ] Read [`docs/integration/README.md`](docs/integration/README.md); open the backend checkout separately at `C:\Users\namc1\WebstormProjects\CampusBookings`.
- [ ] Run `npm ci`, `npm test`, and `npm run build`.
- [ ] Record the supported Node version decision; do not use the observed non-LTS version as an implicit policy.
- [ ] Confirm which backend environment is intended before changing `src/environments`.
- [ ] Verify CORS and API reachability with sanitized logs.
- [ ] Check production and full audit results before release; separate runtime dependency risk from tooling risk.

## 11. Recommended Next Work Units

1. **Supported toolchain baseline:** choose a supported Node/npm version and reproduce install, 4/4 tests, build, and audits.
2. **Contract smoke test:** verify auth, representative reservation, recurring reservation, error handling, CORS, and one Calendar path against the intended backend environment.
3. **Environment workflow decision:** define local/staging/production API targeting and update only the compile-time files and docs required by that decision.
4. **Budget remediation:** inspect warnings, identify the largest contributors, and either optimize or record an explicit accepted budget decision.
5. **Dev audit remediation:** plan compatible Angular/PrimeNG/tooling upgrades, keeping each upgrade with its tests and build evidence.

Each work unit should include focused verification, runtime evidence or an explicit N/A, and a rollback boundary. Keep behavior changes, tests, and user-facing documentation together; commit by deliverable unit, not by file type.

## 12. Troubleshooting And Escalation

| Symptom | First checks | Escalate when |
|---|---|---|
| UI loads but API calls fail | Check `apiUrl` includes `/api`, backend reachability, browser origin, and backend CORS | Target backend or origin is unknown |
| Local backend is not used | Confirm the selected environment file; both checked-in files point to Railway | A local/staging targeting policy is missing |
| Tests fail before specs | Confirm `npm ci`, browser launcher, Karma setup, and supported Node version | Toolchain mismatch persists after clean install |
| Build budget warning/failure | Inspect `angular.json` initial/component style budgets | Team must accept or change release thresholds |
| Auth loops or 401s | Inspect interceptor behavior, token expiry, renewal header, and backend auth contract | Claims/status/header contract differs |
| Calendar flow fails | Verify backend OAuth redirect, provider client, scopes, and browser route | Provider/deployment ownership is unclear |

Escalate provider, backend, deployment, and credential questions to the corresponding owner. Include commit, environment file, command, sanitized browser/network evidence, and a clear **Verified**/**Not verified** label.

## 13. Documentation Maintenance Rules

- Update evidence date, commit, command, and result whenever verification behavior changes.
- Source code, Angular configuration, package lockfile, tests, and live backend API documentation are normative over prose.
- Label claims **Verified**, **Not verified**, **Open decision**, or **Owner action** according to evidence and responsibility.
- Keep secret names/purposes only; never values.
- Update linked docs and [`docs/DELIVERY-CHECKLIST.md`](docs/DELIVERY-CHECKLIST.md) with user-visible or release-gate changes.
- DeepWiki is contextual only and may be stale; never use it to override current code.
