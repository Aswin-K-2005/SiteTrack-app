from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_admin, get_current_user
from app.database import get_db
from app.models import Site, User
from app.schemas import SiteCreate, SiteOut

router = APIRouter(prefix="/sites", tags=["sites"])

@router.get("", response_model=list[SiteOut])
def list_sites(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    # Only return sites that are NOT archived
    return db.query(Site).filter(Site.is_archived == False).order_by(Site.name).all()


@router.post("", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    site = Site(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    site = db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    try:
        # 1. Unassign all workers so the site disappears from their mobile apps
        site.users = [] 
        
        # 2. SOFT DELETE: Hide the site from the active dashboard instead of destroying data
        site.is_archived = True
        
        db.commit()
        return None
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot archive site. An unexpected database error occurred."
        )
@router.get("/archived", response_model=list[SiteOut])
def list_archived_sites(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    """Fetch only the sites that have been archived."""
    return db.query(Site).filter(Site.is_archived == True).order_by(Site.name).all()

@router.patch("/{site_id}/restore", response_model=SiteOut)
def restore_site(site_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    """Restore an archived site back to active status."""
    site = db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    site.is_archived = False
    db.commit()
    db.refresh(site)
    return site
