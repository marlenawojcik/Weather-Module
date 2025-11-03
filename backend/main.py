#główny plik serwera api
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from services.weather_service import get_weather

app = FastAPI()

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
