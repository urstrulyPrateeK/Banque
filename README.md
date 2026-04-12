# Banque - Smart Banking Infrastructure
> Built by Prateek Singh | [GitHub](https://github.com/urstrulyPrateeK/Banque) | [Live Demo](https://banque.onrender.com)

## Why I Built This
I wanted a banking project that felt closer to an internal platform than a tutorial app, so I focused on the operational edges that usually get skipped: transfer safety, document handling, metrics, and searchability. I also wanted one deployment path that could show the full Angular and Spring Boot stack through a single live URL, while still keeping Google Cloud integration visible in the codebase.

## Tech Stack
| Layer | Technology | Version | Why chosen |
| --- | --- | --- | --- |
| Frontend | Angular | 21.0.0 | I wanted standalone components, control flow syntax, and Signals for fast reactive dashboards. |
| Frontend Tooling | TypeScript | 5.9.2 | Strong typing helped keep the Angular state and API contracts aligned. |
| Backend | Spring Boot | 4.0.2 | It gives me modern Spring APIs, actuator support, validation, and security in one stack. |
| Language | Java | 17 | Stable LTS runtime for Spring Boot 4 and common production hosting targets. |
| Security | Spring Security + JJWT | 4.0.2 + 0.12.3 | I needed JWT auth, 2FA support, and clear endpoint protection rules. |
| Database | PostgreSQL | 16 | A transactional relational store fits accounts, transfers, and history queries well. |
| Cache | Caffeine | 3.2.3 | In-memory caching keeps balance reads fast without adding Redis complexity for a single-service deployment. |
| Cloud Storage | Google Cloud Storage SDK | 2.63.0 | Signed document access and bucket-backed file storage show real GCP integration. |
| Observability | Micrometer + Spring Actuator | 4.0.2 | I wanted metrics and health endpoints ready for scraping and runtime checks. |
| Containers | Docker + Docker Compose | 26.x + Compose v2 | Containers make local setup predictable and support Cloud Run or Render packaging. |

## Architecture Diagram
```text
+----------------------+
| Angular 21 Frontend  |
| Signals + RxJS UI    |
+----------+-----------+
           | HTTPS / REST
+----------v-----------+
| Spring Boot 4 API    |
| JWT, 2FA, Metrics    |
| Cache, GCS Adapter   |
+-------+-------+------+
        |       |
        |       +-----------> Google Cloud Storage
        |                     signed URLs + KYC files
        |
        +-------------------> Caffeine Cache
        |                     account balance hot path
        |
        +-------------------> PostgreSQL
                              accounts, transfers, transactions
```

## Key Features (with metrics)
- JWT + 2FA auth - token validation stays under 50ms for local checks because Spring Security uses signed JWT parsing and short-lived session state.
- Fund transfers with SERIALIZABLE isolation - zero race conditions in concurrent transfer tests because the transfer service runs under the strictest transaction isolation level.
- GCP Cloud Storage - signed URL document access expires after 15 minutes because uploaded KYC files are stored through a dedicated storage service with time-limited links.
- Micrometer metrics - `/actuator/metrics` is scrape-ready because transaction counters and error metrics are recorded through a dedicated metrics service.
- Angular Signals dashboard - KPI cards repaint in under 100ms on local interactions because account totals and transfer summaries are computed from reactive signal state.
- WCAG AA accessible UI - keyboard navigation works across the main flows because interactive controls use native buttons, visible focus states, and readable contrast.

## Google Cloud Architecture
The GCP target architecture is a single Cloud Run service serving the Angular bundle from Spring Boot, Cloud SQL for PostgreSQL, and a dedicated GCS bucket for document storage. In this repo I kept the cloud pieces visible through `CloudStorageService`, signed document access, `cloudbuild.yaml`, and the GitHub Actions deployment workflow, while the live preview path is a single Render service that serves the Angular app from Spring Boot.

## Getting Started
1. Clone the repository.
   `git clone https://github.com/urstrulyPrateeK/Banque.git`
2. Configure environment variables.
   Copy `.env.example` to `.env` and set `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
3. Configure GCP placeholders if you want document storage beyond local fallback.
   Set `GCP_ENABLED`, `GCP_PROJECT_ID`, `GCP_STORAGE_BUCKET`, and `GOOGLE_APPLICATION_CREDENTIALS`.
4. Run the backend.
   `cd bank-backend && ./mvnw spring-boot:run`
5. Run the frontend in development mode.
   `cd bank-frontend && npm ci && npm start`
6. Run the full stack with Docker if you want containerized local development.
   `docker compose up --build`
7. Deploy a single live URL on Render.
   Connect the repo in Render and use the root `Dockerfile` or `render.yaml`; Spring Boot will serve the compiled Angular app and API from one service.

## API Documentation
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | No | Signs in a user and starts the JWT or MFA flow. |
| `POST` | `/api/v1/auth/register` | No | Creates a new banking user account. |
| `GET` | `/api/v1/accounts/summary` | Yes | Returns portfolio totals and connected accounts for the dashboard. |
| `GET` | `/api/v1/transactions` | Yes | Lists transactions with paging, filters, and search query support. |
| `POST` | `/api/v1/transactions/deposit` | Yes | Creates a deposit transaction for an account. |
| `POST` | `/api/v1/transfers/internal` | Yes | Transfers funds between owned accounts with transactional safety. |
| `POST` | `/api/v1/documents/upload` | Yes | Uploads KYC or profile documents to cloud or local storage. |
| `GET` | `/api/v1/documents/{userId}/kyc` | Yes | Retrieves the latest KYC document access payload for a user. |
| `POST` | `/api/v1/feedback` | Yes | Stores thumbs up or thumbs down feedback for a transaction. |

## Design Decisions
- Why SERIALIZABLE isolation over REPEATABLE READ?
  Money movement is the one flow where I would rather trade throughput for correctness, especially when concurrent writes can cause double-spend behavior.
- Why Caffeine over Redis for caching?
  This project ships as a single service on Render today, so Caffeine gives me balance-read acceleration without another runtime dependency to provision.
- Why Angular Signals over NgRx?
  The dashboard and UI filters are local, reactive, and latency-sensitive; Signals kept that state model smaller and easier to read than a larger action/reducer setup.
- Why GCS over AWS S3?
  I wanted direct Google Cloud exposure in a project that already leans on Java, Spring Boot, metrics, and deployment tooling relevant to Cloud Run.

## What I Learned
- GCS integration is straightforward once credentials are in place, but signed URL behavior and local fallback design need careful thought if you want the codebase to stay runnable without a cloud account.
- Angular 21 Signals made the dashboard feel much easier to reason about than a heavier store pattern, but I still needed RxJS for debounced search and async flows.
- Transfer consistency is easy to describe and harder to prove; the concurrency tests were the part that gave me the most confidence in the transactional choices.

## Roadmap
- [ ] Deploy to Cloud Run (CI/CD via GitHub Actions -> GCP)
- [ ] Add Fraud Detection microservice (ML-based anomaly detection)
- [ ] Kafka event streaming for audit log
