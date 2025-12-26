const express = require("express");
const router = express.Router();

// JWKS endpoint to expose public keys for JWT verification
router.get("/", async (req, res, next) => {
  try {
    const { getJwtKeyMaterial } = require("../utils/jwt-keys");
    const { publicJwk } = await getJwtKeyMaterial();
    res.json({ keys: [publicJwk] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;