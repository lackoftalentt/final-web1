const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const screenshots = path.join(root, "docs/screenshots");
const checks = [];
let browser, server;
const apiPattern = "**/api.open-meteo.com/**";
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
function check(name, value = true) {
  assert.ok(value, name);
  checks.push(name);
}

(async () => {
  await fs.mkdir(screenshots, { recursive: true });
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const url = process.env.BASE_URL || "http://127.0.0.1:4173";
  if (!process.env.BASE_URL) {
    server = spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        "4173",
        "--strictPort",
      ],
      { cwd: root, stdio: "ignore" },
    );
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (server.exitCode !== null)
        throw new Error("Preview server could not start.");
      try {
        const response = await fetch(url);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(ready, "Preview server readiness");
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  const mediaRequests = [];
  page.on("request", (request) => {
    if (/\.(gif|mp4)(?:\?|$)/.test(request.url()))
      mediaRequests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("Failed to load resource")
    )
      errors.push(message.text());
  });
  const go = async (route) => {
    await page.goto(`${url}/#${route}`);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  const shot = async (name) => {
    await page.screenshot({
      path: path.join(screenshots, name),
      fullPage: true,
      animations: "disabled",
    });
  };
  await page.route(apiPattern, (route) => route.fulfill({ json: fixture }));

  await go("/");
  const heroImage = page.locator(".hero-motion img");
  await heroImage.evaluate((image) => image.decode());
  await page.waitForFunction(
    () => document.querySelector(".hero-motion video")?.readyState >= 1,
  );
  check(
    "hero uses a muted, inline MP4 with no loop and the original duration",
    await page
      .locator(".hero-motion video")
      .evaluate(
        (video) =>
          video.muted &&
          video.playsInline &&
          !video.loop &&
          Math.abs(video.duration - 5.45) < 0.01,
      ),
  );
  const finishedAt = await page.locator(".hero-motion video").evaluate(
    (video) =>
      new Promise((resolve, reject) => {
        if (video.ended) return resolve(video.currentTime);
        video.addEventListener("ended", () => resolve(video.currentTime), {
          once: true,
        });
        video.addEventListener(
          "error",
          () => reject(new Error("Video failed before completing")),
          { once: true },
        );
      }),
  );
  await page
    .locator(".hero-motion video")
    .waitFor({ state: "detached", timeout: 12000 });
  check(
    "one playback ends on the exact original static final frame",
    Math.abs(finishedAt - 5.45) < 0.01 &&
      (await heroImage.getAttribute("src")).includes("initiald-last-") &&
      (await page.locator(".hero-motion").getAttribute("data-playback")) ===
        "still",
  );
  check(
    "the original heavy GIF is never downloaded",
    !mediaRequests.some((url) => url.endsWith(".gif")),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requestsBeforeReducedMotion = mediaRequests.length;
  await page.reload();
  await heroImage.evaluate((image) => image.decode());
  check(
    "reduced motion displays the last frame without mounting video",
    (await page.locator(".hero-motion video").count()) === 0 &&
      (await heroImage.getAttribute("src")).includes("initiald-last-"),
  );
  check(
    "reduced motion does not request the MP4 or GIF",
    mediaRequests.length === requestsBeforeReducedMotion,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  check(
    "first visit defaults to dark mode",
    (await page.locator("html").getAttribute("data-theme")) === "dark",
  );
  const pagePalette = () =>
    page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      text: getComputedStyle(document.body).color,
    }));
  const darkPalette = await pagePalette();
  check(
    "dark theme paints both the page and its text",
    darkPalette.root === "rgb(11, 11, 12)" &&
      darkPalette.body === darkPalette.root &&
      darkPalette.text === "rgb(243, 243, 238)",
  );
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  const lightPalette = await pagePalette();
  check(
    "switching themes updates the root, body, and inherited text",
    lightPalette.root === "rgb(246, 246, 242)" &&
      lightPalette.body === lightPalette.root &&
      lightPalette.text === "rgb(35, 39, 36)",
  );
  await page.reload();
  check(
    "explicit light preference survives reload",
    (await page.locator("html").getAttribute("data-theme")) === "light",
  );
  await shot("home-desktop-light.png");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await go("/culture");
  check(
    "theme persists across navigation",
    (await page.locator("html").getAttribute("data-theme")) === "dark",
  );
  await page.reload();
  check(
    "theme persists across reload",
    (await page.locator("html").getAttribute("data-theme")) === "dark",
  );
  await go("/");
  await shot("home-desktop-dark.png");
  await page.getByRole("button", { name: "Switch to light mode" }).click();

  await go("/cars");
  await page.getByRole("searchbox", { name: "Search cars" }).fill("rotary");
  check(
    "live search finds the rotary car",
    (await page.locator(".car-card").count()) === 1 &&
      (await page.locator(".car-title").innerText()) === "RX-7",
  );
  await page.getByRole("button", { name: "AWD", exact: true }).click();
  await page.getByRole("heading", { name: "No legends found." }).waitFor();
  check("combined filtering has a useful empty state");
  await page.getByRole("button", { name: "Reset filters" }).click();
  check(
    "reset restores all cars",
    (await page.locator(".car-card").count()) === 6,
  );
  await page.getByLabel("Manufacturer", { exact: true }).selectOption("Honda");
  await page.reload();
  check(
    "filters persist after reload",
    (await page.locator(".car-card").count()) === 1,
  );
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Sort collection").selectOption("year");
  check(
    "sort updates the collection",
    (await page.locator(".car-title").first().innerText()).includes("NSX"),
  );
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("button", { name: "Save Nissan Skyline GT-R to garage" })
    .click();
  await go("/profile");
  check(
    "guest favourites persist across pages",
    (await page.locator(".car-card").count()) === 1,
  );
  await page.reload();
  check(
    "guest favourites persist across reload",
    (await page.locator(".car-card").count()) === 1,
  );

  await go("/signup");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  check(
    "blank signup fields have inline errors",
    (await page.locator(".field-error").count()) === 5,
  );
  await page.getByLabel("Your name", { exact: true }).fill("Demo Driver");
  await page.getByLabel("Email address", { exact: true }).fill("not-an-email");
  await page.getByLabel("Phone number", { exact: true }).fill("123");
  await page.getByLabel("Password", { exact: true }).fill("weak");
  await page.getByLabel("Confirm password", { exact: true }).fill("different");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  check(
    "email, phone, password, and confirmation validation",
    (await page.locator(".field-error").count()) === 4,
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("+77001234567");
  await page.getByLabel("Password", { exact: true }).fill("Skyline#34");
  await page.getByLabel("Confirm password", { exact: true }).fill("Skyline#34");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("heading", { name: "Demo Driver’s garage." }).waitFor();
  check(
    "registration redirects to stored profile",
    (await page.locator(".profile-info").innerText()).includes(
      "demo@example.com",
    ),
  );
  check(
    "personal garage is separate from guest garage",
    (await page.locator(".car-card").count()) === 0,
  );
  check(
    "readable passwords are not stored",
    !(await page.evaluate(() => localStorage.getItem("jdm:accounts"))).includes(
      "Skyline#34",
    ),
  );
  await go("/cars/rx7");
  await page.getByRole("button", { name: "Save to your garage" }).click();
  await page.getByRole("tab", { name: "Specifications" }).click();
  check(
    "car details show specifications",
    (await page.getByRole("tabpanel").innerText()).includes("13B") ||
      (await page.getByRole("tabpanel").innerText()).includes("rotary"),
  );
  await page.getByRole("tab", { name: "Specifications" }).press("ArrowLeft");
  check(
    "car tabs support keyboard navigation",
    (await page
      .getByRole("tab", { name: "The story" })
      .getAttribute("aria-selected")) === "true",
  );
  await go("/profile");
  await shot("profile-desktop.png");
  await page.getByRole("button", { name: "Sign out" }).click();
  await go("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByLabel("Password", { exact: true }).fill("WrongPass#34");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("alert").waitFor();
  check("incorrect credentials show an inline error");
  await page.getByLabel("Password", { exact: true }).fill("Skyline#34");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Demo Driver’s garage." }).waitFor();
  check(
    "login restores the correct garage",
    (await page.locator(".car-card").count()) === 1,
  );

  await go("/contact");
  let contactFails = true;
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: contactFails ? 502 : 200,
      json: contactFails
        ? {
            ok: false,
            error: "The message couldn’t be delivered. Please try again later.",
          }
        : { ok: true, deliveredAt: "2026-11-18T12:00:00Z" },
    }),
  );
  await page.getByRole("button", { name: "Send message" }).click();
  check(
    "contact form validates missing topic and message",
    (await page.locator(".field-error").count()) === 2,
  );
  await page.getByLabel("What’s on your mind?").selectOption("Share a story");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("The RX-7 is my favourite rotary car.");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("alert").waitFor();
  check(
    "failed contact delivery does not show a success screen",
    (await page.locator(".contact-success").count()) === 0,
  );
  check(
    "failed contact delivery is not recorded as sent",
    (await page.evaluate(
      () => JSON.parse(localStorage.getItem("jdm:messages") || "[]").length,
    )) === 0,
  );
  contactFails = false;
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("heading", { name: "Thanks, Demo Driver." }).waitFor();
  check(
    "confirmed contact delivery stores a local history copy (controlled API response)",
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("jdm:messages")),
      )
    ).length === 1,
  );
  await go("/profile");
  check(
    "profile shows message delivery history",
    (await page.locator(".profile-messages details").count()) === 1,
  );

  await go("/drive");
  await page.locator(".current-weather").waitFor();
  check(
    "API response renders weather",
    (await page.locator(".current-weather").innerText()).includes("18"),
  );
  await page.getByRole("button", { name: /Yokohama/ }).click();
  await page.locator(".current-weather").waitFor();
  check(
    "destination selection updates weather",
    (await page.locator(".current-weather").innerText()).includes("Yokohama"),
  );
  await page.unroute(apiPattern);
  await page.route(apiPattern, (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Refresh weather" }).click();
  await page.getByRole("button", { name: "Try again" }).waitFor();
  check("API errors expose a retry control");
  await page.unroute(apiPattern);
  await page.route(apiPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ json: fixture });
  });
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("heading", { name: "Checking the skies…" }).waitFor();
  await page.locator(".current-weather").waitFor();
  check("API retry shows loading and recovers");

  const routes = [
    "/",
    "/cars",
    "/cars/r34",
    "/culture",
    "/drive",
    "/about",
    "/contact",
    "/signup",
    "/profile",
  ];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await go(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      check(`no horizontal page overflow: ${route} at ${width}px`, !overflow);
      const unlabeled = await page
        .locator("input:not([type=hidden]),textarea,select")
        .evaluateAll(
          (nodes) =>
            nodes.filter(
              (node) =>
                !node.labels?.length && !node.getAttribute("aria-label"),
            ).length,
        );
      check(
        `form controls are labeled: ${route} at ${width}px`,
        unlabeled === 0,
      );
      if (route === "/" && [390, 768].includes(width))
        await shot(`home-${width}-light.png`);
      if (route === "/cars" && width === 390)
        await shot("collection-mobile.png");
      if (route === "/contact" && width === 390)
        await shot("contact-mobile.png");
    }
    if (width === 390) {
      await go("/");
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("navigation")
        .getByRole("link", { name: "Culture", exact: true })
        .click();
      check(
        "mobile navigation closes after navigation",
        (await page
          .getByRole("button", { name: "Open navigation" })
          .getAttribute("aria-expanded")) === "false",
      );
    }
  }
  const blockedAutoplayPage = await context.newPage();
  await blockedAutoplayPage.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Autoplay denied", "NotAllowedError"));
  });
  await blockedAutoplayPage.goto(`${url}/#/`);
  await blockedAutoplayPage
    .locator('.hero-motion[data-playback="still"]')
    .waitFor();
  check(
    "blocked autoplay falls back to the final image",
    (await blockedAutoplayPage.locator(".hero-motion video").count()) === 0,
  );
  await blockedAutoplayPage.close();
  const failedVideoPage = await context.newPage();
  await failedVideoPage.route("**/*.mp4", (route) => route.abort("failed"));
  await failedVideoPage.goto(`${url}/#/`);
  await failedVideoPage
    .locator('.hero-motion[data-playback="still"]')
    .waitFor();
  await failedVideoPage
    .locator(".hero-motion img")
    .evaluate((image) => image.decode());
  check(
    "video network failure keeps a decoded static image",
    (await failedVideoPage.locator(".hero-motion video").count()) === 0,
  );
  await failedVideoPage.close();
  check("no runtime exceptions or React errors", errors.length === 0);
  await fs.writeFile(
    path.join(root, "docs/browser-results.json"),
    JSON.stringify(
      {
        status: "passed",
        checks,
        errors,
        screenshots: "docs/screenshots",
        api: "API success, loading, and failure tested with controlled responses; live service availability is not established.",
      },
      null,
      2,
    ),
  );
  console.log(
    `${checks.length} browser checks passed. Screenshots saved to docs/screenshots/.`,
  );
})()
  .catch(async (error) => {
    console.error(error.message);
    await fs.writeFile(
      path.join(root, "docs/browser-results.json"),
      JSON.stringify(
        {
          status: checks.length ? "failed" : "blocked",
          checks,
          error: error.message.split("\n")[0],
          detail: error.message
            .split("\n")
            .find((line) => /Operation not permitted|EPERM/.test(line))
            ?.replace(/\u001b\[[0-9;]*m/g, ""),
          screenshots: "No screenshots claimed unless actual files exist.",
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    server?.kill();
  });
