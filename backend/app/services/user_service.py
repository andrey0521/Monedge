import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import hash_password
import uuid

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, email: str, full_name: str, password: str) -> User:
    loop = asyncio.get_event_loop()
    hashed = await loop.run_in_executor(None, hash_password, password)
    
    user = User(
        id=uuid.uuid4(),
        email=email,
        full_name=full_name,
        hashed_password=hashed,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def get_or_create_oauth_user(db: AsyncSession, email: str, full_name: str) -> User:
    user = await get_user_by_email(db, email)
    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            hashed_password="",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user