import CarArt from "./CarArt.jsx";
import Icon from "./Icon.jsx";
import { useApp } from "../App.jsx";

export default function CarCard({ car, index = 0 }) {
  const { saved, toggleSaved } = useApp();
  const selected = saved.includes(car.id);
  return (
    <article className="car-card" style={{ "--order": index }}>
      <div className="car-card-visual">
        <span className="car-code">{car.code}</span>
        <button
          className={`icon-button save-button ${selected ? "is-saved" : ""}`}
          aria-label={`${selected ? "Remove" : "Save"} ${car.maker} ${car.name}${selected ? " from" : " to"} garage`}
          aria-pressed={selected}
          onClick={() => toggleSaved(car.id)}
        >
          <Icon name="heart" />
        </button>
        <a href={`#/cars/${car.id}`} tabIndex="-1" aria-hidden="true">
          <CarArt car={car} />
        </a>
      </div>
      <div className="car-card-body">
        <div className="card-meta">
          <span>{car.maker}</span>
          <span>{car.years}</span>
        </div>
        <a className="car-title" href={`#/cars/${car.id}`}>
          <h3>{car.name}</h3>
          <Icon name="diagonal" />
        </a>
        <div className="car-card-specs">
          <span>{car.engine}</span>
          <span>{car.power} PS</span>
          <span>{car.layout}</span>
        </div>
      </div>
    </article>
  );
}
