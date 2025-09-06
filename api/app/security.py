"""
Security utilities for JWT tokens and password hashing
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import os

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        print(f"🔍 Attempting to decode token: {token[:20]}...")
        print(f"🔍 Using SECRET_KEY: {SECRET_KEY[:10]}...")
        print(f"🔍 Using ALGORITHM: {ALGORITHM}")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token decoded successfully: {payload}")
        return payload
    except JWTError as e:
        print(f"❌ JWT Error: {e}")
        print(f"❌ Token that failed: {token}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error in token verification: {e}")
        return None

def generate_otp_code() -> str:
    """Generate a 6-digit OTP code"""
    # For development, always return 123456
    return "123456"

# Dummy user database (in production, this would be a real database)
DUMMY_USERS = {
    "admin@example.com": {
        "email": "admin@example.com",
        "hashed_password": get_password_hash("admin123"),
        "role": "admin",
        "full_name": "Administrator"
    }
}

# OTP storage (in production, this would be Redis or database with expiration)
otp_storage: Dict[str, Dict[str, Any]] = {}

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user with email and password"""
    user = DUMMY_USERS.get(email)
    if not user:
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    return {
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"]
    }

def store_otp(phone: str, code: str) -> None:
    """Store OTP code for a phone number with expiration"""
    otp_storage[phone] = {
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),  # 5 minute expiry
        "attempts": 0
    }

def verify_otp(phone: str, code: str) -> bool:
    """Verify OTP code for a phone number"""
    otp_data = otp_storage.get(phone)
    if not otp_data:
        return False
    
    # Check if expired
    if datetime.now(timezone.utc) > otp_data["expires_at"]:
        del otp_storage[phone]
        return False
    
    # Check attempts limit
    if otp_data["attempts"] >= 3:
        del otp_storage[phone]
        return False
    
    # Verify code
    if otp_data["code"] != code:
        otp_data["attempts"] += 1
        return False
    
    # Success - clean up
    del otp_storage[phone]
    return True
