import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_admin, hash_password, get_current_user
from app.database import get_db
from app.models import User, Role
from app.schemas import UserCreate, UserOut, PasswordResetOut

router = APIRouter(prefix="/users", tags=["users"])


def _to_user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        name=u.name,
        username=u.username,
        role=u.role,
        must_change_password=u.must_change_password,
        site_id=u.site_id,
        site_name=u.site.name if u.site else None,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return _to_user_out(current_user)


@router.get("", response_model=list[UserOut])
def list_workers(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    workers = db.query(User).filter(User.role == Role.worker).order_by(User.name).all()
    return [_to_user_out(w) for w in workers]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_worker(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    worker = User(
        name=payload.name,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=Role.worker,
        must_change_password=True,
        site_id=payload.site_id,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return _to_user_out(worker)


@router.post("/{user_id}/reset-password", response_model=PasswordResetOut)
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    worker = db.get(User, user_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    temp_password = "Reset" + str(secrets.randbelow(9000) + 1000)
    worker.hashed_password = hash_password(temp_password)
    worker.must_change_password = True
    db.commit()

    return PasswordResetOut(username=worker.username, temporary_password=temp_password)
@router.delete("/{user_id}", status_code=204)
def remove_worker_registry(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Verifies authorization
):
    # System authorization barrier check: Block non-admins from hitting this
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Administrative rights required.")

    target_worker = db.query(User).filter(User.id == user_id).first()
    if not target_worker:
        raise HTTPException(status_code=404, detail="Worker account not found.")

    if target_worker.id == current_user.id:
        raise HTTPException(status_code=400, detail="Security safety block: Admin cannot delete themselves.")

    db.delete(target_worker)
    db.commit()
    return None

