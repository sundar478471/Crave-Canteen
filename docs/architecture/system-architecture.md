# CraveCanteen System Architecture

## Overview
CraveCanteen is a smart campus canteen hub designed to eliminate waiting lines, streamline kitchen order prep via barcode scanning, send real-time multi-channel notifications (Email & WhatsApp), and provide AI-driven nutritional and financial insights.

```
+-------------------------------------------------------+
|                    FRONTEND LAYER                     |
|           React 19 / Vite / PWA / Tailwind             |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                    BACKEND LAYER                      |
|           Express API / PDF / Email / Twilio          |
+-------------------------------------------------------+
           |                               |
           v                               v
+-----------------------+     +-------------------------+
|     FIRESTORE DB      |     |      GEMINI AI API      |
| Users/Menu/Orders     |     | Chat / Statements       |
+-----------------------+     +-------------------------+
```

## Layers
1. `frontend/`: Web/PWA User Interface built with React 19, Lucide React, Recharts, and HTML5 QR code scanning.
2. `backend/`: Node.js + Express API server managing PDF generation, email notifications (Nodemailer), WhatsApp integration (Twilio/Mock), and server-side operations.
3. `database/`: Firestore security rules, composite indexes, schemas, seeds, and data model documentation.
4. `shared/`: Shared TypeScript types, constants, validation functions, and utilities.
5. `tests/`: Automated unit, integration, e2e, and security test suites using Jest.
6. `scripts/`: System verification, schema migration, database seeding, and deployment scripts.
7. `docs/`: System, frontend, backend, database, security, and deployment documentation.
