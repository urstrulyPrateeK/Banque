# Enterprise Banking Application

This is a comprehensive, full-stack enterprise banking solution. It features a robust Spring Boot 4 backend with a Microservices-ready architecture and a modern Angular 21 frontend utilizing Signals for state management. The project demonstrates a complete banking workflow including 2FA security, detailed transaction auditing, and real-time notifications.

## 📂 Project Structure

```
banking-app/
├── bank-backend/         # Spring Boot 4.0 / Java 17 API
├── bank-frontend/        # Angular 21 / Tailwind CSS Client
├── docker-compose.yml    # Docker Compose Configuration
├── .env.example          # Environment Variables Example
└── README.md             # Project Documentation
```

## 🚀 Technology Stack

### Backend (bank-backend)
*   **Framework**: Spring Boot 4.0 / Spring Framework 7.0
*   **Language**: Java 17 (LTS)
*   **Database**: PostgreSQL 15+ (Primary), Redis (Cache)
*   **Security**: Spring Security 7.x, JWT (JJWT 0.12.5), 2FA
*   **Messaging**: RabbitMQ (Spring AMQP)
*   **Tools**: Lombok, MapStruct, Liquibase, Resilience4j, Micrometer, SpringDoc OpenAPI

### Frontend (bank-frontend)
*   **Framework**: Angular 21 (Standalone Components)
*   **State Management**: Angular Signals, RxJS
*   **Styling**: Tailwind CSS 4.x, Angular Material
*   **Features**: Reactive Forms with Signals, Dark Mode, Responsive Dashboard

## ✨ Key Features

### 🔐 Authentication & Security:
*   User Registration & Login with JWT.
*   Two-Factor Authentication (2FA) using QR codes.
*   Role-based access control (Admin/Customer).

### 💰 Account Management:
*   Savings, Checking, and Credit accounts.
*   Real-time balance updates and overdraft limits.

### 💸 Fund Transfers:
*   Internal transfers between own accounts.
*   External transfers to beneficiaries.
*   Scheduled/Standing instructions.

### 📊 Transaction History:
*   Detailed statements with filtering (Date, Amount, Type).
*   PDF/Excel export capabilities.

### 💳 Card & Loan Management:
*   Request new cards, block cards, set limits.
*   Apply for loans and view EMI schedules.

### 🔔 Notifications:
*   Email and SMS alerts via RabbitMQ async processing.

### 🛡️ Audit & Monitoring:
*   Comprehensive audit logging for all sensitive actions.
*   Prometheus metrics and Actuator health checks.

## 🛠️ Getting Started

### Prerequisites
*   Java: JDK 17+
*   Node.js: Version 20+
*   Maven: 3.8+
*   Database: PostgreSQL 15+ and Redis 7+
*   Infrastructure: Docker & Docker Compose (Recommended)

### 🐳 Quick Start (Docker)
The easiest way to run the full stack (DB, Redis, RabbitMQ, Backend, Frontend) is via Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/urstrulyPrateeK/Banque.git
    cd bankingapp
    ```

2.  **Configure Environment Variables:**
    Copy the example environment file to `.env`:
    ```bash
    cp .env.example .env
    ```
    *Note: You can adjust the settings in `.env` if needed, but the defaults should work out of the box.*

3.  **Start the services:**
    ```bash
    docker-compose up -d --build
    ```
    *Note: If you encounter database errors, try running `docker-compose down -v` first to clear any old volumes.*

4.  **Access the application:**
    *   **Frontend:** `http://localhost:4200`
    *   **Backend API:** `http://localhost:8080/api/v1`
    *   **Swagger Docs:** `http://localhost:8080/swagger-ui.html`
    *   **MailHog (Email Testing):** `http://localhost:8025`

### 💻 Manual Setup

#### 1. Backend Setup
Navigate to the backend directory:
```bash
cd bank-backend
```

Configure database connection in `src/main/resources/application.properties` (if not using defaults).
Build the project:
```bash
mvn clean install
```

Run the application:
```bash
mvn spring-boot:run
```

#### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd bank-frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
ng serve
```

Open browser at `http://localhost:4200/`.

## ⚙️ Configuration
The application is configured via environment variables. See `.env.example` for all available options.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SERVER_PORT` | Backend Port | `8080` |
| `DB_URL` | Database Connection URL | `jdbc:postgresql://db:5432/bankappdb` |
| `DB_USERNAME` | Database Username | `postgres` |
| `DB_PASSWORD` | Database Password | `postgres` |
| `APP_FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:4200` |

## 🧪 Testing

Backend: Run unit and integration tests using JUnit 5.
```bash
mvn test
```

Frontend: Run unit tests using Jest/Karma.
```bash
npm test
```

## 🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request for any features or bug fixes.

## 📄 License
This project is open-source and available under the MIT License.

## 👨‍💻 Author

**Prateek Singh**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/urstrulyPrateeK)
