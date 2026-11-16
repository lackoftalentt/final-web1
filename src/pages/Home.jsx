import { cars } from "../data.js";
import CarCard from "../components/CarCard.jsx";
import Icon from "../components/Icon.jsx";
import HeroMedia from "../components/HeroMedia.jsx";

export default function Home() {
  return (
    <>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-content">
          <span className="eyebrow">
            <span className="status-dot" />
            Japanese performance / JDM
          </span>
          <h1 id="hero-title">
            Legends.
            <br />
            <span>In motion.</span>
          </h1>
          <p>Six Japanese icons. A culture that never stands still.</p>
          <a className="button button-accent" href="#/cars">
            Explore the legends <Icon name="diagonal" />
          </a>
        </div>
        <HeroMedia />
        <div className="hero-art-caption">
          <span>
            <span className="status-dot" />
            Initial D
          </span>
          <a href="#/cars/evo">
            Explore the Evolution <Icon name="diagonal" size={16} />
          </a>
        </div>
      </section>
      <div
        className="maker-strip container"
        aria-label="Manufacturers in the collection"
      >
        <span className="maker-strip-label">THE ORIGINALS</span>
        {["NISSAN", "TOYOTA", "MAZDA", "HONDA", "MITSUBISHI", "SUBARU"].map(
          (name) => (
            <span key={name}>{name}</span>
          ),
        )}
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / The collection</span>
            <h2>Icons for a reason.</h2>
          </div>
          <a className="text-link" href="#/cars">
            View all 6 legends <Icon />
          </a>
        </div>
        <div className="car-grid">
          {cars.slice(0, 3).map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </div>
      </section>
      <section className="container culture-teaser">
        <div className="culture-teaser-art" aria-hidden="true">
          <span className="road-line road-line-one" />
          <span className="road-line road-line-two" />
          <span className="culture-japan">走</span>
          <span className="teaser-caption">THE SPIRIT OF THE DRIVE</span>
        </div>
        <div className="culture-teaser-copy">
          <span className="eyebrow">02 / Beyond the machines</span>
          <h2>
            More than cars.
            <br />A shared obsession.
          </h2>
          <p>
            From rotary ingenuity to rally-bred engineering. Get to know the
            ideas and people behind the badges.
          </p>
          <a className="text-link" href="#/culture">
            Discover the culture <Icon name="diagonal" />
          </a>
        </div>
      </section>
      <section className="container join-strip">
        <div>
          <span className="eyebrow">Make it personal</span>
          <h2>Your dream garage starts here.</h2>
          <p>Keep your favourites together. Come back for another look.</p>
        </div>
        <a className="button" href="#/profile">
          Build your garage <Icon name="diagonal" />
        </a>
      </section>
    </>
  );
}
