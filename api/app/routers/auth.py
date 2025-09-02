"""
Authentication router with login and OTP endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import timedelta

from ..security import (
    authenticate_user, 
    create_access_token, 
    verify_token,
    generate_otp_code,
    store_otp,
    verify_otp
)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: Dict[str, Any]

class OwnerOTPInitRequest(BaseModel):
    phone: str

class OwnerEmailOTPInitRequest(BaseModel):
    email: EmailStr

class OwnerEmailOTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str

class OwnerOTPInitResponse(BaseModel):
    message: str
    expires_in_minutes: int

class OwnerOTPVerifyRequest(BaseModel):
    phone: str
    code: str

class OwnerOTPVerifyResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: Dict[str, Any]

# Authentication Dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    print(f"🔍 Token verification - Token: {token[:20]}...")
    print(f"🔍 Token payload: {payload}")
    
    if payload is None:
        print("❌ Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Token verified for user: {payload.get('email', payload.get('sub'))}")
    return payload

async def get_admin_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to ensure user has admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_owner_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to ensure user has owner role"""
    print(f"🔍 Checking owner role for user: {current_user}")
    
    if current_user.get("role") != "owner":
        print(f"❌ Access denied - User role: {current_user.get('role')}, required: owner")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required"
        )
    
    print(f"✅ Owner access granted for: {current_user.get('email', current_user.get('sub'))}")
    return current_user

# Authentication Endpoints
@router.options("/login")
async def login_options():
    """Handle preflight OPTIONS request for login"""
    return {"message": "OK"}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Admin login with email and password"""
    user = authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "email": user["email"], 
            "role": user["role"],
            "full_name": user["full_name"]
        },
        expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_info=user
    )

@router.post("/owner/otp-init", response_model=OwnerOTPInitResponse)
async def owner_otp_init(request: OwnerOTPInitRequest):
    """Initialize OTP for owner login"""
    # Generate OTP code
    otp_code = generate_otp_code()
    
    # Store OTP (in production, this would have proper expiration)
    store_otp(request.phone, otp_code)
    
    # Print to console (in production, this would send SMS)
    print(f"")
    print(f"🔐 OTP LOGIN CODE")
    print(f"=" * 30)
    print(f"Phone: {request.phone}")
    print(f"Code:  {otp_code}")
    print(f"Valid for: 5 minutes")
    print(f"=" * 30)
    print(f"")
    
    return OwnerOTPInitResponse(
        message=f"OTP sent to {request.phone}. Check console for code.",
        expires_in_minutes=5
    )

@router.post("/owner/otp-verify", response_model=OwnerOTPVerifyResponse)
async def owner_otp_verify(request: OwnerOTPVerifyRequest):
    """Verify OTP and return owner JWT"""
    # Verify OTP code
    if not verify_otp(request.phone, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code"
        )
    
    # Create owner token with limited scope
    access_token_expires = timedelta(minutes=15)  # Shorter expiry for owner tokens
    access_token = create_access_token(
        data={
            "sub": request.phone,
            "phone": request.phone,
            "role": "owner",
            "scope": "tracking"  # Limited scope for owners
        },
        expires_delta=access_token_expires
    )
    
    user_info = {
        "phone": request.phone,
        "role": "owner",
        "scope": "tracking"
    }
    
    return OwnerOTPVerifyResponse(
        access_token=access_token,
        token_type="bearer",
        user_info=user_info
    )


@router.post("/owner/email-otp-init", response_model=OwnerOTPInitResponse)
async def owner_email_otp_init(request: OwnerEmailOTPInitRequest):
    """Initialize OTP for owner login via email"""
    # Generate OTP code
    otp_code = generate_otp_code()
    
    # Store OTP (in production, this would send real email)
    store_otp(request.email, otp_code)
    
    # For development, print to console
    print(f"")
    print(f"🔐 OWNER EMAIL OTP")
    print(f"=" * 30)
    print(f"Email: {request.email}")
    print(f"Code:  {otp_code}")
    print(f"Valid for: 5 minutes")
    print(f"=" * 30)
    print(f"")
    
    return OwnerOTPInitResponse(
        message=f"OTP sent to {request.email}. Code: {otp_code} (DEV MODE)",
        expires_in_minutes=5
    )


@router.post("/owner/email-otp-verify", response_model=OwnerOTPVerifyResponse)
async def owner_email_otp_verify(request: OwnerEmailOTPVerifyRequest):
    """Verify email OTP and return owner JWT"""
    # Verify OTP code
    if not verify_otp(request.email, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code"
        )
    
    # Create owner token with limited scope
    access_token_expires = timedelta(minutes=15)  # Shorter expiry for owner tokens
    access_token = create_access_token(
        data={
            "sub": request.email,
            "email": request.email,
            "role": "owner",
            "scope": "tracking"  # Limited scope for owners
        },
        expires_delta=access_token_expires
    )
    
    user_info = {
        "email": request.email,
        "role": "owner",
        "scope": "tracking"
    }
    
    return OwnerOTPVerifyResponse(
        access_token=access_token,
        token_type="bearer",
        user_info=user_info
    )
