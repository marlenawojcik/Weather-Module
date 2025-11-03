#główny plik serwera api
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import sqlite3
from passlib.context import CryptContext
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from services.weather_service import get_weather

app = FastAPI()

# Hashowanie haseł
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# SQLite DB
conn = sqlite3.connect("users.db", check_same_thread=False)
c = conn.cursor()
c.execute("""CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)""")
c.execute("""CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    city TEXT
)""")
conn.commit()


# Schematy danych
class User(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    username: str

class HistoryItem(BaseModel):
    city: str


    # --------------------------
# Rejestracja
# --------------------------
@app.post("/api/register")
def register(user: User):
    hashed = pwd_context.hash(user.password)
    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user.username, hashed))
        conn.commit()
        return {"message": "Zarejestrowano pomyślnie"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Użytkownik już istnieje")

# --------------------------
# Logowanie
# --------------------------
@app.post("/api/login")
def login(user: User):
    c.execute("SELECT password FROM users WHERE username=?", (user.username,))
    row = c.fetchone()
    if not row or not pwd_context.verify(user.password, row[0]):
        raise HTTPException(status_code=401, detail="Nieprawidłowy login lub hasło")
    return {"username": user.username}

# --------------------------
# Historia wyszukiwań
# --------------------------
@app.post("/api/history/{username}")
def add_history(username: str, item: HistoryItem):
    c.execute("SELECT id FROM users WHERE username=?", (username,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    user_id = row[0]
    c.execute("INSERT INTO history (user_id, city) VALUES (?, ?)", (user_id, item.city))
    conn.commit()
    return {"message": "Dodano do historii"}

@app.get("/api/history/{username}", response_model=List[HistoryItem])
def get_history(username: str):
    c.execute("SELECT id FROM users WHERE username=?", (username,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    user_id = row[0]
    c.execute("SELECT city FROM history WHERE user_id=? ORDER BY id DESC", (user_id,))
    cities = c.fetchall()
    return [{"city": city[0]} for city in cities]
# pozwalamy na połączenia z frontendem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


frontend_path = Path(__file__).resolve().parent.parent/"frontend"

#Serwowanie plików statycznych (JS, CSS, obrazki)
app.mount("/static", StaticFiles(directory=frontend_path), name="static")


# Strona główna `/`
@app.get("/")
def serve_homepage():
    index_file = frontend_path / "index.html"
    return FileResponse(index_file)

#endpoint pogodowy
@app.get("/api/weather")
def weather(city: str):
    data = get_weather(city)
    return data
