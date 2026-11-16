import { useCallback, useState } from "react";

export function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(`jdm:${key}`)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(`jdm:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  const update = useCallback(
    (next) => {
      setValue((previous) => {
        const result = typeof next === "function" ? next(previous) : next;
        writeStored(key, result);
        return result;
      });
    },
    [key],
  );
  return [value, update];
}

// Local authentication is a coursework simulation. Salted hashes avoid storing
// readable passwords, but client-side storage does not provide real authentication.
export async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
