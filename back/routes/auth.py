from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Response,Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, constr
from sqlalchemy import select
from passlib.context import CryptContext
from datetime import datetime, timedelta

from utils.jwt import create_access_token, create_refresh_token, verify_token
from utils.validation import check_validation
from db.models import users
from db.db import database


router = APIRouter(prefix="/auth", tags=["Auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# стандартная схема для OAuth2 password flow
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# ==========================
# Утилиты
# ==========================
def hash_password(password: str) -> str:
    """Хэширует пароль с использованием bcrypt"""
    return pwd_ctx.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Проверяет соответствие пароля хэшу"""
    return pwd_ctx.verify(password, hashed)


# ==========================
# Pydantic-схемы
# ==========================
class RegisterUserSchema(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    phone: constr(min_length=11, max_length=12)
    type_account: int  # 0 - физ. лицо, 1 - юр. лицо, 2 - ИП
    first_name: constr(min_length=2)
    company_name: constr(min_length=2) | None = None
    inn: constr(min_length=10, max_length=12) | None = None
    kpp: constr(min_length=9, max_length=9) | None = None
    premium: bool = False
    premium_expiry: datetime | None = None
    is_admin: bool = False
    is_blocked: bool = False


# ==========================
# Регистрация нового пользователя
# ==========================
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(data: RegisterUserSchema):
    """Регистрирует нового пользователя и выдает access+refresh токены"""

    is_valid, error = await check_validation(data)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)

    hashed_pwd = hash_password(data.password)

    query = users.insert().values(
        email=data.email,
        password_hash=hashed_pwd,
        phone=data.phone,
        type_account=data.type_account,
        first_name=data.first_name,
        company_name=data.company_name,
        inn=data.inn,
        kpp=data.kpp,
        premium=data.premium,
        premium_expiry=data.premium_expiry,
        is_admin=data.is_admin,
        is_blocked=data.is_blocked,
        created_at=datetime.utcnow(),
        last_login=None
    )
    user_id = await database.execute(query)

    access_token = create_access_token({"sub": data.email})
    refresh_token = create_refresh_token({"sub": data.email})

    response = JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "id": user_id,
            "email": data.email,
            "message": "Регистрация прошла успешно 🎉"
        },
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # ⚠️ на dev можно False, на проде только True
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 дней
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 30,  # 30 минут
    )
    return response


# ==========================
#  POST /auth/token — выдача access и refresh
# ==========================
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    query = select(users).where(users.c.email == form_data.username)
    user = await database.fetch_one(query)
    if not user or not pwd_ctx.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Пользователь заблокирован")

    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})

    response = JSONResponse(
        {"access_token": access_token, "token_type": "bearer"},
        status_code=status.HTTP_200_OK,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 30,  # 30 минут
    )
    return response


# ==========================
#  POST /auth/refresh — обновление access_token
# ==========================
@router.post("/refresh")
async def refresh_token(refresh_token: str | None = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token отсутствует")

    payload = verify_token(refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token недействителен")

    new_access_token = create_access_token({"sub": payload["sub"]}, timedelta(minutes=30))

    response = JSONResponse(
        content={"message": "Access token обновлён ✅"}
    )

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,   # не доступен из JS
        secure=True,     # на проде обязательно True
        samesite="lax",
        max_age=60 * 30, # 30 минут
    )

    return response


# ==========================
#  GET /auth/me — защищённый ресурс
# ==========================
@router.get("/me")
async def read_users_me(request: Request):
    # Берём токен из куки
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=402, detail="Токен не найден в куках")

    # Проверяем токен
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Недействительный токен")

    # Ищем пользователя
    query = select(users).where(users.c.email == payload["sub"])
    user = await database.fetch_one(query)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return {
        "email": user.email,
        "first_name": user.first_name,
        "type_account": user.type_account,
        "premium": user.premium,
    }

# ==========================
#  POST /auth/logout — выход пользователя
# ==========================
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")
    return {"message": "Вы успешно вышли"}
