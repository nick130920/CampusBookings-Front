# CampusBookings Frontend

CampusBookings Frontend is the Angular web client for the USCO campus-space booking platform. It provides authentication, scenario discovery and management, reservations, recurring reservations, feedback, notifications, administration, and Google Calendar integration through the CampusBookings backend API.

## Quick Start

Requirements: Node.js and npm compatible with Angular CLI 20, plus a browser supported by Karma for the test runner. The repository does not declare an exact Node.js version; use the version required by the installed Angular 20 toolchain in your delivery environment.

```bash
npm ci
npm start
```

Open `http://localhost:4200/`. The checked-in environment files currently point both development and production builds to the Railway API, so local development does not automatically use a local backend.

## Stack

- Angular 20 with TypeScript 5.8.
- RxJS 7.8 and Angular Router, Forms, and HTTP client.
- PrimeNG 20 with PrimeIcons and the Aura theme package.
- Tailwind CSS 4 with `tailwindcss-primeui`.
- JWT authentication using `@auth0/angular-jwt` and `jwt-decode`.
- Jasmine and Karma for unit tests.

## Commands

These commands are the scripts defined in `package.json`:

| Command | Purpose |
|---|---|
| `npm start` | Start the Angular development server. |
| `npm run build` | Build the production configuration. |
| `npm run watch` | Build continuously with the development configuration. |
| `npm test` | Run the Angular Karma test target. |
| `npm run ng -- <command>` | Invoke the local Angular CLI through the package script. |

The production build uses Angular's `production` file replacement and replaces `src/environments/environment.ts` with `src/environments/environment.prod.ts`. The production build also enables output hashing and enforces the budgets declared in `angular.json`.

## Environment and API Configuration

Configuration is compile-time TypeScript, not runtime environment injection:

- `src/environments/environment.ts` is used by the development build.
- `src/environments/environment.prod.ts` is used by the production build.
- `apiUrl` is currently `https://campusbookings-production.up.railway.app/api` in both files.
- `authEndpoint` is `/auth`, producing authentication requests under `/api/auth`.
- Development has `enableDebug: true`; production has `enableDebug: false`.
- The default language is `es` and the application version is `0.0.1` in both files.

To point the client at another backend, change the appropriate tracked environment file before building. The API URL must include the backend `/api` prefix because services append paths such as `/auth`, `/reservas`, `/v1/feedback`, and `/google-calendar`.

The frontend and backend are separate repositories. The frontend consumes the backend REST API and sends authentication through the configured HTTP interceptors. The backend repository documents its profiles, database settings, and API documentation endpoints.

## Testing

Run `npm test`. Tests are configured by `angular.json` with `tsconfig.spec.json`, `zone.js/testing`, `src/styles.css`, and assets from `public/`. The repository includes application and service/component specifications, including `src/app/app.spec.ts` and `src/app/components/admin/system-config/system-config.spec.ts`.

If Karma cannot launch a browser in a headless or CI environment, provide the browser/CI setup required by that environment; no custom headless script is declared in `package.json`.

## Main Structure

```text
public/                  Static assets, including the USCO logo.
src/main.ts              Angular bootstrap entry point.
src/app/app.config.ts    Application providers and HTTP interceptors.
src/app/app.routes.ts    Client-side routes.
src/app/components/      Feature components for users and administrators.
src/app/services/        API and application services.
src/app/guards/          Authentication and permission guards.
src/app/interceptors/    Authentication and HTTP error handling.
src/app/theme/           PrimeNG/USCO theme configuration.
src/environments/        Build-time API and runtime flags.
angular.json             Build, serve, test, and file-replacement targets.
package.json             Dependencies and supported npm scripts.
```

## Troubleshooting

- **The UI loads but API calls fail:** confirm `apiUrl` includes `/api`, the backend is reachable, and the backend CORS configuration allows the frontend origin.
- **A local backend is not used:** both checked-in environment files currently reference the Railway backend. Update the relevant environment file for local work and rebuild.
- **The production build fails on budgets:** inspect the reported initial bundle or component-style budget in `angular.json`; do not assume the development build validates the same limits.
- **Tests fail before running specs:** check that a browser launcher is available to Karma and that dependencies were installed with `npm ci`.
- **Images do not load:** scenario image paths are resolved relative to the API host by removing the `/api` suffix from `environment.apiUrl`; verify the backend serves the referenced path.

## Delivery Notes

Use `docs/DELIVERY-CHECKLIST.md` for the short release checklist. Keep API URLs and feature flags aligned with the backend deployment being delivered, and never place credentials in environment files or source control.

## Credential Incident And Rotation

The backend delivery treats previously exposed credentials as compromised. Provider and deployment rotation is an external release prerequisite and is not performed by this frontend repository. Do not add tokens, passwords, OAuth secrets, or other credentials to Angular environment files; repository history remains potentially compromised until administrators complete their incident-response policy.
