const API_URL = "http://127.0.0.1:8000/api/weather";
const API_KEY = "25ae8c36b22398f35b25584807571f27";

// ------------------------
// Warstwy mapowe
// ------------------------
let baseLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
});

let temp = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 1.0 });
let clouds = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 1.0 });
let rain = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 1.0 });

// ------------------------
// Mapa
// ------------------------
let map = L.map("map", {
  center: [52.0, 19.0],
  zoom: 6,
  layers: [baseLayer, temp] // domyślnie temperatura
});

// ------------------------
// Legendy pod mapą
// ------------------------
const legends = {
  temp: `<div class="legend-bar legend-temp-bar"></div>
         <div class="legend-labels"><span>-20</span><span>0</span><span>20</span><span>40+</span></div>`,
  clouds: `<div class="legend-bar legend-clouds-bar"></div>
           <div class="legend-labels"><span>0%</span><span>25%</span><span>50%</span><span>100%</span></div>`,
  rain: `<div class="legend-bar legend-rain-bar"></div>
         <div class="legend-labels"><span>0</span><span>2</span><span>5</span><span>10+</span></div>`
};

// ------------------------
// Funkcja zmiany warstwy i legendy
// ------------------------
function switchLayer(layerName) {
  // Usuń wszystkie warstwy pogodowe
  map.removeLayer(temp);
  map.removeLayer(clouds);
  map.removeLayer(rain);

  // Dodaj wybraną warstwę
  if (layerName === "temp") map.addLayer(temp);
  if (layerName === "clouds") map.addLayer(clouds);
  if (layerName === "rain") map.addLayer(rain);

  // Ustaw legendę pod mapą
  document.getElementById("legendContainer").innerHTML = legends[layerName];
}

// ------------------------
// Nasłuchiwanie zmiany radio buttons
// ------------------------
document.querySelectorAll('input[name="weatherLayer"]').forEach(input => {
  input.addEventListener('change', (e) => {
    switchLayer(e.target.value);
  });
});

// Domyślnie ustaw legendę temperatury
switchLayer("temp");

// ------------------------
// Obsługa wyszukiwania miasta
// ------------------------
document.getElementById("searchBtn").addEventListener("click", async () => {
  const city = document.getElementById("cityInput").value;
  if (!city) return alert("Wpisz nazwę miasta!");

  const res = await fetch(`${API_URL}?city=${city}`);
  const data = await res.json();

  if (data.cod !== 200) {
    document.getElementById("weatherInfo").innerText = "Nie znaleziono miasta.";
    return;
  }

  const { coord, main, weather, name } = data;

  document.getElementById("weatherInfo").innerHTML = `
    <h2>${name}</h2>
    <p>${weather[0].description}</p>
    <p>Temperatura: ${main.temp}°C</p>
    <p>Wilgotność: ${main.humidity}%</p>
    <p>Ciśnienie: ${main.pressure} hPa</p>
    <p>Współrzędne: [${coord.lat}, ${coord.lon}]</p>
    <p>Opady: ${data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0} mm</p>
  `;

  map.setView([coord.lat, coord.lon], 10);
  L.marker([coord.lat, coord.lon]).addTo(map)
    .bindPopup(`${name}: ${main.temp}°C, ${weather[0].description}`)
    .openPopup();
});
