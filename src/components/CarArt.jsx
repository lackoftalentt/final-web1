import { useState } from "react";

export default function CarArt({ car }) {
  const [failedSource, setFailedSource] = useState(null);
  const description = `${car.maker} ${car.name} (${car.generation}), side-profile photograph`;

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
      width="1200"
      height="800"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSource(car.photo.src)}
    />
  );
}
