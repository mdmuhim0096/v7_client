import { useEffect, useState } from "react";

const WeatherInfo = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const apiKey = "f00e1fbc2289caa26d0613a25e887827";
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError("Failed to fetch weather");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude);
        },
        () => setError("Location access denied")
      );
    } else {
      setError("Geolocation not supported");
    }
  }, []);

  return (
    <div className="p-4 rounded-xl shadow-md bg-zinc-700/10 text-white w-full h-auto text-center">
      <h2 className="text-lg font-semibold mb-2">🌦️ Weather Info</h2>
      {error && <p>{error}</p>}
      {weather ? (
        <>
          <p>City: {weather.name}</p>
          <p>Country: {weather.sys.country}</p>
          <p>Temp: {weather.main.temp}°C</p>
          <p>{weather.weather[0].description}</p>
        </>
      ) : (
        !error && <p>Loading...</p>
      )}
    </div>
  );
};

export default WeatherInfo;
