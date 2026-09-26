# CraveCanteen — Smart Campus Canteen Hub Architecture

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.0-ffca28.svg)](https://firebase.google.com/)

Senior full-stack refactored architecture separating **Frontend**, **Backend**, **Database**, **Shared Types**, **Tests**, **Scripts**, and **Documentation**.

---

## Architecture Overview

```text
CraveCanteen/
│
├── frontend/             # Everything React 19 / Vite / PWA UI
│   ├── src/
│   │   ├── app/          # App root component & routing
│   │   ├── components/   # Auth, Menu, Staff, Admin, AI, Layout, Common
│   │   ├── pages/        # Route page views
│   │   ├── hooks/        # React hooks
│   │   ├── contexts/     # App state contexts
│   │   ├── services/     # Firebase client, API client, Gemini AI client
│   │   ├── utils/        # UI formatting utilities
│   │   └── main.tsx      # React DOM entry point
│   ├── public/           # PWA Manifest & Icons
│   ├── index.html        # HTML template
│   ├── vite.config.ts    # Vite & PWA build configuration
│   └── tsconfig.json     # Frontend TypeScript config
│
├── backend/              # Node.js + Express API Server
│   ├── src/
│   │   ├── app.ts        # Express app & route configuration
│   │   ├── server.ts     # HTTP server entrypoint
│   │   ├── config/       # Env config & Firebase admin
│   │   ├── routes/       # Auth, Menu, Order, User, AI, Notification, Report routes
│   │   ├── controllers/  # Clean controller functions
│   │   ├── services/     # PDF, Nodemailer Email, Twilio WhatsApp, Gemini AI services
│   │   └── middleware/   # Auth, RBAC role check, Rate limiting, Error handling
│   ├── package.json
│   └── tsconfig.json
│
├── database/             # Database Infrastructure & Docs
│   ├── firestore/        # Rules, Indexes, Schemas, Seeds, Migrations
│   ├── data-model/       # Detailed markdown specs for users, menu, orders, audit-logs
│   └── README.md
│
├── shared/               # Single Source of Truth
│   ├── types/            # Auth, User, Menu, Order types & enums
│   ├── constants/        # Categories, slots, status colors, default users
│   ├── validation/       # Validation schemas and validators
│   └── utils/            # Shared helper functions
│
├── tests/                # Automated Test Suite
│   ├── unit/             # Auth, Menu, Order unit tests
│   ├── integration/      # Express API integration tests
│   ├── security/         # Security & RBAC tests
│   └── e2e/              # E2E lifecycle test scenario
│
├── scripts/              # Developer & Deployment Tools
│   ├── verify/           # System integrity verification script
│   ├── migration/        # Schema migration script
│   ├── database/         # Database seeding script
│   └── deployment/       # Independent deployment helper
│
├── docs/                 # Complete Technical Documentation
│   ├── architecture/     # System, Frontend, Backend, Database, Final Audit docs
│   ├── api/
│   ├── database/
│   ├── deployment/
│   ├── security/
│   └── development/
│
├── .env.example          # Environment variable reference
├── package.json          # Monorepo workspaces & master scripts
└── README.md
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and populate API keys:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run System Verification & Linting
```bash
npm run verify
npm run lint
```

### 5. Build for Production
```bash
npm run build
npm start
```
