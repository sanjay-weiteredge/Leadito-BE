const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, User, Subscription, Plan, AdsReport, Lead, LeadNote, Service, Video, Testimonial, Notification, SystemSetting, sequelize } = require('../models');
const { Op } = require('sequelize');
const notifCtrl = require('./notificationController');
const { uploadToS3, getSignedUrlForView, isS3Value } = require('../utils/s3');

const signUrl = async (url) => {
    if (url && isS3Value(url)) {
        return await getSignedUrlForView(url);
    }
    return url;
};


exports.getDashboardStats = async (req, res) => {
    try {
        const [
            userCount,
            leadCount,
            adCount,
            adsStats,
            videoCount,
            testimonialCount,
            serviceCount,
            recentActiveUsers,
            pendingSubsCount,
            activePaidCount,
            freeUsersCount,
            expiredUsersCount,
            totalSubRevenue,
            currentMonthRevenue,
            renewalsThisWeekCount,
            manualPendingRenewals,
            manualRenewalsThisWeek,
            manualActiveAds
        ] = await Promise.all([
            User.count(),
            Lead.count(),
            AdsReport.count({ where: { status: 'published' } }),
            AdsReport.findAll({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('revenue')), 'totalRevenue'],
                    [sequelize.fn('SUM', sequelize.col('amountSpent')), 'totalSpent']
                ],
                where: { status: 'published' },
                raw: true
            }),
            Video.count(),
            Testimonial.count(),
            Service.count(),
            User.findAll({
                where: { isActive: true },
                include: [{
                    model: Subscription,
                    as: 'subscriptions',
                    where: { status: 'active' },
                    required: false,
                    include: [{ model: Plan, as: 'plan' }]
                }],
                order: [['updatedAt', 'DESC']],
                limit: 5
            }),
            Subscription.count({ where: { status: 'pending' } }),
            User.count({ where: { isActive: true } }),
            User.count({ where: { isActive: false } }),
            Subscription.count({ where: { expiryDate: { [Op.lt]: new Date() } } }),
            // Total Revenue from all SUCCESSFUL payments (Active & Expired)
            Subscription.sum('amount', {
                where: { status: { [Op.in]: ['active', 'expired'] } }
            }),
            // Monthly Revenue from all SUCCESSFUL payments created this month
            Subscription.sum('amount', {
                where: {
                    status: { [Op.in]: ['active', 'expired'] },
                    createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                }
            }),
            Subscription.count({
                where: {
                    status: 'active',
                    expiryDate: {
                        [Op.between]: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
                    }
                }
            }),
            SystemSetting.findOne({ where: { key: 'MANUAL_PENDING_RENEWALS' } }),
            SystemSetting.findOne({ where: { key: 'MANUAL_RENEWALS_THIS_WEEK' } }),
            SystemSetting.findOne({ where: { key: 'MANUAL_ACTIVE_ADS' } })
        ]);

        const totalRev = totalSubRevenue || 0;
        const monthlyRev = currentMonthRevenue || 0;
        const pendingRen = manualPendingRenewals ? parseInt(manualPendingRenewals.value) : pendingSubsCount;
        const renThisWeek = manualRenewalsThisWeek ? parseInt(manualRenewalsThisWeek.value) : renewalsThisWeekCount;
        const activePaid = activePaidCount;
        const activeAds = manualActiveAds ? parseInt(manualActiveAds.value) : adCount;

        return res.json({
            users: userCount,
            leads: leadCount,
            ads: activeAds,
            revenue: parseFloat(adsStats[0]?.totalRevenue || 0),
            spent: parseFloat(adsStats[0]?.totalSpent || 0),
            videos: videoCount,
            testimonials: testimonialCount,
            services: serviceCount,
            activeUsers: recentActiveUsers,
            pendingApprovals: pendingSubsCount,
            activePaidClients: activePaid,
            freeUsers: freeUsersCount,
            expiredUsers: expiredUsersCount,
            totalSubscriptionRevenue: totalRev,
            monthlySubscriptionRevenue: monthlyRev,
            renewalsThisWeek: renThisWeek,
            pendingRenewals: pendingRen,
            manualPendingRenewals: manualPendingRenewals?.value || "",
            manualRenewalsThisWeek: manualRenewalsThisWeek?.value || "",
            manualActiveAds: manualActiveAds?.value || ""
        });
    } catch (err) {
        console.error('Get dashboard stats error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// ... other exports ...

// Testimonial Management
exports.listTestimonials = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: testimonials } = await Testimonial.findAndCountAll({
            order: [['order', 'ASC'], ['createdAt', 'DESC']],
            limit,
            offset
        });

        const processed = await Promise.all(testimonials.map(async t => {
            const data = t.get({ plain: true });
            data.avatarUrl = await signUrl(data.avatarUrl);
            return data;
        }));

        return res.json({
            items: processed,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('List testimonials error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createTestimonial = async (req, res) => {
    try {
        const { name, role, feedback, rating, avatarUrl, order, isActive, socialIcon } = req.body;
        if (!name || !feedback) {
            return res.status(400).json({ message: 'Name and feedback are mandatory' });
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

// Video Management (with S3 Support)
exports.listVideos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Grid friendly (3 or 4 per row)
        const offset = (page - 1) * limit;

        const { count, rows: videos } = await Video.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const processed = await Promise.all(videos.map(async v => {
            const data = v.get({ plain: true });
            data.videoUrl = await signUrl(data.videoUrl);
            data.thumbnailUrl = await signUrl(data.thumbnailUrl);
            return data;
        }));

        return res.json({
            items: processed,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('List videos error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createVideo = async (req, res) => {
    try {
        let { title, description, videoUrl, thumbnailUrl, isActive } = req.body;

        if (req.files) {
            if (req.files.video) {
                videoUrl = await uploadToS3(req.files.video[0], 'videos');
            }
            if (req.files.thumbnail) {
                thumbnailUrl = await uploadToS3(req.files.thumbnail[0], 'videos');
            }
        }

        if (!title || (!videoUrl && !req.files?.video) || (!thumbnailUrl && !req.files?.thumbnail)) {
            return res.status(400).json({ message: 'Title, video (file or URL), and thumbnail (file or URL) are mandatory' });
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

        let updateData = { ...req.body };

        if (req.files) {
            if (req.files.video) {
                updateData.videoUrl = await uploadToS3(req.files.video[0], 'videos');
            }
            if (req.files.thumbnail) {
                updateData.thumbnailUrl = await uploadToS3(req.files.thumbnail[0], 'videos');
            }
        }

        await video.update(updateData);
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

// Service Management
exports.listServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: services } = await Service.findAndCountAll({
            order: [['order', 'ASC']],
            limit,
            offset
        });

        const processed = await Promise.all(services.map(async s => {
            const data = s.get({ plain: true });
            data.iconUrl = await signUrl(data.iconUrl);
            return data;
        }));

        return res.json({
            items: processed,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
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
        const data = service.get({ plain: true });
        data.iconUrl = await signUrl(data.iconUrl);
        return res.status(201).json(data);
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
        const data = service.get({ plain: true });
        data.iconUrl = await signUrl(data.iconUrl);
        return res.json(data);
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { isActive, search } = req.query;

        const where = {};
        if (isActive !== undefined && isActive !== '') {
            where.isActive = (isActive === 'true' || isActive === true);
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { businessName: { [Op.iLike]: `%${search}%` } },
                { city: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            attributes: ['id', 'name', 'phone', 'businessName', 'businessType', 'city', 'isOnboarded', 'isActive', 'createdAt', 'logoUrl', 'leadStatus', 'nextFollowUpDate', 'adminNotes', 'lastActivity'],
            include: [{
                model: Subscription,
                as: 'subscriptions',
                required: false,
                include: [{ model: Plan, as: 'plan' }]
            }],
            order: [
                ['createdAt', 'DESC'],
                [{ model: Subscription, as: 'subscriptions' }, 'createdAt', 'DESC']
            ],
            limit,
            offset
        });

        const processed = await Promise.all(rows.map(async u => {
            const data = u.get({ plain: true });
            data.logoUrl = await signUrl(data.logoUrl);
            return data;
        }));

        return res.json({
            users: processed,
            pagination: {
                totalUsers: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
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

        const data = user.get({ plain: true });
        data.logoUrl = await signUrl(data.logoUrl);

        return res.json(data);
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

        return res.json({ message: 'User deactivated successfully' });
    } catch (err) {
        console.error('Deactivate user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [{ model: Subscription, as: 'subscriptions', order: [['createdAt', 'DESC']], limit: 1 }]
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newState = !user.isActive;

        // If reactivating, ensure they have a valid subscription
        if (newState) {
            const latestSub = user.subscriptions?.[0];
            const now = new Date().toISOString().split('T')[0];
            const isExpired = latestSub && latestSub.expiryDate < now;

            if (!latestSub || isExpired || latestSub.status !== 'active') {
                // Find a plan to use (previous plan or first available)
                let planId = latestSub?.planId;
                if (!planId) {
                    const firstPlan = await Plan.findOne({ where: { isActive: true }, order: [['price', 'ASC']] });
                    if (firstPlan) planId = firstPlan.id;
                }

                if (planId) {
                    const plan = await Plan.findByPk(planId);
                    const startDate = new Date();
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 30));

                    await Subscription.create({
                        userId: user.id,
                        planId: plan.id,
                        status: 'active',
                        amount: plan.price,
                        startDate: startDate.toISOString().split('T')[0],
                        expiryDate: expiryDate.toISOString().split('T')[0],
                    });
                }
            }
        }

        await user.update({ isActive: newState });

        return res.json({
            message: `Account has been ${newState ? 'Reactivated' : 'Suspended'} successfully`,
            isActive: newState
        });
    } catch (err) {
        console.error('Toggle status error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.listPlans = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: plans } = await Plan.findAndCountAll({
            order: [['price', 'ASC']],
            limit,
            offset
        });

        return res.json({
            items: plans,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('List plans error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.createPlan = async (req, res) => {
    try {
        const { name, price, durationDays, adBudget, expectedLeads, features, paymentLink, highlightTag } = req.body;
        if (!name || price === undefined)
            return res.status(400).json({ message: 'name and price are required' });

        const plan = await Plan.create({
            name,
            price,
            durationDays: durationDays || 30,
            adBudget,
            expectedLeads,
            features,
            paymentLink,
            highlightTag
        });
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { userId } = req.query;

        const where = {};
        if (userId && userId !== 'all') {
            where.userId = userId;
        }

        const { count, rows } = await AdsReport.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'phone', 'businessName'] },
                { model: Admin, as: 'admin', attributes: ['id', 'name'] },
            ],
            order: [['month', 'DESC'], ['createdAt', 'DESC']],
            limit,
            offset
        });

        // Calculate totals for stats cards
        const totals = await AdsReport.findAll({
            where,
            attributes: [
                [AdsReport.sequelize.fn('SUM', AdsReport.sequelize.col('adBudget')), 'totalSpent'],
                [AdsReport.sequelize.fn('SUM', AdsReport.sequelize.col('leads')), 'totalLeads'],
                [AdsReport.sequelize.fn('SUM', AdsReport.sequelize.col('revenue')), 'totalRevenue'],
                [AdsReport.sequelize.fn('SUM', AdsReport.sequelize.col('closedDeals')), 'totalDeals'],
            ],
            raw: true
        });

        const stats = totals && totals[0] ? totals[0] : {};

        return res.json({
            reports: rows,
            stats: {
                spent: Number(stats.totalSpent || 0),
                leads: Number(stats.totalLeads || 0),
                revenue: Number(stats.totalRevenue || 0),
                deals: Number(stats.totalDeals || 0),
            },
            pagination: {
                totalReports: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
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


exports.getLeadNotes = async (req, res) => {
    try {
        const { leadId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await LeadNote.findAndCountAll({
            where: { leadId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return res.json({
            notes: rows,
            pagination: {
                totalNotes: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            }
        });
    } catch (err) {
        console.error('Get lead notes error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.listLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { userId, status, search, filter, startDate: qStart, endDate: qEnd } = req.query;

        const where = {};
        if (userId && userId !== 'all') {
            where.userId = userId;
        }
        if (status && status !== 'all') {
            where.status = status;
        }

        // Date Filtering
        if (filter && filter !== 'All') {
            const now = new Date();
            if (filter === 'Daily') {
                where.createdAt = { [Op.gte]: new Date(now.setHours(0, 0, 0, 0)) };
            } else if (filter === 'Weekly') {
                const startDate = new Date(now.setDate(now.getDate() - 7));
                startDate.setHours(0, 0, 0, 0);
                where.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Monthly') {
                const startDate = new Date(now.setMonth(now.getMonth() - 1));
                startDate.setHours(0, 0, 0, 0);
                where.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Custom' && qStart && qEnd) {
                const sDate = new Date(qStart);
                sDate.setHours(0, 0, 0, 0);
                const eDate = new Date(qEnd);
                eDate.setHours(23, 59, 59, 999);
                where.createdAt = { [Op.between]: [sDate, eDate] };
            }
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Lead.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'phone', 'businessName'] },
                { model: LeadNote, as: 'notes', separate: true, order: [['createdAt', 'DESC']] }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Metrics for Cards (Respect same filters)
        const statusCounts = await Lead.findAll({
            where,
            attributes: ['status', [Lead.sequelize.fn('COUNT', Lead.sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true
        });

        const totalLeads = await Lead.count({ where });

        const metrics = {
            total: totalLeads,
            statusWise: {}
        };

        statusCounts.forEach(sc => {
            metrics.statusWise[sc.status] = parseInt(sc.count);
        });

        // Conversion Ratio Calculation (Closed / Total)
        const closedCount = metrics.statusWise['closed'] || 0;
        metrics.conversionRatio = metrics.total > 0 ? ((closedCount / metrics.total) * 100).toFixed(1) : "0.0";

        return res.json({
            leads: rows,
            metrics,
            pagination: {
                totalLeads: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('Admin list leads error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteAdsReport = async (req, res) => {
    try {
        const report = await AdsReport.findByPk(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        await report.destroy();
        return res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        console.error('Delete ads report error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get all leads to clean up their notes
        const leads = await Lead.findAll({ where: { userId: user.id }, attributes: ['id'] });
        const leadIds = leads.map(l => l.id);

        // Manually cleaning up related records
        await Promise.all([
            Subscription.destroy({ where: { userId: user.id } }),
            AdsReport.destroy({ where: { userId: user.id } }),
            Notification.destroy({ where: { userId: user.id } }),
            LeadNote.destroy({ where: { leadId: { [Op.in]: leadIds } } }),
            Lead.destroy({ where: { userId: user.id } })
        ]);

        await user.destroy();
        return res.json({ message: 'User and all associated data permanently deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// --- Manual Payment Management ---

exports.listPendingSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.findAll({
            where: { status: 'pending' },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'phone', 'businessName'] },
                { model: Plan, as: 'plan', attributes: ['id', 'name', 'price'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const processed = await Promise.all(subscriptions.map(async sub => {
            const json = sub.toJSON();
            if (json.proofUrl) {
                json.proofUrl = await getSignedUrlForView(json.proofUrl);
            }
            return json;
        }));

        return res.json(processed);
    } catch (err) {
        console.error('List pending subscriptions error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateUserLeadInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { leadStatus, nextFollowUpDate, adminNotes } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updateData = {};
        if (leadStatus) updateData.leadStatus = leadStatus;
        if (nextFollowUpDate !== undefined) updateData.nextFollowUpDate = nextFollowUpDate;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        // Track that activity happened
        updateData.lastActivity = new Date();

        await user.update(updateData);

        return res.json({ message: 'Lead info updated successfully', user });
    } catch (err) {
        console.error('Update lead info error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.approveSubscription = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { subId } = req.params;
        const subscription = await Subscription.findByPk(subId, { transaction: t });
        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: 'Subscription is not pending' });
        }

        const plan = await Plan.findByPk(subscription.planId, { transaction: t });
        const user = await User.findByPk(subscription.userId, { transaction: t });

        const duration = plan.durationDays || 90;
        let startDate = new Date();
        let expiryDate = new Date();

        // If user already has an active sub, handle renewal
        const activeSub = await Subscription.findOne({
            where: { userId: user.id, status: 'active' },
            transaction: t
        });

        if (activeSub) {
            const currentExpiry = new Date(activeSub.expiryDate);
            const now = new Date();
            const baseDate = currentExpiry > now ? currentExpiry : now;
            expiryDate = new Date(baseDate);
            expiryDate.setDate(expiryDate.getDate() + duration);

            // Mark old sub as expired
            await activeSub.update({ status: 'expired' }, { transaction: t });
        } else {
            expiryDate.setDate(expiryDate.getDate() + duration);
        }

        // Update current subscription
        await subscription.update({
            status: 'active',
            startDate: startDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
        }, { transaction: t });

        // Activate user
        await user.update({ isActive: true }, { transaction: t });

        await t.commit();

        // Notify user
        await notifCtrl.createNotification(
            user.id,
            'Payment Approved! 🚀',
            `Your payment for the ${plan.name} has been verified. Your account is now active!`,
            'payment',
            { planId: plan.id }
        );

        return res.json({ message: 'Subscription approved and user activated successfully.' });
    } catch (err) {
        if (t) await t.rollback();
        console.error('Approve subscription error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// --- System Settings Management ---

exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        return res.json(settingsMap);
    } catch (err) {
        console.error('Get settings error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ message: 'Key is required' });

        const [setting, created] = await SystemSetting.findOrCreate({
            where: { key },
            defaults: { value, description: 'Auto-generated setting' }
        });

        if (!created) {
            await setting.update({ value });
        }

        return res.json({ message: `Setting ${key} updated successfully`, value });
    } catch (err) {
        console.error('Update setting error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
