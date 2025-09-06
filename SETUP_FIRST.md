# 🚨 DEPLOYMENT NOTICE

**If you're setting up TraceLite for the first time after cloning from GitHub:**

Please read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) first to avoid common setup issues.

## Known Issues Fixed in This Release:

✅ **bcrypt compatibility error** - Fixed by pinning bcrypt to version 4.0.1  
✅ **SQLite UUID error** - Fixed by converting all UUID fields to String(36)  
✅ **Database initialization issues** - Comprehensive setup instructions provided  

## Quick Setup:
1. Follow the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for your first setup
2. Then use the demo scripts in README.md for subsequent runs

This notice ensures you avoid the common deployment errors that occur when cloning this repository fresh.
