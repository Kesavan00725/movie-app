import asyncio

import asyncpg


async def main():
    conn = await asyncpg.connect(
        user="postgres",
        password="postgres",
        database="postgres",
        host="localhost",
    )
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = 'fastapi_db'"
    )
    if not exists:
        await conn.execute("CREATE DATABASE fastapi_db")
        print("Created database fastapi_db")
    else:
        print("Database fastapi_db already exists")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
