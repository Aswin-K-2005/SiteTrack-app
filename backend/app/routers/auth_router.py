from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    verify_password, create_access_token, hash_password, get_current_user
)
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, Token, PasswordChangeRequest
from app.notifier import notify_admins_proxy_attempt

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # SQLAlchemy's .filter(Column == value) binds the value as a parameter —
    # it is never interpolated into the SQL string, so this is not injectable.
    user = db.query(User).filter(User.username == payload.username.lower()).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    # --- Device Binding & Anti-Proxy Security for Workers ---
    if user.role.value == "worker":
        if user.registered_device_id and payload.device_id != user.registered_device_id:
            # 🚨 Notify Admins of proxy attempt
            device_str = payload.device_name or "Unknown Device"
            notify_admins_proxy_attempt(
                db=db,
                title="⚠️ Proxy Alert: Unauthorized Device",
                body=f"Worker '{user.name}' ({user.username}) attempted login from an unapproved device ({device_str})."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is bound to another registered device. Please contact your admin to reset your device.",
            )
        elif not user.registered_device_id and payload.device_id:
            # Check if this device is already bound to a different employee account
            existing_device_user = (
                db.query(User)
                .filter(User.registered_device_id == payload.device_id, User.id != user.id)
                .first()
            )
            if existing_device_user:
                # 🚨 Notify Admins of multi-account phone proxy attempt
                notify_admins_proxy_attempt(
                    db=db,
                    title="⚠️ Proxy Alert: Device Conflict",
                    body=f"Attempted proxy login: Worker '{user.name}' tried using device registered to '{existing_device_user.name}'."
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"This device is already registered to employee '{existing_device_user.name}'. Each device can only be bound to one employee.",
                )
            user.registered_device_id = payload.device_id
            user.device_name = payload.device_name or "Mobile Device"
            db.commit()

    token = create_access_token({"sub": str(user.id)})
    return Token(
        access_token=token,
        must_change_password=user.must_change_password,
        role=user.role,
    )


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()
