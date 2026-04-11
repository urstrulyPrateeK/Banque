# Banking Application Backend

![Java](https://img.shields.io/badge/Java-17%2B-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.x-green)
![Spring Security](https://img.shields.io/badge/Spring%20Security-7.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)
![Redis](https://img.shields.io/badge/Redis-7%2B-red)
![JWT](https://img.shields.io/badge/JWT-Auth-orange)
![Maven](https://img.shields.io/badge/Maven-3.8%2B-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive, production-ready banking backend service built with Spring Boot 4. Provides complete RESTful APIs for modern banking operations including user management, accounts, cards, transfers, transactions, and payments with full audit logging.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Modules](#modules)
  - [User Management](#user-management)
  - [Account Management](#account-management)
  - [Transaction Service](#transaction-service)
  - [Transfer Service](#transfer-service)
  - [Payment Service](#payment-service)
  - [Card Management](#card-management)
- [Security](#security)
- [Activity Logging](#activity-logging)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Technology Stack](#technology-stack)
- [Project Statistics](#project-statistics)
- [Author](#author)

## 🎯 Overview

The Banking Application Backend is a robust, secure, and scalable system designed to handle comprehensive banking operations. Built with enterprise-grade architecture, it provides 115+ RESTful API endpoints covering all aspects of digital banking.

### Key Highlights

✅ **115+ API Endpoints** across 6 core modules  
✅ **Complete Audit Trail** with IP and User Agent tracking  
✅ **40+ Activity Types** logged for compliance  
✅ **16 Database Tables** with full relational integrity  
✅ **JWT Authentication** with MFA support  
✅ **Real-time Processing** for all transactions  
✅ **Production-Ready** with comprehensive error handling  

## 🚀 Features

### Core Banking Features
- 👤 **User Management** - Registration, authentication, profile, MFA
- 💰 **Account Management** - Multiple accounts, balance tracking, statements
- 💳 **Card Services** - Debit/Credit/Prepaid cards with full controls
- 💸 **Transfers** - Internal, external, scheduled, and recurring
- 📊 **Transactions** - Deposits, withdrawals, search, analytics
- 🧾 **Payments** - Bills, utilities, merchants, saved billers

### Advanced Features
- 🔐 **Multi-Factor Authentication** (Email OTP)
- 📧 **Notification System** (Real-time alerts via RabbitMQ)
- 📈 **Statistics & Analytics** (Account, transaction, transfer stats)
- 📄 **Statement Generation** (PDF/CSV export)
- 🔄 **Recurring Operations** (Transfers, payments)
- 🛡️ **Activity Logging** (Complete audit trail)
- 💱 **Multi-Currency Support** (Ready for expansion)
- ⚡ **Real-time Balance Updates**

## 🏗️ Architecture

The application follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Controllers - REST API Endpoints)     │
├─────────────────────────────────────────┤
│          Business Layer                 │
│    (Services - Business Logic)          │
├─────────────────────────────────────────┤
│         Data Access Layer               │
│  (Repositories - JPA/Hibernate)         │
├─────────────────────────────────────────┤
│          Database Layer                 │
│    (PostgreSQL/Redis)                   │
└─────────────────────────────────────────┘
```

### Package Structure

```
com.bank.bankbackend/
├── auth/                   # Authentication & Authorization
├── user/                   # User Management (18 endpoints)
├── account/                # Account Management (17 endpoints)
├── transaction/            # Transaction Processing (14 endpoints)
├── transfer/               # Money Transfers (16 endpoints)
├── payment/                # Bill & Utility Payments (19 endpoints)
├── card/                   # Card Management (21 endpoints)
├── security/               # Security Configuration & JWT
├── config/                 # Application Configuration
└── common/                 # Shared Utilities & Exceptions
```

## 📦 Modules

### User Management
**Endpoints:** 18 | **Controller:** `UserController`, `AuthController` | **Service:** `UserService`

- **Features:** Registration, login, MFA, profile management, settings, notifications, activity logs.
- **Activity Logged:** `PROFILE_UPDATED`, `PASSWORD_CHANGED`, `MFA_ENABLED`, `MFA_DISABLED`, `AVATAR_UPLOADED`, `AVATAR_REMOVED`, `SETTINGS_UPDATED`

---

### Account Management
**Endpoints:** 17 | **Controller:** `AccountController` | **Service:** `AccountService`

- **Features:** Multi-account creation (SAVINGS, CHECKING, etc.), balance tracking, statements (PDF/CSV), freeze/unfreeze, primary account setting.
- **Activity Logged:** `ACCOUNT_CREATED`, `ACCOUNT_UPDATED`, `ACCOUNT_CLOSED`, `ACCOUNT_FROZEN`, `ACCOUNT_UNFROZEN`, `PRIMARY_ACCOUNT_SET`

---

### Transaction Service
**Endpoints:** 14 | **Controller:** `TransactionController` | **Service:** `TransactionService`

- **Features:** Deposits, withdrawals, advanced search, dispute resolution, transaction receipts, export.
- **Activity Logged:** `DEPOSIT`, `WITHDRAWAL`, `TRANSACTION_CANCELLED`, `DISPUTE_RAISED`

---

### Transfer Service
**Endpoints:** 16 | **Controller:** `TransferController` | **Service:** `TransferService`

- **Features:** Internal, external, scheduled, and recurring transfers with account verification and limit enforcement.
- **Activity Logged:** `INTERNAL_TRANSFER`, `EXTERNAL_TRANSFER`, `TRANSFER_SCHEDULED`, `RECURRING_TRANSFER_CREATED`, `TRANSFER_CANCELLED`

---

### Payment Service
**Endpoints:** 19 | **Controller:** `PaymentController` | **Service:** `PaymentService`

- **Features:** Bill, utility, and merchant payments; scheduled and recurring payments; saved biller management.
- **Activity Logged:** `BILL_PAYMENT`, `UTILITY_PAYMENT`, `MERCHANT_PAYMENT`, `PAYMENT_SCHEDULED`, `BILLER_SAVED`, `BILLER_DELETED`

---

### Card Management
**Endpoints:** 21 | **Controller:** `CardController` | **Service:** `CardService`

- **Features:** Full card lifecycle (request, activate, block, cancel), PIN management, limit controls, and transaction history.
- **Activity Logged:** `CARD_REQUESTED`, `CARD_ACTIVATED`, `CARD_BLOCKED`, `CARD_REPORTED_LOST`, `CARD_PIN_CHANGED`, `CARD_LIMITS_UPDATED`

---

## 🔐 Security

### Authentication & Authorization
- **JWT (JSON Web Tokens)** for stateless authentication.
- **Role-Based Access Control (RBAC)**: `USER` and `ADMIN` roles.
- **Password & PIN Encryption** using BCrypt.

### Multi-Factor Authentication (MFA)
- Email-based OTP for sensitive operations.

### Security Features
- ✅ CORS & CSRF protection.
- ✅ SQL injection prevention via JPA.
- ✅ Ownership verification on all operations.

---

## 📊 Activity Logging

A complete audit trail is maintained for all significant user actions, logging the user ID, action type, description, IP address, user agent, and timestamp.

---

## 🗄️ Database Schema

### Core Tables (16)
1. **users** & **user_settings**: Core user data and preferences.
2. **accounts** & **balance_history**: Account details and balance changes.
3. **transactions**: All financial transactions.
4. **transfers** & **recurring_transfers**: One-time and recurring fund transfers.
5. **payments**, **recurring_payments**, & **saved_billers**: Bill payment records.
6. **cards** & **card_transactions**: Card details and associated transactions.
7. **notifications** & **user_activities**: User alerts and audit logs.
8. **password_reset_tokens** & **email_verification_tokens**: Security token storage.

*An ER diagram can be found at `docs/er-diagram.png`.*

---

## 📚 API Documentation

### OpenAPI/Swagger
Access the interactive Swagger UI for live API testing:
**URL:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

The complete API specification is also available in `openapi.json` in the `api-calls` directory.

### DTO Overview
Key Data Transfer Objects (DTOs) used in the API:

| Module      | DTO Name               | Purpose                               |
|-------------|------------------------|---------------------------------------|
| User        | `RegisterRequest`      | Register a new user.                  |
| User        | `LoginRequest`         | Authenticate and receive JWT.         |
| User        | `UpdateProfileRequest` | Update user profile details.          |
| Account     | `CreateAccountRequest` | Create a new bank account.            |
| Transaction | `DepositRequest`       | Deposit funds into an account.        |
| Transaction | `WithdrawRequest`      | Withdraw funds from an account.       |
| Transfer    | `InternalTransferRequest`| Transfer between own accounts.        |
| Transfer    | `ExternalTransferRequest`| Transfer to another user's account.   |
| Payment     | `BillPaymentRequest`   | Pay a bill to a specified biller.     |
| Card        | `CardRequestRequest`   | Request a new debit/credit card.      |
| Card        | `ChangePinRequest`     | Change a card's PIN.                  |

### Response Formats
All API responses follow a consistent JSON structure.

**Success Response (`2xx`)**
```json
{
  "status": "SUCCESS",
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

**Error Response (`4xx`, `5xx`)**
```json
{
  "status": "ERROR",
  "message": "Invalid input provided.",
  "errors": ["Field 'username' must not be empty."]
}
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+**
- **Maven 3.8+**
- **Database** (PostgreSQL 15+ and Redis 7+)
- **SMTP Server** (or MailHog for testing)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/urstrulyPrateeK/Banque.git
   cd bankingapp/bank-backend
   ```

2. **Configure Secrets:**
   For security, it is recommended to use environment variables for secrets. Create a `.env` file in the root directory (see `.env.example`).
   
   Alternatively, update `src/main/resources/application.properties` directly for local development.

3. **Build the project:**
   ```bash
   mvn clean install
   ```

4. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```
   The API will be available at `http://localhost:8080`.

---

## 🧪 Testing

Run unit and integration tests using Maven:
```bash
mvn test
```
Tests are configured to run against an in-memory H2 database to avoid interfering with development data.

---

## 🛠️ Technology Stack

- **Backend:** Spring Boot 4.0.x, Spring Framework 7.0.x
- **Data:** Spring Data JPA, Hibernate
- **Database:** PostgreSQL, Redis (Cache)
- **Security:** Spring Security 7.x, JWT, BCrypt
- **Utilities:** Lombok, MapStruct, Resilience4j
- **Build:** Maven

---

## 📊 Project Statistics

- **115+ API Endpoints**
- **6 Core Service Modules**
- **90+ Java Files**
- **16 Database Tables** & **16 Entities**
- **50+ DTOs (Records)**
- **40+ Logged Activity Types**

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Prateek Singh**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/urstrulyPrateeK)
