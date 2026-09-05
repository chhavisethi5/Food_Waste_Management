# ShareMeal — Commercial Food Recovery & Redistribution Network

A full-stack, real-time logistics platform designed to divert surplus edible food from commercial kitchens and licensed restaurants directly to verified local shelters and non-profits prior to spoilage.

Unlike standard e-commerce or CRUD applications, ShareMeal operates on a strict **time-to-live (TTL) reservation state machine**, enforcing food-safety temperature compliance and geospatial proximity routing.


## 🛠️ Architecture & Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy ORM, Pydantic v2
- **Database:** PostgreSQL / SQLite (Indexed spatial & status queries)
- **Real-Time Communication:** Native WebSockets (Bidirectional connection management)
- **Reporting & Document Streaming:** ReportLab (Headless binary PDF generation)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Authentication & Security:** JWT (Access Tokens), Role-Based Access Control (RBAC), Passlib (Bcrypt hashing)


##  Core Engineering Features

### 1. Verification Handshake Protocol (Physical Handover Lock)
To prevent phantom claims and ensure volunteer arrival:
- Reserving an available listing generates a short-lived **4-digit numeric PIN** accessible solely by the recipient NGO.
- At the time of physical handover, the donor enters this PIN into the Donor Portal.
- The backend executes an atomic verification transaction: on PIN match, status transitions from `Reserved` to `Collected`.

### 2. Time-To-Live (TTL) Lifecycle & Automated Expiration Worker
- Food items are strictly bounded by freshness windows based on handling conditions.
- A background scheduler evaluates active reservations:
  - Listings uncollected beyond their reservation window automatically forfeit the reservation lock and re-queue into the public feed.
  - Batches past their absolute cutoff time automatically transition to `Expired` status.

### 3. Food Safety & Temperature Storage Compliance
- Implemented **Pydantic `@field_validator` and `@model_validator` logic** enforcing hygiene compliance before writes reach SQL:
  - **Hot Holding (>60°C):** Capped at a strict 4-hour distribution window.
  - **Refrigerated (<5°C):** Capped at 6 hours.
  - **Ambient / Dry:** Capped at 24 hours.
- NGOs must provide a transport acknowledgment before locking the reservation.

### 4. Geospatial Proximity & Radius Filtering
- Donor physical addresses and coordinates (`lat`, `lng`) are anchored once at profile registration.
- Haversine mathematical queries execute on the backend (`/listings?user_lat=...&user_lng=...&radius_km=X`) to filter batches dynamically based on the volunteer's current GPS position.

### 5. Event-Driven Real-Time Sync (WebSockets)
- Utilizes an in-memory `ConnectionManager` to broadcast lifecycle events across active sessions:
  - `LISTING_CREATED`: Injects fresh batches immediately into the NGO Feed.
  - `LISTING_RESERVED`: Updates status pills across both portals without polling.
  - `LISTING_COLLECTED`: Flips cards into verified completion states.

### 6. Dynamic ESG & Carbon Offset Reporting
- Calculates verifiable environmental impact using international food loss baselines:
  - **Meals Served:** $\text{Quantity (kg)} \div 0.42\text{ kg/meal}$
  - **Emissions Offset:** $\text{Quantity (kg)} \times 2.5\text{ kg CO}_2\text{e}$
- Directly compiles and streams downloadable monthly PDF certificates via FastAPI binary file responses.

---

##  Project Structure

```text
sharemeal/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, JWT, WebSockets ConnectionManager
│   │   ├── models/         # SQLAlchemy database models (User, Listing, Claim)
│   │   ├── routers/        # API route handlers (Auth, Listings, Claims, Analytics)
│   │   ├── schemas/        # Pydantic validation schemas & business invariants
│   │   ├── services/       # PDF generation (ReportLab) & Geo calculation utilities
│   │   └── main.py         # App factory, CORS, and background worker scheduler
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/     # Modals, Navbar, Status badges
    │   ├── hooks/          # useWebSocketUpdates, Geolocation hooks
    │   ├── pages/          # LandingPage, DonorDashboard, NgoFeed, Login
    │   └── App.tsx         # Route orchestration & RBAC route guards
    ├── package.json
    └── tailwind.config.js

```

##  Getting Started

### Backend Setup

1. Navigate to `/backend`:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

```


2. Install dependencies:
```bash
pip install -r requirements.txt

```


3. Run the development server:
```bash
uvicorn app.main:app --reload --port 8000

```


*FastAPI Interactive Docs will be live at `http://localhost:8000/docs`.*

### Frontend Setup

1. Navigate to `/frontend`:
```bash
cd frontend
npm install

```


2. Launch the client:
```bash
npm run dev

```


*Application will be available at `http://localhost:5173`.*

---

##  API Endpoints (Highlights)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register Donor (with address) or NGO |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/listings` | Public/NGO | Fetch active listings with optional radius filter |
| `POST` | `/listings` | Donor | Create surplus batch (inherits donor location) |
| `POST` | `/listings/{id}/reserve` | NGO | Claim food & generate 4-digit pickup PIN |
| `POST` | `/listings/{id}/verify-pickup` | Donor | Input NGO PIN to finalize handover |
| `GET` | `/donors/impact-report` | Donor | Stream dynamic ESG Impact PDF certificate |
| `WS` | `/ws/updates` | Authenticated | Live bidirectional status broadcasting |

```

```
