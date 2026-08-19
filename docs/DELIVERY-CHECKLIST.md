# Frontend Delivery Checklist

- [ ] Confirm the target API URL in the selected `src/environments/` file.
- [ ] Confirm the backend CORS allowlist includes the deployed frontend origin.
- [ ] Run `npm ci` from the lockfile.
- [ ] Run `npm test` and record the result.
- [ ] Run `npm run build` and check production bundle/style budgets.
- [ ] Verify authentication, a representative reservation flow, and API error handling.
- [ ] Confirm no credentials or local tooling state are included in the change.
- [ ] Confirm backend mandatory secret variables are configured in the deployment secret store.
- [ ] Confirm external credential revocation and replacement is complete before release; this repository does not perform provider rotation.
- [ ] Record that repository history remains potentially compromised and was not rewritten.
