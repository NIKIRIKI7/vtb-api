from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from db.db import metadata, engine
from sqlalchemy import Boolean

users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String, unique=True, nullable=False),
    Column("password_hash", String, nullable=False),
    Column("phone", String, nullable=False),

    # Физ. лицо или юр. лицо или ИП
    Column("type_account", Integer, nullable=False),

    # Доп. данные
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
    extend_existing=True
)

#metadata.create_all(engine)