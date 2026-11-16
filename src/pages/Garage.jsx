import { useState } from "react";
import { cars } from "../data.js";
import { useStoredState } from "../storage.js";
import { useApp } from "../App.jsx";
import CarCard from "../components/CarCard.jsx";
import CarArt from "../components/CarArt.jsx";
import Icon from "../components/Icon.jsx";

export function Garage() {
  const [filters, setFilters] = useStoredState("filters", {
    query: "",
    layout: "all",
    maker: "all",
    sort: "curated",
  });
  const current = {
    query: "",
    layout: "all",
    maker: "all",
    sort: "curated",
    ...filters,
  };
  const update = (changes) => setFilters({ ...current, ...changes });
  let results = cars.filter(
    (car) =>
      `${car.maker} ${car.name} ${car.generation} ${car.engine} ${car.engineType}`
        .toLowerCase()
        .includes(String(current.query).toLowerCase().trim()) &&
      (current.layout === "all" || car.layout === current.layout) &&
      (current.maker === "all" || car.maker === current.maker),
  );
  if (current.sort === "name")
    results = [...results].sort((a, b) => a.name.localeCompare(b.name));
  if (current.sort === "year")
    results = [...results].sort((a, b) => a.year - b.year);
  if (current.sort === "weight")
    results = [...results].sort((a, b) => a.weight - b.weight);
  const active =
    current.query ||
    current.layout !== "all" ||
    current.maker !== "all" ||
    current.sort !== "curated";
  return (
    <section className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">The collection / 6 original icons</span>
        <h1>Find your kind of legend.</h1>
        <p>
          Different philosophies. One unforgettable era of Japanese performance.
        </p>
      </div>
      <div className="filter-panel">
        <label className="search-field">
          <Icon name="search" />
          <span className="sr-only">Search cars</span>
          <input
            type="search"
            value={current.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search a car, engine, or manufacturer…"
          />
        </label>
        <div className="filter-row">
          <div className="segmented" aria-label="Drivetrain filter">
            {[
              ["all", "All cars"],
              ["AWD", "AWD"],
              ["RWD", "RWD"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={current.layout === value}
                className={current.layout === value ? "is-active" : ""}
                onClick={() => update({ layout: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="select-filters">
            <label>
              <span className="sr-only">Manufacturer</span>
              <select
                aria-label="Manufacturer"
                value={current.maker}
                onChange={(event) => update({ maker: event.target.value })}
              >
                <option value="all">All manufacturers</option>
                {cars.map((car) => (
                  <option key={car.id}>{car.maker}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort collection</span>
              <select
                aria-label="Sort collection"
                value={current.sort}
                onChange={(event) => update({ sort: event.target.value })}
              >
                <option value="curated">Curated order</option>
                <option value="name">Name: A–Z</option>
                <option value="year">First year</option>
                <option value="weight">Lightest first</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="results-bar">
        <p role="status">
          {results.length} {results.length === 1 ? "legend" : "legends"} in the
          collection
        </p>
        {active && (
          <button
            className="text-button"
            onClick={() =>
              setFilters({
                query: "",
                layout: "all",
                maker: "all",
                sort: "curated",
              })
            }
          >
            Reset filters <Icon name="close" size={15} />
          </button>
        )}
      </div>
      {results.length ? (
        <div className="car-grid">
          {results.map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="search" size={32} />
          <h2>No legends found.</h2>
          <p>Try a different engine, name, or manufacturer.</p>
          <button
            className="button button-secondary"
            onClick={() =>
              setFilters({
                query: "",
                layout: "all",
                maker: "all",
                sort: "curated",
              })
            }
          >
            Clear all filters <Icon name="refresh" />
          </button>
        </div>
      )}
      <p className="fine-print spec-note">
        Figures describe selected Japanese-market variants; specifications vary
        by year and trim. Original vector illustrations are stylised.
      </p>
    </section>
  );
}

export function CarDetails({ id }) {
  const car = cars.find((item) => item.id === id);
  const { saved, toggleSaved } = useApp();
  const [tab, setTab] = useState("story");
  return (
    <section className="container page-section">
      <a className="back-link" href="#/cars">
        <Icon name="arrow" />
        Back to the collection
      </a>
      <div className="detail-grid">
        <div className="detail-art">
          <span className="eyebrow">
            {car.maker} / {car.code}
          </span>
          <span className="detail-watermark" aria-hidden="true">
            {car.generation}
          </span>
          <CarArt car={car} />
          <span className="art-credit">Original vector illustration</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {car.years} / {car.layout}
          </span>
          <h1>
            {car.maker}
            <br />
            <span>{car.name}</span>
          </h1>
          <p className="detail-tag">{car.tag}</p>
          <p>{car.description}</p>
          <button
            className={`button ${saved.includes(id) ? "button-secondary" : ""}`}
            onClick={() => toggleSaved(id)}
            aria-pressed={saved.includes(id)}
          >
            <Icon name="heart" />
            {saved.includes(id)
              ? "Saved to your garage"
              : "Save to your garage"}
          </button>
          <a className="quiet-link" href="#/profile">
            View your garage <Icon name="diagonal" size={16} />
          </a>
        </div>
      </div>
      <div className="detail-stats">
        {[
          [car.engine, "Engine"],
          [`${car.power} PS`, "Power"],
          [`${car.torque} Nm`, "Torque"],
          [`${car.weight.toLocaleString()} kg`, "Weight"],
        ].map(([value, label]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="detail-editorial">
        <div className="segmented" role="tablist" aria-label="Car information">
          {[
            ["story", "The story"],
            ["specs", "Specifications"],
          ].map(([value, label]) => (
            <button
              id={`tab-${value}`}
              role="tab"
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              key={value}
              onClick={() => setTab(value)}
              onKeyDown={(event) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "story"
                      : event.key === "End"
                        ? "specs"
                        : tab === "story"
                          ? "specs"
                          : "story";
                  setTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }
              }}
              className={tab === value ? "is-active" : ""}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "story" ? (
            <div className="story-copy">
              <h2>{car.tag}</h2>
              <p>{car.story}</p>
              <a className="text-link" href="#/culture">
                Explore the culture <Icon />
              </a>
            </div>
          ) : (
            <dl className="spec-list">
              {[
                ["Manufacturer", car.maker],
                ["Chassis", car.code],
                ["Production", car.years],
                ["Engine", car.engineType],
                ["Drivetrain", car.layout],
                ["Power", `${car.power} PS (JDM)`],
                ["Torque", `${car.torque} Nm`],
                ["Weight", `${car.weight} kg`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      <p className="fine-print">
        Reference figures for a selected Japanese-market trim. Production,
        output, and weight vary by specification.
      </p>
      <div className="section-heading related-heading">
        <h2>Keep exploring.</h2>
        <a className="text-link" href="#/cars">
          All legends <Icon />
        </a>
      </div>
      <div className="car-grid">
        {cars
          .filter((item) => item.id !== id)
          .slice(0, 3)
          .map((item) => (
            <CarCard key={item.id} car={item} />
          ))}
      </div>
    </section>
  );
}
