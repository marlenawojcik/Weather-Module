#modul do pobierania danych z openweather
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

def get_weather(city_name: str):
    params = {
        "q": city_name,
        "appid": API_KEY,
        "units": "metric",
        "lang": "pl"
    }
    response = requests.get(BASE_URL, params=params)
    return response.json()
