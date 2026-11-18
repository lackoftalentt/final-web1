import { validate } from "../src/validation.js";

const BODY_LIMIT = 16384;
const fields = ["name", "email", "phone", "subject", "message"];

function reply(status, body, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

async function readBody(request) {
  if (Number(request.headers.get("content-length")) > BODY_LIMIT)
    throw new RangeError("Payload too large");
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing body");
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_LIMIT) {
      await reader.cancel();
      throw new RangeError("Payload too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function createContactHandler({
  env = process.env,
  fetcher = fetch,
} = {}) {
  return async function handleContact(request) {
    if (request.method !== "POST")
      return reply(
        405,
        { ok: false, error: "Use POST to send a message." },
        { Allow: "POST" },
      );

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return reply(403, {
        ok: false,
        error: "Please send the message from this website.",
      });

    if (
      request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json"
    )
      return reply(415, { ok: false, error: "Send the form as JSON." });

    let body;
    try {
      body = await readBody(request);
    } catch (error) {
      return reply(error instanceof RangeError ? 413 : 400, {
        ok: false,
        error:
          error instanceof RangeError
            ? "The message is too large."
            : "The message could not be read.",
      });
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      fields.some((field) => typeof body[field] !== "string")
    )
      return reply(400, {
        ok: false,
        error: "Please complete all contact fields.",
      });

    const values = Object.fromEntries(
      fields.map((field) => [field, body[field].trim()]),
    );
    const errors = validate(values, "contact");
    if (Object.keys(errors).length)
      return reply(400, {
        ok: false,
        error: "Please check the highlighted fields.",
        errors,
      });

    const token = env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = env.TELEGRAM_CHAT_ID?.trim();
    if (
      !token ||
      !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token) ||
      !/^[1-9]\d{0,15}$/.test(chatId || "")
    )
      return reply(503, {
        ok: false,
        error:
          "Contact delivery is not configured yet. Please try again later.",
      });

    const text = [
      "Fujiwara Tofu Shop — new contact message",
      "",
      `Name: ${values.name.replace(/\s+/g, " ")}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone}`,
      `Topic: ${values.subject}`,
      "",
      values.message,
    ].join("\n");

    try {
      const telegram = await fetcher(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            link_preview_options: { is_disabled: true },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      const result = await telegram.json();
      if (telegram.status === 429 || result.error_code === 429) {
        const wait = Math.min(
          3600,
          Math.max(1, Number(result.parameters?.retry_after) || 30),
        );
        return reply(
          429,
          {
            ok: false,
            error: `Please wait ${wait} seconds before sending again.`,
          },
          {
            "Retry-After": String(wait),
          },
        );
      }
      if (
        !telegram.ok ||
        result.ok !== true ||
        !Number.isInteger(result.result?.message_id)
      )
        return reply(502, {
          ok: false,
          error: "The message couldn’t be delivered. Please try again later.",
        });
      return reply(200, {
        ok: true,
        deliveredAt: new Date().toISOString(),
      });
    } catch {
      // Never expose Telegram URLs, credentials or upstream responses to clients/logs.
      return reply(502, {
        ok: false,
        error:
          "Delivery couldn’t be confirmed. Please wait before trying again to avoid a duplicate.",
      });
    }
  };
}
