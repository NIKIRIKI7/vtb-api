from fastapi import APIRouter, Depends, HTTPException, Header, Request, Path, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
import httpx
import asyncio
from datetime import datetime
import json

from db.db import database
from db.models import users, bank_consents
from utils.jwt import verify_token
from routes.banks import get_or_refresh_token, BANK_URLS, CLIENT_ID

router = APIRouter(prefix="/accounts", tags=["Accounts"])


# ---------- Авторизация ----------
async def get_current_user(request: Request):
    # 1. Пробуем взять токен из cookie
    token = request.cookies.get("access_token")

    # 2. Если в cookie нет — пробуем из заголовка Authorization
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Отсутствует токен пользователя",
        )

    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен пользователя",
        )

    q = select(users).where(users.c.email == payload["sub"])
    user = await database.fetch_one(q)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return user


# ---------- GET /accounts ----------
@router.get("")
async def get_accounts_with_balances(
    bank: str,
    authorization: str = Header(...),
    user=Depends(get_current_user),
):

    # --- Проверяем банк ---
    if bank not in BANK_URLS:
        raise HTTPException(status_code=400, detail="Неверный банк")

    # --- Проверяем токен клиента ---
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Неверный формат Authorization")


    # --- Получаем токен банка ---
    bank_token = await get_or_refresh_token(user.id, bank)

    headers = {"Authorization": f"Bearer {bank_token}"}
    params = {}

    # --- Проверяем наличие согласия ---
    record = await database.fetch_one(
        select(bank_consents).where(
            (bank_consents.c.user_id == user.id)
            & (bank_consents.c.bank_name == bank)
        )
    )

    if record:
        consent_id = record["consent_id"]
        client_id = record["client_id"]
        status = (record["status"] or "").lower()

        if consent_id and status in ["approved", "authorized"]:
            headers["X-Consent-Id"] = consent_id
            headers["X-Requesting-Bank"] = CLIENT_ID
            if client_id:
                params["client_id"] = client_id

    # --- Отправляем запрос в банк ---
    url = f"{BANK_URLS[bank]}/accounts"

    async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
        resp = await client.get(url, headers=headers, params=params)

    # --- Обработка ошибок ---
    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Банк отклонил авторизацию (401)")
    if resp.status_code == 400 and "client_id" in resp.text.lower():
        raise HTTPException(status_code=400, detail="client_id обязателен для межбанковского запроса")
    if resp.status_code == 403:
        raise HTTPException(status_code=403, detail="Согласие отсутствует или отозвано")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    # --- Счета ---
    accounts = resp.json().get("data", {}).get("account", [])

    if not accounts:
        return {"accounts": [], "message": "Счета не найдены", "bank": bank}

    # --- Параллельно получаем балансы ---
    async def fetch_balance(client, acc_id):
        url = f"{BANK_URLS[bank]}/accounts/{acc_id}/balances"
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                return {"accountId": acc_id, "balance": r.json().get("data", {})}
            else:
                return {"accountId": acc_id, "error": f"Bank returned {r.status_code}"}
        except Exception as e:
            return {"accountId": acc_id, "error": str(e)}

    async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
        tasks = [fetch_balance(client, a.get("accountId")) for a in accounts if a.get("accountId")]
        balances = await asyncio.gather(*tasks)

    # --- Объединяем счета и балансы ---
    for acc in accounts:
        acc_id = acc.get("accountId")
        match = next((b for b in balances if b["accountId"] == acc_id), None)
        if match:
            acc["balance"] = match.get("balance") or {"error": match.get("error")}

    return {
        "bank": bank,
        "accounts": accounts,
        "count": len(accounts),
        "fetched_at": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/{account_id}/transactions/full")
async def get_full_account_transactions(
    account_id: str = Path(..., description="ID счёта (например acc-3481)"),
    bank: str = Query(..., description="Код банка (vbank, abank, sbank)"),
    authorization: str = Header(...),
    user=Depends(get_current_user),
):
    """
    📜 Возвращает всю историю транзакций по счёту.
    Автоматически проходит все страницы (пагинацию).
    Работает как для своих, так и межбанковских счетов.
    """

    if bank not in BANK_URLS:
        raise HTTPException(status_code=400, detail="Неверный банк")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Неверный формат Authorization")
    user_token = authorization.split(" ")[1]
    # --- Получаем токен банка ---
    bank_token = await get_or_refresh_token(user.id, bank)
    headers = {"Authorization": f"Bearer {bank_token}"}

    # --- Проверяем согласие ---
    record = await database.fetch_one(
        select(bank_consents).where(
            (bank_consents.c.user_id == user.id)
            & (bank_consents.c.bank_name == bank)
        )
    )
    if record:
        consent_id = record["consent_id"]
        status = (record["status"] or "").lower()
        if consent_id and status in ["approved", "authorized"]:
            headers["X-Consent-Id"] = consent_id
            headers["X-Requesting-Bank"] = CLIENT_ID

    # --- Переход по страницам ---
    all_transactions = []
    page = 1
    limit = 50  # можно выставить максимум, чтобы быстрее собрать всё

    async with httpx.AsyncClient(verify=False, timeout=20.0) as client:
        while True:
            url = f"{BANK_URLS[bank]}/accounts/{account_id}/transactions"
            params = {"page": page, "limit": limit}
            resp = await client.get(url, headers=headers, params=params)

            if resp.status_code == 401:
                raise HTTPException(status_code=401, detail="Банк отклонил авторизацию (401)")
            if resp.status_code == 403:
                raise HTTPException(status_code=403, detail="Нет согласия для доступа к транзакциям")
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)

            data = resp.json()
            transactions = data.get("data", {}).get("transaction", [])
            all_transactions.extend(transactions)
            meta = data.get("meta", {})
            total_pages = meta.get("totalPages", 1)

            # выход, если достигли конца
            if not transactions or page >= total_pages:
                break

            page += 1
            await asyncio.sleep(0.5)  # чтобы не заспамить банк


    return {
        "bank": bank,
        "accountId": account_id,
        "total": len(all_transactions),
        "transactions": all_transactions,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
    }
