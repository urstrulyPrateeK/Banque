<p align="center">
  <img src="bank-frontend/public/banque-mark.svg" alt="Banque Logo" width="96" height="96" />
</p>

<h1 align="center">Banque</h1>

<p align="center">
  Modern digital banking platform built for reliability, speed, and production-grade user experience.
</p>

<p align="center">
  <a href="https://banque-p7oe.onrender.com/"><img alt="Deployment Live" src="https://img.shields.io/badge/Deployment-LIVE-22c55e?style=for-the-badge&logo=render&logoColor=white" /></a>
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-4.0.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img alt="Angular" src="https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img alt="Java" src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

## Deployment

- Status: ✅ Live
- URL: https://banque-p7oe.onrender.com/

> [!IMPORTANT]
> <sub><strong>Platform Note:</strong> "render its takes 5 mins to open due to render incapbility of slow laoding after inactivity"</sub>

## Product Preview

<table>
  <tr>
    <td><img src="images/Landing%20page.png" alt="Landing Page" width="100%" /></td>
    <td><img src="images/Main%20Home%20page.png" alt="Main Home Page" width="100%" /></td>
  </tr>
  <tr>
    <td><img src="images/Account%20creation%20page.png" alt="Account Creation Page" width="100%" /></td>
    <td><img src="images/Accounts%20page.png" alt="Accounts Page" width="100%" /></td>
  </tr>
</table>

## Why Banque

Banque is built to feel like a serious financial product, not a demo app. It combines a polished frontend experience with enterprise-ready backend architecture so users get both confidence and speed in daily banking operations.

Core outcomes:

- End-to-end full-stack banking workflows in one cohesive product.
- Transaction safety through robust isolation and backend safeguards.
- Security-first auth flow with JWT and 2FA support.
- Production-ready deployment artifacts and cloud portability.

## Cloud Strategy

This repository includes Google Cloud-native integrations and deployment artifacts (Cloud Build and GCS-backed document flows). Due to running-cost constraints, the live public deployment currently runs on Render.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Angular 21, TypeScript, RxJS |
| Backend | Spring Boot 4.0.2, Java 17, Spring Security, JPA |
| Auth | JWT (JJWT), 2FA integration |
| Database | PostgreSQL (production), H2 (dev/testing compatibility) |
| Cloud Services | Google Cloud Storage, Firebase |
| Observability | Spring Boot Actuator, Micrometer |
| Containerization | Docker, Docker Compose |
| Hosting | Render (live), GCP-ready codebase |

## Architecture

```text
Browser (Angular 21)
  -> REST API (Spring Boot 4)
    -> Auth + Security Layer (JWT + 2FA)
    -> Domain Services (Accounts, Transfers, Payments, Documents)
    -> Data Layer (JPA/Hibernate)
      -> PostgreSQL / H2
```

## Key Capabilities

- Secure account creation and login flows.
- Dashboard, accounts, transfers, and transactions modules.
- Document and profile workflows.
- API-driven architecture with clean frontend/backend boundaries.
- Cloud-aware implementation with GCP integrations and Render deployment path.

## Run Locally

### Backend

```bash
cd bank-backend
./mvnw spring-boot:run
```

### Frontend

```bash
cd bank-frontend
npm install
npm run dev
```

### Full Stack via Docker

```bash
docker compose up --build
```

## Repository Layout

- bank-backend: Spring Boot backend services and APIs.
- bank-frontend: Angular frontend app.
- db: SQL bootstrap scripts.
- docs: contribution, security, UX and project documentation.
- images: product screenshots used in this README.

## Documentation

- Project docs: docs/README.md
- Contributing guide: docs/CONTRIBUTING.md
- Security policy: docs/SECURITY.md
- License: docs/LICENSE

## Author

Built by Prateek Singh.
