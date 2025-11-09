from fastapi import APIRouter, Depends, HTTPException, Request, status
import httpx
from db.models import ai_chat
from db.db import database
from utils.llm import ask_ai
from routes.account import get_current_user
from utils.analytics import make_spending_summary
from sqlalchemy import select, asc

router = APIRouter(prefix="/ai", tags=["AI Chat"])

BASE_URL = "http://localhost:8000"

@router.post("/chat")
async def ai_chat_route(msg: dict, request: Request, user=Depends(get_current_user)):
    user_message = msg.get("message")
    bank = msg.get("bank")

    if not user_message:
        raise HTTPException(status_code=400, detail="Пустое сообщение")
    if not bank:
        raise HTTPException(status_code=400, detail="Не указан банк")

    # Получаем токен из cookie
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Нет access_token в cookie")

    await database.execute(ai_chat.insert().values(
        user_id=user.id,
        role="user",
        message=user_message
    ))

    # Запрашиваем данные по счетам
    transactions = []
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        acc_resp = await client.get(
            f"{BASE_URL}/accounts",
            params={"bank": bank},
            headers={"Authorization": f"Bearer {token}"}
        )

        if acc_resp.status_code != 200:
            raise HTTPException(status_code=acc_resp.status_code, detail=f"Ошибка при получении счетов: {acc_resp.text}")

        accounts = acc_resp.json().get("accounts", [])
        for acc in accounts:
            acc_id = acc.get("accountId")
            if not acc_id:
                continue
            tx_resp = await client.get(
                f"{BASE_URL}/accounts/{acc_id}/transactions/full",
                params={"bank": bank},
                headers={"Authorization": f"Bearer {token}"}
            )
            if tx_resp.status_code == 200:
                txs = tx_resp.json().get("transactions", [])
                transactions.extend(txs)

    context = f"Всего транзакций: {len(transactions)}"
    ai_reply = await ask_ai(user_message, context)

    await database.execute(ai_chat.insert().values(
        user_id=user.id,
        role="assistant",
        message=ai_reply
    ))

    return {
        "bank": bank,
        "user": user_message,
        "assistant": ai_reply,
        "transactions_count": len(transactions)
    }

# === ИСТОРИЯ ЧАТА ===
@router.get("/history")
async def get_chat_history(user=Depends(get_current_user)):
    """
    Возвращает историю диалога пользователя с AI, отсортированную по времени.
    """
    query = (
        select(ai_chat)
        .where(ai_chat.c.user_id == user.id)
        .order_by(asc(ai_chat.c.created_at))
    )
    records = await database.fetch_all(query)

    history = [
        {
            "role": r["role"],
            "message": r["message"],
            "created_at": r["created_at"].isoformat()
        }
        for r in records
    ]

    return {"user_id": user.id, "history": history, "count": len(history)}
