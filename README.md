# Expense Tracker

A full-stack personal expense tracker built on the MERN stack with TypeScript on both ends.

## Stack

- **Backend:** Node.js, Express, TypeScript, MongoDB (via Mongoose), MongoDB Atlas
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts / Chart.js
- **Auth:** JWT stored in an httpOnly cookie (set by the backend, sent automatically by the frontend via `withCredentials`)

## Project layout

```
Expense tracker/
├── backend/       # Express API (TypeScript)
│   └── src/
│       ├── config/        # DB connection
│       ├── controllers/   # Route handlers
│       ├── middleware/    # Auth, error handling, rate limiting, validation
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routers
│       ├── types/         # Shared/ambient TS types
│       ├── utils/
│       ├── app.ts         # Express app wiring
│       └── server.ts      # Entrypoint
└── frontend/      # React app (TypeScript, Vite)
    └── src/
        ├── api/            # Axios client + one module per resource
        ├── components/     # layout/, common/, dashboard/
        ├── context/        # AuthContext, ThemeContext
        ├── pages/          # One component per route
        ├── routes/         # AppRoutes, ProtectedRoute
        └── types/          # Shared TS types mirroring backend models
```

## Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance) and its connection string

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Run it:

```bash
npm run dev
```

The API starts on `http://localhost:5000`, health check at `GET /api/health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Run it:

```bash
npm run start
```

The app starts on `http://localhost:5173` and proxies `/api` requests to the backend during dev (see `vite.config.ts`).

## Current status

This is a scaffold: the full folder structure, models, routes, controllers, middleware, and frontend routing/auth/theme wiring are in place and should compile and run, but most feature pages (Expenses, Income, Analytics, Budgets, Goals, Calendar, Reports) are placeholder stubs. The Dashboard and Settings pages are wired to real endpoints as a working example of the intended pattern.

### What's implemented end-to-end
- Registration, login, logout, session check (`/auth/me`) via httpOnly cookie
- Protected routing (`ProtectedRoute` + `AppRoutes`)
- Light/dark/system theme switching, persisted to `localStorage`
- Dashboard summary (balance, monthly income/expenses/savings, recent transactions)
- Settings: profile update (name, currency), theme selection

### Next steps
- Build out CRUD UI for Expenses, Income, Categories, Budgets, and Goals against the existing `src/api/*Api.ts` modules
- Add charts to Analytics using the `/dashboard/spending-by-category` and `/dashboard/trend` endpoints
- Add a notifications dropdown wired to `notificationApi`
- Write backend tests (auth, expense/income CRUD, budget rollover) and frontend component tests

## Scripts

| Location | Command | Purpose |
|---|---|---|
| `backend/` | `npm run dev` | Start API with reload |
| `backend/` | `npm run build` | Compile TypeScript |
| `frontend/` | `npm run start` / `npm run dev` | Start Vite dev server |
| `frontend/` | `npm run build` | Type-check + production build |
| `frontend/` | `npm run test` | Run Vitest |
