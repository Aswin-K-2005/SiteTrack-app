from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth import require_admin, get_current_user
from app.database import get_db
from app.models import LeaveRequest, User, Role, Holiday
from app.schemas import LeaveRequestCreate, LeaveRequestOut

router = APIRouter(prefix="/leaves", tags=["leaves"])

def _to_out(leave: LeaveRequest) -> LeaveRequestOut:
    return LeaveRequestOut(
        id=leave.id,
        user_id=leave.user_id,
        user_name=leave.user.name if leave.user else None,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status
    )

# --- WORKER ENDPOINTS ---

@router.post("/request", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def request_leave(
    payload: LeaveRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date.")
        
    # --- NEW: Smart Holiday Overlap Check ---
    # Get the IDs of the sites this worker belongs to
    worker_site_ids = [site.id for site in current_user.sites]
    
    # Check if any declared holiday falls within their requested leave dates
    overlapping_holiday = db.query(Holiday).filter(
        Holiday.holiday_date >= payload.start_date,
        Holiday.holiday_date <= payload.end_date,
        (Holiday.site_id.is_(None) | Holiday.site_id.in_(worker_site_ids))
    ).first()

    if overlapping_holiday:
        raise HTTPException(
            status_code=400, 
            detail=f"No need to apply! {overlapping_holiday.holiday_date} is already a declared holiday ({overlapping_holiday.title})."
        )
    # ----------------------------------------

    leave = LeaveRequest(
        user_id=current_user.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
        status="pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return _to_out(leave)

@router.get("/me", response_model=list[LeaveRequestOut])
def my_leaves(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.user_id == current_user.id).order_by(LeaveRequest.start_date.desc()).all()
    return [_to_out(l) for l in leaves]

# --- ADMIN ENDPOINTS ---

@router.get("/all", response_model=list[LeaveRequestOut])
def all_leaves(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
    return [_to_out(l) for l in leaves]

@router.patch("/{leave_id}/status", response_model=LeaveRequestOut)
def update_leave_status(
    leave_id: int, 
    new_status: str, # expected: "approved" or "rejected"
    db: Session = Depends(get_db), 
    _admin: User = Depends(require_admin)
):
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    leave.status = new_status
    db.commit()
    db.refresh(leave)
    return _to_out(leave)
