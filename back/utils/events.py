from fastapi import FastAPI
from db.db import database, engine, metadata

def attach_db_events(app: FastAPI):
    """Привязывает события подключения/отключения к БД"""
    
    @app.on_event("startup")
    async def startup():
        # Подключаемся к БД
        await database.connect()
        # Создаём таблицы, если их нет
        async with engine.begin() as conn:
            await conn.run_sync(metadata.create_all)
        print("✅ Database connected and tables ensured.")

    @app.on_event("shutdown")
    async def shutdown():
        await database.disconnect()
        print("🧹 Database disconnected.")
