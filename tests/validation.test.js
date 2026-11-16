import test from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/validation.js";
import { hashPassword, readStored, writeStored } from "../src/storage.js";

const signup = {
  name: "Enthusiast",
  email: "driver@example.com",
  phone: "+7 (700) 123-45-67",
  password: "Skyline#34",
  confirm: "Skyline#34",
};

test("registration accepts valid details and does not mutate input", () => {
  const input = { ...signup };
  assert.deepEqual(validate(input, "signup"), {});
  assert.deepEqual(input, signup);
});
test("blank and whitespace-only required fields have individual errors", () => {
  const result = validate(
    { name: "  ", email: "\t", phone: " ", password: "", confirm: "" },
    "signup",
  );
  for (const key of ["name", "email", "phone", "password", "confirm"])
    assert.ok(result[key], key);
});
test("invalid email formats are rejected without native validation", () => {
  for (const email of [
    "driver",
    "driver@",
    "@example.com",
    "a b@example.com",
    "driver@example",
    "a@b.c",
  ]) {
    assert.ok(validate({ ...signup, email }, "signup").email, email);
  }
  assert.equal(
    validate({ ...signup, email: " driver+34@example.co.uk " }, "signup").email,
    undefined,
  );
});
test("phone validation rejects letters and out-of-range digit counts", () => {
  for (const phone of [
    "123",
    "1234567890123456",
    "+7 700 xyz 4567",
    "++77001234567",
  ]) {
    assert.ok(validate({ ...signup, phone }, "signup").phone, phone);
  }
  for (const phone of ["+77001234567", "(212) 555-0123", "+44 20 1234 5678"])
    assert.equal(
      validate({ ...signup, phone }, "signup").phone,
      undefined,
      phone,
    );
});
test("password rules enforce all four character classes and length", () => {
  for (const password of [
    "A1!aaaa",
    "skyline#34",
    "SKYLINE#34",
    "Skyline###",
    "Skyline123",
  ]) {
    assert.ok(
      validate({ ...signup, password, confirm: password }, "signup").password,
      password,
    );
  }
  assert.ok(validate({ ...signup, confirm: "Different#34" }, "signup").confirm);
  assert.ok(validate({ ...signup, confirm: "" }, "signup").confirm);
});
test("login validates credentials fields without requiring signup fields", () => {
  assert.deepEqual(
    validate({ email: signup.email, password: signup.password }, "login"),
    {},
  );
  assert.ok(validate({ email: signup.email, password: "" }, "login").password);
});
test("contact validates phone, topic, and meaningful message", () => {
  const message = {
    ...signup,
    subject: "Share a story",
    message: "I love the rotary-powered RX-7.",
  };
  assert.deepEqual(validate(message, "contact"), {});
  assert.ok(validate({ ...message, subject: "" }, "contact").subject);
  assert.ok(validate({ ...message, message: "   " }, "contact").message);
  assert.ok(validate({ ...message, message: "short" }, "contact").message);
  assert.equal(
    validate(
      {
        name: signup.name,
        email: signup.email,
        phone: signup.phone,
        subject: message.subject,
        message: message.message,
      },
      "contact",
    ).password,
    undefined,
  );
});
test("password hashes are deterministic, salted, and not plaintext", async () => {
  const first = await hashPassword(signup.password, "first-salt");
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, signup.password);
  assert.equal(first, await hashPassword(signup.password, "first-salt"));
  assert.notEqual(first, await hashPassword(signup.password, "second-salt"));
  assert.notEqual(first, await hashPassword("Other#123", "first-salt"));
});
test("local storage handles corrupt JSON and blocked access", () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  assert.equal(writeStored("theme", "dark"), true);
  assert.equal(readStored("theme", "light"), "dark");
  data.set("jdm:theme", "invalid-json");
  assert.equal(readStored("theme", "light"), "light");
  globalThis.localStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  assert.deepEqual(readStored("accounts", []), []);
  assert.equal(writeStored("theme", "dark"), false);
  delete globalThis.localStorage;
});
