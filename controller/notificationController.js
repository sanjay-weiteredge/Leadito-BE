const { Notification } = require('../models');

exports.listNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        return res.json(notifications);
    } catch (err) {
        console.error('List notifications error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({
            where: { id, userId: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.update({ isRead: true });
        return res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Mark as read error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { userId: req.user.id, isRead: false } }
        );
        return res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark all as read error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper for other controllers
exports.createNotification = async (userId, title, message, type = 'general', metadata = {}) => {
    try {
        return await Notification.create({
            userId,
            title,
            message,
            type,
            metadata
        });
    } catch (err) {
        console.error('Create notification error:', err);
    }
};
