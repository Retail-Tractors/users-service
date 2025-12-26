const { generateKeyPairSync } = require("crypto");
const fs = require("fs");
const path = require("path");

// Script to generate RSA key pair and save as PEM files

const outDir = path.join(__dirname, "..", "certs");
fs.mkdirSync(outDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
});

const privatePemPkcs8 = privateKey.export({ type: "pkcs8", format: "pem" }); // BEGIN PRIVATE KEY
const publicPemSpki = publicKey.export({ type: "spki", format: "pem" });     // BEGIN PUBLIC KEY

fs.writeFileSync(path.join(outDir, "jwt-private.pkcs8.pem"), privatePemPkcs8);
fs.writeFileSync(path.join(outDir, "jwt-public.spki.pem"), publicPemSpki);
