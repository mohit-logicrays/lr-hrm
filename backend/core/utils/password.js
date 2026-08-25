import crypto from "crypto";

/**
 * Generates a cryptographically strong random password.
 * Guarantees at least one uppercase, lowercase, digit and symbol.
 */
export function generateRandomPassword(length = 14) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const password = [pick(upper), pick(lower), pick(digits), pick(symbols)];

  while (password.length < length) {
    password.push(pick(all));
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

function pick(charset) {
  return charset[crypto.randomInt(0, charset.length)];
}
