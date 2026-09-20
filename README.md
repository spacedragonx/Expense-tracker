<div align="center">
<img src="./assets/logos/Github%20Logo.jpg" alt="Expense Tracker Logo" width="300" />

# Full-Stack MERN Expense Tracker
<br>

[![Last Commit](https://img.shields.io/badge/last%20commit-recent-blue?style=for-the-badge&labelColor=555555)](https://github.com/spacedragonx/Expense-tracker/commits)
[![TypeScript](https://img.shields.io/badge/typescript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=555555)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-18-61DAFB?style=for-the-badge&logo=react&logoColor=black&labelColor=555555)](https://react.dev/)

<br>

<p>Built with the tools and technologies:</p>

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

A robust, scalable, and secure personal finance management platform. Built to empower users to take control of their finances through intuitive dashboards, real-time analytics, and comprehensive goal tracking.

## Objective & Application

**The Problem:** Managing personal finances often involves scattered spreadsheets, delayed insights, and a lack of clear, actionable data. 
**The Solution:** This application provides a centralized, secure hub to track income, categorize expenses, set budgets, and monitor financial goals. 

**Core Applications:**
- **Real-time Financial Dashboard:** Instant overview of balances, monthly cash flow, and recent transactions.
- **Spending Analytics:** Visual insights into spending habits via interactive charts.
- **Budgeting & Goal Setting:** Proactive financial planning tools to stay on track.
- **Multi-currency Support:** Adaptable settings for global users.

## Architecture & Tech Stack

This project is built using a modern, type-safe MERN stack, emphasizing security, performance, and maintainability.

### Backend (Node.js / Express)
- **Language:** Strict TypeScript for end-to-end type safety.
- **Database:** MongoDB (via Mongoose) with robust schema validation.
- **Security & Auth:** Stateless JWT authentication securely stored in `httpOnly` cookies (preventing XSS), express rate-limiting, and centralized error handling.
- **Structure:** Modular MVC-inspired architecture ensuring clean separation of concerns (Controllers, Services/Logic, Routes, Middleware).

### Frontend (React / Vite)
- **Framework:** React 18 with Vite for lightning-fast HMR and optimized builds.
- **Styling:** Tailwind CSS for a highly responsive, utility-first UI design, complete with persistent Light/Dark mode.
- **State Management & Routing:** React Router for protected client-side routing, modular Context API for global state.
- **Data Fetching:** Axios with interceptors for seamless cookie-based credential transmission.

### DevOps & Deployment
- **Containerization:** Docker & Docker Compose configured for both development and production environments.
- **Reverse Proxy:** Caddy server configured for automatic HTTPS and efficient request routing in production.

## Project Layout

The repository is structured as a monorepo, separating the client and server while allowing for potential shared type definitions.

```text
Expense tracker/
├── backend/       # Express API (TypeScript)
│   └── src/
│       ├── config/        # DB & Environment configuration
│       ├── controllers/   # Request handlers & business logic
│       ├── middleware/    # Auth, error handling, rate limiting, validation
│       ├── models/        # Mongoose data schemas
│       ├── routes/        # Express API routing definitions
│       ├── types/         # Ambient & utility TypeScript types
│       └── server.ts      # Application entrypoint
├── frontend/      # React App (TypeScript, Vite)
│   └── src/
│       ├── api/            # Axios API client & resource modules
│       ├── components/     # Reusable UI components (layout, common)
│       ├── context/        # Global state (Auth, Theme)
│       ├── pages/          # Route-level components
│       ├── routes/         # App routing & ProtectedRoute logic
│       └── types/          # Frontend TS types (mirroring backend)
├── docker-compose.yml      # Local development container orchestration
├── docker-compose.prod.yml # Production container orchestration
└── Caddyfile               # Production reverse proxy configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Docker (Optional, for containerized setup)

### Local Development Setup

#### 1. Backend API
```bash
cd backend
npm install
cp .env.example .env
```
Update `.env` with your `MONGO_URI` and a secure `JWT_SECRET`.
```bash
npm run dev # Starts server on http://localhost:5000
```

#### 2. Frontend Client
```bash
cd frontend
npm install
cp .env.example .env
```
```bash
npm run start # Starts Vite server on http://localhost:5173
```
*Note: Vite is configured to proxy `/api` requests to the backend automatically.*

## Development Roadmap & Status

The foundational architecture is complete. Core infrastructure including database models, authentication flows, protected routing, and theme management are fully operational.

**Implemented End-to-End:**
- Secure User Authentication (Registration, Login, Session Persistence).
- Dynamic Dashboard (Balances, cash flow summaries, transaction history).
- User Settings & Preferences (Profile updates, persistent theme switching).

**Next Steps / Work in Progress:**
- [ ] Expand CRUD interfaces for Categories, Budgets, and Financial Goals.
- [ ] Integrate Recharts/Chart.js for advanced visual analytics on the dashboard.
- [ ] Implement comprehensive test coverage (Vitest for frontend, Jest/Supertest for backend API).

## Scripts Reference

| Location | Command | Purpose |
|---|---|---|
| `backend/` | `npm run dev` | Start API with reload |
| `backend/` | `npm run build` | Compile TypeScript |
| `frontend/` | `npm run start` / `npm run dev` | Start Vite dev server |
| `frontend/` | `npm run build` | Type-check + production build |
| `frontend/` | `npm run test` | Run Vitest |
