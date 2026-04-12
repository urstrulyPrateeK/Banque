<p align="center">
  <img src="bankingapp/bank-frontend/public/banque-mark.svg" alt="Banque" width="64" height="64">
</p>

<h1 align="center">Banque</h1>
<p align="center">
  <strong>Smart Banking Infrastructure</strong><br>
  <sub>Full-stack banking platform built with Spring Boot 4 · Angular 21 · Google Cloud</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.0.2-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Google%20Cloud-Storage-4285F4?style=flat-square&logo=googlecloud&logoColor=white" alt="GCP">
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License">
</p>

---

## Why I Built This

Most banking applications treat the frontend as an afterthought — forms bolted onto REST endpoints with minimal attention to user experience or operational clarity. I wanted to build something different: a banking platform where every interaction feels as fast, clear, and trustworthy as products from companies I admire.

Banque is my answer to that challenge — a single deployable application that combines a signals-driven Angular 21 frontend with a Spring Boot 4 backend, connected to PostgreSQL, Google Cloud Storage, and Firebase. It handles real-world banking workflows: account management, fund transfers with race condition protection, KYC document uploads, and two-factor authentication — all wrapped in a design system I built from scratch.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│              Angular 21 · Signals · RxJS                 │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│                   Spring Boot 4.0.2                       │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────────┐   │
│  │ Auth     │  │ Accounts  │  │ Transfers           │   │
│  │ JWT+2FA  │  │ CRUD+Cache│  │ SERIALIZABLE iso.   │   │
│  └──────────┘  └───────────┘  └─────────────────────┘   │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────────┐   │
│  │ Documents│  │ Payments  │  │ Metrics             │   │
│  │ GCS/Local│  │ Cards     │  │ Micrometer+Actuator │   │
│  └──────────┘  └───────────┘  └─────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Global Exception Handler · MDC Logging · Cache    │   │
│  └──────────────────────────────────────────────────┘   │
└────────┬──────────────┬──────────────┬──────────────────┘
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────────┐
    │PostgreSQL│   │ Google    │  │  Firebase   │
    │  + H2   │   │ Cloud     │  │  Auth +     │
    │ (dev)   │   │ Storage   │  │  Firestore  │
    └─────────┘   └───────────┘  └─────────────┘
```

The Angular frontend compiles into the Spring Boot JAR, producing a **single deployable artifact**. One URL serves both the API (`/api/v1/*`) and the SPA (`/*`).

---

## Tech Stack

| Layer                   | Technology            | Version | Purpose                                                             |
| ----------------------- | --------------------- | ------- | ------------------------------------------------------------------- |
| **Frontend**      | Angular               | 21      | Standalone components, Signals-based reactivity, lazy-loaded routes |
| **UI State**      | Angular Signals       | —      | Fine-grained reactivity without NgRx overhead                       |
| **Async**         | RxJS                  | 7.8     | debounceTime on search, HTTP interceptors, retry logic              |
| **Backend**       | Spring Boot           | 4.0.2   | REST API, security filters, actuator monitoring                     |
| **Language**      | Java                  | 17      | Records, sealed classes, pattern matching                           |
| **Auth**          | Spring Security + JWT | —      | Stateless auth with refresh tokens, role-based access               |
| **2FA**           | Fast2SMS              | —      | SMS-based OTP verification for account security                     |
| **Database**      | PostgreSQL            | 16      | Production data store with SERIALIZABLE isolation                   |
| **Dev DB**        | H2                    | —      | In-memory PostgreSQL-compatible mode for local dev                  |
| **Cache**         | Caffeine              | —      | Account balance caching, 500-entry / 30s TTL                        |
| **Metrics**       | Micrometer            | —      | Transaction count, avg amount, error rate via `/actuator`         |
| **Storage**       | Google Cloud Storage  | —      | KYC document uploads with signed URL access                         |
| **Auth Provider** | Firebase              | —      | Email/password auth + Firestore for real-time data                  |
| **Deployment**    | Docker + Render       | —      | Multi-stage build, non-root container, auto-deploy                  |

---

## Features

### 🔐 Authentication & Security

- **JWT + Refresh Tokens** — Stateless authentication with automatic token renewal
- **Two-Factor Authentication** — SMS-based OTP via Fast2SMS with 6-digit verification
- **SERIALIZABLE Transaction Isolation** — Fund transfers are protected against race conditions at the database level, not just application level
- **Non-root Docker** — Production container runs as unprivileged `banque` user

### 📊 Dashboard & Analytics

- **Real-time KPI Cards** — Total balance, monthly spend, active accounts, transfer velocity
- **Angular Signals** — Dashboard state updates propagate through computed signals with <100ms render time
- **Skeleton Loaders** — CSS shimmer animations during data fetches instead of spinners
- **Portfolio Pulse** — Spending pattern analysis card with visual summaries

### 💳 Account Management

- **Multi-account Support** — Checking, Savings, Business, Investment accounts
- **Cached Balance Queries** — `@Cacheable` with Caffeine reduces database reads under load
- **Account Details** — Transaction history, balance trends, and account metadata

### 💸 Transfers & Payments

- **Safe Money Movement** — `@Transactional(isolation = SERIALIZABLE)` prevents double-spending
- **Transfer History** — Filterable, searchable transaction log with `debounceTime` on search input
- **Payment Processing** — Card payments, bill pay, and recurring payment support

### 📄 Document Management (GCP)

- **Drag-and-Drop Upload** — KYC documents and profile photos via `DocumentUploadComponent`
- **Google Cloud Storage** — Production-ready GCS integration with automatic local fallback
- **Signed URL Access** — Time-limited document URLs (configurable, default 15 minutes)
- **Document Signing** — Cryptographic document integrity verification

### 👤 User Experience

- **Profile Management** — Avatar upload, personal info editing, address management
- **Feedback System** — Thumbs up/down after transactions, stored and queryable
- **Notification Center** — Bell icon dropdown with activity notifications
- **Responsive Layout** — Sidebar navigation collapses on mobile

### 📈 Observability

- **Micrometer Metrics** — `banque.transactions.count`, `banque.transactions.avg_amount`, `banque.transactions.error_rate`
- **Actuator Endpoints** — `/actuator/health`, `/actuator/info`, `/actuator/metrics`
- **MDC Structured Logging** — Every log line includes `userId` for request tracing
- **Health Probes** — Kubernetes/Render-compatible liveness and readiness checks

---

## Getting Started

### Prerequisites

- **Java 17+** (Temurin recommended)
- **Node.js 20+** and npm
- **Maven 3.9+** (wrapper included)
- **PostgreSQL 16** (or use H2 for local dev)

### Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/urstrulyPrateeK/Banque.git
cd Banque/bankingapp

# Start the backend (H2 in-memory database)
cd bank-backend
./mvnw spring-boot:run

# In a new terminal — start the frontend
cd bank-frontend
npm install
npm run dev
```

The backend runs at `http://localhost:8080` and the frontend at `http://localhost:4200`.

### Docker (Production-like)

```bash
cd bankingapp
docker compose up --build
```

This starts PostgreSQL, builds the full-stack app, and serves everything on `http://localhost:8080`.

### Environment Variables

| Variable               | Default                   | Description                          |
| ---------------------- | ------------------------- | ------------------------------------ |
| `DB_URL`             | `jdbc:h2:mem:banquedb`  | JDBC database URL                    |
| `DB_USERNAME`        | `sa`                    | Database username                    |
| `DB_PASSWORD`        | *(empty)*               | Database password                    |
| `JWT_SECRET`         | *(dev default)*         | 256-bit hex secret for token signing |
| `APP_FRONTEND_URL`   | `http://localhost:4200` | CORS allowed origin                  |
| `GCP_ENABLED`        | `false`                 | Enable Google Cloud Storage          |
| `GCP_STORAGE_BUCKET` | `banque-documents`      | GCS bucket name                      |

---

## API Reference

### Authentication

| Method   | Endpoint                  | Auth | Description                  |
| -------- | ------------------------- | ---- | ---------------------------- |
| `POST` | `/api/v1/auth/register` | —   | Create a new account         |
| `POST` | `/api/v1/auth/login`    | —   | Authenticate and receive JWT |
| `POST` | `/api/v1/auth/refresh`  | JWT  | Refresh access token         |

### Accounts

| Method   | Endpoint                  | Auth | Description          |
| -------- | ------------------------- | ---- | -------------------- |
| `GET`  | `/api/v1/accounts`      | JWT  | List user's accounts |
| `POST` | `/api/v1/accounts`      | JWT  | Create a new account |
| `GET`  | `/api/v1/accounts/{id}` | JWT  | Get account details  |

### Transfers

| Method   | Endpoint              | Auth | Description                           |
| -------- | --------------------- | ---- | ------------------------------------- |
| `POST` | `/api/v1/transfers` | JWT  | Initiate fund transfer (SERIALIZABLE) |
| `GET`  | `/api/v1/transfers` | JWT  | List transfer history                 |

### Documents

| Method   | Endpoint                           | Auth | Description             |
| -------- | ---------------------------------- | ---- | ----------------------- |
| `POST` | `/api/v1/documents/upload`       | JWT  | Upload KYC document     |
| `GET`  | `/api/v1/documents/{userId}/kyc` | JWT  | Get signed document URL |

### Monitoring

| Method  | Endpoint              | Auth | Description                         |
| ------- | --------------------- | ---- | ----------------------------------- |
| `GET` | `/actuator/health`  | —   | Health check (liveness + readiness) |
| `GET` | `/actuator/metrics` | —   | Application metrics                 |

---

## Design Decisions

### Why SERIALIZABLE isolation over REPEATABLE READ?

Fund transfers involve reading a balance, validating sufficiency, and writing a new balance. REPEATABLE READ allows phantom reads — two concurrent transfers could both read the same balance and both succeed, creating money from nothing. SERIALIZABLE prevents this by detecting write conflicts at commit time.

### Why Caffeine over Redis for caching?

For a single-instance deployment, Caffeine provides sub-microsecond cache access without network hops. Adding Redis adds operational complexity (another service to deploy, monitor, and secure) that isn't justified until horizontal scaling requires a shared cache layer.

### Why Angular Signals over NgRx?

The dashboard KPIs need reactive updates when account data changes, but the state graph is shallow — there's no deeply nested state that requires normalized stores. Signals provide fine-grained reactivity with `computed()` and `effect()` at a fraction of NgRx's boilerplate.

### Why bundle Angular into Spring Boot?

A single JAR means one Render service, one health check, one deploy pipeline. The frontend is static assets served by Spring Boot's resource handler — no CORS complexity, no separate CDN configuration, no split deployment timing issues.

---

## Project Structure

```
bankingapp/
├── bank-backend/
│   └── src/main/java/dev/prateek/banque/
│       ├── config/          # Security, GCP, Cache, CORS
│       ├── auth/            # JWT, 2FA, registration
│       ├── account/         # Account CRUD + caching
│       ├── transaction/     # Transactions + metrics
│       ├── transfer/        # SERIALIZABLE fund transfers
│       ├── document/        # GCS upload + signed URLs
│       ├── payment/         # Payment processing
│       ├── user/            # Profile management
│       └── feedback/        # Transaction feedback
├── bank-frontend/
│   └── src/app/
│       ├── features/
│       │   ├── auth/        # Login, Register, 2FA
│       │   ├── dashboard/   # KPI cards, signals
│       │   ├── accounts/    # Account list + details
│       │   ├── transactions/# Search with debounceTime
│       │   ├── transfers/   # Transfer form + history
│       │   ├── user/        # Profile, settings
│       │   └── public/      # Landing, About, FAQ, Contact
│       ├── core/            # Guards, interceptors, stores
│       └── shared/          # Pipes, components, utilities
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Local dev with PostgreSQL
├── render.yaml              # Render blueprint
└── cloudbuild.yaml          # GCP Cloud Build config
```

---

## What I Learned

**Transaction Isolation is not optional for financial apps.** Early in development, I tested concurrent transfers and discovered that without SERIALIZABLE isolation, two simultaneous transfers could overdraw an account. The performance cost (~2ms per transfer) is negligible compared to the correctness guarantee.

**Angular Signals simplify reactive UIs dramatically.** Moving from a service-based approach with manual subscription management to Signals cut the dashboard component code by roughly 40%. `computed()` signals automatically track dependencies — no more forgotten `unsubscribe()` calls.

**GCP integration has a steep learning curve but pays off.** Setting up signed URLs for document access required understanding IAM service accounts, bucket policies, and credential management. The abstraction I built (with local fallback) means the app works identically in development and production.

---

## Roadmap

- [ ] Deploy to GCP Cloud Run with CI/CD via GitHub Actions
- [ ] Add spending analytics with chart visualizations
- [ ] Implement Kafka event streaming for audit log
- [ ] Add expense categorization with ML classification
- [ ] PWA support with offline transaction queue

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built by <a href="https://github.com/urstrulyPrateeK">Prateek Singh</a> · 2026</sub>
</p>
