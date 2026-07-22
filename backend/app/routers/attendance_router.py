from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.geo import distance_meters
from app.models import AttendanceRecord, AttendanceType, User, Site, Role, Holiday
from app.schemas import AttendanceMarkRequest, AttendanceOut, TodayStatus

# --- NEW: Import the notification engine ---
from app.notifier import send_push_notification

router = APIRouter(prefix="/attendance", tags=["attendance"])


def _to_out(r: AttendanceRecord) -> AttendanceOut:
    # Explicitly tell the system this clock time is already locked to Indian Standard Time hours
    tz_kolkata = ZoneInfo("Asia/Kolkata")
    localized_ts = r.timestamp.replace(tzinfo=tz_kolkata)
    
    return AttendanceOut(
        id=r.id, 
        user_id=r.user_id, 
        user_name=r.user.name if r.user else None,
        site_id=r.site_id, 
        type=r.type, 
        timestamp=localized_ts,
        record_date=r.record_date, 
        distance_m=r.distance_m,
    )

@router.post("/mark", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def mark_attendance(
    payload: AttendanceMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.sites:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are not assigned to any sites yet")
        
    # --- Smart Geofence: Loop through all assigned sites to find where they are ---
    valid_site = None
    min_dist = float('inf')
    matched_dist = 0
    
    for site in current_user.sites:
        dist = distance_meters(payload.latitude, payload.longitude, site.latitude, site.longitude)
        if dist <= site.radius_m:
            valid_site = site
            matched_dist = dist
            break
        if dist < min_dist:
            min_dist = dist
            
    if not valid_site:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are outside the check-in zone for all assigned sites. Closest site is {round(min_dist)}m away.",
        )

    # --- Restored logic to save to database ---
    tz_kolkata = ZoneInfo("Asia/Kolkata")
    now_ist = datetime.now(tz_kolkata)
    today = now_ist.date()

    todays_records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.user_id == current_user.id,
            AttendanceRecord.record_date == today,
        )
        .all()
    )

    has_in = any(r.type == AttendanceType.check_in for r in todays_records)
    has_out = any(r.type == AttendanceType.check_out for r in todays_records)

    if has_in and has_out:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You've already completed attendance for today")

    record_type = AttendanceType.check_out if has_in else AttendanceType.check_in

    naive_ist_now = now_ist.replace(tzinfo=None)

    record = AttendanceRecord(
        user_id=current_user.id,
        site_id=valid_site.id,      # dynamically assign the site they are standing in
        type=record_type,
        timestamp=naive_ist_now,
        record_date=today,
        distance_m=matched_dist,    
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # --- NEW: Send a welcome push notification if they just checked in ---
    if record_type == AttendanceType.check_in and current_user.fcm_token:
        send_push_notification(
            token=current_user.fcm_token,
            title="Checked In Successfully ✅",
            body=f"Welcome to {valid_site.name}. Have a safe shift!"
        )

    return _to_out(record)


@router.get("/me", response_model=list[AttendanceOut])
def my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.user_id == current_user.id)
        .order_by(AttendanceRecord.timestamp.desc())
        .limit(30)
        .all()
    )
    return [_to_out(r) for r in records]


@router.get("/today", response_model=list[TodayStatus])
def today_overview(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    tz_kolkata = ZoneInfo("Asia/Kolkata")
    today = datetime.now(tz_kolkata).date()
    
    workers = db.query(User).filter(User.role == Role.worker).all()
    result = []
    for w in workers:
        recs = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.user_id == w.id, AttendanceRecord.record_date == today)
            .order_by(AttendanceRecord.timestamp.asc())
            .all()
        )
        has_in = next((r for r in recs if r.type == AttendanceType.check_in), None)
        has_out = next((r for r in recs if r.type == AttendanceType.check_out), None)
        
        if has_out:
            status_val, last_time = "checked_out", has_out.timestamp
        elif has_in:
            status_val, last_time = "checked_in", has_in.timestamp
        else:
            status_val, last_time = "not_checked_in", None

        if last_time:
            last_time = last_time.replace(tzinfo=tz_kolkata)
            
        # FIX: Find the actual site they checked into today to show on the admin dashboard
        active_record = has_out or has_in
        current_site_name = active_record.site.name if active_record and active_record.site else None

        result.append(TodayStatus(
            user_id=w.id, name=w.name, username=w.username,
            site_name=current_site_name,
            status=status_val, last_time=last_time,
        ))
    return result


@router.get("/log", response_model=list[AttendanceOut])
def recent_log(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    records = (
        db.query(AttendanceRecord)
        .order_by(AttendanceRecord.timestamp.desc())
        .limit(50)
        .all()
    )
    return [_to_out(r) for r in records]
