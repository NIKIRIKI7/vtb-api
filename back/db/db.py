from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import MetaData
from databases import Database
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./vtb_api.db")

# Асинхронная база данных
database = Database(DATABASE_URL)

# Асинхронный движок SQLAlchemy
engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# Метаданные таблиц
metadata = MetaData()
