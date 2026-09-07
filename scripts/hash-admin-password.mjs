import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password || password.length < 10) {
  console.error("Передайте пароль длиной не менее 10 символов.");
  process.exitCode = 1;
} else {
  const salt = randomBytes(24);
  const hash = scryptSync(password, salt, 64);
  console.log(`scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`);
}
