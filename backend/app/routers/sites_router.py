from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_admin, get_current_user
from app.database import get_db
from app.models import Site, User
from app.schemas import SiteCreate, SiteOut

router = APIRouter(prefix="/sites", tags=["sites"])

@router.get("", response_model=list[SiteOut])
def list_sites(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return db.query(Site).order_by(Site.name).all()

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
        # Clear the many-to-many worker associations first
        site.users = [] 
        
        # Now it is safe to delete the site
        db.delete(site)
        db.commit()
        return None
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete site. Ensure all attendance logs for this site are cleared first."
        )
