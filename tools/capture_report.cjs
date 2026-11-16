// Capture the real production website in an isolated browser profile.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const directory = path.join(root, "docs/screenshots/report");
const manifestPath = path.join(root, "docs/report-captures.json");
const manifest = {
  status: "running",
  captured_at: new Date().toISOString(),
  method: "Playwright Chromium screenshots of the production build",
  images: [],
  runtime_errors: [],
  layout_checks: [],
  live_api: "not checked",
};
let browser, server;

async function fingerprint(directory) {
  const files = [];
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  await walk(directory);
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(
      path.relative(directory, file).split(path.sep).join("/") + "\0",
    );
    hash.update(await fs.readFile(file));
  }
  return hash.digest("hex");
}

async function startPreview() {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  server = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4174",
      "--strictPort",
    ],
    { cwd: root, stdio: "pipe" },
  );
  let error = "";
  server.stderr.on("data", (chunk) => {
    error += chunk;
  });
  server.on("error", (event) => {
    error += event.message;
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Preview server could not start: ${error.trim()}`);
    try {
      const response = await fetch("http://127.0.0.1:4174");
      if (response.ok) return "http://127.0.0.1:4174";
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Preview server did not become ready. ${error.trim()}`);
}

(async () => {
  await fs.mkdir(directory, { recursive: true });
  manifest.build_fingerprint = await fingerprint(path.join(root, "dist"));
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  const executablePath = candidates.find(existsSync);
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const url = await startPreview();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => manifest.runtime_errors.push(error.message));
  page.setDefaultTimeout(15000);
  const go = async (route) => {
    await page.goto(`${url}/#${route}`, { waitUntil: "load" });
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((image) => image.decode().catch(() => {})),
      ),
    );
  };
  async function shot(id, title, options = {}) {
    const file = path.join(directory, `${id}.png`);
    const screenshot = options.selector ? page.locator(options.selector) : page;
    await screenshot.screenshot({
      path: file,
      animations: "disabled",
      ...(options.selector ? {} : { fullPage: Boolean(options.fullPage) }),
    });
    const audit = await page.evaluate(() => ({
      route: location.hash.slice(1),
      viewport: innerWidth,
      document_width: document.documentElement.scrollWidth,
      theme: document.documentElement.dataset.theme,
    }));
    manifest.layout_checks.push({
      id,
      ...audit,
      no_horizontal_overflow: audit.document_width <= audit.viewport + 1,
    });
    manifest.images.push({
      id,
      title,
      path: path.relative(root, file).split(path.sep).join("/"),
      route: audit.route,
      viewport: page.viewportSize(),
      theme: audit.theme,
      sha256: createHash("sha256")
        .update(await fs.readFile(file))
        .digest("hex"),
      ...options,
    });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Captured ${id}`);
  }

  await go("/");
  await page.waitForTimeout(5600);
  await shot(
    "home-dark",
    "Home: full-width Initial D hero after its single playback",
  );
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await shot("home-light", "Home: the selected light theme");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();

  for (const [route, id, title] of [
    [
      "/cars",
      "collection",
      "Collection: manufacturer, drivetrain, sorting and search controls",
    ],
    [
      "/cars/r34",
      "car-details",
      "Car details: story and save-to-garage action",
    ],
    [
      "/culture",
      "culture",
      "Culture: engineering and Japanese automotive heritage",
    ],
    ["/about", "about", "About Us: project purpose and team"],
    ["/contact", "contact", "Contact: a local demonstration form"],
    ["/signup", "signup", "Sign Up: local account registration"],
    ["/login", "login", "Log In: returning to a saved profile"],
  ]) {
    await go(route);
    await shot(id, title);
  }

  await go("/cars/r34");
  await page.getByRole("tab", { name: "Specifications" }).click();
  await shot(
    "specifications",
    "Specifications tab: selected Japanese-market reference figures",
    { selector: ".detail-editorial" },
  );

  await go("/cars");
  await page.getByRole("searchbox", { name: "Search cars" }).fill("rotary");
  await page.waitForFunction(
    () => document.querySelectorAll(".car-card").length === 1,
  );
  await shot("search", "Live search: rotary returns the Mazda RX-7");
  await page.getByRole("button", { name: "AWD", exact: true }).click();
  await page.getByRole("heading", { name: "No legends found." }).waitFor();
  await shot(
    "empty-results",
    "Combined filters: empty results and a reset action",
  );
  await page.getByRole("button", { name: "Reset filters" }).click();

  await go("/signup");
  await page.getByLabel("Your name", { exact: true }).fill("Demo Driver");
  await page.getByLabel("Email address", { exact: true }).fill("invalid-email");
  await page.getByLabel("Phone number", { exact: true }).fill("123");
  await page.getByLabel("Password", { exact: true }).fill("weak");
  await page.getByLabel("Confirm password", { exact: true }).fill("different");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.locator(".field-error").first().waitFor();
  await shot(
    "signup-validation",
    "JavaScript validation: email, phone, password strength and confirmation",
    { selector: "form" },
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo.driver@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("+77001234567");
  await page.getByLabel("Password", { exact: true }).fill("Garage#2026");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("Garage#2026");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("heading", { name: "Demo Driver’s garage." }).waitFor();
  await go("/cars/r34");
  await page.getByRole("button", { name: "Save to your garage" }).click();
  await go("/cars/rx7");
  await page.getByRole("button", { name: "Save to your garage" }).click();
  await go("/profile");
  await shot("profile", "Profile: registered sample user and two saved cars");
  await page.reload();
  await page.locator(".car-card").first().waitFor();
  if ((await page.locator(".car-card").count()) !== 2)
    throw new Error("Saved cars did not survive reload.");

  await go("/contact");
  await page.getByRole("button", { name: "Save message" }).click();
  await page.locator(".field-error").first().waitFor();
  await shot(
    "contact-validation",
    "Contact: required topic and message are validated inline",
    { selector: "form" },
  );
  await page.getByLabel("What’s on your mind?").selectOption("Share a story");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("My favourite car is the rotary-powered RX-7.");
  await page.getByRole("button", { name: "Save message" }).click();
  await page.locator(".contact-success").waitFor();
  await shot(
    "contact-saved",
    "Contact: confirmation explicitly states that the message is saved locally",
    { selector: ".contact-form-panel" },
  );

  await go("/profile");
  await page.getByRole("button", { name: "Sign out" }).click();
  await go("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo.driver@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Wrong#2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("alert").waitFor();
  await shot(
    "login-validation",
    "Log In: incorrect credentials receive an on-page message",
    { selector: "form" },
  );
  await page.getByLabel("Password", { exact: true }).fill("Garage#2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Demo Driver’s garage." }).waitFor();

  await go("/drive");
  await page.waitForFunction(
    () =>
      document.querySelector(".current-weather") ||
      document.querySelector(".weather-state .button"),
  );
  manifest.live_api = (await page.locator(".current-weather").count())
    ? "A successful unmodified response was observed from the live Open-Meteo service."
    : "Live request failed; the real error state was captured.";
  await shot(
    "drive-live",
    "Drive Forecast: observed response from the live weather service",
    { api: "live", api_observation: manifest.live_api },
  );
  const apiPattern = "**/api.open-meteo.com/**";
  await page.route(apiPattern, (route) => route.abort("failed"));
  if (await page.getByRole("button", { name: "Try again" }).count())
    await page.getByRole("button", { name: "Try again" }).click();
  else await page.getByRole("button", { name: "Refresh weather" }).click();
  await page.getByRole("button", { name: "Try again" }).waitFor();
  await shot(
    "drive-error",
    "API failure: a controlled failed request exposes a retry button",
    { api: "controlled-error" },
  );
  await page.unroute(apiPattern);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const fixture = {
    current: {
      temperature_2m: 18,
      weather_code: 2,
      wind_speed_10m: 9,
      time: "2026-11-16T12:00",
    },
    daily: {
      time: ["2026-11-16", "2026-11-17", "2026-11-18"],
      weather_code: [2, 0, 61],
      temperature_2m_max: [20, 21, 17],
      temperature_2m_min: [11, 12, 10],
      precipitation_probability_max: [10, 0, 85],
    },
  };
  await page.route(apiPattern, async (route) => {
    await gate;
    await route.fulfill({ json: fixture });
  });
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("heading", { name: "Checking the skies…" }).waitFor();
  await shot(
    "drive-loading",
    "API loading state while a controlled response is delayed",
    { api: "controlled-loading" },
  );
  release();
  await page.locator(".current-weather").waitFor();
  await shot(
    "drive-controlled",
    "API success interface with controlled test data, not live weather",
    { api: "fixture" },
  );

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await go("/");
    await page.waitForTimeout(5600);
    await shot(
      `home-${width}`,
      `Home: ${width === 390 ? "mobile" : "tablet"} viewport, ${width}px wide`,
    );
    if (width === 390) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await shot("mobile-navigation", "Mobile navigation: expanded menu");
      await page.getByRole("button", { name: "Close navigation" }).click();
      await go("/cars");
      await shot(
        "collection-mobile",
        "Collection: single-column mobile layout",
      );
      await go("/contact");
      await shot(
        "contact-mobile",
        "Contact: labelled inputs in a narrow viewport",
        { selector: ".contact-form-panel" },
      );
    }
  }
  manifest.status =
    manifest.runtime_errors.length ||
    manifest.layout_checks.some((check) => !check.no_horizontal_overflow)
      ? "captured-with-findings"
      : "passed";
  manifest.completed_at = new Date().toISOString();
  console.log(
    `${manifest.images.length} genuine website screenshots captured.`,
  );
})()
  .catch((error) => {
    manifest.status = manifest.images.length ? "partial" : "blocked";
    manifest.error = error.message.split("\n")[0];
    manifest.detail = error.message
      .split("\n")
      .find((line) => /Operation not permitted|EPERM/.test(line))
      ?.replace(/\u001b\[[0-9;]*m/g, "");
    console.error(manifest.error);
    if (manifest.detail) console.error(manifest.detail);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    server?.kill();
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  });
