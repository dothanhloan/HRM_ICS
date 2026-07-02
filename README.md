# ICS HRMS

Monorepo layout for backend (FastAPI) and frontend (React).

## Prerequisites

- Node.js 18+
- Python 3.11+
- MySQL 8+

## Backend (FastAPI)

1. Create and activate a virtual environment (optional if already created):

```powershell
python -m venv .venv
& d:\HRM_ICS\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r backend\requirements.txt
```

If you do not have `requirements.txt`, install from `pyproject.toml`:

```powershell
pip install fastapi uvicorn[standard] sqlalchemy pymysql alembic
```

3. Set environment variables:

```powershell
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="123456"
$env:MYSQL_HOST="127.0.0.1"
$env:MYSQL_PORT="3306"
$env:MYSQL_DB="qlns"
```

4. Run backend:

```powershell
Set-Location d:\HRM_ICS\backend
d:/HRM_ICS/.venv/Scripts/python.exe -m uvicorn app.main:app --reload
```

Swagger UI:

- http://127.0.0.1:8000/docs

## Frontend (React + Vite)

1. Install dependencies:

```powershell
Set-Location d:\HRM_ICS\frontend
npm install
```

2. Run frontend:

```powershell
npm run dev
```

Frontend runs at:

- http://localhost:5173

## API base URL

Frontend reads `VITE_API_BASE_URL` (see [frontend/.env.example](frontend/.env.example)).
