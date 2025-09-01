# TrackLite - Laboratory Sample Tracking System

A modern web application for tracking laboratory samples through the testing process, built with FastAPI and React.

## 🚀 Quick Demo (Windows)

**One-click setup and launch:**
```bash
start-demo.bat
```

This will automatically:
- Install all Python and Node.js dependencies
- Create and seed the demo database
- Launch both API and web application
- Display access URLs

**Access the demo:**
- **Web App:** [http://localhost:5173](http://localhost:5173)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

📖 **For complete demo instructions and functionalities, see [DEMO_GUIDE.md](DEMO_GUIDE.md)**

---

## 📋 Requirements

- **Python 3.12+**
- **Node.js 20+**
- **npm 10+**

---

## 🛠️ Manual Setup (if needed)

### 1. Install API Dependencies
```bash
setup.bat
```

### 2. Install Web Dependencies
```bash
cd web
npm install
cd ..
```

### 3. Seed Demo Data (optional)
```bash
cd api
.venv\Scripts\activate
python ..\scripts\seed_demo.py
cd ..
```

### 4. Start Services Manually
```bash
# Terminal 1 - API
cd api
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Web
cd web
npm run dev
```

---

## 🐳 Codespaces/WSL/Linux

### Quick Setup
```bash
bash .devcontainer/setup.sh
```

### Manual Start
```bash
# Terminal 1 - API
cd api && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Web
cd web && npm run dev -- --host
```

---

## 🎯 Core Features

- **Owner Tracking Portal** - Real-time sample tracking for customers
- **Receipt Management** - Digital receipts for lab submissions
- **Lab Test Management** - Track test progress and results
- **Report Generation** - Automated PDF reports
- **Invoice Processing** - Billing and payment tracking
- **REST API** - Full API with OpenAPI documentation

---

## 📊 Demo Data

Pre-populated with sample customers and tracking IDs for immediate testing:
- Sample customers: Alice Demo, Bob Demo, Charlie Demo
- Tracking IDs: RCP-001, RCP-002, RCP-003
- Demo login: contact@acme.com (OTP: 123456)

---

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:
```bash
cp .env.example .env
```

For demo purposes, the default values work out of the box.

---

## 🚨 Troubleshooting

- **Module not found errors:** Re-run `setup.bat` or `start-demo.bat`
- **Port conflicts:** Ensure ports 5173 and 8000 are available
- **Database issues:** Delete `demo.db` and re-run setup

---

## 📚 Documentation

- **[DEMO_GUIDE.md](DEMO_GUIDE.md)** - Complete demo walkthrough and testing instructions
- **[API Documentation](http://localhost:8000/docs)** - Interactive API documentation (when running)

---

## 🏗️ Architecture

- **Backend:** FastAPI with async support
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Database:** SQLite (easily upgradable to PostgreSQL)
- **API:** RESTful with OpenAPI/Swagger documentation
- **Development:** Hot reload for both frontend and backend

---

**Ready to demo? Run `start-demo.bat` and see [DEMO_GUIDE.md](DEMO_GUIDE.md) for detailed instructions!**
# TrackLite - Laboratory Sample Tracking System

A modern web application for tracking laboratory samples through the testing process, built with FastAPI and React.

## 🚀 Quick Demo (Windows)

**One-click setup and launch:**
```bash
start-demo.bat
```

This will automatically:
- Install all Python and Node.js dependencies
- Create and seed the demo database
- Launch both API and web application
- Display access URLs

**Access the demo:**
- **Web App:** [http://localhost:5173](http://localhost:5173)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

📖 **For complete demo instructions and functionalities, see [DEMO_GUIDE.md](DEMO_GUIDE.md)**

---

## 📋 Requirements

- **Python 3.12+**
- **Node.js 20+**
- **npm 10+**

---

## 🛠️ Manual Setup (if needed)

### 1. Install API Dependencies
```bash
setup.bat
```

### 2. Install Web Dependencies
```bash
cd web
npm install
cd ..
```

### 3. Seed Demo Data (optional)
```bash
cd api
.venv\Scripts\activate
python ..\scripts\seed_demo.py
cd ..
```

### 4. Start Services Manually
```bash
# Terminal 1 - API
cd api
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Web
cd web
npm run dev
```
---

## 🐳 Codespaces/WSL/Linux

### Quick Setup
```bash
bash .devcontainer/setup.sh
```

### Manual Start
```bash
# Terminal 1 - API
cd api && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Web
cd web && npm run dev -- --host
```

---

## 🎯 Core Features

- **Owner Tracking Portal** - Real-time sample tracking for customers
- **Receipt Management** - Digital receipts for lab submissions
- **Lab Test Management** - Track test progress and results
- **Report Generation** - Automated PDF reports
- **Invoice Processing** - Billing and payment tracking
- **REST API** - Full API with OpenAPI documentation

---

## 📊 Demo Data

Pre-populated with sample customers and tracking IDs for immediate testing:
- Sample customers: Alice Demo, Bob Demo, Charlie Demo
- Tracking IDs: RCP-001, RCP-002, RCP-003
- Demo login: contact@acme.com (OTP: 123456)

---

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:
```bash
cp .env.example .env
```

For demo purposes, the default values work out of the box.

---

## 🚨 Troubleshooting

- **Module not found errors:** Re-run `setup.bat` or `start-demo.bat`
- **Port conflicts:** Ensure ports 5173 and 8000 are available
- **Database issues:** Delete `demo.db` and re-run setup

---

## 📚 Documentation

- **[DEMO_GUIDE.md](DEMO_GUIDE.md)** - Complete demo walkthrough and testing instructions
- **[API Documentation](http://localhost:8000/docs)** - Interactive API documentation (when running)

---

## 🏗️ Architecture

- **Backend:** FastAPI with async support
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Database:** SQLite (easily upgradable to PostgreSQL)
- **API:** RESTful with OpenAPI/Swagger documentation
- **Development:** Hot reload for both frontend and backend

---

**Ready to demo? Run `start-demo.bat` and see [DEMO_GUIDE.md](DEMO_GUIDE.md) for detailed instructions!**