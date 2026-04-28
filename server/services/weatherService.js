const axios = require('axios');

// Simple in-memory cache — weather data is valid for 20 minutes
const cache = new Map();
const CACHE_TTL = 20 * 60 * 1000;

const WMO_EMOJI = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️', 56: '🌦️', 57: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const WMO_DESC = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

const fetchWeatherForZip = async (zip) => {
  const cached = cache.get(zip);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Step 1: ZIP → coordinates
  const geoRes = await axios.get(`https://api.zippopotam.us/us/${zip}`, { timeout: 8000 });
  const place = geoRes.data?.places?.[0];
  if (!place) throw new Error(`ZIP code ${zip} not found`);

  const lat = parseFloat(place.latitude);
  const lon = parseFloat(place.longitude);
  const city = place['place name'];
  const state = place['state abbreviation'];

  // Step 2: coordinates → current weather
  const wxRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m', 'apparent_temperature', 'weather_code',
        'wind_speed_10m', 'relative_humidity_2m', 'precipitation',
      ].join(','),
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      timezone: 'auto',
    },
    timeout: 8000,
  });

  const cur = wxRes.data.current;
  const data = {
    zip,
    city,
    state,
    temp: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    weatherCode: cur.weather_code,
    emoji: WMO_EMOJI[cur.weather_code] || '🌡️',
    description: WMO_DESC[cur.weather_code] || 'Unknown',
    windSpeed: Math.round(cur.wind_speed_10m),
    humidity: cur.relative_humidity_2m,
    precipitation: cur.precipitation,
  };

  cache.set(zip, { data, ts: Date.now() });
  return data;
};

module.exports = { fetchWeatherForZip };
