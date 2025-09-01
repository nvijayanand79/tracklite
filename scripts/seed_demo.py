"""
Demo data seeder.
Populates a SQLite DB or prints mock data if DB not used.
Modify for your schema.
"""
import os, sqlite3

db_url = os.getenv("DATABASE_URL", "sqlite:///demo.db")
if db_url.startswith("sqlite"):
    db_path = db_url.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT)")
    cur.execute("DELETE FROM customers")
    cur.executemany("INSERT INTO customers (name,email) VALUES (?,?)", [
        ("Alice Demo","alice@example.com"),
        ("Bob Demo","bob@example.com"),
        ("Charlie Demo","charlie@example.com")
    ])
    conn.commit()
    conn.close()
    print(f"Seeded demo data into {db_path}")
else:
    print("DATABASE_URL not sqlite, skipping seeding.")
