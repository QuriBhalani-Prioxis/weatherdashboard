"use client";
import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Zap,
  X,
  Star,
} from "lucide-react";

const API_KEY = "783e9fb1dd0671e8bb4004d5624d9d5e";

interface ForecastDay {
  date: string;
  temp: number;
  condition: string;
  icon: string;
}

interface CityWeather {
  id: number;
  city: string;
  country: string;
  temperature: number;
  condition: string;
  icon: string;
  forecast: ForecastDay[];
  isFavorite?: boolean;
  humidity: number;
}

export default function WeatherDashboard() {
  const [cityName, setCityName] = useState("");
  const [weatherCards, setWeatherCards] = useState<CityWeather[]>([]);
  const [error, setError] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("favoriteCityNames");
    if (stored) {
      try {
        const cities: string[] = JSON.parse(stored);
        if (Array.isArray(cities)) {
          cities.forEach((city) => fetchWeatherByCity(city, true));
        }
      } catch {
        console.error("Failed to parse favorite city names");
      }
    }
  }, []);

  useEffect(() => {
    const favoriteCityNames = weatherCards
      .filter((card) => card.isFavorite)
      .map((card) => card.city);
    localStorage.setItem(
      "favoriteCityNames",
      JSON.stringify(favoriteCityNames)
    );
  }, [weatherCards]);

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const getIcon = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case "clear":
        return <Sun size={28} />;
      case "clouds":
        return <Cloud size={28} />;
      case "rain":
        return <CloudRain size={28} />;
      case "snow":
        return <CloudSnow size={28} />;
      case "thunderstorm":
        return <Zap size={28} />;
      default:
        return <Sun size={28} />;
    }
  };

  const fetchWeatherByCity = async (name: string, markFavorite = false) => {
    try {
      const current = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          name
        )}&appid=${API_KEY}&units=metric`
      );
      const curData = await current.json();
      if (curData.cod !== 200) throw new Error(curData.message);

      const {
        coord: { lat, lon },
        sys: { country },
        main,
        weather: w,
        id,
      } = curData;

      if (weatherCards.some((c) => c.id === id)) return;

      const fc = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const fcData = await fc.json();

      const seen = new Set<string>();
      const forecast: ForecastDay[] = fcData.list
        .filter((entry: any) => {
          const date = entry.dt_txt.split(" ")[0];
          const hour = entry.dt_txt.split(" ")[1];
          return !seen.has(date) && hour === "12:00:00";
        })
        .map((entry: any) => {
          const date = entry.dt_txt.split(" ")[0];
          seen.add(date);
          return {
            date,
            temp: Math.round(entry.main.temp),
            condition: entry.weather[0].main,
            icon: entry.weather[0].icon,
          };
        });

      const newCard: CityWeather = {
        id,
        country,
        city: curData.name,
        temperature: Math.round(main.temp),
        condition: w[0].main,
        icon: w[0].icon,
        humidity: main.humidity,
        forecast: forecast.slice(0, 5),
        isFavorite: markFavorite,
      };

      setWeatherCards((prev) => [newCard, ...prev]);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetch5DayForecast = () => {
    if (!cityName.trim()) return;
    fetchWeatherByCity(cityName);
    setCityName("");
  };

  const removeCard = (id: number) => {
    setWeatherCards((prev) => prev.filter((card) => card.id !== id));
  };

  const toggleFavorite = (id: number) => {
    setWeatherCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, isFavorite: !card.isFavorite } : card
      )
    );
  };

  const displayedCards = showFavoritesOnly
    ? weatherCards.filter((c) => c.isFavorite)
    : weatherCards;

  return (
    <div
      className={`p-6 w-full min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center flex-grow flex items-center justify-center gap-2">
          <Sun className="text-yellow-400" size={28} />
          Weather Forecast
        </h1>

        <button
          onClick={() => setIsDarkMode((prev) => !prev)}
          className={`ml-4 p-2 rounded transition-colors ${
            isDarkMode
              ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
              : "bg-gray-800 text-yellow-400 hover:bg-gray-700"
          }`}
          aria-label="Toggle dark mode"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              fetch5DayForecast();
            }
          }}
          placeholder="Enter city"
          className={`flex-grow p-2 border rounded text-base focus:outline-none focus:ring-2 ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-yellow-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600"
          }`}
        />
        <button
          onClick={fetch5DayForecast}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="favorites-toggle"
          checked={showFavoritesOnly}
          onChange={() => setShowFavoritesOnly((v) => !v)}
          className="cursor-pointer"
        />
        <label
          htmlFor="favorites-toggle"
          className="select-none cursor-pointer flex items-center gap-1"
        >
          Show only favorites
          <Star size={16} className="text-yellow-400" />
        </label>
      </div>

      {error && (
        <div
          className={`mb-4 text-center ${
            isDarkMode ? "text-red-400" : "text-red-600"
          }`}
        >
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {displayedCards.length === 0 && (
          <div
            className={`text-center col-span-full ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {showFavoritesOnly
              ? "No favorite cities added."
              : "No cities added yet. Search for a city to add."}
          </div>
        )}
        {displayedCards.map((weather) => (
          <div
            key={weather.id}
            className={`border p-6 rounded shadow relative transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-800 text-white border-gray-700"
                : "bg-white text-gray-900 border-gray-300"
            }`}
          >
            <button
              onClick={() => removeCard(weather.id)}
              className={`absolute top-2 right-2 transition-colors ${
                isDarkMode
                  ? "text-gray-400 hover:text-red-500"
                  : "text-gray-500 hover:text-red-600"
              }`}
              title="Remove city"
            >
              <X size={18} />
            </button>

            <button
              onClick={() => toggleFavorite(weather.id)}
              className="absolute top-2 left-2"
              title={
                weather.isFavorite ? "Unmark favorite" : "Mark as favorite"
              }
            >
              <Star
                size={20}
                className={
                  weather.isFavorite ? "text-yellow-400" : "text-gray-400"
                }
              />
            </button>

            <h2 className="text-xl font-semibold mb-2 text-center">
              {weather.city}, {weather.country}
            </h2>

            <div className="flex items-center justify-center gap-4 mb-4">
              {getIcon(weather.condition)}
              <div>
                <div className="text-3xl font-bold">
                  {weather.temperature}°C
                </div>
                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  {weather.condition}
                </div>
                <div className="text-sm">Humidity: {weather.humidity}%</div>
              </div>
            </div>

            <h3 className="text-base font-semibold mb-2 border-b pb-1 border-gray-400">
              5-Day Forecast
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {weather.forecast.map((d) => (
                <div
                  key={d.date}
                  className={`p-2 rounded text-center transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {new Date(d.date).toLocaleDateString(undefined, {
                      weekday: "short",
                    })}
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
                    alt={d.condition}
                    className="mx-auto h-10"
                  />
                  <div className="text-sm font-semibold">{d.temp}°C</div>
                  <div
                    className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                  >
                    {d.condition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
