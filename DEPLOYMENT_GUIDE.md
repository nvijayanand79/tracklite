# TraceLite Deployment Guide

This guide provides step-by-step instructions for setting up TraceLite after cloning from GitHub.

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Git

## Quick Setup (Windows)

### 1. Clone the Repository
```bash
git clone https://github.com/nvijayanand79/tracklite.git
cd tracklite
```

### 2. Backend Setup

Navigate to the API directory:
```bash
cd api
```

Create a Python virtual environment:
```bash
python -m venv .venv
```

Activate the virtual environment:
```bash
# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Create environment file:
```bash
copy .env.example .env
# Edit .env file with your configuration
```

Initialize the database:
```bash
python init_db.py
```

### 3. Frontend Setup

Open a new terminal and navigate to the web directory:
```bash
cd web
```

Install Node.js dependencies:
```bash
npm install
```

## Running the Application

### Start Backend API (Terminal 1)
```bash
cd api
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (Terminal 2)
```bash
cd web
npm run dev
```

## Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Common Issues & Solutions

### Issue 1: bcrypt Version Error
```
(trapped) error reading bcrypt version
AttributeError: module 'bcrypt' has no attribute '_about_'
```

**Solution:** This is already fixed in the current requirements.txt with `bcrypt==4.0.1`. If you still encounter this:
```bash
pip uninstall bcrypt passlib
pip install bcrypt==4.0.1
pip install passlib[bcrypt]==1.7.4
```

### Issue 2: SQLite UUID Error
```
sqlalchemy.exc.CompileError: ... can't render element of type UUID
```

**Solution:** This is already fixed in the current models. All UUID fields have been converted to String(36) for SQLite compatibility.

### Issue 3: Database File Permissions
If you get permission errors with the database file:
```bash
# Remove existing database files
rm tracelite.db api/tracelite.db api/data/tracelite.db

# Recreate database
cd api
python init_db.py
```

### Issue 4: Port Already in Use
If ports 8000 or 5173 are already in use:
```bash
# For backend (change port)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# For frontend (change port)
npm run dev -- --port 5174
```

## Environment Configuration

### API Environment (.env file in /api)
```env
DATABASE_URL=sqlite:///./tracelite.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
```

### Frontend Environment (optional .env in /web)
```env
VITE_API_URL=http://localhost:8000
```

## Production Deployment

### Using Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Production Setup

#### Backend Production
```bash
cd api
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend Production
```bash
cd web
npm run build
# Serve dist/ folder with nginx or similar
```

## Database Migrations

If you need to make database schema changes:
```bash
cd api
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Testing

### Run Backend Tests
```bash
cd api
python -m pytest
```

### Run Frontend Tests
```bash
cd web
npm test
```

## Troubleshooting

### Clean Installation
If you encounter persistent issues:
```bash
# Remove virtual environment
rm -rf api/.venv

# Remove node modules
rm -rf web/node_modules

# Remove database files
rm -f api/tracelite.db api/demo.db

# Start fresh installation
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python init_db.py

cd ../web
npm install
```

### Get Help
- Check the console output for specific error messages
- Ensure all prerequisites are installed
- Verify environment variables are set correctly
- Check that ports 8000 and 5173 are available

## Development Notes

- The application uses SQLite by default for development
- All UUID fields are stored as String(36) for SQLite compatibility
- bcrypt is pinned to version 4.0.1 for compatibility with passlib
- The frontend uses Vite for development server
- API documentation is available at /docs endpoint

## Project Structure
```
tracklite/
├── api/                 # FastAPI backend
│   ├── app/            # Application code
│   ├── alembic/        # Database migrations
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── web/                # React frontend
│   ├── src/            # Source code
│   ├── package.json    # Node dependencies
│   └── vite.config.ts  # Vite configuration
└── README.md           # Project documentation
```
