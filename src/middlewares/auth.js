const jose = require("jose")
let publickey;

// Load public key once
async function loadPublicKey() {
    if (publickey) return publickey;
    const { getJwtKeyMaterial } = require("../utils/jwt-keys");
    const { publicJwk } = await getJwtKeyMaterial();
    publickey = await jose.importJWK(publicJwk, 'RS256');
    return publickey;
}

// function that will make the request fail if token is wrong or has expired
async function authenticateToken(req, res, next) {
  try {
    const key = await loadPublicKey();

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ["RS256"],
      issuer: "retail-tractors-users-service",
      audience: "retail-tractors-users",
    });

    req.user = payload;
    next();
  } catch (err) {
    if (err.code === "ERR_JWT_EXPIRED") {
      return res.status(401).json({ error: "Token expired." });
    }
    return res.status(403).json({ error: "Invalid token." });
  }
}

module.exports = { authenticateToken };