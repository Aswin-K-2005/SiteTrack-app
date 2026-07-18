import enum
from datetime import datetime, date
from zoneinfo import ZoneInfo

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Enum
)
from sqlalchemy.orm import relationship

from app.database import Base


class Role(str, enum.Enum):
    admin = "admin"
    worker = "worker"


class AttendanceType(str, enum.Enum):
    check_in = "in"
    check_out = "out"


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_m = Column(Integer, nullable=False, default=150)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))

    users = relationship("User", back_populates="site")
    attendance_records = relationship("AttendanceRecord", back_populates="site")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    username = Column(String(60), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(Role), default=Role.worker, nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site = relationship("Site", back_populates="users")

    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))

    attendance_records = relationship("AttendanceRecord", back_populates="user",cascade="all,delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id",ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    type = Column(Enum(AttendanceType), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    record_date = Column(Date, default=date.today, nullable=False)
    distance_m = Column(Float, nullable=False)

    user = relationship("User", back_populates="attendance_records")
    site = relationship("Site", back_populates="attendance_records")
