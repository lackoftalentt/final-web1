import test from "node:test";
import assert from "node:assert/strict";
import { authenticate, registerAccount, getAccounts } from "../src/account.js";

test("registration and login use normalized email and salted stored credentials", async () => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  const details = {
    name: " Demo Driver ",
    email: " Demo@Example.com ",
    phone: "+77001234567",
    password: "Skyline#34",
  };
  const user = await registerAccount(details);
  assert.equal(user.name, "Demo Driver");
  assert.equal(user.email, "demo@example.com");
  assert.equal(user.phone, details.phone);
  assert.equal(getAccounts().length, 1);
  assert.ok(!data.get("jdm:accounts").includes(details.password));
  assert.equal(
    (await authenticate("DEMO@example.com ", details.password)).id,
    user.id,
  );
  await assert.rejects(authenticate(details.email, "Wrong#123"), /don’t match/);
  await assert.rejects(
    authenticate("missing@example.com", details.password),
    /don’t match/,
  );
  await assert.rejects(
    registerAccount({ ...details, email: "demo@example.com" }),
    /already exists/,
  );
  const another = await registerAccount({
    ...details,
    email: "other@example.com",
  });
  assert.notEqual(user.passwordHash, another.passwordHash);
  assert.notEqual(user.id, another.id);
  assert.equal(getAccounts().length, 2);
  delete globalThis.localStorage;
});

test("registration exposes a useful storage failure", async () => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceeded");
    },
  };
  await assert.rejects(
    registerAccount({
      name: "Demo",
      email: "demo@example.com",
      phone: "+77001234567",
      password: "Skyline#34",
    }),
    /couldn’t be saved/,
  );
  delete globalThis.localStorage;
});
