const { User } = require('../models');

const isPaid = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findByPk(req.user.id);

        if (!user || !user.isActive) {
            return res.status(403).json({
                message: 'Access denied. Please upgrade to a paid plan to use this feature.',
            });
        }

        // Optionally update req.user with fresh data
        req.user.isActive = user.isActive;

        next();
    } catch (err) {
        console.error('isPaid middleware error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = isPaid;
