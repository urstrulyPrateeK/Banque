# Contributing to Banque

Thank you for considering contributing to Banque. This document outlines the process for contributing and the standards expected.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/Banque.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make changes** following the guidelines below
5. **Test** your changes locally
6. **Submit** a pull request

## Development Setup

### Backend (Spring Boot 4)

```bash
cd bankingapp/bank-backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8080` with H2 in-memory database by default.

### Frontend (Angular 21)

```bash
cd bankingapp/bank-frontend
npm install
npm run dev
```

Runs on `http://localhost:4200` with hot reload.

## Code Standards

### Java (Backend)
- Follow standard Java naming conventions
- Use `@Transactional` appropriately — document isolation level choices
- Add MDC context (`userId`) in service methods for structured logging
- Write meaningful Javadoc for public API methods
- Use Jakarta Bean Validation on request DTOs

### TypeScript (Frontend)
- Use Angular Signals for reactive state (not BehaviorSubject for new code)
- Standalone components only — no NgModules
- Use the Banque CSS design system variables (`--bq-navy`, `--bq-teal`, etc.)
- Lazy-load feature routes

### CSS
- Use CSS custom properties defined in `styles.css`
- Follow the Banque color palette: navy (`#0a1628`), teal (`#0d9488`), cloud (`#f8fafc`)
- Component styles should be scoped — avoid global CSS

## Commit Messages

Use conventional commit format:

```
feat: add spending analytics chart
fix: resolve race condition in transfer service
docs: update API reference table
refactor: extract cache config to dedicated class
```

## Pull Request Process

1. Update documentation if you change public APIs
2. Ensure the build passes: `mvn clean verify` and `ng build`
3. Keep PRs focused — one feature or fix per PR
4. Reference any related issues in the PR description

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)

---

Built by [Prateek Singh](https://github.com/urstrulyPrateeK)
