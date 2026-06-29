import os
import asyncpg
from datetime import datetime

DATABASE_URL = os.getenv("postgresql://neondb_owner:npg_jI7S2koLdnsF@ep-orange-term-at82w3ik-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require", "")

_pool = None


async def get_pool():
    global _pool
    if _pool is None and DATABASE_URL:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    return _pool


async def init_db():
    pool = await get_pool()
    if pool is None:
        print("⚠️  DATABASE_URL não configurada – banco desativado.")
        return
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS simulacoes (
                id          SERIAL PRIMARY KEY,
                tipo        VARCHAR(2)  NOT NULL,
                renda       NUMERIC(15,2) NOT NULL,
                valor_max   NUMERIC(15,2) NOT NULL,
                nome        TEXT,
                email       TEXT,
                criado_em   TIMESTAMP DEFAULT NOW()
            )
        """)
    print("✅ Banco de dados inicializado.")


async def save_simulation(data: dict):
    pool = await get_pool()
    if pool is None:
        return
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO simulacoes (tipo, renda, valor_max, nome, email)
            VALUES ($1, $2, $3, $4, $5)
            """,
            data["tipo"],
            data["renda"],
            data["valor_max"],
            data.get("nome"),
            data.get("email"),
        )


async def get_stats():
    pool = await get_pool()
    if pool is None:
        return {"total": 0, "media_valor": 0}
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT COUNT(*) as total, AVG(valor_max) as media FROM simulacoes"
        )
        return {"total": row["total"], "media_valor": float(row["media"] or 0)}
