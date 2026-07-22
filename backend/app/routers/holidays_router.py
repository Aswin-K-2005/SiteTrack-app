from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.auth import require_admin, get_current_user
from app.database import get_db
from app.models import Holiday, User
from app.schemas import HolidayCreate, HolidayOut

router = APIRouter(prefix="/holidays", tags=["holidays"])

@router.post("", response_model=HolidayOut, status_code=status.HTTP_201_CREATED)
def create_holiday(
    payload: HolidayCreate, 
    db: Session = Depends(get_db), 
    _admin: User = Depends(require_admin)
):
    holiday = Holiday(**payload.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday

@router.get("", response_model=list[HolidayOut])
def list_holidays(
    db: Session = Depends(get_db), 
    _user: User = Depends(get_current_user)
):
    # Returns all holidays ordered by date
    return db.query(Holiday).order_by(Holiday.holiday_date.asc()).all()
