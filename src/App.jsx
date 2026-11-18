import { createContext, useContext, useEffect, useRef, useState } from "react";
import Icon from "./components/Icon.jsx";
import Brand, { brandName } from "./components/Brand.jsx";
import { cars } from "./data.js";
import { Auth, Contact, Profile } from "./pages/Account.jsx";
import Drive from "./pages/Drive.jsx";
import { About, Culture } from "./pages/Editorial.jsx";
import { CarDetails, Garage } from "./pages/Garage.jsx";
import Home from "./pages/Home.jsx";
import { readStored, useStoredState } from "./storage.js";
import { useTheme } from "./theme.js";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
export const navigate = (path) => {
  window.location.hash = path;
};

function getRoute() {
  return window.location.hash.slice(1).split("?")[0] || "/";
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [theme, setTheme] = useTheme();
  const [session, setSession] = useStoredState("session", null);
  const [garages, setGarages] = useStoredState("garages", {});
  const [toast, setToast] = useState("");
  const timer = useRef(null);
  const main = useRef(null);
  const accounts = readStored("accounts", []);
  const user = Array.isArray(accounts)
    ? accounts.find((account) => account.id === session?.id)
    : null;
  const owner = user?.id || "guest";
  const saved = Array.isArray(garages?.[owner]) ? garages[owner] : [];

  useEffect(() => {
    const onRoute = () => setRoute(getRoute());
    window.addEventListener("hashchange", onRoute);
    return () => window.removeEventListener("hashchange", onRoute);
  }, []);
  useEffect(() => {
    const titles = {
      "/": "Legends. In motion.",
      "/cars": "The collection",
      "/culture": "The culture",
      "/drive": "Drive forecast",
      "/about": "Our story",
      "/contact": "Get in touch",
      "/login": "Welcome back",
      "/signup": "Join the garage",
      "/profile": "Your garage",
    };
    const car = cars.find((item) => route === `/cars/${item.id}`);
    document.title = `${car ? `${car.maker} ${car.name}` : titles[route] || "Page not found"} — ${brandName}`;
    window.scrollTo({ top: 0, behavior: "instant" });
    main.current?.focus({ preventScroll: true });
  }, [route]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function notify(message) {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4000);
  }
  function toggleSaved(id) {
    const exists = saved.includes(id);
    setGarages((previous) => ({
      ...previous,
      [owner]: exists ? saved.filter((item) => item !== id) : [...saved, id],
    }));
    notify(exists ? "Removed from your garage." : "Added to your garage.");
  }
  function logout() {
    setSession(null);
    notify("You have signed out.");
    navigate("/");
  }

  let page;
  if (route === "/") page = <Home />;
  else if (route === "/cars") page = <Garage />;
  else if (
    route.startsWith("/cars/") &&
    cars.some((car) => car.id === route.split("/")[2])
  )
    page = <CarDetails id={route.split("/")[2]} />;
  else if (route === "/culture") page = <Culture />;
  else if (route === "/drive") page = <Drive />;
  else if (route === "/about") page = <About />;
  else if (route === "/contact") page = <Contact />;
  else if (route === "/login" || route === "/signup")
    page = <Auth key={route} kind={route.slice(1)} />;
  else if (route === "/profile") page = <Profile />;
  else
    page = (
      <section className="container empty-page">
        <span className="eyebrow">404 / Off the map</span>
        <h1>Let’s get you back on track.</h1>
        <a className="button" href="#/">
          Back to home <Icon />
        </a>
      </section>
    );

  return (
    <AppContext.Provider
      value={{
        route,
        theme,
        setTheme,
        user,
        setSession,
        saved,
        toggleSaved,
        notify,
        logout,
      }}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" ref={main} tabIndex="-1" key={route}>
        {page}
      </main>
      <Footer />
      <div
        className={`toast ${toast ? "is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Icon name="check" />
            {toast}
          </>
        )}
      </div>
    </AppContext.Provider>
  );
}

function Header() {
  const { route, theme, setTheme, user, saved } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="wordmark" href="#/" aria-label={`${brandName} home`}>
          <Brand />
        </a>
        <nav
          id="main-nav"
          className={`main-nav ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          {[
            ["/cars", "The collection"],
            ["/culture", "Culture"],
            ["/drive", "Drive forecast"],
            ["/about", "About us"],
          ].map(([path, text]) => (
            <a
              key={path}
              href={`#${path}`}
              aria-current={route.startsWith(path) ? "page" : undefined}
            >
              {text}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <a
            className="garage-link"
            href="#/profile"
            aria-label={`Your garage, ${saved.length} saved cars`}
          >
            <Icon name="user" />
            <span>{user ? "Your garage" : "My garage"}</span>
            {saved.length > 0 && (
              <span className="save-count">{saved.length}</span>
            )}
          </a>
          <button
            className="icon-button menu-toggle"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-controls="main-nav"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer container">
      <div className="footer-top">
        <a className="footer-brand" href="#/" aria-label={`${brandName} home`}>
          <Brand />
          <span>For the love of the drive.</span>
        </a>
        <div className="footer-links">
          <a href="#/cars">Collection</a>
          <a href="#/about">Our team</a>
          <a href="#/contact">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {brandName}. Team letsgo · SE-2516.
        </span>
        <span>An independent enthusiast project.</span>
      </div>
    </footer>
  );
}
