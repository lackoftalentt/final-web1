import test from "node:test";
import assert from "node:assert/strict";
import { createContactHandler } from "../server/contact.js";
import { validate } from "../src/validation.js";
import { sendContact } from "../src/contact.js";

const env = {
  TELEGRAM_BOT_TOKEN: "123456789:testing_only_fake_token_12345",
  TELEGRAM_CHAT_ID: "123456789",
};
const values = {
  name: "Demo Driver",
  email: "demo@example.com",
  phone: "+77001234567",
  subject: "Project feedback",
  message: "I like the RX-7 collection.",
};
const request = (body = values, options = {}) =>
  new Request("https://example.com/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://example.com",
    },
    body: JSON.stringify(body),
    ...options,
  });
const delivered = () => Response.json({ ok: true, result: { message_id: 42 } });

test("contact sends plain text to the server-configured owner only", async () => {
  let outgoing;
  const handler = createContactHandler({
    env,
    fetcher: async (url, options) => {
      outgoing = { url, ...JSON.parse(options.body) };
      return delivered();
    },
  });
  const response = await handler(
    request({
      ...values,
      message: "<b>Keep this literal</b>",
      chat_id: "999",
      token: "injected",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(outgoing.chat_id, env.TELEGRAM_CHAT_ID);
  assert.match(outgoing.text, /Name: Demo Driver/);
  assert.match(outgoing.text, /<b>Keep this literal<\/b>/);
  assert.equal(outgoing.parse_mode, undefined);
  assert.ok(!outgoing.text.includes("injected"));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("invalid inputs, malformed JSON, cross-origin requests and oversized bodies never reach Telegram", async () => {
  let calls = 0;
  const handler = createContactHandler({
    env,
    fetcher: async () => {
      calls++;
      return delivered();
    },
  });
  const invalid = [
    [request({ ...values, email: "invalid" }), 400],
    [request({ ...values, phone: [] }), 400],
    [request({ ...values, subject: "Arbitrary topic" }), 400],
    [request({ ...values, message: "x".repeat(3001) }), 400],
    [request([], {}), 400],
    [request(values, { body: "{" }), 400],
    [request(values, { body: "x".repeat(16385) }), 413],
    [
      request(values, {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example",
        },
      }),
      403,
    ],
    [request(values, { headers: { "Content-Type": "text/plain" } }), 415],
    [new Request("https://example.com/api/contact"), 405],
  ];
  for (const [incoming, status] of invalid)
    assert.equal((await handler(incoming)).status, status);
  assert.equal(calls, 0);
});

test("missing configuration fails without a fake success or credential leak", async () => {
  const handler = createContactHandler({
    env: {},
    fetcher: () => {
      throw new Error("should not be called");
    },
  });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
});

test("Telegram rejection, missing receipt and network failures never report success", async () => {
  for (const fetcher of [
    async () =>
      Response.json({ ok: false, description: env.TELEGRAM_BOT_TOKEN }),
    async () => Response.json({ ok: true, result: {} }),
    async () => {
      throw new Error(`Network error for ${env.TELEGRAM_BOT_TOKEN}`);
    },
    async () => new Response("not JSON", { status: 502 }),
  ]) {
    const handler = createContactHandler({ env, fetcher });
    const response = await handler(request());
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.equal(JSON.parse(body).ok, false);
    assert.ok(!body.includes(env.TELEGRAM_BOT_TOKEN));
  }
});

test("Telegram rate limits provide a retry delay", async () => {
  const handler = createContactHandler({
    env,
    fetcher: async () =>
      Response.json(
        {
          ok: false,
          error_code: 429,
          parameters: { retry_after: 17 },
        },
        { status: 429 },
      ),
  });
  const response = await handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "17");
});

test("contact length limits also apply in frontend validation", () => {
  assert.ok(validate({ ...values, name: "x".repeat(81) }, "contact").name);
  assert.ok(
    validate({ ...values, message: "x".repeat(3001) }, "contact").message,
  );
  assert.equal(validate(values, "contact").password, undefined);
});

test("the browser contact client requires a positive server receipt", async () => {
  globalThis.document = { baseURI: "https://example.com/#/contact" };
  try {
    let target;
    await sendContact(values, async (url) => {
      target = url.href;
      return Response.json({ ok: true });
    });
    assert.equal(target, "https://example.com/api/contact");
    await assert.rejects(
      sendContact(values, async () => Response.json({ ok: false })),
      /couldn’t be sent/,
    );
    await assert.rejects(
      sendContact(
        values,
        async () => new Response("Not Found", { status: 404 }),
      ),
      /couldn’t be sent/,
    );
    await assert.rejects(
      sendContact(values, async () => {
        throw new Error("offline");
      }),
      /couldn’t be confirmed/,
    );
  } finally {
    delete globalThis.document;
  }
});
