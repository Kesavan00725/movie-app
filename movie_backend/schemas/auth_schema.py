from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    name: str
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class LogoutResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetResponse(BaseModel):
    message: str
    request_id: str

class OtpVerificationRequest(BaseModel):
    request_id: str
    otp: str

class OtpVerificationResponse(BaseModel):
    message: str
    request_id: str

class ResetPasswordRequest(BaseModel):
    request_id: str
    new_password: str