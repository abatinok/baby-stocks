#!/usr/bin/env node
// Generates the encrypted admin-auth payload for index.html without ever writing
// the plaintext admin password to disk or to this repo.
//
// Usage:
//   node tools/generate-admin-payload.mjs
//
// You'll be prompted for the admin password (input is not echoed to the terminal).
// The script derives an AES-GCM key from that password via PBKDF2 (random salt,
// 250,000 iterations, SHA-256) and uses it to encrypt a small fixed marker string.
// It prints a JS object literal — paste it over the ADMIN_AUTH_PAYLOAD placeholder
// near the top of index.html's <script> block. The printed payload is ciphertext;
// it is safe to commit. The password itself is never printed or stored anywhere.

import { webcrypto as crypto } from 'node:crypto';

const PBKDF2_ITERATIONS = 250000;
const VERIFICATION_MARKER = 'baby-stocks-admin-auth-v1';

let fallbackLines = null;

async function readAllStdinLines() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c))))
    .toString('utf8')
    .split(/\r?\n/);
}

async function readPasswordHidden(promptText) {
  if (!process.stdin.isTTY) {
    // Non-interactive stdin (e.g. piped input for testing): fall back to a
    // plain, unhidden read since there is no terminal to suppress echo on.
    // Piped stdin is read fully up front and consumed line by line, since
    // Node's readline does not reliably support sequential rl.question()
    // calls against a non-TTY stream.
    if (!fallbackLines) fallbackLines = await readAllStdinLines();
    process.stdout.write(promptText);
    const line = fallbackLines.shift() ?? '';
    process.stdout.write(line + '\n');
    return line;
  }

  return new Promise((resolve) => {
    process.stdout.write(promptText);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let input = '';
    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
        return;
      }
      if (char === '\u0003') {
        process.stdout.write('\n');
        process.exit(1);
      }
      if (char === '\u007f' || char === '\b') {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    };
    process.stdin.on('data', onData);
  });
}

function toBase64(buf) {
  return Buffer.from(buf).toString('base64');
}

async function main() {
  const password = await readPasswordHidden('New admin password: ');
  const confirm = await readPasswordHidden('Confirm admin password: ');

  if (!password) {
    console.error('Password cannot be empty.');
    process.exit(1);
  }
  if (password !== confirm) {
    console.error('Passwords did not match.');
    process.exit(1);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(VERIFICATION_MARKER)
  );

  const payload = {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    iterations: PBKDF2_ITERATIONS
  };

  console.log('\nPaste this over the ADMIN_AUTH_PAYLOAD placeholder in index.html:\n');
  console.log(`    const ADMIN_AUTH_PAYLOAD = ${JSON.stringify(payload, null, 6).replace(/\n/g, '\n    ')};`);
  console.log('\nThis payload is ciphertext only — it is safe to commit. The password itself was not written anywhere.');
}

main().catch((err) => {
  console.error('Error generating admin payload:', err);
  process.exit(1);
});
