# SORTOLOG IQ

> **Tagline:** From messy data to commerce-ready intelligence.  
> **Product Category:** Real-Data Industrial Product Data Enrichment & Quality Engine  
> **Status:** Production-Ready Real-Data Industrial Tool (Stateless Memory Architecture)

---

## 1. Executive Summary

**SORTOLOG IQ** is an industrial product data enrichment and quality engine built for real manufacturer and distributor datasets. Raw supplier catalog feeds from manufacturers and distributors are cryptic, abbreviated, unbranded, and incomplete.

SORTOLOG IQ ingests real user-provided product data (CSV, XLSX, PDF, Images) and transforms it into complete, standardized, search-ready product catalog records matching the **252-column Unilog delivery schema** during an active user session without requiring a persistent database.

---

## 2. Core Operational Flow

```text
Open SORTOLOG IQ
        ↓
Upload REAL CSV / Excel / PDF / Images
        ↓
Process REAL DATA
        ↓
Review REAL RESULTS
        ↓
Export REAL UNILOG OUTPUT
```

### Core Philosophy:
> **AI proposes. Rules validate. Evidence supports. Humans decide.**

The application explicitly separates **Semantic Intelligence** (Google Gemini API for taxonomy classification, attribute extraction, and multi-channel description synthesis) from **Deterministic Intelligence** (Python rules, LOV lookup tables, UOM space normalization, Pint standards, content validation, and auto-fix rules).

---

## 3. Privacy & Session Storage

* **Stateless Session Memory:** SORTOLOG IQ uses a stateless session architecture. No database or user account is required for MVP operation.
* **Real Customer Data Processing:** Product catalogues, review queues, audit logs, and evaluation states reside in active session memory during processing and export.
* **Automatic Cleanup:** Temporary files created during processing are automatically cleaned up when the session ends or expires.

---

## 4. Supported File Formats & Input Verification

The file ingestion engine supports:
* **CSV (`.csv`)** — Automatic encoding detection (UTF-8, Latin-1, CP1252) and flexible header mapping.
* **Excel (`.xlsx`, `.xls`)** — Sheet inspection, header matching, and row extraction.
* **PDF (`.pdf`)** — Technical specification document parsing and bounding box coordinate mapping.
* **Images (`.png`, `.jpg`, `.jpeg`)** — Product image bundle ingestion.

---

## 5. Backend Architecture

```text
backend/
├── app/
│   ├── main.py                   # FastAPI Application Entrypoint
│   ├── api/
│   │   ├── routes/               # API Routes (health, sessions, import, products, reviews, evaluation, analytics, evidence, export)
│   │   └── router.py
│   ├── core/                     # Config, Logging, Exceptions
│   ├── session/                  # In-Memory Session Engine (session_manager.py, session_models.py)
│   ├── schemas/                  # Pydantic Schemas (Product, Validation, Review, Evaluation)
│   ├── services/                 # Business Services (ingestion, processing, quality, review, export)
│   ├── enrichment/               # Manufacturer, Brand, Classification, Attributes, Descriptions
│   ├── ai/                       # Gemini AI Client, Prompts, Response Parser
│   ├── validation/               # Validation Engine, Rules, LOV, UOM, Content, Auto-Fix
│   ├── evaluation/               # Ground Truth Benchmark Evaluator & Discrepancy Matrix
│   ├── evidence/                 # PDF Bounding Box Coordinates & Document Resolver
│   └── storage/                  # Object Storage Temporary Storage Adapter
└── tests/
    ├── test_backend.py           # Backend Unit & Session Service Tests
    ├── test_api_endpoints.py     # FastAPI Session Route Integration Tests
    ├── test_e2e_pipeline.py     # End-to-End Session Workflow Tests
    └── test_scale_1000.py        # 1,000-Row In-Memory Scalability Tests
```

---

## 6. How to Run the Application

### 1. Environment & Dependencies Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your `GEMINI_API_KEY` or `WATSONX_API_KEY` (Optional; deterministic fallbacks run if key is omitted). Note that `.env` is protected and ignored by `.gitignore`.

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 2. Start Backend Server

From project root:
```bash
python run_backend.py
```

FastAPI documentation is available at `http://localhost:8000/docs`.

### 3. Start Frontend UI

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to access the SORTOLOG IQ web interface.

---

## 7. Quality Assurance & Automated Testing

### Running Backend & API Test Suite
To run all automated backend unit, API, e2e, and 1,000-row scale tests:

```bash
python -m pytest backend/tests
```

### Real File Upload Validation Suite
To run the real-file upload validation test script (CSV, XLSX, PDF, Image formats):

```bash
python scratch/test_real_file_upload.py
```

### Frontend Verification Suite
To verify all frontend files and components:

```bash
cd frontend
npm test
```

---

## 8. Deployment Readiness

* **Secrets & Credentials:** Sensitive environment variables (`.env`) are strictly protected via `.gitignore`.
* **Clean Build:** All temporary test cache files (`.pytest_cache`, `pytest-cache-files-*`), node_modules, and build outputs are excluded from repository tracking.
* **Production Build:**
  - Backend: Run with `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`
  - Frontend: Run `npm run build` and `npm start` inside `frontend/`

