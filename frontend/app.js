const API_URL = "http://127.0.0.1:8000/api/weather";

let map = L.map("map").setView([52.0, 19.0], 6); // Polska

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

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
  `;

  map.setView([coord.lat, coord.lon], 10);
  L.marker([coord.lat, coord.lon]).addTo(map)
    .bindPopup(`${name}: ${main.temp}°C, ${weather[0].description}`)
    .openPopup();
});
