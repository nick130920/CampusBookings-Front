# CampusBookings Integration

The frontend and backend are separate repositories. See [frontend architecture](../frontend/architecture.md), [frontend API client map](../frontend/api-client-map.md), and the backend repository's [integration guide](../../../CampusBookings/docs/integration/README.md) when both checkouts are available.

## Documentation evidence

- Frontend observed commit: `97067b1`.
- Backend observed commit: `a7b55f9`.
- DeepWiki backend: contextual reference indexed at commit `aa93eded` on 2025-09-15: [DeepWiki CampusBookings](https://deepwiki.com/nick130920/CampusBookings).
- Verification date: 2026-08-19.
- Working-tree changes present.
- DeepWiki is a contextual reference, not the normative source.

## End-to-end matrix

| Area | Current evidence |
|---|---|
| Environments | Both frontend environments target Railway; backend `dev` uses H2 on `8081`, while Compose uses PostgreSQL host port `5440`. |
| Auth | Angular calls `/api/auth`, sends bearer JWTs, handles local/server expiry and optional renewal header; backend filters and authorizes JWTs. Exact token schema is **Not verified**. |
| Reservations | Angular calls `/api/reservas`, `/api/reservas-recurrentes`, and `/api/disponibilidad`; DTO compatibility is **Not verified**. |
| Google Calendar | Angular and backend both expose `/api/google-calendar`; OAuth redirect/provider alignment is **Not verified** end to end. |

## Confirmed gaps

- `/api` and `/api/v1` namespaces coexist.
- Frontend permission examples are not active route protection; backend annotations are authoritative.
- Railway availability for the observed backend, health checks, and environment parity are **Not verified**.
