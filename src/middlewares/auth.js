const jose = require("jose")
const { createPublicKey } = require("crypto");
const fs = require("fs");
const path = require("path");

const publickeyPem = fs.readFileSync(path.join(__dirname, '..', '..', 'certs', 'jwt-public.pem'), 'utf8');
const publickey = createPublicKey(publickeyPem);

// function that will make the request fail if token is wrong or has expired
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. Token missing."});
    jose.jwtVerify(token, publickey, { algorithms: ['RS256'] }).then(({ payload }) => {
        req.user = payload;
        next();
    }).catch(err => {
        return res.status(403).json({ error: err.name === 'TokenExpiredError' ? "Token expired." : "Invalid token." });
    });
}

module.exports = { authenticateToken };