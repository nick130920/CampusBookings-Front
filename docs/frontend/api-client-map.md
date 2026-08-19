# API Client Map

Paths below are derived from Angular service source and are shown relative to `environment.apiUrl`, which currently ends in `/api`. Payload and response compatibility is **Not verified** here.

| Service | Base path | Consumed operations |
|---|---|---|
| `AuthService` | `/auth` | register, authenticate, forgot-password send/verify/reset |
| `ScenarioService` | `/v1/escenarios`, `/v1/escenarios/images` | scenario CRUD, types/locations, image upload/delete/config |
| `ReservationService` | `/reservas` | create, availability, day/month occupancy, user/scenario/status lists, approve/reject/cancel, admin list, report |
| `RecurringReservationService` | `/reservas-recurrentes` | preview/create, user/admin lists, read/update, activate/deactivate/delete, generate |
| `FeedbackService` | `/v1/feedback` | create/update/read, own/scenario queries, statistics, deactivate/delete |
| `GoogleCalendarService` | `/google-calendar` | authorization URL, connect, disconnect, status, sync-all |
| `AlertManagementService` | `/alertas` | list, reservation/user/pending queries, configure, send/cancel/resend, process, statistics, cleanup |
| `AuthorizationService` | `/user` | current permissions |
| `RoleManagementService` | `/admin/roles`, `/admin/permissions` | role and permission management |
| `UserManagementService` | `/admin/users` | users, search, role, by-role |
| `ScenarioTypePermissionService` | `/v1/scenario-type-permissions` plus admin/scenario paths | assign/revoke and user permissions |
| `SystemConfigService` | `/configuracion` | reservation configuration read/update |
| `ScenarioService` availability | `/disponibilidad` | availability requests |

The frontend also constructs a WebSocket URL from the API host at `/ws/notifications`. Exact backend DTOs, statuses, and auth requirements remain **Not verified**.
