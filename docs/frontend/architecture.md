# Frontend Architecture

The frontend is a standalone Angular application bootstrapped from `src/main.ts` with providers in `src/app/app.config.ts` and routes in `src/app/app.routes.ts`.

## Structure

| Area | Location | Responsibility |
|---|---|---|
| Application shell | `src/app/app.ts`, `app.config.ts` | Bootstrap, providers, router, HTTP setup |
| Feature UI | `src/app/components` | Auth, scenarios, reservations, feedback, alerts, administration, Calendar |
| API/application services | `src/app/services` | HTTP calls, session state, authorization, notifications, WebSocket |
| Navigation protection | `src/app/guards` | Authentication and optional permission evaluation |
| HTTP cross-cutting | `src/app/interceptors` | Bearer token, expiry, 401 handling |
| Build-time configuration | `src/environments` | API URL and flags selected at compile time |

The active routes use `AuthGuard` at the dashboard boundary. Some feature components are eagerly loaded and others use `loadComponent`. `routes-with-permissions.example.ts` is an example, not proof of active permission protection.
