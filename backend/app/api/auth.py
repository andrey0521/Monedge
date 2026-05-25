from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, decode_token
from app.core.deps import get_current_user
from app.services.user_service import get_user_by_email, create_user, get_or_create_oauth_user
from app.services.category_service import seed_default_categories
from app.schemas.user import UserCreate, UserOut
from app.core.config import settings
from app.models.user import User
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])

# ---------- Email/Password ----------

@router.post("/register", response_model=UserOut)
async def resgister(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    user = await create_user(db, user_in.email, user_in.full_name, user_in.password)
    if user_in.use_default_categories:
        await seed_default_categories(db, user.id)
    return user

@router.post("/login")
async def login(response: Response, user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="El correo o la contraseña no son correctos")
    token = create_access_token({"sub":str(user.id)})
    response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
    return{"message": "Login existoso"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

# ---------- OAuth Google ----------

@router.get("/google")
async def google_login():
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        "&response_type=code"
        "&scope=openid email profile"
        f"&redirect_uri={settings.FRONTEND_URL}/auth/google/callback"
    )
    return {"url": google_auth_url}


@router.get("/google/callback")
async def google_callback(code: str, response: Response, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # Intercambiar code por token
        token_res = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{settings.FRONTEND_URL}/auth/google/callback",
            "grant_type": "authorization_code",
        })
        token_data = token_res.json()

        # Obtener info del usuario
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        user_info = user_info_res.json()

    user = await get_or_create_oauth_user(db, user_info["email"], user_info["name"])
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
    return {"message": "Login con Google exitoso"}