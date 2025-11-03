# routes/banks.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select, insert, update, and_
from datetime import datetime, timedelta
import httpx, os, json

from db.models import bank_tokens, bank_consents, users
from db.db import database
from utils.jwt import verify_token

router = APIRouter(prefix="/banks", tags=["Banks"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

BANK_URLS = {
    "vbank": "https://vbank.open.bankingapi.ru",
    "abank": "https://abank.open.bankingapi.ru",
    "sbank": "https://sbank.open.bankingapi.ru",
}

CLIENT_ID = os.getenv("CLIENT_ID", "team239")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "F1cVm5XwPoWquHf70R9VC8437ofbrQi0")

# ---------- AUTH ----------
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Недействительный токен пользователя")
    q = select(users).where(users.c.email == payload["sub"])
    user = await database.fetch_one(q)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


# ---------- DB helpers ----------
async def get_cached_token(user_id: int, bank: str):
    q = select(bank_tokens).where(
        and_(bank_tokens.c.user_id == user_id, bank_tokens.c.bank_name == bank)
    )
    rec = await database.fetch_one(q)
    if rec and rec["expires_at"] and rec["expires_at"] > datetime.utcnow() + timedelta(minutes=5):
        return rec["access_token"]
    return None


async def save_token(user_id: int, bank: str, token: str, expires_in: int):
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    existing = await database.fetch_one(
        select(bank_tokens).where(
            and_(bank_tokens.c.user_id == user_id, bank_tokens.c.bank_name == bank)
        )
    )
    if existing:
        q = (
            update(bank_tokens)
            .where(bank_tokens.c.id == existing["id"])
            .values(access_token=token, expires_at=expires_at)
        )
    else:
        q = insert(bank_tokens).values(
            user_id=user_id, bank_name=bank, access_token=token, expires_at=expires_at
        )
    await database.execute(q)


async def get_cached_consent(user_id: int, bank: str):
    q = select(bank_consents).where(
        and_(bank_consents.c.user_id == user_id, bank_consents.c.bank_name == bank)
    )
    return await database.fetch_one(q)


async def save_consent(user_id: int, bank: str, consent_id: str, client_id: str, status: str):
    q = insert(bank_consents).values(
        user_id=user_id,
        bank_name=bank,
        consent_id=consent_id,
        client_id=client_id,
        status=status,
        created_at=datetime.utcnow(),
    )
    await database.execute(q)


# ---------- Network ----------
async def request_bank(method: str, url: str, *, headers=None, params=None, json_body=None):
    try:
        async with httpx.AsyncClient(verify=False, trust_env=True, timeout=15.0) as client:
            resp = await client.request(method, url, headers=headers, params=params, json=json_body)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Ошибка при обращении к банку: {e!s}")

    if resp.status_code >= 400:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=resp.status_code, detail=detail)

    try:
        return resp.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Банк вернул не-JSON ответ")


# ---------- Token ----------
async def get_or_refresh_token(user_id: int, bank: str):
    if bank not in BANK_URLS:
        raise HTTPException(status_code=400, detail="Неверный банк")
    cached = await get_cached_token(user_id, bank)
    if cached:
        return cached

    url = f"{BANK_URLS[bank]}/auth/bank-token"
    data = await request_bank(
        "POST", url, params={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}
    )

    token = data.get("access_token")
    exp = int(data.get("expires_in", 86400))
    if not token:
        raise HTTPException(status_code=502, detail="Банк не вернул access_token")

    await save_token(user_id, bank, token, exp)
    return token


# ---------- Endpoints ----------

@router.post("/{bank}/token")
async def get_bank_token(bank: str, user=Depends(get_current_user)):
    token = await get_or_refresh_token(user.id, bank)
    return {"access_token": token, "bank": bank, "user_id": user.id}


@router.get("/{bank}/accounts")
async def get_accounts(bank: str, user=Depends(get_current_user)):
    if bank not in BANK_URLS:
        raise HTTPException(status_code=400, detail="Неверный банк")

    user_id = user.id
    token = await get_or_refresh_token(user_id, bank)

    # Проверяем, есть ли consent
    query = select(bank_tokens).where(
        (bank_tokens.c.user_id == user_id) &
        (bank_tokens.c.bank_name == bank)
    )
    consent = await database.fetch_one(query)

    # --- если нет consent, пробуем создать ---
    if not consent:
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Requesting-Bank": CLIENT_ID,
        }

        body = {
            "client_id": f"{CLIENT_ID}-{user_id}",
            "permissions": ["ReadAccountsDetail", "ReadBalances"],
            "reason": "Агрегация счетов для MapTrack",
            "requesting_bank": CLIENT_ID,
            "requesting_bank_name": "Team 239 App",
        }

        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(f"{BANK_URLS[bank]}/account-consents/request", headers=headers, json=body)

        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()

        # Проверяем, есть ли consent_id
        consent_id = data.get("consent_id")
        status = data.get("status", "unknown")

        # если нет consent_id — сохраняем статус ожидания
        await database.execute(
            insert(bank_tokens).values(
                user_id=user_id,
                bank_name=bank,
                consent_id=consent_id or "pending",
                client_id=f"{CLIENT_ID}-{user_id}",
                status=status,
                created_at=datetime.utcnow(),
            )
        )

        # если согласие не одобрено — сообщаем пользователю
        if not consent_id or status != "approved":
            return {
                "message": "Согласие создано, но ожидает подтверждения в банке.",
                "bank": bank,
                "status": status,
            }

    else:
        consent_id = consent["consent_id"]
        status = consent["status"]

        if consent_id == "pending" or status != "approved":
            # Проверяем статус вручную
            headers = {"Authorization": f"Bearer {token}", "X-Requesting-Bank": CLIENT_ID}
            async with httpx.AsyncClient(verify=False) as client:
                resp = await client.get(f"{BANK_URLS[bank]}/account-consents/{consent_id}", headers=headers)

            if resp.status_code == 200:
                data = resp.json().get("data", {})
                if data.get("status") == "approved":
                    await database.execute(
                        update(bank_tokens)
                        .where(bank_tokens.c.id == consent["id"])
                        .values(status="approved", consent_id=data.get("consentId"))
                    )
                    consent_id = data.get("consentId")
                else:
                    return {"message": "Согласие всё ещё не подтверждено пользователем", "status": data.get("status")}
            else:
                raise HTTPException(status_code=resp.status_code, detail="Ошибка при проверке статуса согласия")

    # --- Получаем счета ---
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Requesting-Bank": CLIENT_ID,
        "X-Consent-Id": consent_id,
    }

    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(f"{BANK_URLS[bank]}/accounts", headers=headers, params={"client_id": f"{CLIENT_ID}-{user_id}"})

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    return resp.json()

@router.get("/{bank}/consent/{consent_id}")
async def get_consent_status(bank: str, consent_id: str, user=Depends(get_current_user)):
    token = await get_or_refresh_token(user.id, bank)
    headers = {"Authorization": f"Bearer {token}", "X-Requesting-Bank": CLIENT_ID}
    url = f"{BANK_URLS[bank]}/account-consents/{consent_id}"
    return await request_bank("GET", url, headers=headers)
