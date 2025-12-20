const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET
// function that will make the request fail if token is wrong or has expired
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. Token missing."});
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };