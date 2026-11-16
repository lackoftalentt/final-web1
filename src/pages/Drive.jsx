import { useEffect, useState } from "react";
import { locations } from "../data.js";
import Icon from "../components/Icon.jsx";

export function describeWeather(code) {
  if (code === 0) return ["Clear skies", "sun"];
  if (code <= 3) return ["Partly cloudy", "cloud"];
  if (code <= 48) return ["Foggy", "cloud"];
  if (code <= 67) return ["Rain or drizzle", "rain"];
  if (code <= 77) return ["Snow", "cloud"];
  if (code <= 82) return ["Rain showers", "rain"];
  if (code <= 86) return ["Snow showers", "cloud"];
  return ["Thunderstorms", "rain"];
}

export default function Drive() {
  const [city, setCity] = useState(locations[0]);
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ status: "loading", data: null });
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12000);
    setRequest({ status: "loading", data: null });
    async function load() {
      try {
        const params = new URLSearchParams({
          latitude: city.latitude,
          longitude: city.longitude,
          current: "temperature_2m,weather_code,wind_speed_10m",
          daily:
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
          timezone: "Asia/Tokyo",
          forecast_days: "3",
        });
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Weather service is unavailable.");
        const data = await response.json();
        if (
          !data.current ||
          !Number.isFinite(data.current.temperature_2m) ||
          !Number.isFinite(data.current.weather_code) ||
          !Number.isFinite(data.current.wind_speed_10m) ||
          !data.current.time ||
          !Array.isArray(data.daily?.time) ||
          data.daily.time.length < 3 ||
          ![
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
          ].every(
            (key) =>
              Array.isArray(data.daily[key]) &&
              data.daily[key].length >= 3 &&
              data.daily[key].every(Number.isFinite),
          )
        )
          throw new Error("Weather data is incomplete.");
        if (!disposed) setRequest({ status: "success", data });
      } catch (error) {
        if (!disposed)
          setRequest({
            status: "error",
            data: null,
            message: timedOut
              ? "The weather service took too long to respond."
              : error.name === "AbortError"
                ? "The request was interrupted."
                : "We couldn’t load the latest weather. Check your connection and try again.",
          });
      } finally {
        clearTimeout(timeout);
      }
    }
    load();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [city.id, attempt]);
  const data = request.data;
  const [condition, icon] = data
    ? describeWeather(data.current.weather_code)
    : [];
  return (
    <section className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">Drive forecast / Japan</span>
        <h1>Know before you go.</h1>
        <p>
          Three places connected by car culture. Live weather to help plan your
          visit.
        </p>
      </div>
      <div className="location-tabs" aria-label="Choose a destination">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => setCity(location)}
            className={city.id === location.id ? "is-active" : ""}
            aria-pressed={city.id === location.id}
          >
            <Icon name="pin" size={18} />
            {location.name}
            <span>{location.area}</span>
          </button>
        ))}
      </div>
      <div className="weather-layout">
        <div className="destination-panel">
          <span className="eyebrow">Destination / Japan</span>
          <div className="destination-map" aria-hidden="true">
            <svg viewBox="0 0 300 350">
              <path
                d="m220 15 22 22-8 22-22 10-8-22Zm-18 69 4 32-27 34-7 33-24 18-8 27-34 17-21 30-29 5-8-15 33-27 24-15 12-26 29-23 15-38 21-20Zm-101 170 12 15-31 18-17-7ZM51 286l18 12-17 27-18 5-9-17Z"
                fill="currentColor"
              />
              <circle
                cx={city.id === "suzuka" ? 115 : 160}
                cy={city.id === "suzuka" ? 235 : 204}
                r="8"
                className="map-dot"
              />
              <circle
                cx={city.id === "suzuka" ? 115 : 160}
                cy={city.id === "suzuka" ? 235 : 204}
                r="16"
                className="map-ring"
              />
            </svg>
          </div>
          <div className="destination-copy">
            <h2>
              {city.name}
              <span>日本</span>
            </h2>
            <p>{city.description}</p>
            <span className="fine-print">
              {city.latitude.toFixed(2)}° N / {city.longitude.toFixed(2)}° E
            </span>
          </div>
        </div>
        <div
          className="weather-panel"
          aria-live="polite"
          aria-busy={request.status === "loading"}
        >
          <div className="weather-panel-heading">
            <span className="eyebrow">Local conditions</span>
            <button
              className="icon-button"
              aria-label="Refresh weather"
              onClick={() => setAttempt((value) => value + 1)}
              disabled={request.status === "loading"}
            >
              <Icon name="refresh" />
            </button>
          </div>
          {request.status === "loading" && (
            <div className="weather-state">
              <span className="spinner" />
              <h2>Checking the skies…</h2>
              <p>Loading the latest forecast for {city.name}.</p>
            </div>
          )}
          {request.status === "error" && (
            <div className="weather-state">
              <Icon name="cloud" size={42} />
              <h2>A pause in the forecast.</h2>
              <p>{request.message}</p>
              <button
                className="button button-secondary"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Try again <Icon name="refresh" />
              </button>
            </div>
          )}
          {data && (
            <>
              <div className="current-weather">
                <div>
                  <span className="weather-city">
                    {city.name} <span>· Japan</span>
                  </span>
                  <strong>
                    {Math.round(data.current.temperature_2m)}
                    <span>°C</span>
                  </strong>
                  <p>{condition}</p>
                </div>
                <Icon name={icon} size={90} />
              </div>
              <div className="weather-metrics">
                <span>
                  <Icon name="wind" />
                  {data.current.wind_speed_10m} km/h wind
                </span>
                <span>
                  <Icon name="rain" />
                  {data.daily.precipitation_probability_max[0]}% chance of rain
                </span>
              </div>
              <div className="daily-forecast">
                {data.daily.time.map((date, index) => {
                  const [label, dailyIcon] = describeWeather(
                    data.daily.weather_code[index],
                  );
                  return (
                    <div key={date}>
                      <span>
                        {index === 0
                          ? "Today"
                          : new Date(
                              `${date}T12:00:00+09:00`,
                            ).toLocaleDateString("en", {
                              weekday: "short",
                              timeZone: "Asia/Tokyo",
                            })}
                      </span>
                      <Icon name={dailyIcon} size={27} />
                      <span className="fine-print">{label}</span>
                      <strong>
                        {Math.round(data.daily.temperature_2m_max[index])}°{" "}
                        <span>
                          {Math.round(data.daily.temperature_2m_min[index])}°
                        </span>
                      </strong>
                    </div>
                  );
                })}
              </div>
              <p className="fine-print weather-update">
                Forecast time: {data.current.time.replace("T", " ")} JST
              </p>
            </>
          )}
        </div>
      </div>
      <div className="weather-attribution">
        <p>
          Weather data by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo <Icon name="diagonal" size={13} />
          </a>{" "}
          ·{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
        </p>
        <p>
          A weather forecast is a planning aid. Check local road and event
          information before travelling.
        </p>
      </div>
    </section>
  );
}
