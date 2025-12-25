const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const publickey = fs.readFileSync(path.join(__dirname, '..', '..', 'certs', 'jwt-public.pem'), 'utf8');

// function that will make the request fail if token is wrong or has expired
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. Token missing."});
    jwt.verify(token, publickey, { algorithms: ['RS256'] }, (err, user) => {
        if (err) return res.status(403).json({ error: err.name === 'TokenExpiredError' ? "Token expired." : "Invalid token." });
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };