'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Drop if previously created by sequelize sync
        await queryInterface.dropTable('ads_reports', { cascade: true }).catch(() => { });

        await queryInterface.createTable('ads_reports', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            updatedByAdmin: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'admins', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            platform: {
                type: Sequelize.ENUM('facebook', 'instagram', 'google', 'all'),
                defaultValue: 'all',
            },
            reportType: {
                type: Sequelize.ENUM('monthly', 'weekly'),
                defaultValue: 'monthly',
            },
            month: {
                type: Sequelize.STRING(7),
                allowNull: false,
                comment: 'Format: YYYY-MM e.g. 2024-04',
            },
            weekNumber: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: '1-52',
            },
            adBudget: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: true,
            },
            amountSpent: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: true,
            },
            leads: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            costPerLead: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            closedDeals: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            revenue: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: true,
            },
            roi: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            closedRatio: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Conversion percentage (Closed Deals / Leads * 100)',
            },
            notes: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Array of strings for Notes & Updates section',
            },
            campaignStatus: {
                type: Sequelize.ENUM('active', 'published', 'issue', 'budget_low', 'paused'),
                allowNull: true,
                defaultValue: null,
            },
            paymentStatus: {
                type: Sequelize.ENUM('pending', 'paid', 'overdue'),
                allowNull: true,
                defaultValue: 'pending',
            },
            status: {
                type: Sequelize.ENUM('draft', 'published'),
                defaultValue: 'draft',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Unique composite index
        await queryInterface.addIndex('ads_reports', ['userId', 'month', 'platform', 'reportType', 'weekNumber'], {
            unique: true,
            name: 'unique_user_report',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('ads_reports', 'unique_user_report');
        await queryInterface.dropTable('ads_reports');
    },
};
