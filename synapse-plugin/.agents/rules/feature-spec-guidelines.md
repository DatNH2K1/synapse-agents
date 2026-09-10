# Feature Specification & Business Flow Guidelines (Fullstack & Background Services)

> [!IMPORTANT]
> **CRITICAL ENFORCEMENT**: Maintaining the living functional specification in `FEATURES.md` and `docs/features/*.md` is **MANDATORY** for any task or feature involving user interfaces (FE), backend APIs, background workers, scheduled cron jobs, queue consumers, webhooks, or event-driven services. Every feature that directly or indirectly impacts **business logic** MUST be documented with high granularity by the AI Agent.

This rule outlines the protocol for generating, modularizing, and updating the project's living Feature & Business Flow Specification across Frontend, Backend, and Background Services.

---

### 1. Distinction from Changelog

| Document                                 | Nature                                      | Purpose                                                                                                                                                            |
| :--------------------------------------- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`CHANGELOG.md`**                       | **Delta / Historical Log**                  | Documents _what changed_ in a specific branch/commit compared to `develop`/`main`.                                                                                 |
| **`FEATURES.md` + `docs/features/*.md`** | **Living State / Functional Specification** | Documents _how the system currently operates_, including UI buttons/flows, backend API contracts, cron triggers, queue processors, and background state mutations. |

---

### 2. Architecture & File Placement (Hub-and-Spoke)

All feature specification documents MUST be located at the root of the target repository containing the `.git` directory:

```text
<repository-git-root>/
├── FEATURES.md                       # Master Index: High-level overview & Module Table of Contents
└── docs/
    └── features/                     # Detailed modular specifications
        ├── 01-authentication.md      # UI screens, OAuth callbacks, Session/JWT lifecycle
        ├── 02-order-management.md    # Checkout UI, order state machine, payment webhooks
        ├── 03-billing-worker.md      # Cron jobs, recurring invoice generation, dunning flow
        ├── 04-inventory-sync.md      # SQS/Kafka consumers, third-party ERP sync, stock updates
        └── ...
```

- **Monorepo / Independent Sub-repositories**: If the workspace contains multiple independent Git repositories (e.g. `frontend/`, `backend/`, `worker/`), maintain `FEATURES.md` and `docs/features/` directly within each respective `.git` root.

---

### 3. Strict Relative Path Rule (CRITICAL)

- **Relative Paths ONLY**: All internal links between `FEATURES.md` and `docs/features/*.md` MUST use relative paths (e.g., `[Billing Worker](./docs/features/03-billing-worker.md)` or `[⬅ Back to Catalog](../../FEATURES.md)`).
- **Absolute Paths Prohibited**: NEVER write absolute file paths (such as `/Users/...`, `C:\...`, or `file:///...`) into any markdown or repository files.

---

### 4. Master Index Format (`FEATURES.md`)

The root `FEATURES.md` categorizes both User-Facing (FE) and Background/Core (BE/Worker) capabilities:

```markdown
# Product Feature Catalog & Business Flow Specifications

> Comprehensive functional specification and living flow documentation for [Project Name].

## 📌 Module Index

### 🖥️ User-Facing & Frontend Modules

| Module                    | Scope & Capabilities                                        | Status   | Detailed Specification                                                       |
| :------------------------ | :---------------------------------------------------------- | :------- | :--------------------------------------------------------------------------- |
| **01. Authentication**    | Login/Register UI, OAuth2, 2FA Modal, Password Reset        | `Stable` | [docs/features/01-authentication.md](./docs/features/01-authentication.md)   |
| **02. Orders & Checkout** | Cart Drawer, Voucher Engine, Stripe Elements, Order History | `Stable` | [docs/features/02-orders-checkout.md](./docs/features/02-orders-checkout.md) |

### ⚙️ Backend, Workers & Background Services

| Service / Worker           | Trigger & Execution Scope                                        | Status   | Detailed Specification                                                             |
| :------------------------- | :--------------------------------------------------------------- | :------- | :--------------------------------------------------------------------------------- |
| **03. Billing Worker**     | Cron (0 0 1 \* \*), Auto-generate monthly invoices & charge card | `Stable` | [docs/features/03-billing-worker.md](./docs/features/03-billing-worker.md)         |
| **04. Order Expiry Queue** | Redis Delay Queue (30 mins), Auto-cancels unpaid orders          | `Stable` | [docs/features/04-order-expiry-queue.md](./docs/features/04-order-expiry-queue.md) |
| **05. Payment Webhooks**   | Stripe `payment_intent.succeeded` event listener & state sync    | `Stable` | [docs/features/05-payment-webhooks.md](./docs/features/05-payment-webhooks.md)     |
```

---

### 5. Detailed Module Specification Formats

#### A. Format for Frontend / UI-Driven Modules (`docs/features/<fe-module>.md`)

```markdown
# Module: [UI Module Name]

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Screen: [Screen Name] (`/route-path`)

### A. UI Elements & Action Matrix

| Element Name          | Component Type | Visibility / Enabled Conditions | Interaction & Business Flow                                                                                                  |
| :-------------------- | :------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| **Email Input**       | Input Field    | Always visible                  | Validates email format on blur (`^.+@.+\..+$`). Displays error badge if invalid.                                             |
| **"Sign In" Button**  | Primary Button | Enabled when form is valid      | Calls `POST /api/v1/auth/login`. Displays loading spinner. Redirects to `/dashboard` on success; shows alert toast on error. |
| **"Forgot Password"** | Text Link      | Always visible                  | Opens Modal `#modal-forgot-password` (see Flow 1.2).                                                                         |

### B. Business & User Flows

#### Flow 1.1: Primary Action Flow (Happy Path)

1. User enters credentials and clicks **"Sign In"**.
2. System receives token -> Checks `profile_completed`. If false -> Redirects to `/onboarding`.

#### Flow 1.2: Edge Cases & Error Handling

- **Account Locked**: If failed attempts > 5 in 15 mins, disables submission button for 15 mins with countdown timer.
```

---

#### B. Format for Backend, Worker & Background Service Modules (`docs/features/<be-worker-module>.md`)

```markdown
# Service / Worker: [Service Name]

[⬅ Back to Feature Catalog](../../FEATURES.md)

## 1. Trigger & Scheduling Matrix

| Process / Job Name            | Trigger Mechanism   | Frequency / Event Source         | Idempotency Key / Lock                   |
| :---------------------------- | :------------------ | :------------------------------- | :--------------------------------------- |
| **Auto-Cancel Unpaid Orders** | Queue Job / Polling | Every 5 mins / Redis delay queue | `lock:order:cancel:{order_id}` (TTL 30s) |
| **Nightly Invoice Sync**      | Cron Schedule       | Daily at 02:00 UTC (`0 2 * * *`) | Database Advisory Lock / Redis lock      |
| **Stripe Webhook Consumer**   | HTTP Webhook        | `POST /api/v1/webhooks/stripe`   | Stripe Event ID (`evt_...`)              |

---

## 2. Business Flow & Processing Pipeline

### Process: [Process / Job Name]

#### A. Trigger & Pre-conditions

- **Trigger**: Order remains in `PENDING_PAYMENT` state after 30 minutes.
- **Pre-condition**: No active webhook lock for incoming payment.

#### B. Step-by-Step Execution Flow

1. **Query Candidates**: Worker fetches orders where `status = 'PENDING_PAYMENT'` AND `created_at <= NOW() - INTERVAL '30 MINUTES'`.
2. **State Transition**: Updates `orders.status` to `CANCELLED` with `cancellation_reason = 'PAYMENT_TIMEOUT'`.
3. **Inventory Release**: Emits event `inventory.release` with item SKU & quantity to replenish available stock.
4. **Customer Notification**: Pushes email notification template `ORDER_AUTO_CANCELLED` to notification queue.

#### C. Side Effects & External Integrations

- **Database**: Updates `orders` table and `order_logs` audit trail.
- **Cache/Queue**: Publishes event to Kafka/RabbitMQ/Redis `order-events` channel.
- **Third-Party APIs**: Calls ERP inventory endpoint `POST /erp/inventory/restock`.

#### D. Failure Handling, Retries & Dead Letter Queue (DLQ)

- **Retry Policy**: Exponential backoff (3 attempts: 5s, 30s, 2m).
- **DLQ**: After 3 failed attempts, routes payload to `dlq:orders:cancellation` and sends Slack alert to `#eng-alerts`.
```

---

### 6. AI Agent Lifecycle & Maintenance Rules

1. **Fullstack Scope Awareness**:
   - Do NOT restrict feature docs to visible UI. Whenever building or modifying background jobs, cron tasks, event listeners, webhooks, or API controllers, verify their business impact and document them in `docs/features/`.
2. **New Feature Implementation**:
   - Locate or create the corresponding `docs/features/<module>.md` (UI or Worker/Service).
   - Detail triggers, action matrices, step-by-step execution flows, side effects, and error handling.
   - Register the module in `FEATURES.md` using relative links.
3. **Feature Modification / Refactoring**:
   - If UI elements, API behavior, cron schedule, retry policy, or business logic changes, update the corresponding file in `docs/features/*.md` immediately.
4. **Feature Deprecation / Removal**:
   - Remove or mark deprecated background jobs and UI flows to ensure the specification remains the Single Source of Truth.

---

### 7. Cold Start & Legacy Project Adoption Protocol

When working on an existing or legacy repository where `FEATURES.md` does not yet exist, agents MUST follow this protocol:

1. **Default Mode: Incremental Adoption (Task-Scoped)**:
   - Do NOT perform an uncontrolled scan of the entire legacy codebase during normal feature/fix tasks (to avoid context overflow and hallucination).
   - **Step A**: Initialize the root `FEATURES.md` index template at the `.git` root.
   - **Step B**: Create `docs/features/<module>.md` specifically for the module, UI screen, or background worker touched by the current task.
   - **Step C**: Register that module into `FEATURES.md`. Unmodified legacy modules will be adopted incrementally as future tasks interact with them.
2. **Explicit Baseline Scan Mode (On User Request)**:
   - When the user explicitly requests to initialize or reverse-engineer the complete feature catalog for a legacy project:
     - Scan routing files, API controllers, page directories, and background job definitions to construct the comprehensive module index in `FEATURES.md`.
     - Prioritize generating granular `docs/features/*.md` specifications for core authentication and primary business workflows first.
