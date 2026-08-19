# Environment Configuration

Configuration is compile-time TypeScript, not runtime environment injection.

| Build | File | Observed API URL |
|---|---|---|
| Development | `src/environments/environment.ts` | `https://campusbookings-production.up.railway.app/api` |
| Production | `src/environments/environment.prod.ts` | Same Railway URL |

`angular.json` replaces `environment.ts` with `environment.prod.ts` for the production build. Services append paths to `apiUrl`, so the `/api` prefix is required by the current client code. `enableDebug` differs between files; language and version are compile-time values.

## Warning

Both checked-in environments currently point to Railway. This is verified configuration, not proof of a working Railway deployment and not a local-backend default. Pointing at a local backend requires changing the appropriate environment file and rebuilding. Never place credentials or tokens in these files.
