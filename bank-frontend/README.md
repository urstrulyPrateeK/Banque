# Banking Application Frontend

![Angular](https://img.shields.io/badge/Angular-21-red)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![RxJS](https://img.shields.io/badge/RxJS-7.x-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

A modern, responsive banking dashboard built with Angular 21. This application utilizes the latest Angular features including Signals for state management, Standalone Components, and the new Control Flow syntax. It provides a seamless user experience for managing accounts, transactions, transfers, and cards.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Author](#author)

## 🎯 Overview

The Banking Application Frontend is designed to be a fast, secure, and user-friendly interface for banking customers. It connects to the Spring Boot backend to provide real-time data and transaction capabilities.

### Key Highlights

✅ **Angular 21** with Standalone Components  
✅ **Signals** for reactive state management  
✅ **Tailwind CSS 4** for modern, utility-first styling  
✅ **Responsive Design** for mobile, tablet, and desktop  
✅ **Dark Mode** support  
✅ **Real-time Notifications** via WebSockets (RabbitMQ)  

## 🚀 Features

### 🔐 Authentication
- **Secure Login & Registration** with JWT handling.
- **Two-Factor Authentication (2FA)** setup and verification.
- **Session Management** with auto-refresh tokens.

### 🏦 Dashboard
- **Account Overview**: View total balance, recent activity, and quick actions.
- **Charts & Graphs**: Visual representation of income vs. expenses.

### 💸 Money Management
- **Transfers**: Internal and external fund transfers.
- **Payments**: Bill payments and saved beneficiaries.
- **Transaction History**: Filterable and searchable list of all transactions.

### 💳 Card Control
- **Card Management**: View card details, block/unblock cards, and request new cards.
- **Limit Settings**: Adjust spending limits and change PINs.

### 👤 User Profile
- **Settings**: Update personal information and security preferences.
- **Activity Log**: View a history of login and security events.

## 🛠️ Technology Stack

- **Framework:** Angular 21
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x, Angular Material
- **State Management:** Angular Signals, RxJS
- **HTTP Client:** Angular HttpClient (with Interceptors)
- **Build Tool:** Angular CLI (esbuild)

## 📂 Project Structure

```
src/
├── app/
│   ├── core/               # Singleton services, interceptors, guards
│   ├── shared/             # Shared components, pipes, directives
│   ├── features/           # Feature modules (lazy loaded)
│   │   ├── auth/           # Login, Register, 2FA
│   │   ├── dashboard/      # Main dashboard view
│   │   ├── accounts/       # Account details and management
│   │   ├── transfers/      # Fund transfer forms
│   │   ├── cards/          # Card management
│   │   └── settings/       # User profile settings
│   ├── layout/             # Main layout, header, sidebar, footer
│   └── app.routes.ts       # Application routing configuration
├── assets/                 # Images, icons, fonts
├── environments/           # Environment configuration
└── styles.css              # Global styles and Tailwind imports
```

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v20 or higher
- **npm:** v10 or higher
- **Angular CLI:** v21 (`npm install -g @angular/cli`)

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd bank-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Docker Setup

To run the frontend in a Docker container (served by Nginx):

```bash
docker-compose up -d frontend
```

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `ng serve` | Starts the development server. |
| `ng build` | Builds the project for production to the `dist/` folder. |
| `ng test` | Runs unit tests via Karma/Jest. |
| `ng lint` | Lints the code using ESLint. |

## ⚙️ Configuration

The application connects to the backend API defined in `src/environments/environment.ts`.

**Development (`environment.ts`):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

**Production (`environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: '/api/v1' // Relative path for Nginx proxy
};
```

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Prateek Singh**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/urstrulyPrateeK)
