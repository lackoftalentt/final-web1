import { useState } from "react";
import { navigate, useApp } from "../App.jsx";
import { cars } from "../data.js";
import { readStored, writeStored } from "../storage.js";
import { authenticate, registerAccount } from "../account.js";
import { validate } from "../validation.js";
import Field from "../components/Field.jsx";
import Icon from "../components/Icon.jsx";
import CarCard from "../components/CarCard.jsx";
import CarArt from "../components/CarArt.jsx";
import Brand, { brandName } from "../components/Brand.jsx";

function focusFirstError(form) {
  requestAnimationFrame(() =>
    form.querySelector('[aria-invalid="true"]')?.focus(),
  );
}

export function Auth({ kind }) {
  const signup = kind === "signup";
  const { user, setSession, notify } = useApp();
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (event) => {
    const next = { ...values, [event.target.name]: event.target.value };
    setValues(next);
    setStatus("");
    setErrors((previous) => {
      const nextErrors = { ...previous };
      delete nextErrors[event.target.name];
      if (event.target.name === "password") delete nextErrors.confirm;
      return nextErrors;
    });
  };
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const nextErrors = validate(values, kind);
    setErrors(nextErrors);
    setStatus("");
    if (Object.keys(nextErrors).length) {
      focusFirstError(form);
      return;
    }
    setBusy(true);
    try {
      const account = signup
        ? await registerAccount(values)
        : await authenticate(values.email, values.password);
      if (!writeStored("session", { id: account.id }))
        throw new Error(
          "Your session couldn’t be saved. Please allow local storage.",
        );
      setSession({ id: account.id });
      notify(
        signup
          ? `Welcome to the garage, ${account.name}.`
          : `Welcome back, ${account.name}.`,
      );
      navigate("/profile");
    } catch (error) {
      setStatus(
        error instanceof TypeError
          ? "Account access is unavailable. Use localhost or HTTPS and allow local storage."
          : error.message,
      );
    } finally {
      setBusy(false);
    }
  }
  if (user)
    return (
      <section className="container empty-page">
        <span className="eyebrow">You’re already signed in</span>
        <h1>Welcome, {user.name}.</h1>
        <p>Your collection is waiting for you.</p>
        <a className="button" href="#/profile">
          Open your garage <Icon />
        </a>
      </section>
    );
  return (
    <section className="container auth-layout">
      <div className="auth-art">
        <span className="eyebrow">Your next obsession starts here.</span>
        <h2>
          Good taste.
          <br />
          Great company.
        </h2>
        <div className="auth-car">
          <CarArt car={cars[2]} />
        </div>
        <span className="auth-art-caption">
          <Brand />
          <span>FOR THE LOVE OF THE DRIVE</span>
        </span>
      </div>
      <div className="auth-form">
        <a className="back-link" href="#/cars">
          <Icon name="arrow" />
          Back to the collection
        </a>
        <span className="eyebrow">Your personal collection</span>
        <h1>{signup ? "Join the garage." : "Welcome back."}</h1>
        <p>
          {signup
            ? "Create a local profile and make yourself at home."
            : "Sign in to return to your saved legends."}
        </p>
        <form
          noValidate
          onSubmit={submit}
          aria-label={signup ? "Create account" : "Sign in"}
        >
          {signup && (
            <Field
              label="Your name"
              name="name"
              value={values.name}
              onChange={change}
              error={errors.name}
              autoComplete="name"
              placeholder="Your name"
            />
          )}
          <Field
            label="Email address"
            name="email"
            value={values.email}
            onChange={change}
            error={errors.email}
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          {signup && (
            <Field
              label="Phone number"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={change}
              error={errors.phone}
              autoComplete="tel"
              placeholder="+7 700 123 45 67"
            />
          )}
          <Field
            label="Password"
            name="password"
            type="password"
            value={values.password}
            onChange={change}
            error={errors.password}
            autoComplete={signup ? "new-password" : "current-password"}
            hint={
              signup
                ? "8+ characters, uppercase, lowercase, number, and symbol."
                : undefined
            }
            placeholder={signup ? "Create a strong password" : "Your password"}
          />
          {signup && (
            <Field
              label="Confirm password"
              name="confirm"
              type="password"
              value={values.confirm}
              onChange={change}
              error={errors.confirm}
              autoComplete="new-password"
              placeholder="Repeat your password"
            />
          )}
          {status && (
            <p className="form-feedback error-feedback" role="alert">
              {status}
            </p>
          )}
          <button className="button form-submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" />
                Please wait…
              </>
            ) : (
              <>
                {signup ? "Create account" : "Sign in"}
                <Icon />
              </>
            )}
          </button>
        </form>
        <p className="auth-switch">
          {signup ? "Already part of the garage?" : "New around here?"}{" "}
          <a href={signup ? "#/login" : "#/signup"}>
            {signup ? "Sign in" : "Create an account"}{" "}
            <Icon name="diagonal" size={14} />
          </a>
        </p>
        <p className="fine-print demo-note">
          Coursework demo. Accounts are stored in this browser only. Use sample
          details and a password you don’t use elsewhere.
        </p>
      </div>
    </section>
  );
}

export function Contact() {
  const { user } = useApp();
  const [values, setValues] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState("");
  function change(event) {
    setValues((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setErrors((previous) => ({ ...previous, [event.target.name]: undefined }));
    setResult("");
  }
  function submit(event) {
    event.preventDefault();
    const nextErrors = validate(values, "contact");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstError(event.currentTarget);
      return;
    }
    const stored = readStored("messages", []);
    const messages = Array.isArray(stored) ? stored : [];
    const saved = writeStored("messages", [
      ...messages,
      {
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        owner: user?.id || "guest",
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
      },
    ]);
    setResult(saved ? "success" : "error");
  }
  return (
    <section className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">Contact / Start a conversation</span>
        <h1>
          Every legend has a story.
          <br />
          What’s yours?
        </h1>
        <p>A favourite car, an idea for the archive, or just a hello.</p>
      </div>
      <div className="contact-layout">
        <aside className="contact-aside">
          <div className="contact-symbol">
            <Icon name="mail" size={42} />
          </div>
          <h2>Let’s talk cars.</h2>
          <p>
            We’re Dastan and Beibarys, the team behind {brandName}. This space
            is for the people who notice the details.
          </p>
          <dl>
            <div>
              <dt>The team</dt>
              <dd>letsgo</dd>
            </div>
            <div>
              <dt>Our home</dt>
              <dd>Astana IT University</dd>
            </div>
            <div>
              <dt>Our group</dt>
              <dd>SE-2516</dd>
            </div>
          </dl>
          <p className="fine-print">
            This is a demo contact form. Your message is saved on this device;
            it is not sent to the team.
          </p>
        </aside>
        <div className="contact-form-panel">
          {result === "success" ? (
            <div className="contact-success" role="status">
              <span className="success-icon">
                <Icon name="check" size={30} />
              </span>
              <span className="eyebrow">Message saved locally</span>
              <h2>Thanks, {values.name.trim()}.</h2>
              <p>
                Your message about “{values.subject}” is saved in this browser.
                No email has been sent.
              </p>
              <button
                className="button"
                onClick={() => {
                  setResult("");
                  setValues((previous) => ({
                    ...previous,
                    subject: "",
                    message: "",
                  }));
                }}
              >
                Write another message <Icon />
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} aria-label="Contact the team">
              <div className="form-row">
                <Field
                  label="Your name"
                  name="name"
                  value={values.name}
                  onChange={change}
                  error={errors.name}
                  autoComplete="name"
                  placeholder="Your name"
                />
                <Field
                  label="Email address"
                  name="email"
                  value={values.email}
                  onChange={change}
                  error={errors.email}
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <Field
                label="Phone number"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={change}
                error={errors.phone}
                autoComplete="tel"
                placeholder="+7 700 123 45 67"
              />
              <Field
                label="What’s on your mind?"
                name="subject"
                value={values.subject}
                onChange={change}
                error={errors.subject}
                options={[
                  "Suggest a car",
                  "Share a story",
                  "Project feedback",
                  "Something else",
                ]}
              />
              <Field
                label="Your message"
                name="message"
                value={values.message}
                onChange={change}
                error={errors.message}
                multiline
                placeholder="Tell us a little more…"
              />
              {result === "error" && (
                <p role="alert" className="form-feedback error-feedback">
                  The message couldn’t be saved. Check that local storage is
                  enabled.
                </p>
              )}
              <button className="button form-submit">
                Save message <Icon name="diagonal" />
              </button>
              <p className="fine-print">
                All fields are needed. This form saves a local demonstration
                message.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export function Profile() {
  const { user, saved, logout } = useApp();
  const savedCars = cars.filter((car) => saved.includes(car.id));
  const stored = readStored("messages", []);
  const messages = Array.isArray(stored)
    ? stored.filter((message) => message.owner === user?.id)
    : [];
  return (
    <section className="container page-section">
      <div className="profile-heading">
        <div>
          <span className="eyebrow">Your corner of the collection</span>
          <h1>{user ? `${user.name}’s garage.` : "Your dream garage."}</h1>
          <p>
            {user
              ? "A collection that says something about you."
              : "Save the machines you keep coming back to."}
          </p>
        </div>
        {user && (
          <button className="button button-secondary" onClick={logout}>
            Sign out <Icon name="diagonal" />
          </button>
        )}
      </div>
      {user ? (
        <div className="profile-info">
          <span className="profile-avatar" aria-hidden="true">
            {user.name[0].toUpperCase()}
          </span>
          <div>
            <h2>{user.name}</h2>
            <span>{user.email}</span>
          </div>
          <div>
            <span className="eyebrow">Phone</span>
            <p>{user.phone}</p>
          </div>
          <div>
            <span className="eyebrow">Member since</span>
            <p>
              {new Date(user.joined).toLocaleDateString("en", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="guest-banner">
          <div>
            <h2>A little space of your own.</h2>
            <p>
              Your guest favourites stay in this browser. Sign in to use a
              separate personal garage.
            </p>
          </div>
          <div className="guest-actions">
            <a className="text-link" href="#/login">
              Sign in
            </a>
            <a className="button" href="#/signup">
              Create account <Icon />
            </a>
          </div>
        </div>
      )}
      <div className="section-heading">
        <h2>
          Saved legends{" "}
          <span className="heading-count">{savedCars.length}</span>
        </h2>
        <a className="text-link" href="#/cars">
          Explore collection <Icon />
        </a>
      </div>
      {savedCars.length ? (
        <div className="car-grid">
          {savedCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="empty-state garage-empty">
          <Icon name="heart" size={34} />
          <h2>The best garages start with one car.</h2>
          <p>Tap the heart on a car to make it part of your collection.</p>
          <a className="button" href="#/cars">
            Find your first legend <Icon />
          </a>
        </div>
      )}
      {user && messages.length > 0 && (
        <div className="profile-messages">
          <h2>Your local messages</h2>
          <p className="fine-print">
            Saved on this device. These messages have not been sent.
          </p>
          {messages.map((message) => (
            <details key={message.id}>
              <summary>
                {message.subject}
                <span>{new Date(message.date).toLocaleDateString("en")}</span>
              </summary>
              <p>{message.message}</p>
            </details>
          ))}
        </div>
      )}
      <p className="fine-print spec-note">
        Your profile and garage are local to this browser. Clearing site data
        removes them.
      </p>
    </section>
  );
}
