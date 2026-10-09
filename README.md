# ShareMeal — Surplus Food Redistribution Platform

> A full-stack, real-time logistics platform connecting restaurants, bakeries, and commercial kitchens with local NGOs and shelters to eliminate food waste and fight local hunger prior to spoilage.

[![Live Demo](https://img.shields.io/badge/Demo-explore--sharemeal.vercel.app-00B27A?style=flat-square)](https://explore-sharemeal.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Tailwind-blue?style=flat-square)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11+-009688?style=flat-square)](https://fastapi.tiangolo.com/)

---

## Live Demo & Testing Accounts

Explore the live production deployment: **[https://explore-sharemeal.vercel.app](https://explore-sharemeal.vercel.app)**

Use these pre-configured test credentials to evaluate both perspectives:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Donor (Restaurant)** | `donor.demo@sharemeal.com` | `DemoPass123!` | Post surplus batches, verify recipient PINs, export ESG impact certificates |
| **NGO / Shelter** | `ngo.demo@sharemeal.com` | `DemoPass123!` | Filter nearby batches by GPS radius, 1-click reserve, view 4-digit pickup PIN |

---

## Key Features

- **Role-Based Access Control (RBAC):** Distinct workflows and authenticated views for Commercial Donors vs. Verified NGO Claimants via JWT claims.
- **Secure 4-Digit Handshake Protocol:** A transient 4-digit PIN generated upon reservation is held solely by the claiming NGO and must be physically verified by the donor to execute an atomic completion transaction.
- **Real-Time Bidirectional Sync (WebSockets):** Instant broadcast of `LISTING_CREATED`, `LISTING_RESERVED`, and `LISTING_COLLECTED` events across all active dashboards without page refreshes or polling.
- **Food Safety & Temperature Invariant Enforcement:** Pydantic validators enforce strict biological holding temperatures and dynamically cap maximum expiration windows (2h, 6h, 24h).
- **Geospatial Radius Queries:** Haversine distance computations execute on the backend (`/listings?user_lat=...&user_lng=...&radius_km=X`) to sort batches by driving distance from registered donor coordinates.
- **Automated TTL & Reservation Sweeper:** Asynchronous background tasks cancel expired reservation holds and automatically re-queue unclaimed batches.
- **ESG & Carbon Offset PDF Export:** Headless compilation and binary streaming of monthly impact certificates using ReportLab.

---

## Architecture & Tech Stack

```text
[ React 19 + TypeScript ]  ──(WebSockets / Axios)──►  [ FastAPI + Uvicorn ]  ──►  [ SQLite / PostgreSQL ]
         │                                                      │
    Vercel Host                                            Render Host
```

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS
- **Routing & Networking:** React Router v7, Axios (Bearer token interceptors), Native WebSocket hooks
- **Tooling:** Vite, Oxlint

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database ORM:** SQLAlchemy with auto-migrating relational models
- **Real-Time Engine:** Native WebSocket Connection Manager
- **Authentication:** OAuth2 password flow with `bcrypt` password hashing and JWT access tokens
- **Reporting:** ReportLab (Headless binary PDF generation and response streaming)
- **Async Workers:** AsyncIO scheduled background lifecycle sweepers

---

## Local Development Setup

### 1. Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/chhavisethi5/Food_Waste_Management.git
cd Food_Waste_Management/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
*API interactive documentation will be available at `http://localhost:8000/docs`.*

### 3. Frontend Setup
```bash
# In a new terminal window
cd Food_Waste_Management/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend will be running at `http://localhost:5173`.*

---

## API Endpoints (Highlights)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Registers Donor (with kitchen GPS) or NGO |
| `POST` | `/auth/login` | Public | Issues JWT access token |
| `GET` | `/listings` | Authenticated | Fetches available listings filtered by radius & category |
| `POST` | `/listings` | Donor | Posts surplus food with temperature & handling bounds |
| `POST` | `/listings/{id}/reserve` | NGO | Claims batch, locks TTL timer, and generates pickup PIN |
| `POST` | `/listings/{id}/verify-pickup` | Donor | Validates NGO PIN and completes physical handover |
| `GET` | `/donors/impact-report` | Donor | Streams generated monthly ESG Impact PDF certificate |
| `WS` | `/ws/updates` | Authenticated | Live event bus for real-time feed updates |
