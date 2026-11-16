import { hashPassword, readStored, writeStored } from "./storage.js";

export function getAccounts() {
  const accounts = readStored("accounts", []);
  return Array.isArray(accounts) ? accounts : [];
}

export async function registerAccount(values) {
  const email = values.email.trim().toLowerCase();
  if (getAccounts().some((account) => account.email === email)) {
    throw new Error(
      "An account with this email already exists. Please sign in.",
    );
  }
  const salt = crypto.randomUUID();
  const account = {
    id: crypto.randomUUID(),
    name: values.name.trim(),
    email,
    phone: values.phone.trim(),
    salt,
    passwordHash: await hashPassword(values.password, salt),
    joined: new Date().toISOString(),
  };
  // Re-read after asynchronous hashing so a newer local registration is retained.
  const accounts = getAccounts();
  if (accounts.some((existing) => existing.email === email)) {
    throw new Error(
      "An account with this email already exists. Please sign in.",
    );
  }
  if (!writeStored("accounts", [...accounts, account])) {
    throw new Error(
      "Your account couldn’t be saved. Please allow local storage.",
    );
  }
  return account;
}

export async function authenticate(email, password) {
  const account = getAccounts().find(
    (account) => account.email === email.trim().toLowerCase(),
  );
  if (
    !account ||
    (await hashPassword(password, account.salt)) !== account.passwordHash
  ) {
    throw new Error("That email and password don’t match. Please try again.");
  }
  return account;
}
