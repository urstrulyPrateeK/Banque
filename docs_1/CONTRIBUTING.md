# Contributing to Banque

## Workflow
1. Create a feature branch from `main`.
2. Keep backend and frontend changes scoped to the same feature when they share an API contract.
3. Run `./mvnw test` in `bank-backend` and `npm run build` in `bank-frontend` before opening a pull request.

## Pull Requests
- Use clear titles that describe the user-facing outcome.
- Include screenshots for UI changes.
- Call out any new environment variables, routes, or deployment changes.

## Code Style
- Prefer small, reviewable commits.
- Keep Angular state close to the component unless shared application state is required.
- Keep Spring services transactional only where correctness depends on it.