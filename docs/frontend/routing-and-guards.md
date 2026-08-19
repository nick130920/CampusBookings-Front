# Routing and Guards

## Active route shape

- Public: `/privacy-policy`, `/login`, `/register`, `/forgot-password`, and `/google-calendar/callback`.
- Authenticated dashboard: `/dashboard` guarded by `AuthGuard`.
- Scenario routes: list, create, availability, edit, and detail.
- Reservation routes: list, new, recurring create/list, plus `/reservations` compatibility redirect.
- Admin routes: dashboard, reports, configuration, roles, type permissions, and alerts.
- Google Calendar configuration: `/dashboard/google-calendar/config`.
- Empty and unknown paths redirect to `/dashboard`.

## Guard behavior

`AuthGuard` checks the stored token through `AuthService` and redirects unauthenticated users to `/login` with a return URL. Login, registration, and password recovery use inline checks that reject an existing token.

`PermissionGuard` supports route data for `permission`, `anyPermissions`, `allPermissions`, `role`, and `roles`, but those metadata entries are not present on the active admin routes in `app.routes.ts`. The example route file is not active configuration.

The auth interceptor adds bearer tokens, rejects locally expired tokens, records activity, and accepts `X-New-Token`. `AuthErrorInterceptor` handles server `401` responses and redirects after clearing session state.
