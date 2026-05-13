const { User, Subscription, Plan, Lead, LeadNote, AdsReport, Service, Video, Testimonial, SystemSetting } = require('../models');
const notifCtrl = require('./notificationController');
const { uploadToS3, getSignedUrlForView, isS3Value } = require('../utils/s3');

const signUrl = async (url) => {
    if (url && isS3Value(url)) {
        return await getSignedUrlForView(url);
    }
    return url;
};

const processUser = async (user) => {
    if (!user) return null;
    const userData = user.toJSON ? user.toJSON() : user;

    userData.logoUrl = await signUrl(userData.logoUrl);

    return userData;
};

exports.listServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { isActive: true },
            order: [['order', 'ASC']]
        });

        const processed = await Promise.all(services.map(async s => {
            const data = s.get({ plain: true });
            data.iconUrl = await signUrl(data.iconUrl);
            return data;
        }));

        return res.json(processed);
    } catch (err) {
        console.error('List services error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.listVideos = async (req, res) => {
    try {
        const videos = await Video.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        });

        const processed = await Promise.all(videos.map(async v => {
            const data = v.get({ plain: true });
            data.videoUrl = await signUrl(data.videoUrl);
            data.thumbnailUrl = await signUrl(data.thumbnailUrl);
            return data;
        }));

        return res.json(processed);
    } catch (err) {
        console.error('List videos error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.listTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.findAll({
            where: { isActive: true },
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });

        const processed = await Promise.all(testimonials.map(async t => {
            const data = t.get({ plain: true });
            data.avatarUrl = await signUrl(data.avatarUrl);
            return data;
        }));

        return res.json(processed);
    } catch (err) {
        console.error('List testimonials error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: [] },
            include: [
                {
                    model: Subscription,
                    as: 'subscriptions',
                    include: [{ model: Plan, as: 'plan' }],
                    where: { status: 'active' },
                    required: false,
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                },
            ],
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Auto-disable if expired
        if (user.isActive && user.subscriptions && user.subscriptions.length > 0) {
            const activeSub = user.subscriptions[0];
            const expiryDate = new Date(activeSub.expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
                await user.update({ isActive: false });
                user.isActive = false;

                // Also update subscription status
                await activeSub.update({ status: 'expired' });
            }
        } else if (user.isActive && (!user.subscriptions || user.subscriptions.length === 0)) {
            // Safety check: isActive was true but no active sub found
            await user.update({ isActive: false });
            user.isActive = false;
        }

        const processedUser = await processUser(user);
        return res.json(processedUser);
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, businessName, businessType, businessAddress, city, state } = req.body;
        let logoUrl = req.body.logoUrl;

        // If a file is uploaded, upload it to S3
        if (req.file) {
            logoUrl = await uploadToS3(req.file);
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({
            name,
            email,
            businessName,
            businessType,
            businessAddress,
            city,
            state,
            logoUrl: logoUrl || user.logoUrl
        });

        const processedUser = await processUser(user);
        return res.json({ message: 'Profile updated successfully', user: processedUser });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.onboardUser = async (req, res) => {
    try {
        const { name, email, businessName, businessType, businessAddress, city, state } = req.body;
        let logoUrl = req.body.logoUrl;

        // If a file is uploaded, upload it to S3
        if (req.file) {
            logoUrl = await uploadToS3(req.file);
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({
            name,
            email,
            businessName,
            businessType,
            businessAddress,
            city,
            state,
            logoUrl,
            isOnboarded: true
        });

        // Welcome Notification
        await notifCtrl.createNotification(
            req.user.id,
            'Welcome to Leadito!',
            'Your business profile is set up. Let\'s start growing your business together.',
            'general'
        );

        const processedUser = await processUser(user);
        return res.json({ message: 'Onboarding completed successfully', user: processedUser });
    } catch (err) {
        console.error('Onboarding error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.findAll({
            where: { isActive: true },
            order: [['price', 'ASC']],
        });
        return res.json(plans);
    } catch (err) {
        console.error('Get plans error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

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


exports.getAdsResults = async (req, res) => {
    try {
        const { platform, type } = req.query;

        // Fetch fresh user status from DB to reflect payments immediately (avoid stale JWT isActive)
        const user = await User.findByPk(req.user.id);
        const isActive = user ? user.isActive : false;

        if (!isActive) {
            return res.json({
                demo: true,
                message: 'Upgrade to a paid plan to see your real ad performance data.',
                data: [{
                    month: '2024-04',
                    reportType: 'monthly',
                    adBudget: 50000,
                    leads: 2350,
                    costPerLead: 21.28,
                    closedDeals: 156,
                    revenue: 312000,
                    roi: 524,
                    closedRatio: 6.6,
                    platform: platform || 'meta',
                    campaignStatus: 'active',
                    notes: [
                        'Campaign performance is exceeding benchmark by 15%.',
                        'High engagement observed in 25-34 age demographic.',
                        'Budget utilization is optimal for this period.'
                    ]
                }],
            });
        }

        let whereClause = { userId: req.user.id, status: 'published' };
        if (platform) {
            whereClause.platform = platform;
        } else {
            whereClause.platform = 'meta';
        }

        if (type) whereClause.reportType = type;

        const reports = await AdsReport.findAll({
            where: whereClause,
            order: [['month', 'DESC'], ['weekNumber', 'DESC']],
        });

        return res.json({ demo: false, data: reports });
    } catch (err) {
        console.error('Get ads results error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.listLeads = async (req, res) => {
    try {
        const { search, status, filter, startDate: qStart, endDate: qEnd } = req.query;
        let whereClause = { userId: req.user.id };
        const { Op } = require('sequelize');

        // Handle Date Filtering
        if (filter && filter !== 'All') {
            const now = new Date();
            if (filter === 'Daily') {
                const startDate = new Date(now.setHours(0, 0, 0, 0));
                whereClause.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Weekly') {
                const startDate = new Date(now.setDate(now.getDate() - 7));
                startDate.setHours(0, 0, 0, 0);
                whereClause.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Monthly') {
                const startDate = new Date(now.setMonth(now.getMonth() - 1));
                startDate.setHours(0, 0, 0, 0);
                whereClause.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Custom' && qStart && qEnd) {
                const sDate = new Date(qStart);
                sDate.setHours(0, 0, 0, 0);
                const eDate = new Date(qEnd);
                eDate.setHours(23, 59, 59, 999);
                whereClause.createdAt = { [Op.between]: [sDate, eDate] };
            }
        }

        if (search) {
            const query = search.trim();
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { phone: { [Op.iLike]: `%${query}%` } }
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const { rows: leads, count } = await Lead.findAndCountAll({
            where: whereClause,
            attributes: {
                include: [
                    [
                        Lead.sequelize.literal(`(
                            SELECT COUNT(*) FROM "lead_notes" WHERE "lead_notes"."leadId" = "Lead"."id"
                        )`),
                        'notesCount'
                    ]
                ]
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // NEW: Get separate stats based ONLY on time filter (ignoring search)
        let statsWhere = { userId: req.user.id };
        if (filter && filter !== 'All') {
            const now = new Date();
            if (filter === 'Daily') {
                statsWhere.createdAt = { [Op.gte]: new Date(now.setHours(0, 0, 0, 0)) };
            } else if (filter === 'Weekly') {
                const startDate = new Date(now.setDate(now.getDate() - 7));
                startDate.setHours(0, 0, 0, 0);
                statsWhere.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Monthly') {
                const startDate = new Date(now.setMonth(now.getMonth() - 1));
                startDate.setHours(0, 0, 0, 0);
                statsWhere.createdAt = { [Op.gte]: startDate };
            } else if (filter === 'Custom' && qStart && qEnd) {
                const sDate = new Date(qStart);
                sDate.setHours(0, 0, 0, 0);
                const eDate = new Date(qEnd);
                eDate.setHours(23, 59, 59, 999);
                statsWhere.createdAt = { [Op.between]: [sDate, eDate] };
            }
        }

        const allLeadsStats = await Lead.findAll({
            where: statsWhere,
            attributes: ['status', [Lead.sequelize.fn('COUNT', Lead.sequelize.col('id')), 'count']],
            group: ['status']
        });

        return res.json({
            leads,
            stats: allLeadsStats,
            pagination: {
                totalLeads: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('List leads error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.createLead = async (req, res) => {
    try {
        const { name, phone, source, status, followUpDate } = req.body;
        if (!name) return res.status(400).json({ message: 'Lead name is required' });

        const lead = await Lead.create({
            userId: req.user.id,
            name,
            phone,
            source,
            status,
            followUpDate,
        });

        // Trigger Notification
        await notifCtrl.createNotification(
            req.user.id,
            'New Lead Created',
            `A new lead "${name}" has been added to your dashboard.`,
            'lead_created',
            { leadId: lead.id }
        );

        return res.status(201).json(lead);
    } catch (err) {
        console.error('Create lead error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateLead = async (req, res) => {
    try {
        const lead = await Lead.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        const oldStatus = lead.status;
        await lead.update(req.body);

        // Notify on status change
        if (req.body.status && req.body.status !== oldStatus) {
            await notifCtrl.createNotification(
                req.user.id,
                'Lead Status Updated',
                `Lead "${lead.name}" status changed to ${req.body.status.replace(/_/g, ' ')}.`,
                'status_changed',
                { leadId: lead.id, oldStatus, newStatus: req.body.status }
            );
        }

        return res.json(lead);
    } catch (err) {
        console.error('Update lead error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        await lead.destroy();
        return res.json({ message: 'Lead deleted' });
    } catch (err) {
        console.error('Delete lead error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getLeadNotes = async (req, res) => {
    try {
        const lead = await Lead.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        const notes = await LeadNote.findAll({
            where: { leadId: lead.id },
            order: [['createdAt', 'DESC']],
        });
        return res.json(notes);
    } catch (err) {
        console.error('Get lead notes error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.addLeadNote = async (req, res) => {
    try {
        const lead = await Lead.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        const { note } = req.body;
        if (!note) return res.status(400).json({ message: 'Note content is required' });

        const leadNote = await LeadNote.create({ leadId: lead.id, note });
        return res.status(201).json(leadNote);
    } catch (err) {
        console.error('Add lead note error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateLeadNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { note } = req.body;

        const leadNote = await LeadNote.findOne({
            where: { id: noteId },
            include: [{
                model: Lead,
                as: 'lead',
                where: { userId: req.user.id }
            }]
        });

        if (!leadNote) return res.status(404).json({ message: 'Note not found' });
        if (!note) return res.status(400).json({ message: 'Note content is required' });

        await leadNote.update({ note });
        return res.json(leadNote);
    } catch (err) {
        console.error('Update lead note error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteLeadNote = async (req, res) => {
    try {
        const { noteId } = req.params;

        const leadNote = await LeadNote.findOne({
            where: { id: noteId },
            include: [{
                model: Lead,
                as: 'lead',
                where: { userId: req.user.id }
            }]
        });

        if (!leadNote) return res.status(404).json({ message: 'Note not found' });

        await leadNote.destroy();
        return res.json({ message: 'Note deleted' });
    } catch (err) {
        console.error('Delete lead note error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
