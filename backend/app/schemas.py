from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models import Role, AttendanceType


# ---------- Auth ----------

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=1, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool
    role: Role


class PasswordChangeRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


# ---------- Sites ----------

class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_m: int = Field(default=150, ge=20, le=5000)


class SiteOut(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    radius_m: int

    model_config = ConfigDict(from_attributes=True)


# ---------- Users ----------

USERNAME_PATTERN = r"^[a-zA-Z0-9_.]{3,60}$"

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    username: str = Field(pattern=USERNAME_PATTERN)
    password: str = Field(min_length=6, max_length=128)
    site_ids: list[int] = Field(default_factory=list) # <-- Changed to a list!

    @field_validator("username")
    @classmethod
    def lowercase_username(cls, v: str) -> str:
        return v.lower()

class UserOut(BaseModel):
    id: int
    name: str
    username: str
    role: Role
    must_change_password: bool
    sites: list[SiteOut] = Field(default_factory=list) # <-- Changed to output a list of full sites!
    model_config = ConfigDict(from_attributes=True)

class PasswordResetOut(BaseModel):
    username: str
    temporary_password: str


# ---------- Attendance ----------

class AttendanceMarkRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class AttendanceOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    site_id: int
    type: AttendanceType
    timestamp: datetime
    record_date: date
    distance_m: float

    model_config = ConfigDict(from_attributes=True)


class TodayStatus(BaseModel):
    user_id: int
    name: str
    username: str
    site_name: Optional[str] = None
    status: str  # "not_checked_in" | "checked_in" | "checked_out"
    last_time: Optional[datetime] = None
