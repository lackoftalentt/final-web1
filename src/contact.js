export const CONTACT_SUBJECTS = [
  "Suggest a car",
  "Share a story",
  "Project feedback",
  "Something else",
];

// Keep the complete Telegram message below its 4096-character limit.
export const CONTACT_LIMITS = {
  name: 80,
  email: 254,
  phone: 40,
  subject: 60,
  message: 3000,
};

export async function sendContact(values, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(new URL("./api/contact", document.baseURI), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Delivery couldn’t be confirmed. Check your connection before trying again to avoid a duplicate.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok !== true) {
    const error = new Error(
      data?.error || "The message couldn’t be sent. Please try again later.",
    );
    if (data?.errors && typeof data.errors === "object")
      error.fields = data.errors;
    throw error;
  }
  return data;
}
