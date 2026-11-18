import { useState } from "react";

export default function CarArt({ car }) {
  const [failedSource, setFailedSource] = useState(null);
  const description = `${car.maker} ${car.name} (${car.generation}), AI-generated studio side profile`;

  if (failedSource === car.photo.src) {
    return (
      <div
        className="car-art car-photo-unavailable"
        role="img"
        aria-label={description + " unavailable"}
      >
        <span>
          {car.maker} {car.name}
        </span>
        <span>Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      className="car-art"
      src={car.photo.src}
      alt={description}
      width="1536"
      height="1024"
      loading="lazy"
      decoding="async"
      onError={() => setFailedSource(car.photo.src)}
    />
  );
}
