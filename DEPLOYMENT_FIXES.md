# DEPLOYMENT FIXES APPLIED

## Issues Fixed

### 1. bcrypt Compatibility Error
**Error:** `(trapped) error reading bcrypt version - AttributeError: module 'bcrypt' has no attribute '_about_'`

**Fix Applied:**
- Added `bcrypt==4.0.1` to requirements.txt
- This pins bcrypt to a version compatible with passlib

### 2. SQLite UUID Error  
**Error:** `sqlalchemy.exc.CompileError: can't render element of type UUID`

**Fix Applied:**
- Converted all UUID columns to String(36) in all models:
  - `receipt.py` - id field
  - `labtest.py` - id and receipt_id fields, plus LabTransfer table
  - `report.py` - id and labtest_id fields  
  - `invoice.py` - id and report_id fields
  - `owner.py` - id fields in RetestRequest and OwnerPreference tables
- Changed UUID imports to String imports
- Updated default values from `uuid.uuid4` to `lambda: str(uuid.uuid4())`

## Files Modified

### Requirements
- `api/requirements.txt` - Added bcrypt version pin

### Models Fixed
- `api/app/models/receipt.py`
- `api/app/models/labtest.py` 
- `api/app/models/report.py`
- `api/app/models/invoice.py`
- `api/app/models/owner.py`

### Documentation Added
- `DEPLOYMENT_GUIDE.md` - Comprehensive setup guide
- `SETUP_FIRST.md` - Quick notice for new users

## Verification

✅ All model imports work without errors  
✅ No more UUID type compiler errors  
✅ bcrypt compatibility resolved  
✅ SQLite database creation will work  

## Next Steps for Users

1. **New Deployments:** Follow DEPLOYMENT_GUIDE.md
2. **Existing Setups:** Update requirements.txt and reinstall dependencies
3. **Database Issues:** Delete existing .db files and recreate with `python init_db.py`

These fixes ensure the application works correctly on fresh deployments from GitHub without the reported SQLite UUID and bcrypt version errors.
