import { cars, stories } from "../data.js";
import CarArt from "../components/CarArt.jsx";
import Brand, { brandName } from "../components/Brand.jsx";
import Icon from "../components/Icon.jsx";

export function Culture() {
  return (
    <section className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">The culture / Beyond the badge</span>
        <h1>It was never just about cars.</h1>
        <p>
          A way of thinking. A love of engineering. A connection that crosses
          borders.
        </p>
      </div>
      <div className="culture-intro">
        <span className="culture-intro-symbol" aria-hidden="true">
          魂
        </span>
        <div>
          <span className="eyebrow">Japanese domestic market</span>
          <h2>
            Built for Japan.
            <br />
            An inspiration everywhere.
          </h2>
          <p>
            JDM originally describes vehicles and specifications made for
            Japan’s domestic market. Among enthusiasts, the term also evokes the
            distinctive performance cars and ideas that found a following around
            the world.
          </p>
        </div>
      </div>
      <div className="editorial-stories">
        {stories.map((story) => (
          <article key={story.id} className="editorial-story">
            <div className="story-visual">
              <span className="story-number">{story.number}</span>
              <CarArt car={cars.find((car) => car.id === story.car)} />
              <span className="eyebrow">{story.category}</span>
            </div>
            <div className="story-text">
              <span className="eyebrow">{story.category}</span>
              <h2>{story.title}</h2>
              <p className="story-intro">{story.intro}</p>
              <p>{story.text}</p>
              <a className="text-link" href={`#/cars/${story.car}`}>
                Meet the machine <Icon name="diagonal" />
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="simple-callout">
        <Icon name="pin" size={28} />
        <div>
          <h2>A little closer to the source.</h2>
          <p>
            Explore three Japanese automotive destinations and check their
            weather.
          </p>
        </div>
        <a className="button button-secondary" href="#/drive">
          Drive forecast <Icon />
        </a>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">About / Team letsgo</span>
        <h1>
          Made by enthusiasts.
          <br />
          For the curious.
        </h1>
        <p>Six cars. Countless reasons to care about them.</p>
      </div>
      <div className="about-manifesto">
        <Brand className="manifesto-logo" />
        <div>
          <span className="eyebrow">Our idea</span>
          <h2>
            Less noise.
            <br />
            More of what matters.
          </h2>
          <p>
            {brandName} is an independent collection of the Japanese performance
            cars we keep coming back to. We bring their stories, defining
            engineering, and culture together in one focused place.
          </p>
          <p>
            Discover a new favourite, understand what makes it special, and
            build a personal garage. You don’t need to know every engine code to
            belong here.
          </p>
          <a className="text-link" href="#/cars">
            Start exploring <Icon />
          </a>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">The people behind the project</span>
          <h2>A shared passion.</h2>
        </div>
        <span className="fine-print">Astana IT University / SE-2516</span>
      </div>
      <div className="team-grid">
        {[
          ["01", "Dastan", "Explore. Build. Refine."],
          ["02", "Beibarys", "Details make the difference."],
        ].map(([number, name, motto]) => (
          <article className="team-member" key={name}>
            <div className="team-avatar" aria-hidden="true">
              {name[0]}
              <span>{number}</span>
            </div>
            <div>
              <span className="eyebrow">Team letsgo / SE-2516</span>
              <h3>{name}</h3>
              <p>{motto}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="about-values">
        {[
          [
            "Curated, not crowded.",
            "A focused selection with room to understand each car.",
          ],
          [
            "Engineering has a story.",
            "The figures matter. So do the ideas behind them.",
          ],
          [
            "Your favourites, together.",
            "A simple personal collection, saved on your device.",
          ],
        ].map(([title, text], index) => (
          <div key={title}>
            <span className="eyebrow">0{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="simple-callout">
        <Icon name="mail" size={28} />
        <div>
          <h2>Have a story to share?</h2>
          <p>We’d like to hear what makes a car special to you.</p>
        </div>
        <a className="button button-secondary" href="#/contact">
          Get in touch <Icon />
        </a>
      </div>
    </section>
  );
}
