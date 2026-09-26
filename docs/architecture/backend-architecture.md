# CraveCanteen Backend Architecture

## Pipeline & Flow
```
Request -> Route -> Middleware -> Controller -> Service -> DB / External API -> Response
```

## Modular Components (`backend/src/`)
- `config/`: Environment loading (`env.ts`), Firebase setup (`firebase.ts`).
- `middleware/`:
  - `auth.middleware.ts`: Token verification
  - `role.middleware.ts`: Role-Based Access Control (`STUDENT`, `STAFF`, `ADMIN`)
  - `rateLimit.middleware.ts`: Request rate limiting (100 req/min per IP)
  - `validation.middleware.ts`: Body payload validation
  - `error.middleware.ts`: Global error handler
- `services/`:
  - `orders/`: Order processing, PDF generation, notification dispatch
  - `pdf/`: PDFKit PDF generation for receipts and financial reports
  - `notifications/`: Email service (Nodemailer) and WhatsApp service (Twilio/Mock)
  - `ai/`: Server-side Gemini integration
  - `auth/`, `menu/`, `users/`, `qr/`
- `controllers/`: Request handler functions (`order.controller.ts`, `auth.controller.ts`, `notification.controller.ts`, etc.)
- `routes/`: Modular Express routers (`order.routes.ts`, `auth.routes.ts`, `notification.routes.ts`, `report.routes.ts`, etc.)
- `app.ts` & `server.ts`: Express application setup and HTTP server startup script.
