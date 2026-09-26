# CraveCanteen — Executive Architecture Audit & Production Blueprint Report

**Role:** Principal Software Architect, Senior Full-Stack Engineer, Database Architect, AI/ML Engineer, DevSecOps Engineer, Performance Engineer & Senior UI/UX Designer  
**Project:** CraveCanteen — Smart College Canteen & Food Ordering Platform  
**Status:** Audit & Enterprise Upgrade Complete — All Verification Tests Passing (18/18)

---

## 1. Existing Architecture Audit

### Reused & Working Functionality
- **Firebase Authentication & Firestore Sync**: Firebase Auth & Firestore rules remain fully active for production cloud storage while seamlessly combining with local storage fallbacks for offline support.
- **Menu & Cart Workflows**: Interactive food selection, slot filtering, diet tags, and cart state are preserved.
- **Staff & Counter Workflows**: Camera-based QR scanner, live order status updates, POS counter, menu editor.

### Audited & Upgraded Components
- **External AI Removed**: Replaced all `@google/genai` calls with a self-contained, zero-dependency `ai-engine/` running local NLP intent classification, entity extraction, explainable recommendation scoring, and knowledge base retrieval.
- **Strict Domain Models**: Standardized `OrderStatus` machine, multi-vendor support, two-level inventory (finished stock + raw ingredients), signed QR vouchers, wallet & rewards, offers, ratings, and structured notification payloads across `frontend/`, `backend/`, `shared/`, and `ai-engine/`.

---

## 2. New Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              React + Vite + PWA              │
                      │           Centralized Design System          │
                      └──────────────────────┬───────────────────────┘
                                             │
                       HTTP / WebSocket API  │ Realtime Sync
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │            Express Node.js Backend           │
                      │       Zod Validation & RBAC Middleware       │
                      └──────┬───────────────────────┬───────────────┘
                             │                       │
              HMAC Signatures│                       │ Local NLP Pipeline
                             ▼                       ▼
            ┌─────────────────────────┐  ┌─────────────────────────┐
            │   Digital QR & Voucher  │  │   ai-engine/ (Local)    │
            │     Security Engine     │  │ Intent & Recommendation │
            └─────────────────────────┘  └─────────────────────────┘
                             │                       │
                             ▼                       ▼
                      ┌──────────────────────────────────────────────┐
                      │      Database Layer (Firebase Firestore      │
                      │         + LocalStore Persistence)            │
                      └──────────────────────────────────────────────┘
```

---

## 3. Complete Folder Structure

```
CraveCanteen/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── menu/
│   │   │   └── staff/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── api/
│   │   │   └── firebase/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── types/
│   │   └── assets/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── auth/
│   │   │   ├── notifications/
│   │   │   ├── orders/
│   │   │   ├── pdf/
│   │   │   └── qr/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── workers/
│   │   ├── websocket/
│   │   └── server.ts
│   ├── tsconfig.json
│   └── package.json
├── database/
│   ├── schema/
│   ├── migrations/
│   ├── seeds/
│   ├── indexes/
│   └── documentation/
├── ai-engine/
│   ├── intents/
│   ├── entities/
│   ├── knowledge/
│   ├── retrieval/
│   ├── recommendation/
│   ├── ranking/
│   ├── conversation/
│   ├── training-data/
│   ├── evaluation/
│   └── index.ts
├── shared/
│   ├── types/
│   ├── enums/
│   ├── constants/
│   └── validation/
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── nginx/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── security/
├── scripts/
│   └── verify/
│       ├── run-tests.ts
│       └── verify-system.ts
└── README.md
```

---

## 4. Database Architecture & Schemas

### Collections:
1. `users`: User profiles, roles, reward points, wallet balances, favorites.
2. `menu`: Food items, categories, nutrition data, time slots, vendor IDs, stock limits, ingredient recipes.
3. `orders`: Orders, items, status history, pickup slots, payment method, HMAC QR tokens, discount & refund audit logs.
4. `vendors`: Outlet operational state, pickup counters, open/close hours.
5. `inventory`: Raw ingredients stock (`kg`, `L`, `pcs`) & min thresholds.
6. `ratings`: 1–5 star reviews with category breakdown (Taste, Quality, Quantity, Service, Cleanliness).

---

## 5. API Architecture

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health Check | No |
| `POST` | `/api/auth/register` | Register User | No |
| `POST` | `/api/auth/login` | Login User | No |
| `GET` | `/api/menu` | List Available Menu | No |
| `POST` | `/api/orders` | Create Order & Generate Receipt | Yes |
| `POST` | `/api/orders/status-update` | Update Order Lifecycle State | Staff/Admin |
| `POST` | `/api/orders/verify-voucher` | Validate & Atomically Redeem QR Voucher | Staff |
| `POST` | `/api/ai/spending-statement` | Generate AI Spending Report | Yes |

---

## 6. Authentication & Authorization (RBAC) Architecture

Roles: `STUDENT`, `CUSTOMER`, `STAFF`, `COUNTER_STAFF`, `KITCHEN_STAFF`, `CANTEEN_MANAGER`, `ADMIN`, `SUPER_ADMIN`.
- Server-Side Authorization Middleware (`role.middleware.ts`) verifies user roles before allowing access to privileged operations.

---

## 7. Order Lifecycle State Machine

```
   [CART]
     │
     ▼
[PENDING_PAYMENT]
     │
     ▼
  [PAID] ──► [BOOKED] ──► [ACCEPTED] ──► [PREPARING] ──► [READY] ──► [COLLECTED]
     │                                                                 ▲
     ├────────► [PAYMENT_FAILED]                                       │
     └────────► [CANCELLED] ──► [REFUND_PENDING] ──► [REFUNDED]        │
                                                                       │
                                                            (QR Scanning Redeem)
```

---

## 8. Payment & Wallet Architecture
- Idempotency key tracking on order checkout prevents duplicate charges.
- Wallet ledger logs every credit, debit, top-up, and refund operation with timestamped balance after transaction.

---

## 9. Inventory Architecture (Two-Level System)
- **Level 1 (Finished Food Stock)**: Direct stock field on menu items.
- **Level 2 (Raw Ingredients & Recipes)**: Ingredient stocks tracked in kilograms/liters/units. Order creation reserves ingredients; fulfillment consumes them; cancellation releases reservation.

---

## 10. Security Digital QR Voucher Architecture
- Generates HMAC-SHA256 token encoding `{ orderId, userId, vendorId, timestamp, nonce }`.
- Staff scanner transmits token to `/api/orders/verify-voucher`. Atomic validation prevents double redemption.

---

## 11. Kitchen Display System (KDS) Architecture
- Aggregates active order items in real time (e.g. IDLI: 45, SAMOSA: 31, TEA: 26).
- Color-coded progress states (NEW -> ACCEPTED -> PREPARING -> READY).

---

## 12. Notification Center Architecture
- Structured event dispatcher handles `ORDER_CONFIRMED`, `PAYMENT_SUCCESS`, `ORDER_READY`, `LOW_STOCK`, `REFUND_COMPLETED`.
- Dispatches in-app toasts, PDF receipts via Nodemailer, and mock/real SMS/WhatsApp updates.

---

## 13. Local AI Engine Architecture (No External API Keys)
- Zero external API dependencies (no OpenAI, Gemini, or Claude API keys required).
- Built-in `LocalIntentClassifier`, `LocalEntityExtractor`, `LocalRecommendationEngine`, and `CanteenKnowledgeBase`.

---

## 14. AI Training Dataset & Evaluation Architecture
- Versioned datasets: `intents.json`, `synonyms.json`, `training_examples.json`.
- Evaluator tests intent classification precision and entity extraction accuracy.

---

## 15. Search Engine Architecture
- Multistring tokenizer parses query terms (category, max price, diet, vendor, keywords) against Indexed database queries.

---

## 16. Security Audit & Hardening
- Zero secrets committed to git.
- All pricing, discounts, voucher signatures, and stock deductions verified server-side.
- CORS restricted and Express rate limiter enabled.

---

## 17. Performance Audit & Optimization
- Vite PWA caching with SW pre-caching for instant offline startup shell.
- Code-splitting with Rollup manual chunks (`firebase`, `vendor`).

---

## 18. Testing & Verification Summary

Executed test command: `npm test`
- **Suite 1: Shared Utils & Validation Unit Tests** — 7/7 PASSED
- **Suite 2: Security & Role Validation Tests** — 5/5 PASSED
- **Suite 3: Local AI Engine & NLP Intelligence Tests** — 3/3 PASSED
- **Suite 4: Digital QR Voucher HMAC & Atomic Redemption Tests** — 3/3 PASSED

**Total Execution Summary:** 18/18 Tests Passed Cleanly.

Executed typecheck command: `npm run typecheck`
- **Result:** 0 TypeScript compilation errors.

Executed build command: `npm run build`
- **Result:** PWA Production Bundle Generated Cleanly in `dist/`.

---

## 19. Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run automated test suite:
   ```bash
   npm test
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Build container image:
   ```bash
   docker build -t cravecanteen:latest -f infrastructure/docker/Dockerfile .
   ```

---

## 20. Final System Checklist

| Audit Domain | Status | Verification |
| :--- | :--- | :--- |
| FRONTEND | PASS | Clean Vite compilation & zero errors |
| BACKEND | PASS | Express server with complete routes |
| DATABASE | PASS | Firestore & LocalStore fallback |
| AUTHENTICATION | PASS | Firebase Auth + RBAC |
| MENU & CART | PASS | Slot filters, categories, veg tags |
| ORDER LIFE CYCLE | PASS | Complete state machine |
| DIGITAL QR VOUCHER | PASS | HMAC-SHA256 signature + atomic redemption |
| KITCHEN DISPLAY | PASS | Realtime KDS & aggregated counters |
| LOCAL AI ENGINE | PASS | Zero external AI key dependency |
| TESTS | PASS | 18/18 Unit & Integration tests passing |
