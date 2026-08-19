# Frontend Troubleshooting

- API calls fail: verify `apiUrl` includes `/api`, the backend is reachable, and backend CORS includes the exact frontend origin.
- Local backend is not used: both environment files currently point to Railway; change the selected compile-time file and rebuild.
- Production build fails: inspect the initial or component-style budget in `angular.json`.
- Tests fail before specs: run `npm ci` and verify a Karma browser launcher is available in the environment.
- Images fail: scenario image URLs remove `/api` from `apiUrl`; verify the backend serves the resulting path.
- WebSocket fails: verify the derived host, `/ws/notifications`, authentication/session expectations, and backend CORS/WebSocket configuration.
- Unauthorized redirects: inspect token expiry, the auth interceptors, and backend JWT/CORS configuration before changing guards.
