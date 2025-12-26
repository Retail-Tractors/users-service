// Loads JWT keys from PEM file
// Creates kid to be used in JWTs/JWKS
// https://github.com/panva/jose/blob/main/docs/jwk/thumbprint/functions/calculateJwkThumbprint.md
const fs = require("fs");
const path = require("path");
const { createPrivateKey, createPublicKey } = require("crypto");
const jose = require("jose");

let cached; // { privateKey, publicJwk, kid }

async function getJwtKeyMaterial() {
  if (cached) return cached;

  // Load private key
  const privateKeyPem = fs.readFileSync(
    path.join(__dirname, "..", "..", "certs", "jwt-private.pkcs8.pem"),
    "utf8"
  );
  const privateKey = createPrivateKey(privateKeyPem);

  // Load public key
  const publicKeyPem = fs.readFileSync(
    path.join(__dirname, "..", "..", "certs", "jwt-public.spki.pem"),
    "utf8"
  );
  const publicKey = createPublicKey(publicKeyPem);


  // export public key as JWK (for JWKS)
  const publicJwk = await jose.exportJWK(publicKey); 

  // compute RFC7638 thumbprint (base64url) to use as kid
  const kid = await jose.calculateJwkThumbprint(publicJwk);

  // attach kid/alg/use in the JWKS representation
  const jwkForJwks = {
    ...publicJwk,
    kid,
    alg: "RS256",
    use: "sig",
  };

  cached = { privateKey, publicJwk: jwkForJwks, kid };
  return cached;
}

module.exports = { getJwtKeyMaterial };