import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { cars } from "../src/data.js";

await mkdir(new URL(".generated/", import.meta.url), { recursive: true });
await build({
  entryPoints: ["src/App.jsx"],
  outfile: "tests/.generated/app.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  jsx: "automatic",
  define: { "import.meta.env.BASE_URL": JSON.stringify("./") },
  external: ["react", "react-dom"],
});
const { default: App } = await import("./.generated/app.mjs");
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};

test("every route renders a unique primary heading without throwing", () => {
  const routes = [
    "/",
    "/cars",
    "/culture",
    "/drive",
    "/about",
    "/contact",
    "/login",
    "/signup",
    "/profile",
    ...cars.map((car) => `/cars/${car.id}`),
    "/missing",
  ];
  for (const route of routes) {
    globalThis.window = { location: { hash: `#${route}` } };
    const html = renderToString(createElement(App));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, route);
    assert.match(html, /<main/, route);
    assert.match(html, /<nav[^>]*aria-label="Main navigation"/, route);
    assert.match(html, /<footer/, route);
    assert.doesNotMatch(html, /undefined|NaN/, route);
    for (const [, path] of html.matchAll(/href="#(\/[^"]*)"/g)) {
      assert.ok(routes.includes(path), `Unknown internal route ${path}`);
    }
  }
});
test("authentication and contact forms disable browser validation and expose labels", () => {
  for (const route of ["/signup", "/login", "/contact"]) {
    window.location.hash = `#${route}`;
    const html = renderToString(createElement(App));
    assert.match(html, /<form[^>]*noValidate=""/, route);
    assert.doesNotMatch(
      html,
      /\s(?:required|pattern|minlength|maxlength|min|max)=/i,
      route,
    );
    assert.doesNotMatch(html, /type="email"/, route);
    const ids = [
      ...html.matchAll(/<(?:input|textarea|select)[^>]*\sid="([^"]+)"/g),
    ].map((match) => match[1]);
    for (const id of ids)
      assert.ok(html.includes(`for="${id}"`), `Missing label ${id}`);
  }
});
test("a signed-in profile renders stored details and its own garage", () => {
  storage.set(
    "jdm:accounts",
    JSON.stringify([
      {
        id: "demo",
        name: "Dastan",
        email: "demo@example.com",
        phone: "+77001234567",
        joined: "2026-11-16T00:00:00Z",
      },
    ]),
  );
  storage.set("jdm:session", JSON.stringify({ id: "demo" }));
  storage.set("jdm:garages", JSON.stringify({ demo: ["r34"], guest: ["rx7"] }));
  window.location.hash = "#/profile";
  const html = renderToString(createElement(App));
  assert.match(html, /Dastan/);
  assert.match(html, /demo@example.com/);
  assert.match(html, /77001234567/);
  assert.match(html, /Skyline GT-R/);
  assert.doesNotMatch(html, /Mazda/);
  assert.doesNotMatch(html, /passwordHash|password/);
  storage.clear();
});

test.after(async () => {
  delete globalThis.window;
  delete globalThis.localStorage;
  await rm(new URL(".generated/", import.meta.url), {
    recursive: true,
    force: true,
  });
});
