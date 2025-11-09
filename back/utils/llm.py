import os
import httpx
from openai import AsyncOpenAI

http_client = httpx.AsyncClient(timeout=30.0, verify=False)

API_LLM = os.getenv("AI_KEY","")

client = AsyncOpenAI(
    api_key=API_LLM,
    base_url="https://api.intelligence.io.solutions/api/v1/",
    http_client=http_client,
)

async def ask_ai(user_message: str, context: str = "") -> str:
    """
    Отправляет сообщение в AI-модель и возвращает ответ.
    context — необязательный текст (например, аналитика расходов).
    """
    try:
        prompt = (
            f"Ты — финансовый помощник. Пользователь спрашивает: {user_message}\n\n"
            f"Вот краткий контекст по его расходам:\n{context}, добавь смайлики туда, где уместно."
        )

        response = await client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        return "Извини, не удалось получить ответ от AI. Попробуй позже 🙏"
