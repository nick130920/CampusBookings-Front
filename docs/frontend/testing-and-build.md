# Testing and Build

## Commands

```text
npm ci
npm test
npm run build
```

`npm test` uses Angular's Karma target. `npm run build` selects the production configuration, applies environment replacement, output hashing, and budgets.

## Budgets

The checked-in production budgets are:

| Budget | Warning | Error |
|---|---:|---:|
| Initial bundle | 1.6 MB | 2 MB |
| Any component style | 6 kB | 10 kB |

The package declares Angular 20 and TypeScript 5.8 tooling. An exact Node version is not declared; the current toolchain should be treated as a non-LTS/Node-version compatibility risk until the delivery runtime is pinned. `npm audit` status is **Not verified** and must not be described as clean without a captured run.

This documentation task intentionally does not run tests, builds, or audit.
