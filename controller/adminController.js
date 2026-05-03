const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, User, Subscription, Plan, AdsReport, Lead, Service, Video, Testimonial } = require('../models');
const { Op } = require('sequelize');
const notifCtrl = require('./notificationController');


// ... other exports ...

exports.listTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAll({ order: [['order', 'ASC'], ['createdAt', 'DESC']] });
        return res.json(testimonials);
    } catch (err) {
        console.error('List testimonials error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createTestimonial = async (req, res) => {
    try {
        const { name, role, feedback, avatarUrl, rating, socialIcon, isActive, order } = req.body;
        if (!name || !feedback || !avatarUrl) {
            return res.status(400).json({ message: 'Name, feedback, and avatarUrl are mandatory' });
        }

        const testimonial = await Testimonial.create({ name, role, feedback, avatarUrl, rating, socialIcon, isActive, order });
        return res.status(201).json(testimonial);
    } catch (err) {
        console.error('Create testimonial error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByPk(req.params.id);
        if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });

        await testimonial.update(req.body);
        return res.json(testimonial);
    } catch (err) {
        console.error('Update testimonial error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByPk(req.params.id);
        if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });

        await testimonial.destroy();
        return res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error('Delete testimonial error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.listVideos = async (req, res) => {
    try {
        const videos = await Video.findAll({ order: [['createdAt', 'DESC']] });
        return res.json(videos);
    } catch (err) {
        console.error('List videos error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createVideo = async (req, res) => {
    try {
        const { title, description, videoUrl, thumbnailUrl, isActive } = req.body;
        if (!title || !videoUrl || !thumbnailUrl) {
            return res.status(400).json({ message: 'Title, videoUrl, and thumbnailUrl are mandatory' });
        }

        const video = await Video.create({ title, description, videoUrl, thumbnailUrl, isActive });
        return res.status(201).json(video);
    } catch (err) {
        console.error('Create video error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        await video.update(req.body);
        return res.json(video);
    } catch (err) {
        console.error('Update video error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        await video.destroy();
        return res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error('Delete video error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.listServices = async (req, res) => {
    try {
        const services = await Service.findAll({ order: [['order', 'ASC']] });
        return res.json(services);
    } catch (err) {
        console.error('List services error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createService = async (req, res) => {
    try {
        const { title, description, iconUrl, order, isActive } = req.body;
        if (!title || !description || !iconUrl) {
            return res.status(400).json({ message: 'Title, description, and iconUrl are mandatory' });
        }

        const service = await Service.create({ title, description, iconUrl, order, isActive });
        return res.status(201).json(service);
    } catch (err) {
        console.error('Create service error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        await service.update(req.body);
        return res.json(service);
    } catch (err) {
        console.error('Update service error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        await service.destroy();
        return res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        console.error('Delete service error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Video Management
exports.listVideos = async (req, res) => {
    try {
        const videos = await Video.findAll({ order: [['createdAt', 'DESC']] });
        return res.json(videos);
    } catch (err) {
        console.error('List videos error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createVideo = async (req, res) => {
    try {
        const { title, description, videoUrl, thumbnailUrl, isActive } = req.body;
        if (!title || !videoUrl || !thumbnailUrl) {
            return res.status(400).json({ message: 'Title, videoUrl, and thumbnailUrl are mandatory' });
        }

        const video = await Video.create({ title, description, videoUrl, thumbnailUrl, isActive });
        return res.status(201).json(video);
    } catch (err) {
        console.error('Create video error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        await video.update(req.body);
        return res.json(video);
    } catch (err) {
        console.error('Update video error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        await video.destroy();
        return res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error('Delete video error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Testimonial Management
exports.listTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAll({ order: [['order', 'ASC'], ['createdAt', 'DESC']] });
        return res.json(testimonials);
    } catch (err) {
        console.error('List testimonials error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createTestimonial = async (req, res) => {
    try {
        const { name, role, feedback, rating, avatarUrl, order, isActive, socialIcon } = req.body;
        if (!name || !feedback || !avatarUrl) {
            return res.status(400).json({ message: 'Name, feedback, and avatarUrl are mandatory' });
        }

        const testimonial = await Testimonial.create({ name, role, feedback, rating, avatarUrl, order, isActive, socialIcon });
        return res.status(201).json(testimonial);
    } catch (err) {
        console.error('Create testimonial error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByPk(req.params.id);
        if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });

        await testimonial.update(req.body);
        return res.json(testimonial);
    } catch (err) {
        console.error('Update testimonial error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByPk(req.params.id);
        if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });

        await testimonial.destroy();
        return res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error('Delete testimonial error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



exports.register = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        if (!name || !phone || !password) {
            return res.status(400).json({ message: 'Name, phone, and password are required' });
        }

        const existing = await Admin.findOne({ where: { phone } });
        if (existing) {
            return res.status(400).json({ message: 'Admin with this phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await Admin.create({
            name,
            phone,
            password: hashedPassword
        });

        return res.status(201).json({ message: 'Admin created successfully', admin: { id: admin.id, name: admin.name, phone: admin.phone } });
    } catch (err) {
        console.error('Admin register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password)
            return res.status(400).json({ message: 'Phone and password are required' });

        const admin = await Admin.findOne({ where: { phone } });
        if (!admin)
            return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, admin.password);
        if (!match)
            return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: admin.id, phone: admin.phone, name: admin.name, role: 'admin' },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({ token, admin: { id: admin.id, name: admin.name, phone: admin.phone } });
    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.listUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'phone', 'businessName', 'businessType', 'city', 'isOnboarded', 'isActive', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
        return res.json(users);
    } catch (err) {
        console.error('List users error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                {
                    model: Subscription,
                    as: 'subscriptions',
                    include: [{ model: Plan, as: 'plan' }],
                    order: [['createdAt', 'DESC']],
                },
            ],
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    } catch (err) {
        console.error('Get user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.activateUser = async (req, res) => {
    try {
        const { planId } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const plan = await Plan.findByPk(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

        await user.update({ isActive: true });

        const subscription = await Subscription.create({
            userId: user.id,
            planId: plan.id,
            status: 'active',
            amount: plan.price,
            startDate: startDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
        });

        return res.json({ message: 'User activated successfully', subscription });
    } catch (err) {
        console.error('Activate user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.deactivateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({ isActive: false });

        await Subscription.update(
            { status: 'cancelled' },
            { where: { userId: user.id, status: 'active' } }
        );

        return res.json({ message: 'User deactivated successfully' });
    } catch (err) {
        console.error('Deactivate user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.listPlans = async (req, res) => {
    try {
        const plans = await Plan.findAll({ order: [['price', 'ASC']] });
        return res.json(plans);
    } catch (err) {
        console.error('List plans error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.createPlan = async (req, res) => {
    try {
        const { name, price, durationDays } = req.body;
        if (!name || price === undefined)
            return res.status(400).json({ message: 'name and price are required' });

        const plan = await Plan.create({ name, price, durationDays: durationDays || 30 });
        return res.status(201).json(plan);
    } catch (err) {
        console.error('Create plan error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.updatePlan = async (req, res) => {
    try {
        const plan = await Plan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        await plan.update(req.body);
        return res.json(plan);
    } catch (err) {
        console.error('Update plan error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        await plan.destroy();
        return res.json({ message: 'Plan deleted' });
    } catch (err) {
        console.error('Delete plan error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.listAdsReports = async (req, res) => {
    try {
        const reports = await AdsReport.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'phone', 'businessName'] },
                { model: Admin, as: 'admin', attributes: ['id', 'name'] },
            ],
            order: [['month', 'DESC']],
        });
        return res.json(reports);
    } catch (err) {
        console.error('List ads reports error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.createAdsReport = async (req, res) => {
    try {
        const { userId, month, paymentStatus, ...metrics } = req.body;
        if (!userId || !month)
            return res.status(400).json({ message: 'userId and month are required' });

        const user = await User.findByPk(userId);
        const finalPaymentStatus = paymentStatus || (user && user.isActive ? 'paid' : 'pending');
        const finalStatus = metrics.status || 'published';
        let finalWeekNumber = metrics.weekNumber;

        if (metrics.reportType === 'weekly' && !finalWeekNumber) {
            finalWeekNumber = 1;
        }

        const report = await AdsReport.create({
            userId,
            month,
            paymentStatus: finalPaymentStatus,
            updatedByAdmin: req.admin.id,
            status: finalStatus,
            weekNumber: finalWeekNumber,
            ...metrics,
        });

        // Notify user if published
        if (report.status === 'published') {
            await notifCtrl.createNotification(
                userId,
                'New Ads Report Published',
                `A new performance report for ${month} has been published. Status: ${report.campaignStatus || 'Updated'}.`,
                'new_report',
                { reportId: report.id, month }
            );
        }

        return res.status(201).json(report);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'A report for this user and month already exists' });
        }
        console.error('Create ads report error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.updateAdsReport = async (req, res) => {
    try {
        const report = await AdsReport.findByPk(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const oldStatus = report.status;
        await report.update({ ...req.body, updatedByAdmin: req.admin.id });

        // Notify user on publish or status change
        if (report.status === 'published' && (oldStatus === 'draft' || req.body.campaignStatus || req.body.paymentStatus)) {
            let message = `Your ads report for ${report.month} has been updated.`;
            if (req.body.campaignStatus) message += ` Ads Status: ${req.body.campaignStatus}.`;
            if (req.body.paymentStatus) message += ` Payment: ${req.body.paymentStatus}.`;

            await notifCtrl.createNotification(
                report.userId,
                'Ads Report Update',
                message,
                'new_report',
                { reportId: report.id, month: report.month }
            );
        }

        return res.json(report);
    } catch (err) {
        console.error('Update ads report error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.listLeads = async (req, res) => {
    try {
        const leads = await Lead.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'businessName'] }],
            order: [['createdAt', 'DESC']],
        });
        return res.json(leads);
    } catch (err) {
        console.error('Admin list leads error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
