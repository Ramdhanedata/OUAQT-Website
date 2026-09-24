/*
 * Give someone a way into the admin area, with a password only they know.
 *
 *   npm run make-admin -- you@example.com "Your name"
 *
 * The password is typed here, hidden, twice, and goes straight to Supabase.
 * It is never printed, never logged and never written to a file, so nobody
 * who helped set this up ever sees it.
 *
 * Run it for an address that already exists and it sets that account's
 * password instead, which is also how a forgotten admin password is reset.
 *
 * The first sign-in then shows a QR code for the authenticator app. The admin
 * area is reachable by anyone on the internet, which is why a password alone
 * is not enough and why a short one is refused below.
 */

import { createClient } from "@supabase/supabase-js";
import { stdin, stdout } from "node:process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim() || null;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run make-admin -- you@example.com "Your name"');
  console.error("The login has to be a real email address: Supabase refuses anything else.");
  process.exit(1);
}

/*
 * Read a line without showing what is typed. Characters that arrive after
 * the end of one line are kept for the next, so two lines pasted at once, or
 * piped in, are read as two answers.
 */
let pending = "";
function hidden(prompt) {
  return new Promise((resolve) => {
    stdout.write(prompt);
    let value = "";

    const take = (text) => {
      for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (char === "\r" || char === "\n") {
          pending = text.slice(i + (text[i + 1] === "\n" && char === "\r" ? 2 : 1));
          return true;
        }
        if (char === "\u0003") {
          stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
      pending = "";
      return false;
    };

    const finish = () => {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      resolve(value);
    };

    const onData = (chunk) => {
      if (take(chunk)) finish();
    };

    if (pending && take(pending)) {
      stdout.write("\n");
      resolve(value);
      return;
    }

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", onData);
  });
}

/*
 * Twelve characters, and not only digits or one character repeated. A
 * password on a page anybody can reach is the first thing a stranger tries,
 * and "12345678" is the first thing he tries with it.
 */
function weak(password) {
  if (password.length < 12) return "at least 12 characters";
  if (/^\d+$/.test(password)) return "not only digits";
  if (/^(.)\1+$/.test(password)) return "not one character repeated";
  return null;
}

const password = await hidden("Password (12 characters or more, hidden): ");
const problem = weak(password);
if (problem) {
  console.error(`Refused: the password needs to be ${problem}.`);
  process.exit(1);
}
const again = await hidden("The same password again: ");
if (again !== password) {
  console.error("The two did not match. Nothing was changed.");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });

/* Find the account if it exists; the admin API lists, it does not search. */
let userId = null;
for (let page = 1; page < 50 && !userId; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Could not read the accounts:", error.message);
    process.exit(1);
  }
  const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (found) userId = found.id;
  if (data.users.length < 200) break;
}

if (userId) {
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) {
    console.error("Could not set the password:", error.message);
    process.exit(1);
  }
  console.log(`Password set for ${email}.`);
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    console.error("Could not create the account:", error?.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Account created for ${email}.`);
}

const { error: staffError } = await admin
  .from("admin_users")
  .upsert({ user_id: userId, ...(name ? { name } : {}) }, { onConflict: "user_id" });
if (staffError) {
  console.error("The account exists but could not be made staff:", staffError.message);
  process.exit(1);
}

console.log("It can sign in to /admin. The first sign-in shows a QR code for the authenticator app.");
