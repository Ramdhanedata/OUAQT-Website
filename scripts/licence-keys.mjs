/*
 * Makes the pair that signs licences.
 *
 * The private half goes into LICENCE_SIGNING_KEY, on the server and nowhere
 * else. The public half is built into the desktop app so it can check a
 * licence with no network.
 *
 * Changing the pair invalidates every licence already issued, which is why
 * this prints a warning rather than writing anything by itself.
 *
 *   npm run licence:keys
 */
const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
  "sign",
  "verify",
]);

const privateKey = Buffer.from(
  await crypto.subtle.exportKey("pkcs8", pair.privateKey)
).toString("base64url");

const publicKey = Buffer.from(
  await crypto.subtle.exportKey("spki", pair.publicKey)
).toString("base64url");

console.log("Server, in .env.local and in Vercel:\n");
console.log(`LICENCE_SIGNING_KEY=${privateKey}\n`);
console.log("Desktop app, built into it:\n");
console.log(`LICENCE_PUBLIC_KEY=${publicKey}\n`);
console.log(
  "Keep the private one. Replacing it makes every licence already issued\n" +
    "unverifiable, and every shop holding one stops working."
);
