from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from db.db import metadata, engine
from datetime import datetime

# ---------- Пользователи ----------
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String, unique=True, nullable=False),
    Column("password_hash", String, nullable=False),
    Column("phone", String, nullable=False),
    Column("type_account", Integer, nullable=False),
    Column("first_name", String, nullable=True),
    Column("company_name", String, nullable=True),
    Column("inn", String, nullable=True),
    Column("kpp", String, nullable=True),
    Column("created_at", DateTime, server_default=func.now()),
    Column("premium", Boolean, server_default="false"),
    Column("premium_expiry", DateTime, nullable=True),
    Column("is_admin", Boolean, server_default="false"),
    Column("is_blocked", Boolean, server_default="false"),
    Column("last_login", DateTime, server_default=func.now()),
    extend_existing=True,
)

# ---------- Токены банков ----------
bank_tokens = Table(
    "bank_tokens",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("bank_name", String, nullable=False),
    Column("access_token", String, nullable=False),
    Column("expires_at", DateTime, nullable=False),
    extend_existing=True,
)

# ---------- Согласия банков ----------
bank_consents = Table(
    "bank_consents",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("bank_name", String, nullable=False),
    Column("req_id", String, nullable=True),         # 🆕 ID заявки
    Column("consent_id", String, nullable=True),     # 🆕 настоящий ID согласия (после подтверждения)
    Column("client_id", String, nullable=True),
    Column("status", String, default="pending"),
    Column("created_at", DateTime, default=datetime.utcnow),
)

# ---------- AI Чат ---------
ai_chat = Table(
    "ai_chat",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("role", String(10), nullable=False, server_default="user"),  # "user" | "assistant"
    Column("message", Text, nullable=False),
    Column("session_id", String(64), nullable=True),  # для чатов по темам/контекстам
    Column("created_at", DateTime, server_default=func.now()),
)

# Создание всех таблиц, если их ещё нет
# metadata.create_all(engine)
