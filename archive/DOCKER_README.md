# TraceLite Docker Setup

This guide explains how to run TraceLite using Docker for development, testing, and production deployment.

## Prerequisites

### 1. Install Docker Desktop
- **Windows/Mac:** Download from https://www.docker.com/products/docker-desktop
- **Linux:** Install Docker Engine and Docker Compose
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  ```

### 2. Verify Installation
```bash
docker --version
docker compose version
```

### 3. Clone Repository
```bash
git clone https://github.com/nvijayanand79/tracklite.git
cd tracklite
```

## Quick Start (Production Demo)

1. **Clone and start the application:**
```bash
git clone https://github.com/nvijayanand79/tracklite.git
cd tracklite

# Docker Compose V2 (recommended)
docker compose up --build

# OR Docker Compose V1 (if V2 not available)
docker-compose up --build
```

2. **Access the application:**
- **Frontend:** http://localhost (port 80)
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

3. **Test the setup (optional):**
```bash
# Windows
./test-docker.bat

# Linux/Mac
chmod +x test-docker.sh
./test-docker.sh
```

## Demo Data

The application automatically initializes with demo data including:

### Sample Tracking IDs
- `RCP-001` / `LAB-2024-001` (Water Quality Testing)
- `RCP-002` / `LAB-2024-002` (Soil Contamination Analysis)  
- `RCP-003` / `LAB-2024-003` (Air Quality Monitoring)

### Demo Login Credentials
- **Email:** `contact@acme.com` (OTP: `123456`)
- **Email:** `lab@techstart.com` (OTP: `123456`)
- **Email:** `samples@greenenergy.com` (OTP: `123456`)

## Development Setup

For development with hot reload:

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up --build

# Access at:
# - Frontend: http://localhost:5173
# - API: http://localhost:8000
```

## Testing the Application

### 1. Public Tracking (No Login Required)
1. Go to http://localhost
2. Enter any tracking ID: `RCP-001`, `LAB-2024-001`, etc.
3. View shipment timeline and status

### 2. Owner Portal (Login Required)
1. Click "Owner Login" 
2. Enter email: `contact@acme.com`
3. Enter OTP: `123456`
4. Access:
   - **Track Tab:** Search your shipments
   - **My Documents:** Download reports and invoices
   - **Notifications:** Manage preferences

### 3. Document Downloads
- **Reports:** PDF downloads with lab test details
- **Invoices:** PDF downloads with billing information

## Architecture

### Services
- **API Service:** FastAPI backend with SQLite database
- **Web Service:** React frontend with Nginx (production) or Vite dev server

### Volumes
- **api_data:** Persistent SQLite database storage
- **Development:** Hot reload with mounted source code

## Configuration

### Environment Variables
- `DATABASE_URL`: SQLite database connection
- `SECRET_KEY`: JWT token encryption key
- `INIT_DEMO_DATA`: Auto-initialize demo data (true/false)
- `VITE_API_BASE_URL`: Frontend API endpoint

### Production Customization
1. **Update secrets:** Change `SECRET_KEY` in docker-compose.yml
2. **Domain configuration:** Update nginx.conf for your domain
3. **HTTPS setup:** Add SSL certificates and update nginx config
4. **Database:** Switch to PostgreSQL for production scale

## Database Management

### Reset Demo Data
```bash
# Stop containers
docker-compose down

# Remove data volume
docker volume rm tracklite_api_data

# Restart (will reinitialize demo data)
docker-compose up --build
```

### Backup Database
```bash
# Copy database from container
docker cp tracklite_api_1:/app/data/tracklite.db ./backup-$(date +%Y%m%d).db
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change ports in docker-compose.yml if 80/8000 are in use
   - Use `docker-compose.dev.yml` for port 5173

2. **Database issues:**
   - Reset volumes: `docker-compose down -v`
   - Check logs: `docker-compose logs api`

3. **Build failures:**
   - Clean build: `docker-compose build --no-cache`
   - Check Dockerfile syntax

### Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs api
docker-compose logs web

# Follow logs
docker-compose logs -f
```

## API Endpoints

### Public Endpoints
- `GET /` - Health check
- `POST /owner/track` - Public shipment tracking

### Authenticated Endpoints (Owner Portal)
- `POST /auth/owner-email-otp-init` - Initialize OTP
- `POST /auth/owner-email-otp-verify` - Verify OTP and login
- `GET /owner/documents` - List customer documents
- `GET /owner/reports/{id}/download` - Download report PDF
- `GET /owner/invoices/{id}/download` - Download invoice PDF

## Development Workflow

### Making Changes
1. **API changes:** Edit files in `./api/app/` (auto-reload in dev mode)
2. **Frontend changes:** Edit files in `./web/src/` (hot reload in dev mode)
3. **Database changes:** Update models and run migrations

### Adding New Demo Data
1. Edit `./api/demo_data/init_demo.py`
2. Reset database: `docker-compose down -v`
3. Restart: `docker-compose up --build`

### Production Deployment
1. Update `SECRET_KEY` and other secrets
2. Configure domain/SSL in nginx.conf
3. Use production compose: `docker-compose up -d --build`
4. Set up reverse proxy/load balancer as needed

## Support

For issues or questions:
1. Check logs with `docker-compose logs`
2. Verify demo data initialization completed
3. Ensure all ports are available
4. Try clean rebuild: `docker-compose down -v && docker-compose up --build`
