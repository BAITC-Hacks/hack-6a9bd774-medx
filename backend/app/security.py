import hashlib
from fastapi import Header, HTTPException
from .models import Challenge


def business_identity(x_business_key: str | None = Header(default=None)) -> str | None:
    if x_business_key is None:
        return None
    if len(x_business_key) < 32 or len(x_business_key) > 128:
        raise HTTPException(400, "Некорректный ключ рабочего пространства")
    return hashlib.sha256(x_business_key.encode()).hexdigest()


def require_identity(identity: str | None) -> str:
    if not identity:
        raise HTTPException(401, "Откройте рабочее пространство бизнеса")
    return identity


def require_owner(challenge: Challenge, identity: str | None):
    if challenge.owner_hash != require_identity(identity):
        raise HTTPException(403, "Эта задача принадлежит другому рабочему пространству")
