const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    console.log(`[AdminAuth] Checking access for: ${req.method} ${req.originalUrl}`);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Admin token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};

module.exports = adminAuth;
