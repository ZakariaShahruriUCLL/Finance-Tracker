# Finance Tracker

A cloud-native personal finance tracking application built on Microsoft Azure.

### Features

- **Authentication** — JWT-based register and login
- **Transactions** — create, edit, and delete income and expense entries with amount, date, description, and optional category; filter by type, category, month, and year
- **Categories** — predefined system categories and fully custom user-created categories (name, colour, emoji icon)
- **Receipt uploads** — attach a receipt image to any transaction; stored in Azure Blob Storage and accessed via time-limited SAS URLs
- **Dashboard** — real-time overview with six visualisations: all-time balance hero card, monthly stat cards (income, expenses, net balance, savings rate, avg daily spend), Income vs Expenses bar chart (last 6 months), Spending by Category donut chart, Monthly P&L with savings rate line, Daily Spending bar chart, and a Category Breakdown with progress bars
- **Budget alerts** — a configurable monthly spending limit; a warning banner appears on the dashboard when the limit is exceeded, driven by the Azure Service Bus event pipeline
- **Light / dark mode** — full theme switching with persistent CSS variables
- **Skeleton loaders** — loading states on all pages for a polished user experience

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Java 21, Spring Boot, Azure Functions |
| Database | Azure Cosmos DB (NoSQL) |
| Cache | Azure Cache for Redis |
| Messaging | Azure Service Bus |
| File Storage | Azure Blob Storage |
| Secrets | Azure Key Vault |
| Monitoring | Azure Application Insights |
| Infrastructure | Azure Bicep (IaC) |
| CI/CD | GitHub Actions |

---

## Architecture Decisions

**Azure Cosmos DB over relational SQL** — Transactions and categories are always read and written per user. Partitioning both containers by `/userId` means every query hits a single logical partition, making reads fast without joins. The schemaless model also allows category fields (name, colour, icon) to be embedded directly on each transaction document, eliminating the need for a join at query time.

**Azure Cache for Redis** — Balance, monthly summary, and category breakdown are aggregation queries over potentially thousands of documents per user. These are expensive to recompute on every dashboard load. Spring's `@Cacheable` caches results keyed by `userId + month + year`, and `@CacheEvict` invalidates the relevant entries on any write. This keeps dashboard load times consistently fast for returning users.

**Azure Service Bus (pub/sub) over direct HTTP calls** — Every transaction write publishes an event to a Service Bus topic. Two independent subscribers consume it: `audit-log` records every change for traceability, and `budget-alert` recalculates monthly spending and warns when the user exceeds their configured limit. This decouples the write path from monitoring concerns — a slow or failing budget check cannot block the user's transaction from saving.

**Azure Blob Storage for receipts** — Receipts are stored as blobs and accessed via time-limited SAS URLs (1-hour expiry). This avoids serving binary files through the API, keeps the Function App stateless, and means the frontend can link directly to Azure's CDN-backed storage endpoints.

**Azure Key Vault for secrets** — All sensitive configuration (Cosmos DB key, Redis password, JWT signing secret, Service Bus connection string) is stored in Key Vault and referenced via `@Microsoft.KeyVault(SecretUri=...)` in the Function App's app settings. The Function App authenticates using a user-assigned Managed Identity, so no credentials are stored in deployment templates or environment variables.

**Azure Functions (Consumption plan) over a dedicated App Service** — The API has variable load — mostly idle outside of active sessions. The Consumption plan scales to zero and charges only for actual invocations, making it cost-effective for a project with unpredictable traffic. Spring Boot starts on port 8081 inside the Function worker and all HTTP triggers proxy through to it, so the full Spring MVC stack is available without rewriting controllers.

---

## Prerequisites

- Node.js 18+
- Java 21 (JDK)
- Maven 3.8+
- Azure Functions Core Tools v4
- Azure CLI (for infrastructure deployment)

---

## Running Locally

### 1. Backend

The backend runs as an Azure Function locally on port **7071**.

Create `backend/local.settings.json` with the following structure:

```json
{
    "IsEncrypted": false,
    "Values": {
        "AzureWebJobsStorage": "<your-storage-connection-string>",
        "FUNCTIONS_WORKER_RUNTIME": "java",
        "AZURE_COSMOS_ENDPOINT": "<your-cosmos-endpoint>",
        "AZURE_COSMOS_KEY": "<your-cosmos-key>",
        "JWT_SECRET": "<your-jwt-secret>",
        "AZURE_STORAGE_CONNECTION_STRING": "<your-storage-connection-string>",
        "REDIS_HOST": "<your-redis-host>",
        "REDIS_PORT": "6380",
        "REDIS_PASSWORD": "<your-redis-password>",
        "REDIS_SSL": "true",
        "SERVICE_BUS_CONNECTION_STRING": "<your-service-bus-connection-string>",
        "BUDGET_MONTHLY_LIMIT": "500.0",
        "FRONTEND_URL": "http://localhost:5173"
    }
}
```

Then start the backend:

```bash
cd backend
mvn clean package -DskipTests
mvn azure-functions:run
```

The API will be available at `http://localhost:7071/api`.

### 2. Frontend

The frontend runs on port **5173** and proxies all `/api` requests to the backend at port 7071.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
├── backend/
│   ├── src/main/java/com/financetracker/
│   │   ├── controller/       # REST controllers
│   │   ├── service/          # Business logic + caching
│   │   ├── listener/         # Service Bus subscribers (audit, budget alert)
│   │   ├── model/            # Cosmos DB entity models
│   │   ├── repository/       # Cosmos DB repositories
│   │   ├── security/         # JWT auth + Spring Security
│   │   └── dto/              # Request/response DTOs
│   ├── local.settings.json   # Local environment variables (gitignored)
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API client
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Route pages
│   │   ├── styles/           # CSS variables and glass styles
│   │   └── types/            # TypeScript interfaces
│   ├── vite.config.ts
│   └── package.json
└── infrastructure/
    ├── main.bicep             # Root Bicep template
    ├── main.bicepparam        # Parameters (gitignored)
    └── modules/
        ├── appinsights.bicep  # Log Analytics + Application Insights
        ├── cosmos.bicep       # Cosmos DB account, database, containers
        ├── functionapp.bicep  # Function App, managed identity, app settings
        ├── keyvault.bicep     # Key Vault, secrets, RBAC role assignment
        ├── redis.bicep        # Azure Cache for Redis
        ├── servicebus.bicep   # Service Bus namespace, topic, subscriptions
        └── storage.bicep      # Blob Storage, static website hosting
```

---

## Infrastructure Deployment

All Azure resources are defined as Bicep templates in `infrastructure/`. The deployment order is managed automatically by Bicep based on module dependencies: storage, Cosmos DB, Redis, and Service Bus deploy in parallel; Application Insights deploys independently; the Function App deploys next (creating its managed identity); Key Vault deploys last, granting the managed identity access and storing all secrets.

```bash
az login
az group create --name <resource-group> --location <location>
az deployment group create \
  --resource-group <resource-group> \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/main.bicepparam
```

---

## CI/CD

GitHub Actions workflows are defined in `.github/workflows/`:

- `deploy-backend.yml` — builds the Maven project and deploys to Azure Functions on every push to `main` that touches `backend/`
- `deploy-frontend.yml` — builds the Vite app and uploads to the Azure Blob Storage static website on every push to `main` that touches `frontend/`

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/transactions` | List transactions (filterable by type, category, month, year) |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/transactions/balance` | All-time income/expense balance |
| GET | `/api/transactions/summary` | Monthly income, expenses, and net balance |
| GET | `/api/transactions/category-breakdown` | Spending breakdown by category for a given month |
| GET | `/api/transactions/budget-status` | Whether monthly spending has exceeded the configured limit |
| GET | `/api/transactions/:id/receipt-url` | Generate a time-limited SAS URL for a receipt |
| GET | `/api/categories` | List all categories (custom + predefined) |
| POST | `/api/categories` | Create a custom category |
| PUT | `/api/categories/:id` | Update a custom category |
| DELETE | `/api/categories/:id` | Delete a custom category |
| POST | `/api/upload` | Upload a receipt image (base64-encoded) |
