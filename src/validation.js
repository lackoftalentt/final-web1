import { CONTACT_LIMITS, CONTACT_SUBJECTS } from "./contact.js";

export function validate(values, kind) {
  const errors = {};
  if (kind !== "login") {
    if (!values.name?.trim()) errors.name = "Please enter your name.";
    if (!values.phone?.trim()) errors.phone = "Please enter your phone number.";
    else if (
      !/^\+?[\d\s()-]+$/.test(values.phone) ||
      !/^\d{10,15}$/.test(values.phone.replace(/\D/g, ""))
    ) {
      errors.phone = "Use 10–15 digits, with an optional country code.";
    }
  }
  if (!values.email?.trim()) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = "Enter an address like name@example.com.";
  if (kind === "login" || kind === "signup") {
    if (!values.password) errors.password = "Please enter your password.";
    else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
        values.password,
      )
    ) {
      errors.password =
        "Use 8+ characters with uppercase, lowercase, a number, and a symbol.";
    }
    if (kind === "signup" && !values.confirm)
      errors.confirm = "Please confirm your password.";
    else if (kind === "signup" && values.confirm !== values.password)
      errors.confirm = "Your passwords do not match.";
  }
  if (kind === "contact") {
    if (!values.subject?.trim()) errors.subject = "Please choose a topic.";
    if (!values.message?.trim()) errors.message = "Please write a message.";
    else if (values.message.trim().length < 10)
      errors.message = "Add a little detail — at least 10 characters.";
    if (
      values.subject?.trim() &&
      !CONTACT_SUBJECTS.includes(values.subject.trim())
    )
      errors.subject = "Please choose one of the listed topics.";
    for (const [field, limit] of Object.entries(CONTACT_LIMITS)) {
      if (
        typeof values[field] === "string" &&
        values[field].trim().length > limit
      )
        errors[field] = `Use ${limit} characters or fewer.`;
    }
  }
  return errors;
}
