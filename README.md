# MarFaNet - A Comprehensive Commission & Invoice Management System

## 1. Project Overview

MarFaNet is a robust, full-stack application designed to manage the complex financial relationships in a partner-agent sales model. It provides a centralized platform for administrators to manage sales partners, agents, and their associated financial data. The system automates the generation of invoices from usage data, tracks payments, manages agent wallets, and provides a clear financial overview.

### Core Features:
- **Comprehensive Agent & Partner Management:** Full CRUD (Create, Read, Update, Delete) operations for sales agents and their parent partners.
- **Automated Invoice Generation:** Ingests JSON usage data, validates it, and generates invoices for agents in atomic transactions to ensure data integrity.
- **Centralized Invoice & Payment Tracking:** Manages the entire lifecycle of invoices (from draft to paid) and tracks all payments, intelligently settling agent debts.
- **Agent Wallet System:** Each agent has a dedicated wallet for managing balances, deposits, and invoice settlements.
- **Robust Audit Trail:** Securely logs the user responsible for every critical financial transaction, ensuring full traceability.

---

## 2. Engineering Philosophy & Architecture

This project is built upon a set of rigorous engineering principles designed to ensure stability, maintainability, and scalability. Development is governed by a protocol that prioritizes **Systemic Stability Above All Else**.

### Key Architectural Principles:

1.  **Decoupled Service Pattern:** Core business logic is strictly separated from the web framework (Next.js). Logic is encapsulated in pure, portable TypeScript services (`src/lib/*-service.ts`). This makes the logic highly testable, reusable, and independent of UI concerns.
    -   **Example:** `PaymentService` contains the logic for processing payments, while the Next.js Server Action that calls it is merely a thin wrapper responsible for handling web requests and UI updates.

2.  **Guarded Context for Cross-Cutting Concerns:** For features like auditing that affect many parts of the system, we use a "Hybrid Context-Guard" pattern. It uses `AsyncLocalStorage` to implicitly pass context (e.g., the current user) down the call stack, but this is paired with an explicit guard function (`getRequiredAuditActor`) that throws a loud, immediate error if the context is missing. This prevents silent failures and ensures critical data is never lost.

3.  **Thin Controllers / Server Actions:** The entry points to the system (Next.js Server Actions) are kept "thin." Their job is to handle web-layer tasks like authentication and data validation, call the appropriate business logic service, and then perform UI-specific side effects, such as revalidating data (`revalidatePath`).

---

## 3. Technology Stack

- **Framework:** **Next.js 15+** (with App Router)
- **Language:** **TypeScript**
- **Styling:** **Tailwind CSS**
- **UI Components:** Built with **shadcn/ui**, providing a set of accessible and composable base components.
- **AI & Generative Flows:** **Google's Genkit** is used for tasks like validating and processing uploaded usage data (`src/ai/genkit.ts`).
- **Testing:** **Jest** and **ts-jest** for unit and integration testing.
- **Package Manager:** **npm**

---

## 4. Project Structure

The project follows a feature-oriented structure within the Next.js App Router paradigm.

```
/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Main authenticated application routes
│   │   │   ├── agents/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   └── ...
│   │   ├── portal/            # Public-facing portal for agents
│   │   └── layout.tsx         # Root layout
│   │
│   ├── lib/                   # CORE APPLICATION LOGIC
│   │   ├── data.ts            # Mock database and data access functions
│   │   ├── types.ts           # Centralized TypeScript types
│   │   ├── audit-context.ts   # Guarded Context for the Audit Trail
│   │   ├── invoice-service.ts # Business logic for invoices
│   │   ├── payment-service.ts # Decoupled business logic for payments
│   │   └── wallet-service.ts  # Business logic for agent wallets
│   │
│   ├── components/
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   └── page-header.tsx    # Reusable page header component
│   │
│   └── ai/                    # Genkit AI flows
│       ├── flows/
│       └── genkit.ts
│
├── docs/                      # Project documentation
│   └── blueprint.md           # Architectural and design blueprint
│
├── jest.config.js             # Jest configuration
└── package.json
```

---

## 5. Getting Started

### Prerequisites
- Node.js (v20.x or later)
- npm

### Installation
1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

- **Development Mode:** Starts the Next.js development server.
  ```bash
  npm run dev
  ```
- **Production Build:** Creates an optimized production build.
  ```bash
  npm run build
  ```
- **Start Production Server:** Runs the application from the production build.
  ```bash
  npm start
  ```

### Running Tests
Execute the entire test suite with:
```bash
npm test
```
To run a specific test file:
```bash
npm test -- src/lib/path/to/your.test.ts
```

---

## 6. Design System & UI

The user interface is designed to be professional, focused, and visually coherent, using a dark-mode theme.

### Color Palette
- **Primary Background:** Charcoal Dark (`#0d1117`)
- **Surface (Cards, Modals):** Gray-Navy Dark (`#161b22`)
- **Primary Action (Buttons, Links):** Vivid Blue (`#2563EB`)
- **Secondary Action:** Deep Purple (`#9333EA`)
- **Text (Primary):** Light Gray (`#c9d1d9`)
- **Text (Headings):** White
- **Borders/Separators:** Dark Gray (`border-gray-700`)
- **Success:** Green (`text-green-400`)
- **Warning:** Yellow (`text-yellow-400`)
- **Error/Debt:** Red (`text-red-400`)
- **Overdue:** Orange (`text-orange-400`)
- **Informational:** Cyan (`text-cyan-400`)

### Typography
- **Primary Font:** **Vazirmatn** (a modern, highly-readable Persian sans-serif font).
- **Monospace Font:** System Monospace (for IDs, dates, and tabular data).
