import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const envPath = new URL("../.env.local", import.meta.url);
if (existsSync(envPath)) process.loadEnvFile(envPath);

function saveChat(id) {
  const original = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const next = /^TELEGRAM_CHAT_ID=.*$/m.test(original)
    ? original.replace(/^TELEGRAM_CHAT_ID=.*$/m, `TELEGRAM_CHAT_ID=${id}`)
    : `${original.trimEnd()}\nTELEGRAM_CHAT_ID=${id}\n`;
  writeFileSync(envPath, next, { mode: 0o600 });
  chmodSync(envPath, 0o600);
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token)
    throw new Error(
      "Add TELEGRAM_BOT_TOKEN to .env.local first. Never use a VITE_ prefix.",
    );
  async function telegram(method, body = {}) {
    let response;
    try {
      response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new Error(
        "Could not reach Telegram. Check your connection and run this command again.",
      );
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.ok !== true)
      throw new Error(
        `Telegram rejected ${method} (HTTP ${response.status}). Check the bot token and chat settings.`,
      );
    return data.result;
  }

  const bot = await telegram("getMe");
  console.log(`Bot verified: @${bot.username}`);
  const args = process.argv.slice(2);
  const index = args.indexOf("--chat-id");
  let chatId =
    index >= 0 ? args[index + 1] : process.env.TELEGRAM_CHAT_ID?.trim();

  if (!chatId) {
    const webhook = await telegram("getWebhookInfo");
    if (webhook.url)
      throw new Error(
        "This bot already has a webhook. Obtain your private chat ID from its existing handler and run with --chat-id ID. The webhook was left unchanged.",
      );
    const updates = await telegram("getUpdates", { limit: 100, timeout: 0 });
    const chats = new Map();
    for (const update of updates) {
      const message = update.message;
      if (
        message?.chat?.type === "private" &&
        /^\/start(?:@\w+)?(?:\s|$)/.test(message.text || "")
      )
        chats.set(String(message.chat.id), message.chat);
    }
    if (!chats.size)
      throw new Error(
        `Open https://t.me/${bot.username}, press Start, then run this command again.`,
      );
    const candidates = [...chats.values()];
    console.log("Private chats that started this bot:");
    for (const [i, chat] of candidates.entries())
      console.log(
        `${i + 1}. ${chat.first_name || "Telegram user"}${chat.username ? ` (@${chat.username})` : ""} — chat ID ${chat.id}`,
      );
    if (!stdin.isTTY)
      throw new Error(
        "Run interactively to select the owner, or pass --chat-id ID for the intended recipient.",
      );
    const input = createInterface({ input: stdin, output: stdout });
    let selection;
    try {
      selection = await input.question("Choose the recipient number: ");
    } finally {
      input.close();
    }
    const choice = Number(selection);
    if (!Number.isInteger(choice) || choice < 1 || choice > candidates.length)
      throw new Error("No recipient selected. Run setup again.");
    chatId = String(candidates[choice - 1].id);
  }
  if (!/^[1-9]\d{0,15}$/.test(chatId))
    throw new Error("Use a numeric private chat ID.");
  const chat = await telegram("getChat", { chat_id: chatId });
  if (chat.type !== "private")
    throw new Error("The recipient must be a private chat.");
  saveChat(chatId);
  console.log(
    "Recipient verified. TELEGRAM_CHAT_ID saved in the ignored .env.local file.",
  );
  if (args.includes("--test")) {
    await telegram("sendMessage", {
      chat_id: chatId,
      text: "Fujiwara Tofu Shop: Telegram contact delivery is connected.",
    });
    console.log("Test message delivered to the selected owner.");
  }
  console.log(
    "For production, add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel → Project Settings → Environment Variables, then redeploy.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
