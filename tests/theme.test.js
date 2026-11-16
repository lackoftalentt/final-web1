import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { readTheme } from "../src/theme.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];

test("initial paint and React agree on default, saved, and invalid themes", () => {
  for (const [stored, expected] of [
    [null, "dark"],
    ['"dark"', "dark"],
    ['"light"', "light"],
    ['"unknown"', "dark"],
    ["null", "dark"],
    ["false", "dark"],
    ["{}", "dark"],
    ["invalid-json", "dark"],
  ]) {
    const localStorage = { getItem: () => stored };
    const meta = { content: "" };
    const document = {
      documentElement: { dataset: {} },
      querySelector: () => meta,
    };
    runInNewContext(bootstrap, { localStorage, document });
    globalThis.localStorage = localStorage;
    assert.equal(readTheme(), expected, `React theme for ${stored}`);
    assert.equal(
      document.documentElement.dataset.theme,
      expected,
      `Initial paint for ${stored}`,
    );
    assert.equal(meta.content, expected === "dark" ? "#0b0b0c" : "#f6f6f2");
  }
  delete globalThis.localStorage;
});

test("blocked storage still starts with the dark theme", () => {
  const localStorage = {
    getItem() {
      throw new Error("Storage blocked");
    },
  };
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => ({ content: "" }),
  };
  runInNewContext(bootstrap, { localStorage, document });
  globalThis.localStorage = localStorage;
  assert.equal(readTheme(), "dark");
  assert.equal(document.documentElement.dataset.theme, "dark");
  delete globalThis.localStorage;
});
